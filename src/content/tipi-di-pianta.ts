// Tipi di pianta (D13, livello 3: c'è sempre una scheda). Elenco confermato nel blocco 1 (2026-11-18):
// 19 tipi + la scheda universale; dal 2026-11-26 20: "ortaggi e aromatiche" diviso in aromatiche mediterranee e orto.
// dal 2026-11-27 23: "alberi" diviso in agrumi, alberi mediterranei, alberi da frutto e alberi ornamentali (riserva).
// "casa" = in Italia si coltivano soprattutto in casa (clima d'origine tropicale).

export type IdTipo =
  | "orchidee"
  | "bromelie"
  | "foglia-tropicale"
  | "rampicanti-tropicali"
  | "alberi-arbusti-tropicali"
  | "succulente"
  | "cactus"
  | "felci"
  | "palme"
  | "agrumi"
  | "alberi-mediterranei"
  | "alberi-frutto"
  | "alberi-ornamentali"
  | "conifere"
  | "arbusti"
  | "arbusti-mediterranei"
  | "arbusti-acidofili"
  | "rampicanti"
  | "erbacee-perenni"
  | "annuali"
  | "bulbose"
  | "graminacee"
  | "acquatiche"
  | "ortaggi-aromatiche"
  | "aromatiche-mediterranee"
  | "universale";

export const TIPI: Record<IdTipo, { nome: string; dove: "casa" | "esterno" | "entrambi" }> = {
  orchidee: { nome: "orchidee da appartamento", dove: "casa" },
  bromelie: { nome: "bromelie e tillandsie", dove: "casa" },
  "foglia-tropicale": { nome: "piante verdi da foglia tropicali", dove: "casa" },
  "rampicanti-tropicali": { nome: "rampicanti e ricadenti tropicali", dove: "casa" },
  "alberi-arbusti-tropicali": { nome: "alberi e arbusti tropicali da appartamento", dove: "casa" },
  succulente: { nome: "succulente (piante grasse non cactus)", dove: "entrambi" },
  cactus: { nome: "cactus", dove: "entrambi" },
  felci: { nome: "felci", dove: "entrambi" },
  palme: { nome: "palme", dove: "entrambi" },
  agrumi: { nome: "agrumi", dove: "esterno" },
  "alberi-mediterranei": { nome: "alberi mediterranei sempreverdi", dove: "esterno" },
  "alberi-frutto": { nome: "alberi da frutto", dove: "esterno" },
  "alberi-ornamentali": { nome: "alberi ornamentali di clima temperato", dove: "esterno" },
  conifere: { nome: "conifere", dove: "esterno" },
  arbusti: { nome: "arbusti da giardino e da balcone", dove: "esterno" },
  "arbusti-mediterranei": { nome: "arbusti mediterranei da sole", dove: "esterno" },
  "arbusti-acidofili": { nome: "arbusti da mezz'ombra e terreno acido", dove: "esterno" },
  rampicanti: { nome: "rampicanti da esterno", dove: "esterno" },
  "erbacee-perenni": { nome: "erbacee perenni", dove: "esterno" },
  annuali: { nome: "piante annuali e biennali", dove: "esterno" },
  bulbose: { nome: "bulbose", dove: "entrambi" },
  graminacee: { nome: "graminacee e bambù", dove: "esterno" },
  acquatiche: { nome: "piante acquatiche e palustri", dove: "esterno" },
  "ortaggi-aromatiche": { nome: "ortaggi e aromatiche dell'orto", dove: "esterno" },
  "aromatiche-mediterranee": { nome: "aromatiche mediterranee", dove: "esterno" },
  universale: { nome: "pianta in vaso o in giardino (consigli generali)", dove: "entrambi" },
};
