// Prova del VIVAIO (richiesta dell'utente del 2026-11-23), chiamata da prova-app.mjs con i suoi strumenti.
// Riconoscimento, descrizione e scheda della specie sono INTERCETTATI in Edge: nessuna chiamata a Pl@ntNet né all'AI.
// La scheda della specie arriva in ritardo e finisce in ripiego: così si prova il "salvo appena arriva" con la scheda
// del tipo. Controlla: salva due piante, "Già nel tuo Vivaio", bacheca, scheda salvata SENZA RETE e senza chiamate,
// soprannome, backup (esporta e importa), elimina con conferma, data in fondo alla scheda di specie generata.
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { SEZIONI } from "../../src/lib/schede/genera/regole.ts";

const require = createRequire(import.meta.url);

const candidato = (nome, comune, famiglia) => ({
  nomeScientifico: nome, genere: nome.split(" ")[0], famiglia, nomeComune: comune, altriNomiComuni: [],
  approfondisci: `https://it.wikipedia.org/w/index.php?search=${encodeURIComponent(nome)}&go=Vai`,
});
const PIANTE = {
  pothos: { ok: true, quotaPerDispositivo: 10, risultato: { livello: "probabile", principale: candidato("Epipremnum aureum", "Pothos", "Araceae"), gemelle: [] } },
  giada: { ok: true, quotaPerDispositivo: 10, risultato: { livello: "molto-probabile", principale: candidato("Crassula ovata", "Albero di giada", "Crassulaceae"), gemelle: [] } },
};

