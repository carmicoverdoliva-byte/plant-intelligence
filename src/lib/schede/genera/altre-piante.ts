// Nomi delle ALTRE piante (regola 9c, decisione dell'utente del 2026-11-26): una scheda generata non deve parlare di
// un'altra pianta (es. il pothos nella scheda della Monstera), salvo i confronti che la fonte fa su questa pianta.
// I nomi vengono dall'elenco delle piante più comuni (data/elenco-priorita.json): nome scientifico e nomi comuni.
import elenco from "../../../../data/elenco-priorita.json" with { type: "json" };

interface Voce {
  nome: string;
  nomeComune?: string;
}
// Parole che sono anche parole comuni dell'italiano: non si cercano ("rosa" è anche un colore)
const NON_CERCARE = new Set(["rosa"]);

const voci: Voce[] = [...elenco.specie, ...elenco.generi];
const genereDi = (nome: string) => nome.trim().split(/\s+/)[0];
/** "Mammillaria (cactus)" → ["Mammillaria"]; "Sansevieria, lingua di suocera" → ["Sansevieria", "lingua di suocera"] */
const nomiDi = (v: Voce) => [v.nome, ...(v.nomeComune ?? "").split(",")].map((n) => n.replace(/\(.*?\)/g, "").trim()).filter(Boolean);

/** I nomi delle piante dell'elenco di un ALTRO genere, senza quelli che indicano anche questa pianta. */
export function altrePiante(specie: string, genere: string): string[] {
  const mie = voci.filter((v) => genereDi(v.nome) === genere || v.nome === specie);
  const mieiNomi = new Set(mie.flatMap(nomiDi).map((n) => n.toLowerCase()));
  const altri = voci.filter((v) => !mie.includes(v)).flatMap(nomiDi);
  return [...new Set(altri)].filter((n) => !mieiNomi.has(n.toLowerCase()) && !NON_CERCARE.has(n.toLowerCase()) && n.toLowerCase() !== genere.toLowerCase());
}
