// Calcola il TIPO DI PIANTA di ogni genere (D13, livello 3) dai dati aperti di Kew, WCVP (licenza CC BY 4.0).
// Uso: node scripts/genera-tipi.mjs <percorso di wcvp_names.csv>
// Il file WCVP (300 MB) resta fuori dal repository; qui si salva solo l'indice risultante.
//
// Criteri, in ordine (il campo "base" dice quale ha deciso):
//   1. eccezioni scritte a mano per specie e generi (ortaggi, aromatiche, alcune piante da esterno note)  → "manuale"
//   2. famiglie botaniche con un tipo chiaro (cactus, palme, felci, conifere, graminacee, bromelie)       → "famiglia"
//   3. forma di vita + clima d'origine delle specie accettate del genere (la più frequente)                → "wcvp"
//   4. se nel genere mancano le forme di vita: quella più frequente nella famiglia                          → "famiglia-maggioranza"
//   5. altrimenti la scheda universale                                                                      → "nessun-dato"
import { createReadStream, writeFileSync } from "node:fs";
import { createInterface } from "node:readline";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const FILE = process.argv[2];
if (!FILE) throw new Error("Indica il percorso di wcvp_names.csv");

const FELCI = new Set(["Polypodiaceae", "Nephrolepidaceae", "Pteridaceae", "Aspleniaceae", "Dryopteridaceae", "Athyriaceae", "Blechnaceae", "Davalliaceae", "Dennstaedtiaceae", "Lygodiaceae", "Osmundaceae", "Cyatheaceae", "Dicksoniaceae", "Thelypteridaceae", "Woodsiaceae", "Onocleaceae", "Lindsaeaceae", "Hymenophyllaceae", "Gleicheniaceae", "Schizaeaceae", "Marattiaceae", "Ophioglossaceae", "Equisetaceae", "Psilotaceae", "Cystopteridaceae", "Diplaziopsidaceae", "Tectariaceae", "Oleandraceae", "Lomariopsidaceae", "Hypodematiaceae", "Didymochlaenaceae", "Saccolomataceae", "Cibotiaceae", "Plagiogyriaceae", "Thyrsopteridaceae", "Loxsomataceae", "Metaxyaceae", "Culcitaceae", "Matoniaceae", "Dipteridaceae", "Anemiaceae", "Salviniaceae", "Marsileaceae", "Rhachidosoraceae", "Desmophlebiaceae", "Hemidictyaceae"]);
const CONIFERE = new Set(["Pinaceae", "Cupressaceae", "Taxaceae", "Araucariaceae", "Podocarpaceae", "Sciadopityaceae", "Cephalotaxaceae"]);
const FAMIGLIE = {
  Cactaceae: "cactus",
  Arecaceae: "palme",
  Bromeliaceae: "bromelie",
  Poaceae: "graminacee",
  Cyperaceae: "graminacee",
  Juncaceae: "graminacee",
  Crassulaceae: "succulente",
  Aizoaceae: "succulente",
  Nymphaeaceae: "acquatiche",
  Pontederiaceae: "acquatiche",
  Hydrocharitaceae: "acquatiche",
  Potamogetonaceae: "acquatiche",
  Lemnaceae: "acquatiche",
  Typhaceae: "acquatiche",
  Alismataceae: "acquatiche",
  Nelumbonaceae: "acquatiche",
};
// Generi succulenti in famiglie miste
const GENERI = {
  Aloe: "succulente", Haworthia: "succulente", Haworthiopsis: "succulente", Gasteria: "succulente", Aloiampelos: "succulente",
  Sansevieria: "foglia-tropicale", Zamioculcas: "foglia-tropicale",
  Ocimum: "ortaggi-aromatiche", Petroselinum: "ortaggi-aromatiche", Mentha: "ortaggi-aromatiche", Thymus: "ortaggi-aromatiche",
  Origanum: "ortaggi-aromatiche", Lactuca: "ortaggi-aromatiche", Capsicum: "ortaggi-aromatiche", Cucurbita: "ortaggi-aromatiche",
  Cucumis: "ortaggi-aromatiche", Phaseolus: "ortaggi-aromatiche", Pisum: "ortaggi-aromatiche", Fragaria: "ortaggi-aromatiche",
  Daucus: "ortaggi-aromatiche", Spinacia: "ortaggi-aromatiche", Beta: "ortaggi-aromatiche", Anethum: "ortaggi-aromatiche",
  Coriandrum: "ortaggi-aromatiche", Raphanus: "ortaggi-aromatiche", Eruca: "ortaggi-aromatiche", Apium: "ortaggi-aromatiche",
  Citrus: "alberi",
  // Generi che in Italia si coltivano diversamente da quanto direbbe il clima d'origine prevalente
  Pittosporum: "arbusti", Olea: "alberi", Pelargonium: "arbusti", Strelitzia: "foglia-tropicale", Begonia: "foglia-tropicale",
  Hibiscus: "arbusti", Tradescantia: "foglia-tropicale", Pilea: "foglia-tropicale", Solanum: "universale", Nerium: "arbusti",
  Bougainvillea: "rampicanti", Jasminum: "rampicanti", Trachelospermum: "rampicanti", Gardenia: "arbusti", Lantana: "arbusti",
  Euphorbia: "universale", Passiflora: "rampicanti", Smilax: "rampicanti", Capparis: "arbusti", Celtis: "alberi",
};
// Specie con un tipo diverso da quello del loro genere
const SPECIE = {
  "Ficus carica": "alberi",
  "Solanum lycopersicum": "ortaggi-aromatiche", "Solanum melongena": "ortaggi-aromatiche", "Solanum tuberosum": "ortaggi-aromatiche",
  "Salvia rosmarinus": "ortaggi-aromatiche", "Salvia officinalis": "ortaggi-aromatiche",
  "Allium cepa": "ortaggi-aromatiche", "Allium sativum": "ortaggi-aromatiche", "Allium porrum": "ortaggi-aromatiche",
  "Allium schoenoprasum": "ortaggi-aromatiche", "Brassica oleracea": "ortaggi-aromatiche", "Laurus nobilis": "alberi",
  "Olea europaea": "alberi",
};

