# Prova sul PC dell'anteprima live (D11) — modello fp16

Data: 2026-11-18 · Modello: BioCLIP v1 (ViT-B/16, fp16), conversione ONNX m3r1al/naturalist-bioclip-v1 · 172.8 MB · SHA-256 `d982b6800a5b7512…`
Metodo: confronto con le impronte medie di 6 o 15 foto di riferimento per pianta (22 piante; 15 per le piante "gemelle"). Foto di prova: quelle del test D9, **mai usate come riferimento**.
Velocità sul PC (WebAssembly, senza scheda grafica): 881 ms per analisi in media. Velocità e calore sul telefono li misura la prova D11.

| Gruppo | Foto | Pianta giusta al 1° posto | Fra le prime 3 |
|---|---|---|---|
| ricevute | 3 | 2 (67%) | 3 (100%) |
| inaturalist-coltivate | 32 | 30 (94%) | 30 (94%) |
| inaturalist-selvatiche | 8 | 8 (100%) | 8 (100%) |
| **Totale** | 43 | 40 (93%) | 41 (95%) |

## Trappole (somiglianza con la pianta più vicina)
| Foto | 1° nome | Somiglianza |
|---|---|---|
| trappola-tazza.jpeg | Sansevieria | 0.356 |
| trappola-sfocata.jpeg | Kenzia | 0.387 |
| trappola-foglia-secca.jpeg | Falangio | 0.306 |
Foto vere: somiglianza minima 0.434.

## Taratura della probabilità

La probabilità si calcola dalle somiglianze con una "scala": più la scala è alta, più piccole differenze di somiglianza
diventano grandi differenze di probabilità. Con scala 100 (quella usata da CLIP/BioCLIP per i nomi) la probabilità
risultava **troppo sicura** con le immagini ambigue. NLL ed ECE misurano quanto la probabilità è realistica (più basso = meglio).

| Scala | NLL | ECE |
|---|---|---|
| 10 | 1.014 | 50.4% |
| 15 | 0.620 | 27.7% |
| 20 | 0.464 | 14.8% |
| 25 | 0.411 | 8.2% |
| 30 ✅ | 0.402 | 5.7% |
| 40 | 0.435 | 8.4% |
| 50 | 0.496 | 7.7% |
| 60 | 0.567 | 9.6% |
| 80 | 0.721 | 8.6% |
| 100 | 0.883 | 7.7% |

**Scelta: scala 30.** Esempio della prova con la webcam (somiglianze 0,32 / 0,31 / 0,31 e altre ~0,25): il 1° nome passa dal 57% (scala 100) al 21% (scala 30).
Soglie del popup per questa scala: probabilità ≥ 30%, somiglianza ≥ 0.42, distacco ≥ 15 punti → nome mostrato per 42/43 foto vere, giusto in 39 (93%), trappole con nome: 0/3.

## Piante gemelle ("Forse: X o Y")

Gruppi: pothos/filodendro/monstera · filodendro/peperomia · maranta/calathea · anthurium/spatifillo.
Con le stesse soglie: nome singolo per 42 foto (giusto 39), coppia "X o Y" per 0 foto (pianta giusta nella coppia: 0); trappole con un nome o una coppia: 0/3.

⚠️ Taratura fatta sulle stesse 43 foto usate per misurare: i valori sono indicativi e vanno ricontrollati sul telefono.

