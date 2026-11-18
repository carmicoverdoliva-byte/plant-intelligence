// Prova della schermata Fotocamera (rilascio R0), chiamata da prova-app.mjs con i suoi strumenti.
// La richiesta a /api/identify viene INTERCETTATA in Edge con risposte preparate: nessuna richiesta a Pl@ntNet.
// Controlla: scelta di una foto dalla galleria, parte della pianta, risultato onesto (nessuna percentuale,
// "Scheda di cura in arrivo", specie simili, link per approfondire), messaggi chiari quando il servizio non risponde,
// "Non riesco a riconoscerla" con i consigli di scatto, quota sul telefono.
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

const candidato = (nome, comune) => ({
  nomeScientifico: nome, genere: nome.split(" ")[0], famiglia: "Araceae", nomeComune: comune, altriNomiComuni: [],
  approfondisci: `https://it.wikipedia.org/w/index.php?search=${encodeURIComponent(nome)}&go=Vai`,
});
const RISPOSTE = {
  probabile: { ok: true, quotaPerDispositivo: 10, risultato: { livello: "probabile", principale: candidato("Epipremnum aureum", "Pothos"),
    gemelle: [candidato("Epipremnum pinnatum", "Pothos gigante"), candidato("Philodendron hederaceum", "Filodendro")] } },
  incerto: { ok: true, quotaPerDispositivo: 10, risultato: { livello: "incerto", principale: candidato("Ocimum basilicum", "Basilico"), gemelle: [candidato("Ocimum americanum", "Basilico americano")] } },
  nessuna: { ok: true, quotaPerDispositivo: 10, risultato: { livello: "non-riconosciuta", gemelle: [] } },
  spento: { ok: false, codice: "non-risponde", quotaPerDispositivo: 10 },
};

