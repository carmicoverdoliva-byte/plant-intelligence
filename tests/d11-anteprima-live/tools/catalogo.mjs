// Catalogo di prova D11: le piante che l'anteprima live sa riconoscere.
// `label` = nome comune mostrato nel popup; `genus` = genere mostrato se serve (mai la specie, D10).
// `inatName`/`rank` = nome usato per cercare le foto di riferimento su iNaturalist.
export const CATALOG = [
  { slug: 'pothos', label: 'Pothos', genus: 'Epipremnum', inatName: 'Epipremnum aureum', rank: 'species' },
  { slug: 'sansevieria', label: 'Sansevieria', genus: 'Dracaena', inatName: 'Sansevieria trifasciata', rank: 'species' },
  { slug: 'zamioculcas', label: 'Zamioculcas', genus: 'Zamioculcas', inatName: 'Zamioculcas zamiifolia', rank: 'species' },
  { slug: 'spatifillo', label: 'Spatifillo', genus: 'Spathiphyllum', inatName: 'Spathiphyllum', rank: 'genus' },
  { slug: 'ficus-elastica', label: 'Ficus elastica', genus: 'Ficus', inatName: 'Ficus elastica', rank: 'species' },
  { slug: 'dracena', label: 'Dracena', genus: 'Dracaena', inatName: 'Dracaena fragrans', rank: 'species' },
  { slug: 'falangio', label: 'Falangio', genus: 'Chlorophytum', inatName: 'Chlorophytum comosum', rank: 'species' },
  { slug: 'aloe-vera', label: 'Aloe vera', genus: 'Aloe', inatName: 'Aloe vera', rank: 'species' },
  { slug: 'calathea', label: 'Calathea', genus: 'Goeppertia', inatName: 'Goeppertia', rank: 'genus' },
  { slug: 'kenzia', label: 'Kenzia', genus: 'Howea', inatName: 'Howea forsteriana', rank: 'species' },
  { slug: 'crassula-ovata', label: 'Albero di giada', genus: 'Crassula', inatName: 'Crassula ovata', rank: 'species' },
  { slug: 'echeveria', label: 'Echeveria', genus: 'Echeveria', inatName: 'Echeveria', rank: 'genus' },
  { slug: 'anthurium', label: 'Anthurium', genus: 'Anthurium', inatName: 'Anthurium andraeanum', rank: 'species' },
  { slug: 'stella-di-natale', label: 'Stella di Natale', genus: 'Euphorbia', inatName: 'Euphorbia pulcherrima', rank: 'species' },
  { slug: 'ciclamino', label: 'Ciclamino', genus: 'Cyclamen', inatName: 'Cyclamen persicum', rank: 'species' },
  { slug: 'edera', label: 'Edera', genus: 'Hedera', inatName: 'Hedera helix', rank: 'species' },
  { slug: 'filodendro', label: 'Filodendro', genus: 'Philodendron', inatName: 'Philodendron hederaceum', rank: 'species' },
  { slug: 'peperomia', label: 'Peperomia', genus: 'Peperomia', inatName: 'Peperomia', rank: 'genus' },
  { slug: 'basilico', label: 'Basilico', genus: 'Ocimum', inatName: 'Ocimum basilicum', rank: 'species' },
  { slug: 'rosmarino', label: 'Rosmarino', genus: 'Salvia', inatName: 'Salvia rosmarinus', rank: 'species' },
  { slug: 'maranta', label: 'Maranta', genus: 'Maranta', inatName: 'Maranta leuconeura', rank: 'species' },
  { slug: 'monstera', label: 'Monstera', genus: 'Monstera', inatName: 'Monstera deliciosa', rank: 'species' },
];

// Piante "gemelle" (D10/F17): gruppi che il modello confonde spesso. Se i primi due nomi sono nello stesso gruppo e
// vicini, il popup dice "Forse: X o Y – scatta per saperlo" invece di scegliere a caso.
// Scelti il 2026-11-18 con i dati: somiglianza fra le impronte (prototypes-int8.json) ed errori della prova sul PC e
// sull'iPhone; Anthurium/Spatifillo per la somiglianza nota delle infiorescenze (spata). Una pianta può stare in più gruppi.
export const TWIN_GROUPS = [
  { id: 'aracee-rampicanti', slugs: ['pothos', 'filodendro', 'monstera'], why: 'Pothos/Filodendro somiglianza 0,79; iPhone: Pothos→Filodendro, Monstera→Filodendro' },
  { id: 'foglie-a-cuore', slugs: ['filodendro', 'peperomia'], why: 'somiglianza 0,75; PC: 2 Peperomia su 2 con Filodendro al 1° posto' },
  { id: 'marantacee', slugs: ['maranta', 'calathea'], why: 'somiglianza 0,78; stessa famiglia (Marantaceae)' },
  { id: 'spate-bianche-rosse', slugs: ['anthurium', 'spatifillo'], why: 'somiglianza 0,66; infiorescenza a spata simile' },
];
