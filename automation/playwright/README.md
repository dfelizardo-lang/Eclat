# Lancement depuis Squash

Pour lancer la campagne depuis Squash et recevoir les résultats dans chaque cas, suivre [SQUASH-LAUNCH.md](SQUASH-LAUNCH.md). Les commandes Playwright ci-dessous servent uniquement au diagnostic développeur.

# Tests Playwright Éclat

La suite répertorie 96 cas Squash. Une référence listée ne signifie pas que le
test est codé ou réussi. Voir [COVERAGE.md](COVERAGE.md) pour les scénarios codés,
précontrôles partiels et cas non implémentés, puis [OPERATIONS.md](OPERATIONS.md)
pour les commandes d’installation, d’exécution et de rattachement en masse.
Les sections ci-dessous décrivent le test d’accueil initial et son accès Sites.

Cas Squash : ECL-TC-001 Charger accueil.
Technologie : Playwright.
Référence Squash, si le nom du dépôt dans Squash est Eclat :
Eclat/automation/playwright/tests#accueil.spec.js#ECL-TC-001

La première partie doit correspondre au nom du dépôt déclaré dans Squash. Ne pas utiliser une URL complète dans cette référence.

## Exécution locale

Depuis automation/playwright :
npm install
npx playwright install --with-deps chromium

Fournir ECLAT_SITES_TOKEN à l'environnement via un canal sécurisé, puis :
npm test

Le script exige ce secret et échoue explicitement s'il est absent. Le secret est envoyé seulement au domaine Éclat ; aucun secret ne doit être ajouté dans Git. La session ChatGPT et le jeton Orchestrator ne sont pas ce jeton Sites.

Le paramètre Squash DS_BASE_URL est pris en compte en mode normal. Pour toute une campagne locale, définir ECLAT_LOCAL_TEST=1 et ECLAT_BASE_URL=http://127.0.0.1:3000 sur le projet Squash. Cette sélection explicite prime sur les jeux de données publics, sans envoyer de jeton Sites.

## Orchestrator

L'agent doit disposer de Node, Chromium et @playwright/test accessibles au script dans le checkout de chaque exécution. L'installation dans un autre dossier local ne garantit pas cette disponibilité. Préparer les dépendances du checkout avant la première campagne.

Ne pas modifier les emplacements des rapports html et junit attendus par le fournisseur Playwright Orchestrator. Le script n'a pas encore été exécuté sur l'agent Ubuntu via Squash.

Les traces sont désactivées pour ne pas enregistrer l'en-tête secret dans une trace réseau. Ne pas activer un journal des en-têtes ni diffuser les fichiers de session.

Ce contrôle couvre seulement l'accueil. Il ne certifie pas la totalité du catalogue, l'audio ou le RGAA.

## Règles produit et profils d’appareils

Les décisions appliquées sont décrites dans `../../PRODUCT-RULES.md`, notamment l’histoire du soir en continu (choix B). Après mise à jour, redémarrer le serveur Node pour prendre en compte les routes, puis relancer la suite complète.

```bash
ECLAT_LOCAL_TEST=1 ECLAT_BASE_URL=http://127.0.0.1:3000 npm test -- --workers=2
ECLAT_LOCAL_TEST=1 ECLAT_BASE_URL=http://127.0.0.1:3000 npm run test:devices
```

La seconde commande exécute un contrôle des pages et du mode simplifié pour chacun des 98 profils F12 Chromium et des 207 profils Playwright. Installer les trois moteurs avec `npx playwright install --with-deps chromium firefox webkit`. Les mesures collectées sont informatives : aucun seuil de performance n’a été validé. L’émulation ne valide pas une application Android native ni un téléphone physique. Le rapport est dans `devices-report`.

Pour exécuter uniquement le catalogue F12 : `npm run test:devices -- --project="F12 *"`. Les modes pliés/dépliés sont inclus comme dimensions de fenêtre. Le catalogue source et son empreinte sont conservés dans `devtools-devices.json`.
