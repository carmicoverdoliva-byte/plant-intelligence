// Prova automatica dell'app (passi 1.1 e 1.2 del piano della v1).
// Apre ogni schermata in Microsoft Edge "invisibile", con la larghezza di un iPhone 16 (390 px), e controlla:
// - che la Guida sia raggiungibile dalla barra di navigazione su ogni schermata;
// - che non ci sia scorrimento laterale;
// - che ogni elemento toccabile sia almeno 44 × 44 px;
// - che non ci siano errori nella console;
// - il riquadro di spiegazione della prima visita (compare, si chiude, resta chiuso, il "?" lo riapre);
// - l'onboarding (se presente): percorso completo, salto, ripetizione dalla Guida, non ricompare al secondo avvio.
//
// Uso: prima `npm run build` e `npm run start`, poi in un altro terminale:
//   node tests/app/prova-app.mjs [indirizzo] [--foto cartella]
// Nessuna libreria in più: parla con Edge tramite il suo protocollo di controllo (Chrome DevTools Protocol).
import { spawn } from "node:child_process";
import { existsSync, mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const args = process.argv.slice(2);
const BASE = args.find((a) => a.startsWith("http")) ?? "http://127.0.0.1:3000";
const iFoto = args.indexOf("--foto");
const CARTELLA_FOTO = iFoto >= 0 ? args[iFoto + 1] : null;
if (CARTELLA_FOTO) mkdirSync(CARTELLA_FOTO, { recursive: true });

const EDGE = [
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
].find(existsSync);
if (!EDGE) throw new Error("Microsoft Edge non trovato");

const PORTA = 9300 + Math.floor(Math.random() * 500);
const profilo = mkdtempSync(path.join(tmpdir(), "mandragola-prova-"));
const edge = spawn(EDGE, [
  "--headless=new", "--disable-gpu", "--no-first-run", "--hide-scrollbars",
  `--remote-debugging-port=${PORTA}`, `--user-data-dir=${profilo}`, "about:blank",
]);

const pausa = (ms) => new Promise((r) => setTimeout(r, ms));
let risultati = 0, errori = 0;
const ok = (cond, descrizione) => {
  risultati++;
  if (!cond) errori++;
  console.log(`${cond ? "✓" : "✗"} ${descrizione}`);
};

// --- Collegamento a Edge ---
let ws;
for (let i = 0; i < 50 && !ws; i++) {
  try {
    const info = await (await fetch(`http://127.0.0.1:${PORTA}/json/version`)).json();
    ws = new WebSocket(info.webSocketDebuggerUrl);
  } catch {
    await pausa(200);
  }
}
await new Promise((r) => ws.addEventListener("open", r, { once: true }));
let prossimoId = 1;
const attese = new Map();
const ascoltatori = [];
ws.addEventListener("message", (e) => {
  const m = JSON.parse(e.data);
  if (m.id && attese.has(m.id)) {
    const { risolvi, rifiuta } = attese.get(m.id);
    attese.delete(m.id);
    if (m.error) rifiuta(new Error(m.error.message));
    else risolvi(m.result);
  } else if (m.method) ascoltatori.forEach((f) => f(m));
});
const invia = (method, params = {}, sessionId) =>
  new Promise((risolvi, rifiuta) => {
    const id = prossimoId++;
    attese.set(id, { risolvi, rifiuta });
    ws.send(JSON.stringify({ id, method, params, sessionId }));
  });

const { targetId } = await invia("Target.createTarget", { url: "about:blank" });
const { sessionId } = await invia("Target.attachToTarget", { targetId, flatten: true });
const cmd = (method, params) => invia(method, params, sessionId);
await cmd("Page.enable");
await cmd("Runtime.enable");
await cmd("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });

const erroriConsole = [];
ascoltatori.push((m) => {
  if (m.sessionId !== sessionId) return;
  if (m.method === "Runtime.exceptionThrown") erroriConsole.push(m.params.exceptionDetails.text);
  if (m.method === "Runtime.consoleAPICalled" && m.params.type === "error")
    erroriConsole.push(m.params.args.map((a) => a.value ?? a.description).join(" "));
});

const valuta = async (espressione) => {
  const r = await cmd("Runtime.evaluate", { expression: espressione, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) throw new Error(`${espressione}: ${r.exceptionDetails.text}`);
  return r.result.value;
};
const caricata = () =>
  new Promise((r) => {
    const f = (m) => {
      if (m.method === "Page.loadEventFired" && m.sessionId === sessionId) {
        ascoltatori.splice(ascoltatori.indexOf(f), 1);
        r();
      }
    };
    ascoltatori.push(f);
  });
const apri = async (percorso) => {
  const fatto = caricata();
  await cmd("Page.navigate", { url: BASE + percorso });
  await fatto;
  await pausa(400); // tempo per i componenti che leggono la memoria del telefono
};
const foto = async (nome) => {
  if (!CARTELLA_FOTO) return;
  const { data } = await cmd("Page.captureScreenshot", { format: "png" });
  writeFileSync(path.join(CARTELLA_FOTO, `${nome}.png`), Buffer.from(data, "base64"));
};
const clicca = (selettore) =>
  valuta(`(() => { const el = ${selettore}; if (!el) return false; el.click(); return true; })()`);
const perTesto = (tag, testo) =>
  `[...document.querySelectorAll(${JSON.stringify(tag)})].find((e) => e.textContent.trim() === ${JSON.stringify(testo)})`;

// Controlli comuni a ogni schermata
const controllaSchermata = async (percorso, nome, { senzaBarra = false } = {}) => {
  const dati = await valuta(`(() => {
    const visibili = [...document.querySelectorAll("a, button, summary, input, select")].filter((e) => {
      const r = e.getBoundingClientRect();
      return r.width > 0 && r.height > 0 && getComputedStyle(e).visibility !== "hidden";
    });
    const piccoli = visibili.filter((e) => { const r = e.getBoundingClientRect(); return r.width < 44 || r.height < 44; })
      .map((e) => (e.getAttribute("aria-label") || e.textContent.trim()).slice(0, 40) + " (" + Math.round(e.getBoundingClientRect().width) + "×" + Math.round(e.getBoundingClientRect().height) + ")");
    return {
      guida: !!document.querySelector('nav[aria-label="Navigazione principale"] a[href="/guida"]'),
      larghezza: document.documentElement.scrollWidth,
      finestra: window.innerWidth,
      titolo: document.querySelector("h1")?.textContent.trim() ?? "",
      piccoli,
      font: getComputedStyle(document.body).fontFamily,
    };
  })()`);
  if (!senzaBarra) ok(dati.guida, `${percorso}: Guida raggiungibile dalla barra in basso`);
  ok(dati.larghezza <= dati.finestra, `${percorso}: nessuno scorrimento laterale (${dati.larghezza} ≤ ${dati.finestra} px)`);
  ok(dati.piccoli.length === 0, `${percorso}: elementi toccabili ≥ 44 px${dati.piccoli.length ? " — troppo piccoli: " + dati.piccoli.join(", ") : ""}`);
  ok(dati.titolo.length > 0, `${percorso}: titolo presente ("${dati.titolo.replace(/\s+/g, " ")}")`);
  ok(dati.font.includes("Nunito"), `${percorso}: carattere Nunito`);
  await foto(nome);
};

try {
  // Se l'app ha l'onboarding (passo 1.2), al primo avvio porta lì: lo segniamo come visto per provare le sezioni
  await apri("/");
  const haOnboarding = await valuta(`location.pathname === "/benvenuto"`);
  if (haOnboarding) await valuta(`localStorage.setItem("mandragola:onboarding", "visto"), true`);

  // --- 1. Tutte le schermate ---
  const tutorial = ["muoversi-nell-app", "spiegazioni-delle-sezioni", "installare-l-app", "ripetere-il-tutorial-iniziale", "usare-la-guida"];
  const schermate = ["/", "/piante", "/fotocamera", "/promemoria", "/nuova-pianta", "/guida", ...tutorial.map((t) => `/guida/${t}`)];
  for (const s of schermate) {
    await apri(s);
    await controllaSchermata(s, s === "/" ? "home" : s.slice(1).replace(/\//g, "-"));
  }

  // --- 2. Navigazione: dalla Home alla Guida con la barra ---
  await apri("/");
  await clicca(`document.querySelector('nav[aria-label="Navigazione principale"] a[href="/guida"]')`);
  await pausa(800);
  ok((await valuta("location.pathname")) === "/guida", "Barra: il pulsante Guida apre la Guida");
  // La voce attiva si accende quando la pagina è pronta: aspettiamo fino a 3 s. Attenzione: Next.js tiene in memoria,
  // nascosta, la pagina precedente (anche lei ha un link alla Guida), quindi si cerca solo nella barra.
  let attiva = false;
  for (let i = 0; i < 15 && !attiva; i++) {
    attiva = await valuta(`document.querySelector('nav[aria-label="Navigazione principale"] a[href="/guida"]')?.getAttribute("aria-current") === "page"`);
    if (!attiva) await pausa(200);
  }
  ok(attiva, "Barra: la voce Guida risulta attiva");

  // --- 3. Spiegazione della prima visita (sezione Le mie piante) ---
  await valuta(`localStorage.removeItem("mandragola:spiegazione:piante"), true`);
  await apri("/piante");
  const riquadro = `document.querySelector('section[aria-label^="Spiegazione"]')`;
  ok(await valuta(`!!${riquadro}`), "Spiegazione: compare alla prima visita");
  await clicca(perTesto("button", "Ho capito"));
  await pausa(200);
  ok(await valuta(`!${riquadro}`), "Spiegazione: \"Ho capito\" la chiude");
  await apri("/piante");
  ok(await valuta(`!${riquadro}`), "Spiegazione: non ricompare alla visita successiva");
  await clicca(`document.querySelector('button[aria-label^="Cos\\'è la sezione"]')`);
  await pausa(200);
  ok(await valuta(`!!${riquadro}`), "Spiegazione: il pulsante \"?\" la richiama");

  // --- 4. FAQ: una domanda si apre ---
  await apri("/guida");
  await clicca(`document.querySelector("details summary")`);
  ok(await valuta(`document.querySelector("details").open`), "Guida: una domanda frequente si apre al tocco");

  // --- 5. Vetro: il browser lo supporta e la classe lo usa ---
  ok(
    await valuta(`getComputedStyle(document.querySelector(".vetro")).backdropFilter.includes("blur")`),
    "Vetro: effetto sfocato attivo (con ripiego opaco nei browser che non lo supportano)",
  );

  // --- 6. Onboarding (passo 1.2) ---
  if (haOnboarding) {
    const { provaOnboarding } = await import("./prova-onboarding.mjs");
    await provaOnboarding({ apri, valuta, clicca, perTesto, ok, pausa, foto, controllaSchermata });
  }

  ok(erroriConsole.length === 0, `Console senza errori${erroriConsole.length ? ": " + erroriConsole.join(" | ") : ""}`);
} catch (e) {
  ok(false, `Errore durante la prova: ${e.message}`);
} finally {
  ws.close();
  edge.kill();
  await pausa(500);
  try {
    rmSync(profilo, { recursive: true, force: true });
  } catch {
    /* Edge può tenere occupata la cartella per qualche istante: non è un errore della prova */
  }
}

console.log(`\n${risultati - errori}/${risultati} controlli superati.`);
process.exit(errori ? 1 : 0);
