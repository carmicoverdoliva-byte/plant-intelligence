# Prova sul PC dell'anteprima live (D11) — modello fp16

Data: 2026-11-17 · Modello: BioCLIP v1 (ViT-B/16, fp16), conversione ONNX m3r1al/naturalist-bioclip-v1 · 172.8 MB · SHA-256 `d982b6800a5b7512…`
Metodo: confronto con le impronte medie di 6 foto di riferimento per pianta (22 piante). Foto di prova: quelle del test D9, **mai usate come riferimento**.
Velocità sul PC (WebAssembly, senza scheda grafica): 514 ms per analisi in media. Velocità e calore sul telefono li misura la prova D11.

| Gruppo | Foto | Pianta giusta al 1° posto | Fra le prime 3 |
|---|---|---|---|
| ricevute | 3 | 2 (67%) | 3 (100%) |
| inaturalist-coltivate | 32 | 28 (88%) | 31 (97%) |
| inaturalist-selvatiche | 8 | 8 (100%) | 8 (100%) |
| **Totale** | 43 | 38 (88%) | 42 (98%) |

## Trappole (somiglianza con la pianta più vicina)
| Foto | 1° nome | Somiglianza |
|---|---|---|
| trappola-tazza.jpeg | Pothos | 0.372 |
| trappola-sfocata.jpeg | Kenzia | 0.387 |
| trappola-foglia-secca.jpeg | Falangio | 0.306 |
Foto vere: somiglianza minima 0.434.

## Taratura della probabilità

La probabilità si calcola dalle somiglianze con una "scala": più la scala è alta, più piccole differenze di somiglianza
diventano grandi differenze di probabilità. Con scala 100 (quella usata da CLIP/BioCLIP per i nomi) la probabilità
risultava **troppo sicura** con le immagini ambigue. NLL ed ECE misurano quanto la probabilità è realistica (più basso = meglio).

| Scala | NLL | ECE |
|---|---|---|
| 10 | 1.064 | 46.8% |
| 15 | 0.679 | 24.9% |
| 20 | 0.526 | 12.5% |
| 25 | 0.474 | 5.8% |
| 30 ✅ | 0.465 | 3.7% |
| 40 | 0.503 | 7.5% |
| 50 | 0.571 | 9.0% |
| 60 | 0.651 | 7.9% |
| 80 | 0.825 | 10.2% |
| 100 | 1.007 | 10.3% |

**Scelta: scala 30.** Esempio della prova con la webcam (somiglianze 0,32 / 0,31 / 0,31 e altre ~0,25): il 1° nome passa dal 57% (scala 100) al 21% (scala 30).
Soglie del popup per questa scala: probabilità ≥ 30%, somiglianza ≥ 0.42, distacco ≥ 15 punti → nome mostrato per 40/43 foto vere, giusto in 36 (90%), trappole con nome: 0/3.
⚠️ Taratura fatta sulle stesse 43 foto usate per misurare: i valori sono indicativi e vanno ricontrollati sul telefono.

