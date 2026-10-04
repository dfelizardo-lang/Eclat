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

## Lot équilibré — 4 octobre 2026

Base main inspectée : 9ab3222d88f9e2da12d080fed7061feed63e193d.
8 œuvres supplémentaires intégrées, 4 par public ; 24 passages éditoriaux complets et distincts, 675 à 815 caractères, espaces compris.
Enfants : Les Vacances (Ségur, édition 1884), L’Auberge de l’Ange Gardien (Ségur, 1888), De la Terre à la Lune (Verne, 1868), Michel Strogoff (Verne, 1905).
Adultes : Madame Bovary et Salammbô (Flaubert, 1910), La Petite Fadette (Sand, 1926), François le Champi (Sand, 1853).
Textes français originaux ; auteurs décédés en 1874, 1905, 1880 et 1876, dates contrôlées sur leurs pages Wikisource. Éditions historiques et scans référencés. Pas de préfaces ni illustrations importées. Empreintes et coordonnées des paragraphes conservées.
Catalogue local : 50 titres, 25 par public ; 114 extraits éditoriaux vérifiés, 57 par public. Les 12 titres historiques et leurs 32 fenêtres ne sont toujours pas comptés comme nouveaux extraits validés.
Objectif restant : 150 œuvres supplémentaires, audit des 12 historiques et 486 passages validés pour atteindre 200/600. Cible non atteinte. Tests catalogue/API/rotation/build Android ; vérification de production après commit.

## Lot équilibré de 12 œuvres — 4 octobre 2026, après intégration des voix adultes

Base main inspectée avant écriture : a772c3efbd6ffaff5ac2e8eeeac2f264945e5ee8.
12 nouvelles œuvres françaises originales, six par public ; 36 passages éditoriaux relus, complets et disjoints, de 545 à 1 741 caractères, espaces compris.
Éditions Wikisource et fac-similés : 1825–1911. Décès vérifiés sur les pages auteurs : 1705–1937. Aucun traducteur, préfacier ou illustrateur moderne importé. Les métadonnées, révisions, empreintes et coordonnées des paragraphes sont conservées dans le catalogue et le lot.
Les sélections jeunesse ont été relues : les paragraphes retenus privilégient magie, aventure, entraide et amitié ; les sélections automatiques inadéquates ont été remplacées par d'autres paragraphes authentiques entiers.

Catalogue après intégration : 62 titres actifs (31 Adultes, 31 Enfants), dont 50 œuvres auditées et 150 extraits éditoriaux vérifiés (75 par public). Les 12 titres historiques et leurs 32 fenêtres chevauchantes sont préservés et restent exclus du compteur des extraits éditoriaux vérifiés. Total technique attendu : 182 entrées lecteur, 89 Adultes et 93 Enfants.
Objectif restant : 138 titres supplémentaires et audit des 12 historiques ; 450 passages éditoriaux validés manquent pour atteindre 600. Aucun fichier de pistes n'est compté.
Les passages sont effectivement intégrés au JSON actif, à WORKS/PASSAGES et à l'API ; les 72 nouveaux enregistrements des deux voix sont générés à la construction de l'image, avec réutilisation vérifiée des 292 existants. Interface, rotation quotidienne et données utilisateur inchangées.
Validation locale : 15 tests Node (catalogue, API HTTP, rotation, identifiants historiques, plafond et intégration Android/audio) et les deux tests Python (paragraphes et cache audio) réussis. Contrôle production à compléter après le déploiement.

| Œuvre | Auteur | Public | Édition | Passages |
|---|---|---|---:|---:|
| Colomba | Prosper Mérimée | Adultes | 1845 | 3 |
| Eugénie Grandet | Honoré de Balzac | Adultes | 1855 | 3 |
| Thérèse Raquin | Émile Zola | Adultes | 1868 | 3 |
| Le Dernier Jour d’un condamné | Victor Hugo | Adultes | 1910 | 3 |
| Marie-Claire | Marguerite Audoux | Adultes | 1911 | 3 |
| Le Crime de Sylvestre Bonnard | Anatole France | Adultes | 1896 | 3 |
| Nouveaux Contes de fées | Comtesse de Ségur | Enfants | 1896 | 3 |
| Deux Ans de vacances | Jules Verne | Enfants | 1909 | 3 |
| En famille | Hector Malot | Enfants | 1893 | 3 |
| La Chatte blanche | Marie-Catherine d’Aulnoy | Enfants | 1825 | 3 |
| Trésor des Fèves et Fleur des Pois | Charles Nodier | Enfants | 1894 | 3 |
| Les Petits Souliers | Hégésippe Moreau | Enfants | 1864 | 3 |