export async function provaFotocamera({ apri, valuta, clicca, perTesto, ok, pausa, foto, cmd, ascoltatori, sessionId, controllaSchermata }) {
  // Foto di prova: un JPEG creato al momento, in una cartella temporanea
  const cartella = mkdtempSync(path.join(tmpdir(), "mandragola-foto-"));
  const file = path.join(cartella, "pianta.jpg");
  const sharp = require(path.join(process.cwd(), "node_modules", "sharp"));
  writeFileSync(file, await sharp({ create: { width: 900, height: 1200, channels: 3, background: "#3c8a4a" } }).jpeg().toBuffer());

  let prossima = "probabile";
  let intercettate = 0;
  await cmd("Fetch.enable", { patterns: [{ urlPattern: "*/api/identify*" }] });
  ascoltatori.push(async (m) => {
    if (m.method !== "Fetch.requestPaused" || m.sessionId !== sessionId) return;
    intercettate++;
    const corpo = RISPOSTE[prossima];
    await cmd("Fetch.fulfillRequest", {
      requestId: m.params.requestId,
      responseCode: corpo.ok ? 200 : 503,
      responseHeaders: [{ name: "content-type", value: "application/json" }],
      body: Buffer.from(JSON.stringify(corpo)).toString("base64"),
    });
  });

  const scegliFoto = async () => {
    const { root } = await cmd("DOM.getDocument", { depth: -1 });
    const { nodeIds } = await cmd("DOM.querySelectorAll", { nodeId: root.nodeId, selector: 'input[type="file"][multiple]' });
    await cmd("DOM.setFileInputFiles", { files: [file], nodeId: nodeIds[0] });
    for (let i = 0; i < 20; i++) {
      if (await valuta(`!!document.querySelector('ul[aria-label="Foto scelte"] li')`)) return true;
      await pausa(150);
    }
    return false;
  };
  const testoPagina = () => valuta(`document.querySelector("main").innerText`);
  const aspettaTesto = async (t) => {
    for (let i = 0; i < 30; i++) {
      if ((await testoPagina()).includes(t)) return true;
      await pausa(150);
    }
    return false;
  };

  await valuta(`localStorage.setItem("mandragola:spiegazione:fotocamera", "letta"), true`);
  await apri("/fotocamera");
  ok(await valuta(`!!${perTesto("button", "Scatta")} && !!${perTesto("button", "Galleria")}`), "Fotocamera: pulsanti \"Scatta\" e \"Galleria\"");
  ok((await testoPagina()).includes("Oggi ti restano 10 riconoscimenti"), "Fotocamera: quota del telefono visibile (10 al giorno)");

  // 1. Risultato "probabile"
  ok(await scegliFoto(), "Galleria: la foto scelta compare, ridotta sul telefono");
  ok(await valuta(`[...document.querySelectorAll('[role="radio"]')].map(b => b.textContent).join(",") === "Non so,Foglia,Fiore,Frutto,Corteccia"`), "Parte della pianta: Non so, Foglia, Fiore, Frutto, Corteccia");
  await clicca(`[...document.querySelectorAll('[role="radio"]')].find(b => b.textContent === "Foglia")`);
  await controllaSchermata("/fotocamera (foto scelta)", "fotocamera-scelta");
  await clicca(`[...document.querySelectorAll("button")].find(b => b.textContent.startsWith("Riconosci"))`);
  ok(await aspettaTesto("Scheda di cura in arrivo"), "Risultato: \"Scheda di cura in arrivo\" sotto il nome");
  const t = await testoPagina();
  ok(t.includes("Pothos") && t.includes("probabilmente Epipremnum aureum"), "Risultato: nome comune e \"probabilmente\" + specie");
  ok(t.includes("Affidabilità buona"), "Risultato: affidabilità detta a parole");
  ok(!/\d\s?%/.test(t), "Risultato: nessuna percentuale");
  ok(t.includes("Filodendro") && t.includes("Pothos gigante"), "Risultato: specie simili da confrontare");
  ok(await valuta(`!![...document.querySelectorAll("a")].find(a => a.textContent.includes("Approfondisci") && a.href.includes("wikipedia"))`), "Risultato: link per approfondire");
  ok(await valuta(`!!${perTesto("button", "Aggiungi una foto di un'altra parte")}`), "Risultato probabile: si può aggiungere una foto di un'altra parte (F05)");
  await controllaSchermata("/fotocamera (risultato)", "fotocamera-risultato");
  ok((await testoPagina()).length > 0 && intercettate === 1, "Una sola richiesta inviata (intercettata, nessun consumo della quota)");

  // 2. Risultato "incerto": lo dice chiaramente e dà i consigli di scatto
  prossima = "incerto";
  await clicca(perTesto("button", "Riconosci un'altra pianta"));
  await pausa(200);
  await scegliFoto();
  await clicca(`[...document.querySelectorAll("button")].find(b => b.textContent.startsWith("Riconosci"))`);
  ok(await aspettaTesto("Non ne sono sicuro"), "Incerto: \"Non ne sono sicuro\" ben visibile");
  ok((await testoPagina()).includes("Affidabilità bassa") && (await testoPagina()).includes("Come rifare la foto"), "Incerto: affidabilità bassa e consigli per rifare la foto");
  await foto("fotocamera-incerto");

  // 3. Nessuna pianta riconosciuta
  prossima = "nessuna";
  await clicca(perTesto("button", "Riconosci un'altra pianta"));
  await pausa(200);
  await scegliFoto();
  await clicca(`[...document.querySelectorAll("button")].find(b => b.textContent.startsWith("Riconosci"))`);
  ok(await aspettaTesto("Non riesco a riconoscerla"), "Nessuna pianta: \"Non riesco a riconoscerla\", senza inventare un nome");
  ok((await testoPagina()).includes("Come rifare la foto"), "Nessuna pianta: consigli di scatto (foglia, fiore, più luce)");

  // 4. Servizio spento: messaggio chiaro, le foto restano
  prossima = "spento";
  await clicca(perTesto("button", "Riprova con un'altra foto"));
  await pausa(200);
  await scegliFoto();
  await clicca(`[...document.querySelectorAll("button")].find(b => b.textContent.startsWith("Riconosci"))`);
  ok(await aspettaTesto("Il riconoscimento non risponde"), "Servizio spento: messaggio chiaro in italiano");
  ok(await valuta(`!!document.querySelector('ul[aria-label="Foto scelte"] li')`), "Servizio spento: la foto resta, si può riprovare");
  await foto("fotocamera-errore");

  // 5. Quota del telefono finita
  await valuta(`localStorage.setItem("mandragola:riconoscimenti:" + new Date().toISOString().slice(0,10), "10"), true`);
  const prima = intercettate;
  await clicca(`[...document.querySelectorAll("button")].find(b => b.textContent.startsWith("Riconosci"))`);
  ok(await aspettaTesto("Per oggi hai finito i riconoscimenti") && intercettate === prima, "Quota finita sul telefono: messaggio chiaro, nessuna richiesta inviata");
  await valuta(`localStorage.removeItem("mandragola:riconoscimenti:" + new Date().toISOString().slice(0,10)), true`);

  await cmd("Fetch.disable");
  rmSync(cartella, { recursive: true, force: true });
}
