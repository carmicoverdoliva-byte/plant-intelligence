import { LogoMandragola } from "@/components/logo-mandragola";

// Pagina iniziale provvisoria (passo 0.3 del piano della v1, stile applicato prima della Fase 1):
// verrà sostituita dalla Home vera nel passo 1.1, seguendo docs/design/riferimenti/home.html.
export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-5 pt-7 pb-10">
      <header className="flex items-center gap-2.5">
        <LogoMandragola size={44} />
        <span className="text-xl font-black tracking-[0.2px]">Mandragola</span>
      </header>

      <h1 className="text-[32px] leading-[1.12] font-black">
        Cosa scopriamo
        <br />
        <span className="text-verde">oggi?</span>
      </h1>

      <section className="vetro-forte flex flex-col gap-2 rounded-card p-5">
        <h2 className="text-[22px] font-black">Riconosci e cura le tue piante</h2>
        <p className="text-[15px] leading-relaxed text-testo-2">
          Gratis, senza pubblicità, senza account.
        </p>
        <p className="text-sm text-testo-3">
          App in costruzione: questa è la prima pagina della versione 1.
        </p>
      </section>
    </main>
  );
}
