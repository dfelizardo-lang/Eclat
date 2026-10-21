#!/usr/bin/env node
"use strict";
const fs = require("node:fs/promises");
const path = require("node:path");
const cases = require("../squash-cases.json");
function identity(value, c) {
  if (
    value.reference !== c.reference ||
    value.name !== c.reference + " " + c.name ||
    Number(value.project?.id) !== 1
  )
    throw new Error(
      `Identité inattendue pour ${c.reference} (id ${c.squashId}). Aucun rattachement automatique à une autre instance.`,
    );
  if (value.uuid && value.uuid !== c.uuid)
    throw new Error(`UUID différent pour ${c.reference}.`);
  if (!Object.hasOwn(value, "automated_test_reference"))
    throw new Error(
      "Cette API ne publie pas automated_test_reference. Vérifier la documentation REST de cette instance avant toute écriture.",
    );
}
async function run({
  apply = false,
  fetcher = fetch,
  env = process.env,
  dir = process.cwd(),
} = {}) {
  const token = env.SQUASH_API_TOKEN;
  if (!token)
    throw new Error(
      "SQUASH_API_TOKEN absent. Utiliser un jeton API personnel Squash, jamais le secret JWT du serveur.",
    );
  const base = new URL(
    (env.SQUASH_URL || "http://127.0.0.1:8090/squash").replace(/\/$/, "") + "/",
  );
  if (base.username || base.password || base.search || base.hash)
    throw new Error(
      "SQUASH_URL doit être une URL sans identifiants, paramètres ni fragment.",
    );
  if (!["http:", "https:"].includes(base.protocol))
    throw new Error("Protocole Squash non pris en charge.");
  const api = new URL("api/rest/latest/", base);
  async function request(id, method = "GET", body) {
    const response = await fetcher(new URL("test-cases/" + id, api), {
      method,
      redirect: "error",
      signal: AbortSignal.timeout(20000),
      headers: {
        Authorization: "Bearer " + token,
        Accept: "application/json",
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    if (!response.ok)
      throw new Error(
        `API Squash : ${method} cas ${id}, HTTP ${response.status}. Consulter la documentation locale /api/rest/latest/docs/api-documentation.html.`,
      );
    if (method === "PATCH" && response.status === 204) return null;
    const type = response.headers.get("content-type") || "";
    if (!type.includes("json"))
      throw new Error(
        "Réponse non JSON : connexion ou plugin API REST à vérifier.",
      );
    return response.json();
  }
  const plan = [];
  // Preflight the whole selection before any mutation. Existing bulk-selected
  // technology and SCM repository are deliberately preserved.
  for (const c of cases.filter((c) => c.status === "implemented")) {
    const live = await request(c.squashId);
    identity(live, c);
    if (
      live.automated_test_reference &&
      live.automated_test_reference !== c.automatedReference
    )
      throw new Error(
        `Référence déjà différente pour ${c.reference} : arrêt sans écriture. Examiner le cas avant de remplacer une liaison existante.`,
      );
    plan.push({
      id: c.squashId,
      reference: c.reference,
      uuid: c.uuid,
      before: live.automated_test_reference || null,
      after: c.automatedReference,
      change: live.automated_test_reference !== c.automatedReference,
    });
  }
  const summary = {
    instance: base.href,
    createdAt: new Date().toISOString(),
    changes: plan.filter((p) => p.change).length,
    selection: plan,
    excluded: cases
      .filter((c) => c.status !== "implemented")
      .map((c) => ({
        reference: c.reference,
        status: c.status,
        reason: c.reason,
      })),
  };
  await fs.writeFile(
    path.join(dir, "squash-plan.json"),
    JSON.stringify(summary, null, 2) + "\n",
    { mode: 0o600 },
  );
  if (!apply) return summary;
  // Keep the original backup across retries. No token is ever written.
  try {
    await fs.writeFile(
      path.join(dir, "squash-link-backup.json"),
      JSON.stringify(summary, null, 2) + "\n",
      { mode: 0o600, flag: "wx" },
    );
  } catch (e) {
    if (e.code !== "EEXIST") throw e;
  }
  const completed = [];
  for (const p of plan.filter((p) => p.change)) {
    const c = cases.find((c) => c.squashId === p.id),
      current = await request(p.id);
    identity(current, c);
    if ((current.automated_test_reference || null) !== p.before)
      throw new Error(`Modification concurrente de ${p.reference}, arrêt.`);
    await request(p.id, "PATCH", {
      _type: "test-case",
      automated_test_reference: p.after,
    });
    const actual = await request(p.id);
    identity(actual, c);
    if (actual.automated_test_reference !== p.after)
      throw new Error(`Écriture non confirmée pour ${p.reference}.`);
    completed.push(p.reference);
    await fs.writeFile(
      path.join(dir, "squash-link-progress.json"),
      JSON.stringify(
        { completed, lastUpdatedAt: new Date().toISOString() },
        null,
        2,
      ) + "\n",
      { mode: 0o600 },
    );
  }
  return { ...summary, applied: completed.length };
}
if (require.main === module)
  run({ apply: process.argv.includes("--apply") })
    .then((r) =>
      console.log(
        JSON.stringify(
          {
            mode: process.argv.includes("--apply") ? "appliqué" : "simulation",
            changes: r.changes,
            applied: r.applied || 0,
            excluded: r.excluded.length,
            plan: "squash-plan.json",
          },
          null,
          2,
        ),
      ),
    )
    .catch((e) => {
      console.error(e.message);
      console.error(
        "Arrêt. Les éventuelles écritures confirmées sont consignées dans squash-link-progress.json.",
      );
      process.exitCode = 1;
    });
module.exports = { run, identity };
