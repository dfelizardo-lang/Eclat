const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const DATASET = "adresses-des-bibliotheques-publiques";
const CULTURE_API = "https://data.culture.gouv.fr/api/records/1.0/search/";

app.use(express.static(path.join(__dirname, "public")));

function first(fields, keys, regexes=[]) {
  for (const k of keys) if (fields[k]) return String(fields[k]);
  const found = Object.keys(fields).find(k => regexes.some(rx => rx.test(k)));
  return found ? String(fields[found] || "") : "";
}

function normalize(record, requestedCp) {
  const f = record.fields || {};
  const postalCode = first(f, ["cp","code_postal","codepostal"], [/postal/i, /^cp$/i])
    .replace(/\D/g,"").slice(0,5) || requestedCp;
  return {
    name: first(f,
      ["nom_de_l_etablissement","nom","nom_bibliotheque","libelle"],
      [/nom.*etab/i,/nom.*bibli/i,/^nom$/i,/libell/i]
    ) || "Bibliothèque",
    address: first(f,
      ["adresse","adresse1","adresse_1","voie"],
      [/adresse/i,/voie/i]
    ),
    postalCode,
    city: first(f, ["commune","ville"], [/commune/i,/ville/i]),
    website: first(f,
      ["site_internet","site_web","url","website"],
      [/site.*internet/i,/site.*web/i,/url/i,/website/i]
    )
  };
}

app.get("/api/bibliotheques", async (req,res) => {
  const cp = String(req.query.cp || "").replace(/\D/g,"").slice(0,5);
  if (!/^\d{5}$/.test(cp)) {
    return res.status(400).json({error:"Code postal invalide."});
  }

  const url = new URL(CULTURE_API);
  url.searchParams.set("dataset", DATASET);
  url.searchParams.set("rows", "100");
  url.searchParams.set("refine.cp", cp);

  try {
    const response = await fetch(url, {
      headers: {
        "Accept":"application/json",
        "User-Agent":"Eclat/1.0 (bibliotheques publiques)"
      },
      signal: AbortSignal.timeout(12000)
    });

    if (!response.ok) {
      throw new Error(`Le ministère de la Culture a répondu ${response.status}.`);
    }

    const payload = await response.json();
    const records = Array.isArray(payload.records) ? payload.records : [];
    const results = records.map(r => normalize(r,cp));

    const seen = new Set();
    const unique = results.filter(x => {
      const key = `${x.name}|${x.address}|${x.city}`.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key); return true;
    });

    res.set("Cache-Control","public, max-age=300");
    res.json({
      postalCode: cp,
      count: unique.length,
      results: unique,
      source: "Ministère de la Culture — bibliothèques des collectivités territoriales"
    });
  } catch (e) {
    console.error(e);
    res.status(502).json({
      error:"Le service officiel des bibliothèques ne répond pas actuellement. Réessayez dans un instant."
    });
  }
});

app.listen(PORT, () => {
  console.log(`Éclat disponible sur http://localhost:${PORT}`);
});