## Dettaglio (scala 100)
| Foto | Atteso | 1° nome | Somigl. | 2° nome | Esito |
|---|---|---|---|---|---|
| Pothos.jpeg | pothos | Pothos | 0.695 | Spatifillo | ✅ |
| maranta.jpeg | maranta | Maranta | 0.707 | Calathea | ✅ |
| monstera.jpeg | monstera | Filodendro | 0.786 | Pothos | 🔸 |
| trappola-tazza.jpeg | — | Pothos | 0.372 | Sansevieria | trappola |
| trappola-sfocata.jpeg | — | Kenzia | 0.387 | Pothos | trappola |
| trappola-foglia-secca.jpeg | — | Falangio | 0.306 | Dracena | trappola |
| inat-pothos-1.jpg | pothos | Pothos | 0.698 | Filodendro | ✅ |
| inat-pothos-2.jpg | pothos | Pothos | 0.636 | Filodendro | ✅ |
| inat-sansevieria-1.jpg | sansevieria | Sansevieria | 0.735 | Aloe vera | ✅ |
| inat-sansevieria-2.jpg | sansevieria | Sansevieria | 0.717 | Aloe vera | ✅ |
| inat-zamioculcas-1.jpg | zamioculcas | Zamioculcas | 0.710 | Filodendro | ✅ |
| inat-zamioculcas-2.jpg | zamioculcas | Zamioculcas | 0.686 | Pothos | ✅ |
| inat-spatifillo-1.jpg | spatifillo | Spatifillo | 0.724 | Anthurium | ✅ |
| inat-spatifillo-2.jpg | spatifillo | Spatifillo | 0.699 | Calathea | ✅ |
| inat-ficus-elastica-1.jpg | ficus-elastica | Calathea | 0.678 | Maranta | 🔸 |
| inat-ficus-elastica-2.jpg | ficus-elastica | Ficus elastica | 0.659 | Filodendro | ✅ |
| inat-dracena-1.jpg | dracena | Dracena | 0.741 | Monstera | ✅ |
| inat-dracena-2.jpg | dracena | Dracena | 0.664 | Sansevieria | ✅ |
| inat-falangio-1.jpg | falangio | Falangio | 0.580 | Aloe vera | ✅ |
| inat-falangio-2.jpg | falangio | Falangio | 0.546 | Aloe vera | ✅ |
| inat-aloe-vera-1.jpg | aloe-vera | Aloe vera | 0.642 | Sansevieria | ✅ |
| inat-aloe-vera-2.jpg | aloe-vera | Aloe vera | 0.478 | Sansevieria | ✅ |
| inat-calathea-1.jpg | calathea | Calathea | 0.725 | Maranta | ✅ |
| inat-calathea-2.jpg | calathea | Sansevieria | 0.526 | Calathea | 🔸 |
| inat-kenzia-1.jpg | kenzia | Kenzia | 0.652 | Monstera | ✅ |
| inat-kenzia-2.jpg | kenzia | Kenzia | 0.693 | Falangio | ✅ |
| inat-crassula-ovata-1.jpg | crassula-ovata | Albero di giada | 0.665 | Ficus elastica | ✅ |
| inat-crassula-ovata-2.jpg | crassula-ovata | Albero di giada | 0.798 | Echeveria | ✅ |
| inat-echeveria-1.jpg | echeveria | Echeveria | 0.714 | Albero di giada | ✅ |
| inat-echeveria-2.jpg | echeveria | Echeveria | 0.738 | Albero di giada | ✅ |
| inat-anthurium-1.jpg | anthurium | Anthurium | 0.755 | Stella di Natale | ✅ |
| inat-anthurium-2.jpg | anthurium | Anthurium | 0.833 | Ciclamino | ✅ |
| inat-stella-di-natale-1.jpg | stella-di-natale | Stella di Natale | 0.774 | Anthurium | ✅ |
| inat-stella-di-natale-2.jpg | stella-di-natale | Stella di Natale | 0.434 | Ficus elastica | ✅ |
| inat-ciclamino-1.jpg | ciclamino | Ciclamino | 0.661 | Echeveria | ✅ |
| inat-ciclamino-2.jpg | ciclamino | Ciclamino | 0.669 | Anthurium | ✅ |
| inat-edera-1.jpg | edera | Edera | 0.621 | Pothos | ✅ |
| inat-edera-2.jpg | edera | Edera | 0.504 | Pothos | ✅ |
| inat-filodendro-1.jpg | filodendro | Filodendro | 0.756 | Pothos | ✅ |
| inat-filodendro-2.jpg | filodendro | Filodendro | 0.736 | Pothos | ✅ |
| inat-peperomia-1.jpg | peperomia | Peperomia | 0.555 | Filodendro | ✅ |
| inat-peperomia-2.jpg | peperomia | Filodendro | 0.641 | Albero di giada | 🔸 |
| inat-basilico-1.jpg | basilico | Zamioculcas | 0.489 | Pothos | ❌ |
| inat-basilico-2.jpg | basilico | Basilico | 0.685 | Rosmarino | ✅ |
| inat-rosmarino-1.jpg | rosmarino | Rosmarino | 0.571 | Falangio | ✅ |
| inat-rosmarino-2.jpg | rosmarino | Rosmarino | 0.533 | Aloe vera | ✅ |
