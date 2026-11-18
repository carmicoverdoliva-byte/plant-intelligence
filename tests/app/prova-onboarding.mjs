// Prova del tutorial iniziale (passo 1.2), chiamata da prova-app.mjs con i suoi strumenti.
// Controlla: primo avvio → tutorial; percorso completo fino a "Inizia"; secondo avvio senza tutorial; "Salta";
// ripetizione dalla Guida; invito a installare l'app (compare in Safari, si chiude e resta chiuso).
export async function provaOnboarding({ apri, valuta, clicca, perTesto, ok, pausa, foto, controllaSchermata }) {
  const CHIAVE = "mandragola:onboarding";
  const percorso = () => valuta("location.pathname");
  const aspettaPercorso = async (atteso) => {
    for (let i = 0; i < 25; i++) {
      if ((await percorso()) === atteso) return true;
      await pausa(200);
    }
    return false;
  };
  const titolo = () => valuta(`document.querySelector("main h1")?.textContent.trim()`);

  // 1. Primo avvio: dalla Home si arriva al tutorial
  await valuta(`localStorage.removeItem("${CHIAVE}"), true`);
  await apri("/");
  ok(await aspettaPercorso("/benvenuto"), "Onboarding: al primo avvio la Home porta al tutorial");
  ok(await valuta(`!document.querySelector('nav[aria-label="Navigazione principale"]')`), "Onboarding: a schermo intero, senza barra in basso");

  // 2. Percorso completo: ogni schermata controllata (tocchi, scorrimento laterale), poi "Inizia"
  const titoli = [];
  for (let i = 0; i < 10; i++) {
    titoli.push(await titolo());
    await controllaSchermata(`/benvenuto (${i + 1}) ${titoli.at(-1)}`, `benvenuto-${i + 1}`, { senzaBarra: true });
    if (await valuta(`!!${perTesto("button", "Inizia")}`)) break;
    await clicca(perTesto("button", "Avanti"));
    await pausa(250);
  }
  ok(titoli.length === 6, `Onboarding: 6 schermate (${titoli.join(" · ")})`);
  ok(
    titoli.includes("Fotocamera e posizione") && titoli.includes("Mettila sulla schermata Home") && titoli.includes("Una copia di sicurezza"),
    "Onboarding: ci sono permessi, installazione sulla Home e backup",
  );
  await clicca(perTesto("button", "Indietro"));
  await pausa(250);
  ok((await titolo()) === titoli[4], "Onboarding: \"Indietro\" torna alla schermata precedente");
  await clicca(perTesto("button", "Avanti"));
  await pausa(250);
  await clicca(perTesto("button", "Inizia"));
  ok(await aspettaPercorso("/"), "Onboarding: \"Inizia\" porta alla Home");
  ok((await valuta(`localStorage.getItem("${CHIAVE}")`)) === "visto", "Onboarding: ricordato come visto");

  // 3. Secondo avvio: niente tutorial
  await apri("/");
  await pausa(600);
  ok((await percorso()) === "/", "Onboarding: al secondo avvio non ricompare");

  // 4. "Salta" da una schermata qualsiasi
  await valuta(`localStorage.removeItem("${CHIAVE}"), true`);
  await apri("/");
  await aspettaPercorso("/benvenuto");
  await clicca(perTesto("button", "Avanti"));
  await pausa(250);
  await clicca(perTesto("button", "Salta"));
  ok(await aspettaPercorso("/"), "Onboarding: \"Salta\" porta alla Home");
  ok((await valuta(`localStorage.getItem("${CHIAVE}")`)) === "visto", "Onboarding: dopo \"Salta\" non ricompare");

  // 5. Ripetere dalla Guida
  await apri("/guida");
  await clicca(`[...document.querySelectorAll("a")].find((a) => a.textContent.includes("Ripeti il tutorial iniziale"))`);
  ok(await aspettaPercorso("/benvenuto"), "Guida: \"Ripeti il tutorial iniziale\" apre il tutorial");
  ok((await titolo()) === titoli[0], "Guida: il tutorial ripetuto riparte dalla prima schermata");
  await foto("benvenuto-ripetuto");

  // 5b. Stesso percorso senza ricaricare la pagina (come sul telefono): fine tutorial → Guida → Ripeti
  for (let i = 0; i < 10 && !(await valuta(`!!${perTesto("button", "Inizia")}`)); i++) {
    await clicca(perTesto("button", "Avanti"));
    await pausa(200);
  }
  await clicca(perTesto("button", "Inizia"));
  await aspettaPercorso("/");
  await pausa(500);
  await clicca(`document.querySelector('nav[aria-label="Navigazione principale"] a[href="/guida"]')`);
  await aspettaPercorso("/guida");
  await pausa(500);
  await clicca(`[...document.querySelectorAll("a")].find((a) => a.textContent.includes("Ripeti il tutorial iniziale") && a.offsetParent)`);
  await aspettaPercorso("/benvenuto");
  await pausa(400);
  const titoloVisibile = await valuta(`[...document.querySelectorAll("main h1")].find((h) => h.offsetParent)?.textContent.trim()`);
  ok(titoloVisibile === titoli[0], `Guida: ripetuto senza ricaricare, riparte dalla prima schermata ("${titoloVisibile}")`);

  // 6. Invito a installare l'app (qui siamo "in Safari", non installata)
  await valuta(`localStorage.removeItem("mandragola:invito-installazione"), true`);
  await apri("/");
  const invito = `document.querySelector('aside[aria-label="Installa l\\'app"]')`;
  ok(await valuta(`!!${invito}`), "Invito installazione: compare se l'app è aperta da Safari");
  await clicca(`document.querySelector('button[aria-label="Chiudi l\\'invito"]')`);
  await pausa(200);
  ok(await valuta(`!${invito}`), "Invito installazione: si chiude con la X");
  await apri("/");
  ok(await valuta(`!${invito}`), "Invito installazione: resta chiuso alla visita successiva");
}