## Dettaglio (scala 100)
| Foto | Atteso | 1° nome | Somigl. | 2° nome | Esito |
|---|---|---|---|---|---|
| Pothos.jpeg | pothos | Pothos | 0.803 | Filodendro | ✅ |
| maranta.jpeg | maranta | Maranta | 0.780 | Calathea | ✅ |
| monstera.jpeg | monstera | Filodendro | 0.809 | Pothos | 🔸 |
| trappola-tazza.jpeg | — | Sansevieria | 0.356 | Edera | trappola |
| trappola-sfocata.jpeg | — | Kenzia | 0.387 | Pothos | trappola |
| trappola-foglia-secca.jpeg | — | Falangio | 0.306 | Dracena | trappola |
| inat-pothos-1.jpg | pothos | Pothos | 0.786 | Filodendro | ✅ |
| inat-pothos-2.jpg | pothos | Pothos | 0.696 | Calathea | ✅ |
| inat-sansevieria-1.jpg | sansevieria | Sansevieria | 0.735 | Aloe vera | ✅ |
| inat-sansevieria-2.jpg | sansevieria | Sansevieria | 0.717 | Aloe vera | ✅ |
| inat-zamioculcas-1.jpg | zamioculcas | Zamioculcas | 0.710 | Peperomia | ✅ |
| inat-zamioculcas-2.jpg | zamioculcas | Zamioculcas | 0.686 | Peperomia | ✅ |
| inat-spatifillo-1.jpg | spatifillo | Spatifillo | 0.754 | Anthurium | ✅ |
| inat-spatifillo-2.jpg | spatifillo | Spatifillo | 0.756 | Calathea | ✅ |
| inat-ficus-elastica-1.jpg | ficus-elastica | Calathea | 0.707 | Maranta | ❌ |
| inat-ficus-elastica-2.jpg | ficus-elastica | Ficus elastica | 0.659 | Filodendro | ✅ |
| inat-dracena-1.jpg | dracena | Dracena | 0.741 | Monstera | ✅ |
| inat-dracena-2.jpg | dracena | Dracena | 0.664 | Spatifillo | ✅ |
| inat-falangio-1.jpg | falangio | Falangio | 0.580 | Aloe vera | ✅ |
| inat-falangio-2.jpg | falangio | Falangio | 0.546 | Aloe vera | ✅ |
| inat-aloe-vera-1.jpg | aloe-vera | Aloe vera | 0.642 | Sansevieria | ✅ |
| inat-aloe-vera-2.jpg | aloe-vera | Aloe vera | 0.478 | Sansevieria | ✅ |
| inat-calathea-1.jpg | calathea | Calathea | 0.732 | Maranta | ✅ |
| inat-calathea-2.jpg | calathea | Calathea | 0.545 | Sansevieria | ✅ |
| inat-kenzia-1.jpg | kenzia | Kenzia | 0.652 | Monstera | ✅ |
| inat-kenzia-2.jpg | kenzia | Kenzia | 0.693 | Falangio | ✅ |
| inat-crassula-ovata-1.jpg | crassula-ovata | Albero di giada | 0.665 | Peperomia | ✅ |
| inat-crassula-ovata-2.jpg | crassula-ovata | Albero di giada | 0.798 | Peperomia | ✅ |
| inat-echeveria-1.jpg | echeveria | Echeveria | 0.714 | Albero di giada | ✅ |
| inat-echeveria-2.jpg | echeveria | Echeveria | 0.738 | Albero di giada | ✅ |
| inat-anthurium-1.jpg | anthurium | Anthurium | 0.784 | Stella di Natale | ✅ |
| inat-anthurium-2.jpg | anthurium | Anthurium | 0.860 | Ciclamino | ✅ |
| inat-stella-di-natale-1.jpg | stella-di-natale | Stella di Natale | 0.774 | Anthurium | ✅ |
| inat-stella-di-natale-2.jpg | stella-di-natale | Stella di Natale | 0.434 | Ficus elastica | ✅ |
| inat-ciclamino-1.jpg | ciclamino | Ciclamino | 0.661 | Echeveria | ✅ |
| inat-ciclamino-2.jpg | ciclamino | Ciclamino | 0.669 | Anthurium | ✅ |
| inat-edera-1.jpg | edera | Edera | 0.621 | Pothos | ✅ |
| inat-edera-2.jpg | edera | Edera | 0.504 | Peperomia | ✅ |
| inat-filodendro-1.jpg | filodendro | Filodendro | 0.739 | Peperomia | ✅ |
| inat-filodendro-2.jpg | filodendro | Filodendro | 0.721 | Pothos | ✅ |
| inat-peperomia-1.jpg | peperomia | Peperomia | 0.607 | Filodendro | ✅ |
| inat-peperomia-2.jpg | peperomia | Peperomia | 0.637 | Albero di giada | ✅ |
| inat-basilico-1.jpg | basilico | Zamioculcas | 0.489 | Peperomia | ❌ |
| inat-basilico-2.jpg | basilico | Basilico | 0.685 | Rosmarino | ✅ |
| inat-rosmarino-1.jpg | rosmarino | Rosmarino | 0.571 | Falangio | ✅ |
| inat-rosmarino-2.jpg | rosmarino | Rosmarino | 0.533 | Aloe vera | ✅ |
