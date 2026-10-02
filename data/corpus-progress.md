# Progression du corpus — 2 octobre 2026

Base inspectée : `3b2c194988bc907057f84135022e98cd9ad68757` sur main.

Lot ajouté : 8 œuvres distinctes (4 Adultes, 4 Enfants), 24 passages de paragraphes sources complets, trois sélections disjointes par œuvre, 5000 caractères maximum. Les scans des éditions et les dates de décès ont été vérifiés sur Wikisource. Éditions : Daudet 1895, Flaubert 1910, Gautier 1899, Nerval 1868, Perrault 1902, Verne 1863/1873/1867. Les années d'œuvre et d'édition sont séparées.

Catalogue actif vérifié en production : 20 titres (10 Adultes, 10 Enfants), 56 entrées lecteur = 32 fenêtres historiques + 24 nouveaux passages éditoriaux distincts. Ne pas présenter 56 comme 56 extraits éditoriaux vérifiés. Les 12 anciens textes sont conservés sans modification et marqués `pending-review`. Les fichiers corpus-enrichment-1200/1300/1400 restent de simples pistes non comptées.

Le catalogue complet est séparé de l'interface dans `data/reading-catalog.json`, partagé par le site et `/api/catalogue`. `/api/passages/:id` sert les nouveaux extraits vérifiés avec auteur, œuvre, source, édition et droits. Les identifiants anciens sont inchangés pour préserver historique et favoris ; les nouveaux IDs sont explicites. Le cache HTTP et les sommes SHA256 permettent à un futur client mobile de conserver ces données ; aucune application Android, audio ou fonction hors connexion nouvelle n'est livrée ici.

Validation locale : six tests réussis (rotation et épuisement historique, identité des anciens passages, chargement exact des nouveaux passages, API réelle et bundle navigateur). Aucune modification de daily-themes.js / daily-themes-client.js ni effacement d'historique. Production contrôlée : le déploiement `3919ef64-fc3b-49f8-afdd-6afa4185ab0d` du commit `797ca5bb23a407d8b3fff5e83d20426a24a13e40` est SUCCESS ; les 24 endpoints d’extraits restituent exactement les textes attendus (SHA256), et le bundle/HTML réellement servis génèrent 20 œuvres et 56 entrées lecteur.

Reprise : inspecter HEAD et `/api/catalogue`, puis recontrôler Railway SUCCESS et les compteurs. Priorité ensuite à diversifier les auteurs jeunesse (trois Verne dans ce lot), poursuivre par lots complets et auditer les 12 textes historiques. L'importeur produit uniquement des candidats ; vérifier éditions/droits et relire les passages avant de les fusionner dans le catalogue actif. Ne pas exécuter des incipits comme contenu complet ni compter plusieurs contes d'un même recueil comme plusieurs recueils.
