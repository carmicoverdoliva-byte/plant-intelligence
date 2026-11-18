// Copia i testi della Guida (src/content/guida.ts, unica fonte) in docs/user-guide/guida.md.
// Uso: npm run guida             → riscrive il file
//      npm run guida:controlla   → non scrive; esce con errore se il file non è aggiornato
// Funziona con Node.js 23.6 o successivo, che legge direttamente i file TypeScript semplici.
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { domande, onboarding, sezioni, tutorial } from "../src/content/guida.ts";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const destinazione = path.join(root, "docs/user-guide/guida.md");

const righe = [
  "# Guida di Mandragola",
  "",
  "> File generato da `src/content/guida.ts` con `npm run guida`: **non modificarlo a mano**.",
  "> Gli stessi testi compaiono nell'app, nella sezione Guida (specifiche F02).",
  "",
  "## Tutorial",
  "",
];
for (const t of tutorial) {
  righe.push(`### ${t.titolo}`, "", `_${t.riassunto}_`, "");
  t.passi.forEach((p, i) => righe.push(`${i + 1}. ${p}`));
  righe.push("");
}
righe.push("## Domande frequenti", "");
for (const d of domande) righe.push(`### ${d.domanda}`, "", d.risposta, "");
righe.push("## Tutorial iniziale (primo avvio)", "");
for (const passo of onboarding) {
  righe.push(`### ${passo.titolo}`, "", passo.testo, "");
  for (const punto of passo.punti) righe.push(`- **${punto.titolo}** — ${punto.testo}`);
  righe.push("");
}
righe.push("## Spiegazioni delle sezioni (prima visita)", "");
for (const s of Object.values(sezioni)) righe.push(`### ${s.titolo}`, "", s.testo, "");
const testo = righe.join("\n");

if (process.argv.includes("--controlla")) {
  let attuale = "";
  try {
    attuale = readFileSync(destinazione, "utf8").replace(/\r\n/g, "\n");
  } catch {
    /* file mancante: risulta non aggiornato */
  }
  if (attuale !== testo) {
    console.error("docs/user-guide/guida.md non è aggiornato: esegui node scripts/genera-guida.mjs");
    process.exit(1);
  }
  console.log("Guida: testi dell'app e docs/user-guide/guida.md coincidono.");
} else {
  writeFileSync(destinazione, testo);
  console.log("Scritto docs/user-guide/guida.md");
}
