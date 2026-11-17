# Prova sul PC dell'anteprima live (D11)

Data: 2026-11-17 · Modello: BioCLIP v1 fp16 (ONNX, 172.8 MB) · Metodo: confronto con le impronte medie di 6 foto di riferimento per pianta (22 piante).
Foto di prova: quelle del test D9, **mai usate come riferimento**. Il PC non misura velocità e calore del telefono: questo lo dirà la prova sull'iPhone 16.

| Gruppo | Foto | Pianta giusta al 1° posto | Fra le prime 3 |
|---|---|---|---|
| ricevute | 3 | 2 (67%) | 3 (100%) |
| inaturalist-coltivate | 32 | 28 (88%) | 31 (97%) |
| inaturalist-selvatiche | 8 | 8 (100%) | 8 (100%) |
| **Totale** | 43 | 38 (88%) | 42 (98%) |

## Trappole
| Foto | 1° nome | Probabilità | Somiglianza |
|---|---|---|---|
| trappola-tazza.jpeg | Pothos | 68% | 0.372 |
| trappola-sfocata.jpeg | Kenzia | 94% | 0.387 |
| trappola-foglia-secca.jpeg | Falangio | 85% | 0.306 |

## Soglie candidate per il popup (mostra il nome solo se probabilità ≥ p e somiglianza ≥ s)
| p | s | Foto vere con nome | di cui giuste | Trappole con nome |
|---|---|---|---|---|
| 0.5 | 0.35 | 43/43 | 38 (88%) | 2/3 |
| 0.5 | 0.4 | 43/43 | 38 (88%) | 0/3 |
| 0.5 | 0.42 | 43/43 | 38 (88%) | 0/3 |
| 0.5 | 0.45 | 42/43 | 37 (88%) | 0/3 |
| 0.6 | 0.35 | 40/43 | 36 (90%) | 2/3 |
| 0.6 | 0.4 | 40/43 | 36 (90%) | 0/3 |
| 0.6 | 0.42 | 40/43 | 36 (90%) | 0/3 |
| 0.6 | 0.45 | 39/43 | 35 (90%) | 0/3 |
| 0.7 | 0.35 | 40/43 | 36 (90%) | 1/3 |
| 0.7 | 0.4 | 40/43 | 36 (90%) | 0/3 |
| 0.7 | 0.42 | 40/43 | 36 (90%) | 0/3 |
| 0.7 | 0.45 | 39/43 | 35 (90%) | 0/3 |

