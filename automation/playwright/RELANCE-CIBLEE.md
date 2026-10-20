# Relance isolée des cas 003, 035, 053, 058, 079, 085 et 092

La référence de chaque cas Squash est conservée. Sélectionner uniquement ces
sept lignes dans l'itération et lancer leur exécution automatisée depuis Squash.
Ne pas sélectionner la campagne entière pour cette relance.

## Version locale réellement testée

Avec `ECLAT_LOCAL_TEST=1`, le lancement prépare et démarre l'application du même
checkout que les tests, sur un port libre. La variable `ECLAT_BASE_URL` est
transmise aux workers par la préparation globale ; le jeu `Site_public` est
toujours surchargé par ce mode local explicite. Le journal indique le port et
l'empreinte des sources. La préparation ferme seulement son propre processus.
Le serveur personnel déjà présent sur 3000 n'est ni arrêté ni modifié.

Les dépendances du serveur sont installées dans le checkout si elles manquent.
Une erreur de préparation reste une erreur ; aucun résultat n'est transformé en
succès. Pour tester volontairement un serveur local déjà démarré, définir
`ECLAT_USE_EXISTING_LOCAL_SERVER=1` ; il faut alors mettre à jour ce serveur
séparément. Les lancements ciblant le site public ne démarrent pas de serveur.

## Changements et preuves attendues

| Cas | Modification / preuve |
| --- | --- |
| 003 | Étape par variante d'URL, attendu et reçu nommés ; bilan JSON des chemins, paramètres et statuts. Le contenu propre à chaque page est vérifié. |
| 035 | Tous les profils F12 sont parcourus à 200 %, bilan de tous les échecs, diagnostics et premières captures. Reflow de la largeur agrandie et lecteur défilable. |
| 053 | Le test attend la clôture après fin de transaction avant de recharger, puis vérifie la persistance du retour et l'autre fiche. |
| 058 | La suppression de la série complète reste obligatoire ; le test accepte les formulations « la série » et « sa série », de même sens. |
| 079 | Trois tentatives limitées aux erreurs réseau ou HTTP transitoires, 60 s par requête ; les 404 ne deviennent jamais des succès. Bilan des URL et de chaque tentative. |
| 085 | Le fond et les libellés du choix des voix suivent le thème sombre. Les assertions axe et les parcours clavier restent actifs. |
| 092 | Les trois moteurs sont tous exécutés ; une erreur n'empêche pas le diagnostic des suivants. Version, état/validité du formulaire et capture sont joints en cas d'échec. |

Les cas tournent avec un seul worker. Les limites de durée des scénarios longs
sont augmentées, avec des délais bornés par action pour ne pas masquer un vrai
blocage. Le résultat final reste en échec si une assertion n'est pas satisfaite.

## Validation et limites

Les tests Node contrôlent les démarrages isolés, les ports, l'arrêt, les routes
et les nouvelles tentatives HTTP. Les contrôles de découverte et de génération
JUnit restent applicables. L'environnement de préparation ne dispose pas d'un
navigateur local fonctionnel : la réussite des sept scénarios doit être
confirmée par l'agent Ubuntu, depuis Squash. En cas d'échec, récupérer le journal
complet et les pièces jointes correspondantes ; une capture du statut ne donne
pas le sélecteur ni les valeurs de l'assertion.

## Suite au journal du 19 octobre, 08:25 UTC

Relancer uniquement 026, 035, 040, 058, 085 et 092.

- 035 : grille adaptée à la largeur réelle du contenu agrandi, sans colonne décorative minimale ni chevauchement de cartes.
- 040 : priorité CSS corrigée face aux transitions importantes des cartes.
- 058 : la notice de chaque emprunt indique explicitement de supprimer toute la série.
- 085 : couleurs corrigées sur les contrôles pâles, les messages et les libellés du thème sombre.
- 026 : le média est mis en pause avant de libérer la session lors de la fin d’un extrait. Un événement de fin simulé ne laisse plus un média orphelin jouer.
- 092 : WebKit laisse le formulaire adulte ouvert ; le journal fourni ne contient pas le message du formulaire permettant de déterminer pourquoi. L’état des champs, leurs erreurs de validation et les messages sont désormais écrits directement dans le journal, en plus des pièces jointes. La cause WebKit reste à confirmer.

Ces corrections ne constituent pas une validation navigateur : relancer sur eclat-ubuntu.
