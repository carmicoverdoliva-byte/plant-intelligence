// Prova dell'avviso "Nuova versione disponibile" (richiesta dell'utente del 2026-11-18), chiamata da prova-app.mjs.
// La versione "nuova" si simula intercettando /api/versione in Edge.
export async function provaAggiornamento({ apri, valuta, clicca, perTesto, ok, pausa, cmd, ascoltatori, sessionId }) {
  const avviso = `[...document.querySelectorAll('[role="status"]')].find((e) => e.textContent.includes("Nuova versione disponibile"))`;

  // 1. Stessa versione: nessun avviso
  await apri("/");
  await pausa(1200);
  ok(await valuta(`!${avviso}`), "Aggiornamento: nessun avviso se la versione è la stessa");

  // 2. Versione diversa sul server: compare l'avviso
  await cmd("Fetch.enable", { patterns: [{ urlPattern: "*/api/versione*" }] });
  const intercetta = async (m) => {
    if (m.method !== "Fetch.requestPaused" || m.sessionId !== sessionId) return;
    await cmd("Fetch.fulfillRequest", {
      requestId: m.params.requestId,
      responseCode: 200,
      responseHeaders: [{ name: "content-type", value: "application/json" }],
      body: Buffer.from(JSON.stringify({ versione: "versione-nuova-di-prova" })).toString("base64"),
    });
  };
  ascoltatori.push(intercetta);
  await valuta(`localStorage.setItem("mandragola:prova-dati", "conservato"), true`);
  await apri("/");
  let visto = false;
  for (let i = 0; i < 20 && !visto; i++) {
    visto = await valuta(`!!${avviso}`);
    if (!visto) await pausa(200);
  }
  ok(visto, "Aggiornamento: con una versione nuova compare \"Nuova versione disponibile\"");
  ok(await valuta(`!!${perTesto("button", "Aggiorna")}`), "Aggiornamento: pulsante \"Aggiorna\"");

  // 3. "Aggiorna" ricarica l'app e i dati restano
  ascoltatori.splice(ascoltatori.indexOf(intercetta), 1);
  await cmd("Fetch.disable");
  await clicca(perTesto("button", "Aggiorna"));
  await pausa(2000);
  ok((await valuta(`localStorage.getItem("mandragola:prova-dati")`)) === "conservato", "Aggiornamento: dopo \"Aggiorna\" i dati salvati restano");
  ok(await valuta(`!${avviso}`), "Aggiornamento: dopo la ricarica l'avviso sparisce");
  await valuta(`localStorage.removeItem("mandragola:prova-dati"), true`);
}