const tropicale = (clima) => /tropical/.test(clima) && clima !== "subtropical";

/** Forma di vita + clima → tipo (null se la forma di vita manca). */
function daFormaDiVita(forma, clima) {
  const f = forma.toLowerCase();
  if (!f) return null;
  const trop = tropicale(clima);
  if (/hydro|helophyte/.test(f)) return "acquatiche";
  if (/succulent/.test(f)) return "succulente";
  if (/bamboo/.test(f)) return "graminacee";
  if (/climb|liana|scrambling/.test(f)) return trop ? "rampicanti-tropicali" : "rampicanti";
  if (/epiphyt|lithophyte/.test(f)) return trop ? "foglia-tropicale" : "erbacee-perenni";
  if (/bulbous|tuberous|pseudobulbous|corm/.test(f)) return "bulbose";
  if (/tree/.test(f)) return trop ? "alberi-arbusti-tropicali" : "alberi";
  // Sottoarbusti tropicali (begonie, tradescantie, pilee…): in casa si curano come piante da foglia
  if (/^subshrub|perennial or subshrub/.test(f) && !/shrub or tree/.test(f)) return trop ? "foglia-tropicale" : "arbusti";
  if (/shrub/.test(f)) return trop ? "alberi-arbusti-tropicali" : "arbusti";
  if (/annual|biennial/.test(f)) return "annuali";
  if (/perennial|geophyte|rhizomatous/.test(f)) return trop ? "foglia-tropicale" : "erbacee-perenni";
  return null;
}

const generi = new Map(); // genere → { famiglia, tipi: Map, climi: Map, epifite: n, totali: n }
const famiglie = new Map(); // famiglia → Map tipo → n
const rl = createInterface({ input: createReadStream(FILE, "utf8") });
let h = null;
for await (const line of rl) {
  const c = line.split("|");
  if (!h) { h = Object.fromEntries(c.map((x, i) => [x, i])); continue; }
  if (c[h.taxon_rank] !== "Species" || c[h.taxon_status] !== "Accepted") continue;
  const genere = c[h.genus], famiglia = c[h.family];
  const forma = c[h.lifeform_description] ?? "", clima = c[h.climate_description] ?? "";
  if (!generi.has(genere)) generi.set(genere, { famiglia, tipi: new Map(), epifite: 0, totali: 0 });
  const g = generi.get(genere);
  g.totali++;
  if (/epiphyt/.test(forma)) g.epifite++;
  const t = daFormaDiVita(forma, clima);
  if (t) {
    g.tipi.set(t, (g.tipi.get(t) ?? 0) + 1);
    if (!famiglie.has(famiglia)) famiglie.set(famiglia, new Map());
    famiglie.get(famiglia).set(t, (famiglie.get(famiglia).get(t) ?? 0) + 1);
  }
}
const piuFrequente = (m) => [...m.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];

const indice = {}; // genere → [tipo, base]
const conteggio = {};
for (const [genere, g] of generi) {
  let tipo, base;
  if (GENERI[genere]) { tipo = GENERI[genere]; base = "manuale"; }
  else if (g.famiglia === "Orchidaceae") { tipo = g.epifite * 2 >= g.totali ? "orchidee" : (piuFrequente(g.tipi) ?? "bulbose"); base = "famiglia"; }
  else if (FELCI.has(g.famiglia)) { tipo = "felci"; base = "famiglia"; }
  else if (CONIFERE.has(g.famiglia)) { tipo = "conifere"; base = "famiglia"; }
  else if (FAMIGLIE[g.famiglia]) { tipo = FAMIGLIE[g.famiglia]; base = "famiglia"; }
  else if (g.tipi.size) { tipo = piuFrequente(g.tipi); base = "wcvp"; }
  else if (famiglie.has(g.famiglia)) { tipo = piuFrequente(famiglie.get(g.famiglia)); base = "famiglia-maggioranza"; }
  else { tipo = "universale"; base = "nessun-dato"; }
  indice[genere] = [tipo, base];
  conteggio[base] = (conteggio[base] ?? 0) + 1;
}
const uscita = {
  fonte: "WCVP — World Checklist of Vascular Plants, Royal Botanic Gardens, Kew (CC BY 4.0), versione del 2026-06-04",
  generato: new Date().toISOString().slice(0, 10),
  nota: "genere → [tipo, base]; base: manuale | famiglia | wcvp | famiglia-maggioranza | nessun-dato. Eccezioni per specie in 'specie'.",
  specie: SPECIE,
  generi: indice,
};
const dest = path.join(root, "src/data/tipo-per-genere.json");
writeFileSync(dest, JSON.stringify(uscita));
console.log("generi:", Object.keys(indice).length, "· basi:", JSON.stringify(conteggio));
