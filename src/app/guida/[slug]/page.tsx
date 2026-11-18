import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Bolla } from "@/components/bolla";
import { Icona, TRATTO } from "@/components/icona";
import { tutorial } from "@/content/guida";

// Un tutorial della Guida: titolo e passi numerati. Le pagine si preparano tutte durante la compilazione.
export function generateStaticParams() {
  return tutorial.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: PageProps<"/guida/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const t = tutorial.find((x) => x.slug === slug);
  return { title: t ? `${t.titolo} · Guida · Mandragola` : "Guida · Mandragola" };
}

export default async function Tutorial({ params }: PageProps<"/guida/[slug]">) {
  const { slug } = await params;
  const t = tutorial.find((x) => x.slug === slug);
  if (!t) notFound();

  return (
    <main className="pagina">
      <Link
        href="/guida"
        className="-ml-2 inline-flex h-11 items-center gap-1 self-start rounded-pillola pr-3 pl-1 text-[15px] font-extrabold text-verde"
      >
        <ChevronLeft size={22} strokeWidth={TRATTO} aria-hidden="true" />
        Guida
      </Link>

      <header className="flex items-center gap-3">
        <Bolla tipo={t.bolla} lato={52}>
          <Icona nome={t.icona} size={26} />
        </Bolla>
        <h1 className="text-[28px] leading-tight font-black">{t.titolo}</h1>
      </header>
      <p className="text-[15px] leading-snug text-testo-2">{t.riassunto}</p>

      <ol className="vetro-forte flex flex-col gap-4 rounded-card p-5">
        {t.passi.map((p, i) => (
          <li key={p} className="flex gap-3">
            <span
              aria-hidden="true"
              className="flex size-8 shrink-0 items-center justify-center rounded-pillola bg-verde text-[15px] font-black text-su-verde"
            >
              {i + 1}
            </span>
            <span className="pt-1 text-[15px] leading-snug">{p}</span>
          </li>
        ))}
      </ol>
    </main>
  );
}