export async function provaVivaio({ apri, valuta, clicca, perTesto, ok, pausa, foto, cmd, ascoltatori, sessionId, controllaSchermata }) {
  const cartella = mkdtempSync(path.join(tmpdir(), "mandragola-vivaio-"));
  const file = path.join(cartella, "pianta.jpg");
  const sharp = require(path.join(process.cwd(), "node_modules", "sharp"));
  writeFileSync(file, await sharp({ create: { width: 900, height: 1200, channels: 3, background: "#2f7a45" } }).jpeg().toBuffer());

  let prossima = "pothos";
  let generata = null; // se c'è, /api/scheda-generata risponde subito con questa
  const chiamateApi = []; // richieste a /api/ partite dalla pagina (per controllare "senza nuove chiamate")
  await cmd("Fetch.enable", { patterns: [{ urlPattern: "*/api/*" }] });
  const intercetta = async (m) => {
    if (m.method !== "Fetch.requestPaused" || m.sessionId !== sessionId) return;
    const url = m.params.request.url;
    chiamateApi.push(new URL(url).pathname);
    const rispondi = (corpo, codice = 200) =>
      cmd("Fetch.fulfillRequest", {
        requestId: m.params.requestId, responseCode: codice,
        responseHeaders: [{ name: "content-type", value: "application/json" }],
        body: Buffer.from(JSON.stringify(corpo)).toString("base64"),
      }).catch(() => {}); // la pagina è già cambiata: non c'è più nessuno a cui rispondere
    if (url.includes("/api/identify")) return rispondi(PIANTE[prossima]);
    if (url.includes("/api/descrizione")) return rispondi({ ok: false }, 404);
    if (url.includes("/api/scheda-generata")) {
      if (generata) return rispondi(generata);
      await pausa(1500); // la scheda della specie "sta arrivando"…
      return rispondi({ ok: true, tipo: "ripiego" }); // …e non arriva: resta quella del tipo
    }
    return cmd("Fetch.continueRequest", { requestId: m.params.requestId }); // /api/scheda e il resto: veri
  };
  ascoltatori.push(intercetta);

  const testoPagina = () => valuta(`document.querySelector("main").innerText`);
  const aspetta = async (condizione, volte = 40) => {
    for (let i = 0; i < volte; i++) {
      if (await valuta(condizione)) return true;
      await pausa(150);
    }
    return false;
  };
  const aspettaTesto = (t) => aspetta(`document.querySelector("main").innerText.includes(${JSON.stringify(t)})`);
  const riconosci = async () => {
    const { root } = await cmd("DOM.getDocument", { depth: -1 });
    const { nodeIds } = await cmd("DOM.querySelectorAll", { nodeId: root.nodeId, selector: 'input[type="file"][multiple]' });
    await cmd("DOM.setFileInputFiles", { files: [file], nodeId: nodeIds[0] });
    await aspetta(`!!document.querySelector('ul[aria-label="Foto scelte"] li')`);
    await clicca(`[...document.querySelectorAll("button")].find(b => b.textContent.startsWith("Riconosci"))`);
  };
  const quante = () => valuta(`document.querySelectorAll('section[aria-label="Le piante del Vivaio"] li').length`);
  const oggi = `"mandragola:riconoscimenti:" + new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Rome" }).format(new Date())`;

  // 1. Vivaio vuoto
  await valuta(`localStorage.setItem("mandragola:spiegazione:vivaio", "letta"), localStorage.removeItem(${oggi}), true`);
  await apri("/vivaio");
  ok(await aspettaTesto("Il tuo Vivaio è vuoto"), "Vivaio vuoto: lo dice e invita a fotografare una pianta");
  await controllaSchermata("/vivaio (vuoto)", "vivaio-vuoto");

  // 2. Prima pianta: salvata mentre la scheda della specie sta ancora arrivando
  await apri("/fotocamera");
  await riconosci();
  ok(await aspettaTesto("Salva nel Vivaio"), "Risultato: pulsante \"Salva nel Vivaio\"");
  await clicca(perTesto("button", "Salva nel Vivaio"));
  ok(await aspettaTesto("Salvo appena arriva la scheda di questa specie"), "Scheda della specie in arrivo: \"Salvo appena arriva…\"");
  ok(await aspettaTesto("Salvata nel tuo Vivaio"), "Arrivata la risposta (ripiego): pianta salvata con la scheda del tipo");
  await controllaSchermata("/fotocamera (salvata)", "vivaio-salvata");

  // 3. Seconda pianta
  await clicca(perTesto("button", "Riconosci un'altra pianta"));
  prossima = "giada";
  await pausa(200);
  await riconosci();
  ok(await aspettaTesto("Scheda del tipo: succulente"), "Seconda pianta: albero di giada con la scheda del tipo");
  await aspetta(`!!${perTesto("button", "Salva nel Vivaio")} && !document.querySelector("main").innerText.includes("Sto preparando")`);
  await clicca(perTesto("button", "Salva nel Vivaio"));
  ok(await aspettaTesto("Salvata nel tuo Vivaio"), "Seconda pianta salvata");

  // 4. Stessa specie: "Già nel tuo Vivaio · Apri" e "salvala comunque"
  await clicca(perTesto("button", "Riconosci un'altra pianta"));
  prossima = "pothos";
  await pausa(200);
  await riconosci();
  ok(await aspettaTesto("Già nel tuo Vivaio"), "Stessa specie: \"Già nel tuo Vivaio\" al posto del pulsante");
  ok(await valuta(`!![...document.querySelectorAll("a")].find(a => a.textContent.trim() === "Apri" && a.getAttribute("href").startsWith("/vivaio#p-"))`), "Stessa specie: link \"Apri\" alla pianta salvata");
  await clicca(perTesto("button", "È un'altra pianta: salvala comunque"));
  ok(await aspetta(`!!${perTesto("button", "Salva come pianta diversa")}`), "Stessa specie: si può salvare comunque come pianta diversa");

  // 5. Bacheca: due piante con foto, nome e data
  await apri("/vivaio");
  await aspetta(`document.querySelectorAll('section[aria-label="Le piante del Vivaio"] li').length === 2`);
  ok((await quante()) === 2, "Bacheca: le due piante salvate");
  const t = await testoPagina();
  ok(t.includes("Pothos") && t.includes("Albero di giada") && t.includes("2 piante"), "Bacheca: nomi e numero di piante");
  ok(await aspetta(`[...document.querySelectorAll('section[aria-label="Le piante del Vivaio"] img')].every(i => i.complete && i.naturalWidth > 0)`), "Bacheca: le foto salvate si vedono");
  ok(new RegExp(String(new Date().getFullYear())).test(t), "Bacheca: data di salvataggio");
  await controllaSchermata("/vivaio", "vivaio-bacheca");

  // 6. SENZA RETE: si riapre il Vivaio e la scheda, senza chiamate
  const swPronto = await aspetta(`!!navigator.serviceWorker?.controller`, 60);
  ok(swPronto, "Service worker attivo (serve per aprire il Vivaio senza rete)");
  await cmd("Network.enable");
  await cmd("Network.emulateNetworkConditions", { offline: true, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
  const chiamatePrima = chiamateApi.length;
  await apri("/vivaio");
  await aspetta(`document.querySelectorAll('section[aria-label="Le piante del Vivaio"] li').length === 2`);
  ok((await quante()) === 2, "Senza rete: il Vivaio si apre con le due piante");
  await clicca(`[...document.querySelectorAll('section[aria-label="Le piante del Vivaio"] a')].find(a => a.textContent.includes("Pothos"))`);
  ok(await aspettaTesto("Scheda del tipo: rampicanti"), "Senza rete: la scheda salvata del pothos si apre");
  const s = await testoPagina();
  ok(s.includes("Tossicità") && s.includes("Persone: Tossica") && s.includes("Fonti della scheda"), "Scheda salvata: tossicità e fonti comprese");
  // Riga di sicurezza sotto la tossicità (2026-11-27): per le piante tossiche, con i link ufficiali e senza numeri di telefono
  const avviso = await valuta(`(() => { const p = document.querySelector("[data-avviso-antiveleni]"); if (!p) return null;
    p.scrollIntoView({ block: "center" }); return { testo: p.textContent, link: [...p.querySelectorAll("a")].map((a) => a.href) }; })()`);
  ok(!!avviso && avviso.testo.includes("contatta subito il medico, il veterinario o un Centro Antiveleni") && avviso.link.some((u) => u.includes("salute.gov.it")) && avviso.link.some((u) => u.includes("aspca.org")) && !/\d{3}[\s.-]?\d{3}/.test(avviso.testo),
    "Scheda di una pianta tossica: riga 'contatta subito…' con i link a Ministero della Salute e ASPCA, nessun numero di telefono");
  await pausa(300);
  await foto("scheda-avviso-antiveleni");
  ok(s.includes("Salvata il") && s.includes("probabilmente"), "Scheda salvata: data e nome scientifico con \"probabilmente\"");
  ok(await aspetta(`[...document.querySelectorAll("main img")].some(i => i.complete && i.naturalWidth > 0)`), "Scheda salvata: la tua foto si vede");
  // /api/versione è il controllo dell'avviso "Nuova versione disponibile" (vale per tutta l'app e senza rete fallisce
  // in silenzio): non riguarda le piante. Le chiamate vietate sono riconoscimento, schede e descrizione.
  const nuove = chiamateApi.slice(chiamatePrima).filter((u) => u !== "/api/versione");
  ok(nuove.length === 0, `Senza rete: nessuna chiamata a Pl@ntNet, all'AI o per le schede${nuove.length ? ": " + nuove.join(", ") : ""}`);
  await controllaSchermata("/vivaio#p-… (senza rete)", "vivaio-scheda");
  await cmd("Network.emulateNetworkConditions", { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });

  // 7. Soprannome
  await valuta(`(() => { const i = document.getElementById("soprannome"); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(i, "la pianta del soggiorno"); i.dispatchEvent(new Event("input", { bubbles: true })); return true; })()`);
  await clicca(perTesto("button", "Salva"));
  ok(await aspettaTesto("Soprannome salvato"), "Soprannome: salvato");
  ok(await aspetta(`document.querySelector("main h1")?.textContent === "la pianta del soggiorno"`), "Soprannome: diventa il titolo della scheda");
  await clicca(`[...document.querySelectorAll("button")].find(b => b.textContent.trim() === "Vivaio")`);
  ok(await aspettaTesto("la pianta del soggiorno"), "Soprannome: compare nella bacheca");

  // 8. Esporta backup (il file si legge invece di scaricarlo)
  await valuta(`(() => {
    navigator.canShare = undefined;
    const originale = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function () {
      if (this.download) { fetch(this.href).then(r => r.text()).then(x => { window.__backup = x; }); return; }
      return originale.call(this);
    };
    return true;
  })()`);
  await clicca(`[...document.querySelectorAll("button")].find(b => b.textContent.includes("Esporta backup"))`);
  ok(await aspetta(`typeof window.__backup === "string"`), "Esporta backup: file preparato");
  const backup = await valuta(`window.__backup`);
  const dati = JSON.parse(backup);
  ok(dati.formato === "mandragola-vivaio-backup" && dati.piante.length === 2 && dati.piante.every((p) => p.foto?.startsWith("data:image/jpeg")), "Backup: le due piante con le foto, in un solo file");
  ok(await aspetta(`!document.querySelector('section[aria-label="Copia di sicurezza"]').innerText.includes("Ultimo backup: mai")`), "Backup: data dell'ultimo backup aggiornata");
  const fileBackup = path.join(cartella, "backup.json");
  writeFileSync(fileBackup, backup);

  // 9. Elimina con conferma
  await clicca(`[...document.querySelectorAll('section[aria-label="Le piante del Vivaio"] a')].find(a => a.textContent.includes("Albero di giada"))`);
  await aspettaTesto("Elimina dal Vivaio");
  await clicca(`[...document.querySelectorAll("button")].find(b => b.textContent.includes("Elimina dal Vivaio"))`);
  ok(await aspetta(`[...document.querySelectorAll("dialog")].some(d => d.open && d.innerText.includes("Vuoi eliminare"))`), "Elimina: chiede conferma nella finestrella dell'app");
  await foto("vivaio-elimina");
  ok(await valuta(`document.activeElement?.textContent.trim() === "No, la tengo"`), "Elimina: all'apertura il focus è su \"No, la tengo\" (scelta sicura)");
  await clicca(`[...document.querySelectorAll("dialog button")].find(b => b.textContent.includes("No, la tengo"))`);
  await pausa(300);
  ok(await aspettaTesto("Albero di giada"), "Elimina: \"No, la tengo\" non cancella niente");
  await clicca(`[...document.querySelectorAll("button")].find(b => b.textContent.includes("Elimina dal Vivaio"))`);
  await pausa(300);
  await clicca(`[...document.querySelectorAll("dialog button")].find(b => b.textContent.includes("Sì, elimina"))`);
  await aspetta(`document.querySelectorAll('section[aria-label="Le piante del Vivaio"] li').length === 1`);
  ok((await quante()) === 1 && !(await testoPagina()).includes("Albero di giada"), "Elimina: \"Sì, elimina\" la toglie e torna alla bacheca");

  // 10. Importa backup: torna la pianta eliminata, quella già presente non si duplica
  const importa = async (percorso) => {
    const { root } = await cmd("DOM.getDocument", { depth: -1 });
    const { nodeIds } = await cmd("DOM.querySelectorAll", { nodeId: root.nodeId, selector: 'input[type="file"][accept*="json"]' });
    await cmd("DOM.setFileInputFiles", { files: [percorso], nodeId: nodeIds[0] });
  };
  await importa(fileBackup);
  ok(await aspettaTesto("Ho aggiunto 1 pianta. 1 era già nel Vivaio."), "Importa backup: rimette la pianta eliminata, senza doppioni");
  await aspetta(`document.querySelectorAll('section[aria-label="Le piante del Vivaio"] li').length === 2`);
  ok((await quante()) === 2, "Importa backup: di nuovo due piante");
  const sbagliato = path.join(cartella, "altro.json");
  writeFileSync(sbagliato, JSON.stringify({ ciao: 1 }));
  await importa(sbagliato);
  ok(await aspettaTesto("Questo file non è un backup del Vivaio di Mandragola."), "Importa: un file sbagliato dà un messaggio chiaro");

  // 11. Data in fondo alla scheda di specie: "al momento" solo se appena generata, altrimenti la data vera
  const CODA = "e controllato da regole automatiche, non rivisto da una persona.";
  const schedaGenerata = {
    ok: true, tipo: "generata", verificata: true, modello: "finto", generataIl: "2026-11-20T10:00:00.000Z",
    fonti: { S1: { livello: "A", titolo: "Scheda di prova" } },
    scheda: {
      riassunto: "Scheda di prova.", coseDaFare: ["Cosa di prova."],
      sezioni: Object.fromEntries(SEZIONI.map((k) => [k, { lineeGuida: { riassunto: "Indicazione di prova.", coseDaFare: [], fonti: ["S1"] }, pollice: [] }])),
      tossicita: { persone: "non verificata", animali: "tossica", nota: "Nota di prova.", fonti: ["S1"] },
    },
  };
  generata = { ...schedaGenerata, appenaGenerata: true };
  prossima = "giada";
  await apri("/fotocamera");
  await riconosci();
  ok(await aspettaTesto(`Testo generato al momento ${CODA}`), "Scheda di specie appena generata: \"generato al momento\"");
  await clicca(perTesto("button", "È un'altra pianta: salvala comunque"));
  await aspetta(`!!${perTesto("button", "Salva come pianta diversa")}`);
  await clicca(perTesto("button", "Salva come pianta diversa"));
  await aspettaTesto("Salvata nel tuo Vivaio");
  generata = schedaGenerata;
  await apri("/fotocamera");
  await riconosci();
  ok(await aspettaTesto(`Testo generato il 20 novembre 2026 ${CODA}`), "Scheda di specie dal salvataggio: \"generato il 20 novembre 2026\"");
  await valuta(`[...document.querySelectorAll("p")].find(p => p.textContent.startsWith("Testo generato"))?.scrollIntoView({ block: "center" })`);
  await controllaSchermata("/fotocamera (scheda salvata)", "scheda-data");
  generata = { ...schedaGenerata, generataIl: undefined };
  await apri("/fotocamera");
  await riconosci();
  ok(await aspettaTesto(`Testo generato automaticamente ${CODA}`), "Scheda di specie senza data (salvata prima): \"generato automaticamente\", nessuna data inventata");
  await apri("/vivaio");
  await aspetta(`document.querySelectorAll('section[aria-label="Le piante del Vivaio"] li').length === 3`);
  await valuta(`new Promise(r => { const q = indexedDB.open("mandragola-vivaio"); q.onsuccess = () => { const d = q.result, n = d.objectStoreNames[0], t = d.transaction(n).objectStore(n).getAll(); t.onsuccess = () => { window.__idGenerata = t.result.find(p => p.scheda.tipo === "generata")?.id; d.close(); r(true); }; }; })`);
  await clicca(`document.querySelector('a[href$="' + window.__idGenerata + '"]')`);
  ok(await aspettaTesto(`Testo generato il 20 novembre 2026 ${CODA}`), "Scheda di specie riaperta dal Vivaio: la data, non \"al momento\"");

  // Pulizia: Vivaio vuoto per le prove successive
  await valuta(`new Promise(r => { const q = indexedDB.deleteDatabase("mandragola-vivaio"); q.onsuccess = q.onerror = q.onblocked = () => r(true); })`);
  ascoltatori.splice(ascoltatori.indexOf(intercetta), 1);
  await cmd("Fetch.disable");
  rmSync(cartella, { recursive: true, force: true });
}
