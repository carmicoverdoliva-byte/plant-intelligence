// Pagina iniziale provvisoria (passo 0.3 del piano della v1): verrà sostituita dalla Home vera nel passo 1.1.
export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-12 text-center">
      <h1 className="text-3xl font-bold">Plant Intelligence</h1>
      <p className="max-w-md text-base">
        Riconosci e cura le tue piante: gratis, senza pubblicità, senza account.
      </p>
      <p className="max-w-md text-sm opacity-70">
        App in costruzione: questa è la prima pagina della versione 1.
      </p>
    </main>
  );
}
