# Premier test Playwright Éclat

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

Le paramètre Squash DS_BASE_URL est pris en compte. Il doit conserver le domaine autorisé.

## Orchestrator

L'agent doit disposer de Node, Chromium et @playwright/test accessibles au script dans le checkout de chaque exécution. L'installation dans un autre dossier local ne garantit pas cette disponibilité. Préparer les dépendances du checkout avant la première campagne.

Ne pas modifier les emplacements des rapports html et junit attendus par le fournisseur Playwright Orchestrator. Le script n'a pas encore été exécuté sur l'agent Ubuntu via Squash.

Les traces sont désactivées pour ne pas enregistrer l'en-tête secret dans une trace réseau. Ne pas activer un journal des en-têtes ni diffuser les fichiers de session.

Ce contrôle couvre seulement l'accueil. Il ne certifie pas la totalité du catalogue, l'audio ou le RGAA.
