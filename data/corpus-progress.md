# Progression du corpus — 2 octobre 2026

Base inspectée : `3b2c194988bc907057f84135022e98cd9ad68757` sur main.

Lot ajouté : 8 œuvres distinctes (4 Adultes, 4 Enfants), 24 passages de paragraphes sources complets, trois sélections disjointes par œuvre, 5000 caractères maximum. Les scans des éditions et les dates de décès ont été vérifiés sur Wikisource. Éditions : Daudet 1895, Flaubert 1910, Gautier 1899, Nerval 1868, Perrault 1902, Verne 1863/1873/1867. Les années d'œuvre et d'édition sont séparées.

Catalogue actif vérifié en production : 20 titres (10 Adultes, 10 Enfants), 56 entrées lecteur = 32 fenêtres historiques + 24 nouveaux passages éditoriaux distincts. Ne pas présenter 56 comme 56 extraits éditoriaux vérifiés. Les 12 anciens textes sont conservés sans modification et marqués `pending-review`. Les fichiers corpus-enrichment-1200/1300/1400 restent de simples pistes non comptées.

Le catalogue complet est séparé de l'interface dans `data/reading-catalog.json`, partagé par le site et `/api/catalogue`. `/api/passages/:id` sert les nouveaux extraits vérifiés avec auteur, œuvre, source, édition et droits. Les identifiants anciens sont inchangés pour préserver historique et favoris ; les nouveaux IDs sont explicites. Le cache HTTP et les sommes SHA256 permettent à un futur client mobile de conserver ces données ; aucune application Android, audio ou fonction hors connexion nouvelle n'est livrée ici.

Validation locale : six tests réussis (rotation et épuisement historique, identité des anciens passages, chargement exact des nouveaux passages, API réelle et bundle navigateur). Aucune modification de daily-themes.js / daily-themes-client.js ni effacement d'historique. Production contrôlée : le déploiement `3919ef64-fc3b-49f8-afdd-6afa4185ab0d` du commit `797ca5bb23a407d8b3fff5e83d20426a24a13e40` est SUCCESS ; les 24 endpoints d’extraits restituent exactement les textes attendus (SHA256), et le bundle/HTML réellement servis génèrent 20 œuvres et 56 entrées lecteur.

Reprise : inspecter HEAD et `/api/catalogue`, puis recontrôler Railway SUCCESS et les compteurs. Priorité ensuite à diversifier les auteurs jeunesse (trois Verne dans ce lot), poursuivre par lots complets et auditer les 12 textes historiques. L'importeur produit uniquement des candidats ; vérifier éditions/droits et relire les passages avant de les fusionner dans le catalogue actif. Ne pas exécuter des incipits comme contenu complet ni compter plusieurs contes d'un même recueil comme plusieurs recueils.


## Lot du 2 octobre, commencé à 16 h 10 (Paris)

Base inspectée : `6f8c6f985b42273a079022247c713576cd054a05`.
12 œuvres supplémentaires (6 par public), 36 nouveaux passages disjoints. Après ce lot : 32 titres (16 par public), 60 passages éditoriaux vérifiés, plus les 32 fenêtres historiques conservées. Les douze anciens titres restent à auditer ; ne pas convertir leurs fenêtres en passages éditoriaux distincts dans les compteurs.

Nouveaux auteurs : George Sand, Honoré de Balzac, Émile Zola, Victor Hugo, Stendhal, Voltaire, Comtesse de Ségur, Marie-Catherine d’Aulnoy, Jeanne Marie Leprince de Beaumont. Les années d’édition ont été lues sur les notices de scans Wikisource et les décès sur les pages auteurs. Aucun traducteur ni adaptation moderne. Les textes sont stockés côté serveur et immédiatement réutilisables par l’API existante.

L’importeur élimine désormais les blocs d’illustrations et leurs légendes qui pouvaient interrompre les paragraphes. Il accepte `--spec-file`; les spécifications reproductibles du lot sont dans `data/reading-batches/2026-10-02-1600-specs.json`. Il écrit seulement des candidats. Le catalogue actif et les IDs du premier lot sont préservés. Validation locale : six tests Node et un test Python réussis. Production vérifiée le 2 octobre à 16 h 23 Paris : déploiement `256d6065-bd26-4c13-b2f6-98832ad799da` (commit `27edbf23b83f4124f52c4c3e3751de84ba0ab0ff`) en SUCCESS ; le catalogue public est identique au JSON testé, les 60 passages éditoriaux sont servis avec texte et SHA256 exacts. Le bundle public charge 32 œuvres et 92 entrées lecteur, dont 32 fenêtres historiques.