## Dettaglio
| Foto | Atteso | 1° nome | Prob. | Somigl. | 2° nome | Esito |
|---|---|---|---|---|---|---|
| Pothos.jpeg | pothos | Pothos | 79% | 0.695 | Spatifillo | ✅ |
| maranta.jpeg | maranta | Maranta | 100% | 0.707 | Calathea | ✅ |
| monstera.jpeg | monstera | Filodendro | 100% | 0.786 | Pothos | 🔸 |
| trappola-tazza.jpeg | — | Pothos | 68% | 0.372 | Sansevieria | trappola |
| trappola-sfocata.jpeg | — | Kenzia | 94% | 0.387 | Pothos | trappola |
| trappola-foglia-secca.jpeg | — | Falangio | 85% | 0.306 | Dracena | trappola |
| inat-pothos-1.jpg | pothos | Pothos | 100% | 0.698 | Filodendro | ✅ |
| inat-pothos-2.jpg | pothos | Pothos | 99% | 0.636 | Filodendro | ✅ |
| inat-sansevieria-1.jpg | sansevieria | Sansevieria | 100% | 0.735 | Aloe vera | ✅ |
| inat-sansevieria-2.jpg | sansevieria | Sansevieria | 100% | 0.717 | Aloe vera | ✅ |
| inat-zamioculcas-1.jpg | zamioculcas | Zamioculcas | 100% | 0.710 | Filodendro | ✅ |
| inat-zamioculcas-2.jpg | zamioculcas | Zamioculcas | 100% | 0.686 | Pothos | ✅ |
| inat-spatifillo-1.jpg | spatifillo | Spatifillo | 100% | 0.724 | Anthurium | ✅ |
| inat-spatifillo-2.jpg | spatifillo | Spatifillo | 100% | 0.699 | Calathea | ✅ |
| inat-ficus-elastica-1.jpg | ficus-elastica | Calathea | 96% | 0.678 | Maranta | 🔸 |
| inat-ficus-elastica-2.jpg | ficus-elastica | Ficus elastica | 100% | 0.659 | Filodendro | ✅ |
| inat-dracena-1.jpg | dracena | Dracena | 100% | 0.741 | Monstera | ✅ |
| inat-dracena-2.jpg | dracena | Dracena | 100% | 0.664 | Sansevieria | ✅ |
| inat-falangio-1.jpg | falangio | Falangio | 100% | 0.580 | Aloe vera | ✅ |
| inat-falangio-2.jpg | falangio | Falangio | 100% | 0.546 | Aloe vera | ✅ |
| inat-aloe-vera-1.jpg | aloe-vera | Aloe vera | 100% | 0.642 | Sansevieria | ✅ |
| inat-aloe-vera-2.jpg | aloe-vera | Aloe vera | 56% | 0.478 | Sansevieria | ✅ |
| inat-calathea-1.jpg | calathea | Calathea | 100% | 0.725 | Maranta | ✅ |
| inat-calathea-2.jpg | calathea | Sansevieria | 52% | 0.526 | Calathea | 🔸 |
| inat-kenzia-1.jpg | kenzia | Kenzia | 100% | 0.652 | Monstera | ✅ |
| inat-kenzia-2.jpg | kenzia | Kenzia | 100% | 0.693 | Falangio | ✅ |
| inat-crassula-ovata-1.jpg | crassula-ovata | Albero di giada | 100% | 0.665 | Ficus elastica | ✅ |
| inat-crassula-ovata-2.jpg | crassula-ovata | Albero di giada | 100% | 0.798 | Echeveria | ✅ |
| inat-echeveria-1.jpg | echeveria | Echeveria | 100% | 0.714 | Albero di giada | ✅ |
| inat-echeveria-2.jpg | echeveria | Echeveria | 100% | 0.738 | Albero di giada | ✅ |
| inat-anthurium-1.jpg | anthurium | Anthurium | 100% | 0.755 | Stella di Natale | ✅ |
| inat-anthurium-2.jpg | anthurium | Anthurium | 100% | 0.833 | Ciclamino | ✅ |
| inat-stella-di-natale-1.jpg | stella-di-natale | Stella di Natale | 100% | 0.774 | Anthurium | ✅ |
| inat-stella-di-natale-2.jpg | stella-di-natale | Stella di Natale | 100% | 0.434 | Ficus elastica | ✅ |
| inat-ciclamino-1.jpg | ciclamino | Ciclamino | 100% | 0.661 | Echeveria | ✅ |
| inat-ciclamino-2.jpg | ciclamino | Ciclamino | 100% | 0.669 | Anthurium | ✅ |
| inat-edera-1.jpg | edera | Edera | 100% | 0.621 | Pothos | ✅ |
| inat-edera-2.jpg | edera | Edera | 100% | 0.504 | Pothos | ✅ |
| inat-filodendro-1.jpg | filodendro | Filodendro | 100% | 0.756 | Pothos | ✅ |
| inat-filodendro-2.jpg | filodendro | Filodendro | 100% | 0.736 | Pothos | ✅ |
| inat-peperomia-1.jpg | peperomia | Peperomia | 51% | 0.555 | Filodendro | ✅ |
| inat-peperomia-2.jpg | peperomia | Filodendro | 88% | 0.641 | Albero di giada | 🔸 |
| inat-basilico-1.jpg | basilico | Zamioculcas | 100% | 0.489 | Pothos | ❌ |
| inat-basilico-2.jpg | basilico | Basilico | 100% | 0.685 | Rosmarino | ✅ |
| inat-rosmarino-1.jpg | rosmarino | Rosmarino | 100% | 0.571 | Falangio | ✅ |
| inat-rosmarino-2.jpg | rosmarino | Rosmarino | 100% | 0.533 | Aloe vera | ✅ |
