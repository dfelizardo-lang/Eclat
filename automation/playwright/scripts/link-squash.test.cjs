const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const { run } = require("./link-squash.cjs");
const cases = require("../squash-cases.json").filter(
  (c) => c.status === "implemented",
);
function mock(badId) {
  const state = new Map(
    cases.map((c) => [
      c.squashId,
      {
        reference: c.reference,
        name: c.reference + " " + c.name,
        uuid: c.uuid,
        project: { id: 1 },
        automated_test_reference: null,
      },
    ]),
  );
  const writes = [];
  return {
    state,
    writes,
    fetcher: async (url, opts) => {
      const id = Number(url.pathname.split("/").at(-1));
      const item = state.get(id);
      assert.equal(opts.headers.Authorization, "Bearer fixture-secret");
      assert.equal(opts.redirect, "error");
      if (opts.method === "PATCH") {
        writes.push(id);
        item.automated_test_reference = JSON.parse(
          opts.body,
        ).automated_test_reference;
      }
      return new Response(
        JSON.stringify({
          ...item,
          ...(id === badId ? { reference: "AUTRE-CAS" } : {}),
        }),
        { headers: { "content-type": "application/json" } },
      );
    },
  };
}
const env = {
  SQUASH_API_TOKEN: "fixture-secret",
  SQUASH_URL: "http://localhost:8090/squash",
};
async function temp(fn) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "eclat-link-"));
  try {
    await fn(dir);
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
}
test("simulation : aucune écriture, seulement les scénarios complets", () =>
  temp(async (dir) => {
    const m = mock();
    const result = await run({ ...m, env, dir });
    assert.equal(m.writes.length, 0);
    assert.equal(result.selection.length, cases.length);
    assert.equal(JSON.stringify(result).includes("fixture-secret"), false);
  }));
test("un mauvais cas arrête tout avant le premier PATCH", () =>
  temp(async (dir) => {
    const m = mock(cases.at(-1).squashId);
    await assert.rejects(run({ ...m, env, dir, apply: true }), /Identité/);
    assert.equal(m.writes.length, 0);
  }));
test("liaison existante différente : pas de remplacement silencieux", () =>
  temp(async (dir) => {
    const m = mock();
    m.state.get(cases[0].squashId).automated_test_reference = "autre/script";
    await assert.rejects(
      run({ ...m, env, dir, apply: true }),
      /déjà différente/,
    );
    assert.equal(m.writes.length, 0);
  }));
test("application vérifiée et seconde application idempotente", () =>
  temp(async (dir) => {
    const m = mock();
    const first = await run({ ...m, env, dir, apply: true });
    assert.equal(first.applied, cases.length);
    const originalBackup = await fs.readFile(
      path.join(dir, "squash-link-backup.json"),
      "utf8",
    );
    const second = await run({ ...m, env, dir, apply: true });
    assert.equal(second.applied, 0);
    assert.equal(m.writes.length, cases.length);
    assert.equal(
      await fs.readFile(path.join(dir, "squash-link-backup.json"), "utf8"),
      originalBackup,
    );
  }));