## Lot du 3 octobre 2026 — 00 h 06 (Paris)

Base inspectée avant écriture : e19603cc73263ead0d25a4ffbe1837c152d6486b.
Ajout actif : 10 œuvres françaises originales, 5 par public, 30 passages complets de paragraphes non chevauchants.
Catalogue attendu après déploiement : 42 œuvres (21 enfants, 21 adultes), dont 30 œuvres vérifiées et 90 extraits éditoriaux. Les 12 œuvres historiques et leurs 32 fenêtres restent préservées, non comptées comme nouveaux extraits éditoriaux vérifiés.
Sources : réservoir de l’académie de Toulouse utilisé comme guide; éditions historiques sur Wikisource. Les offres simplement gratuites ne sont pas considérées comme domaine public.
Droits : auteurs décédés entre 1850 et 1923; originaux français, éditions 1849–1906. Notices auteur et édition conservées. Les noms de fichiers Balzac/Indiana diffèrent des dates des notices; les dates des notices sont enregistrées explicitement.
Tests : 7 tests Node et test Python de conservation des paragraphes réussis. Contrôle de production à effectuer après le commit.
Aucune interface, rotation, donnée utilisateur ou infrastructure modifiée.

| Œuvre | Public | Édition | Extraits |
|---|---|---:|---:|
| La Peau de chagrin — Honoré de Balzac | adult | 1855 | 3 |
| Contes du lundi — Alphonse Daudet | child | 1880 | 3 |
| Le Comte de Monte-Cristo — Alexandre Dumas | adult | 1889 | 3 |
| Les Trois Mousquetaires — Alexandre Dumas | child | 1849 | 3 |
| Pêcheur d’Islande — Pierre Loti | adult | 1886 | 3 |
| Sans famille — Hector Malot | child | 1887 | 3 |
| Contes d’une grand’mère — George Sand | child | 1906 | 3 |
| Indiana — George Sand | adult | 1853 | 3 |
| L’Île mystérieuse — Jules Verne | child | 1875 | 3 |
| Germinal — Émile Zola | adult | 1885 | 3 |

Reprise : diversifier poésie, théâtre, récits et auteurs; vérifier les 12 titres historiques; objectif 200 titres/600 extraits encore non atteint.

Validation production le 3 octobre 2026 à 00 h 09 (Paris) : déploiement 38683f67489639eef2a5859cac3169a3bd617563 SUCCESS; /api/catalogue identique au fichier intégré, 42 titres (21 par public), 90 extraits éditoriaux vérifiés; les 30 nouveaux /api/passages/:id contrôlés individuellement par SHA-256. Aucun blocage technique constaté pour ce lot.

## Correction de longueur — 3 octobre 2026

Base inspectée : f9d0882ad0b2f298cbb512e1587d666edcb62f73.
Après le retour utilisateur sur des lectures trop longues, plafond maximal confirmé par l’utilisateur
à 2 000 caractères (espaces et séparateurs compris). Politique partagée dans
`data/catalogue-policy.json`, appliquée au serveur et à l'importeur.
Les 90 passages éditoriaux déjà raccourcis ont été resélectionnés en paragraphes sources entiers :
minimum 564, moyenne 742, maximum 877 caractères. Identifiants inchangés ; traces
des empreintes précédentes dans `data/reading-batches/2026-10-03-length-audit.json`.
Pour La Belle et la Bête, l'édition de 1806 regroupe des paragraphes trop longs :
remplacement par celle de 1883, Le Monde enchanté, Firmin-Didot, avec son scan et
sa source conservés. Aucune coupe de phrase, aucune réécriture.
Les 12 textes historiques restent à auditer ; leurs 32 fenêtres sont déjà sous ce plafond.
Les anciens blocs de migration qui effaçaient l'historique ont été retirés.
Tests : sept contrôles catalogue/API/rotation/identifiants/limite/historique réussis.
Compteurs inchangés : 42 titres (21 par public), 90 passages validés (45 par public),
32 fenêtres historiques exclues du compteur éditorial. Contrôle de production après commit.
L'APK déjà téléchargé embarque l'ancien catalogue : ce correctif met d'abord à jour
le site et l'API, pas rétroactivement les fichiers installés sur un téléphone.
