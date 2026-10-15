# Lancer la campagne depuis Squash TM 14

Le lancement utilisateur se fait dans Squash. L’orchestrateur utilise Playwright sur l’agent, puis remonte les résultats et les rapports. Les commandes ci-dessous préparent l’intégration ; elles ne démarrent pas la campagne.

## Préparer une fois

1. Mettre à jour les cas existants avec le classeur `Eclat_96_cas_mise_a_jour_20261015.xlsx`. Choisir la mise à jour, conserver les identifiants et contrôler le bilan d’import.
2. Dans le dépôt SCM **Eclat**, sélectionner la branche **codex/eclat-playwright-bulk**. La branche `main` ne contient pas encore ces changements.
3. Lancer le script de rattachement en masse depuis le clone Ubuntu. Il préserve les références déjà conformes et s’arrête devant une référence différente :

```bash
cd ~/eclat-automatisation/Eclat-suite
 git pull --ff-only origin codex/eclat-playwright-bulk
cd automation/playwright
npm ci
export SQUASH_URL=http://127.0.0.1:8090/squash
read -rsp 'Jeton API personnel Squash : ' SQUASH_API_TOKEN
printf '\n'
export SQUASH_API_TOKEN
npm run squash:plan
npm run squash:apply
unset SQUASH_API_TOKEN
```

Le jeton API personnel n’est ni le secret JWT du serveur, ni le jeton Orchestrator. Ne pas le partager. Le plan et la sauvegarde des références restent dans le clone.

4. Vérifier dans l’administration du projet les tags **linux**, **playwright**, **chromium** de l’agent disponible **eclat-ubuntu**. Conserver la liaison au serveur Orchestrator existant.
5. Définir la variable d’environnement **PLAYWRIGHT_EXTRA_OPTIONS** associée au serveur automatisé, avec exactement :

```text
--config=Eclat/automation/playwright/playwright.config.js
```

Le fournisseur lance les tests depuis le parent du checkout. La configuration doit donc être désignée explicitement. Ne pas redéfinir les reporters ni les chemins JUnit/HTML.

6. Préparer le checkout réellement utilisé par l’agent à chaque clonage. Le fichier `playwright-provider-hooks.yaml` et le script `scripts/prepare-agent.sh` sont fournis pour cela. Monter le YAML dans le conteneur orchestrateur et définir **PLAYWRIGHT_PROVIDER_HOOKS** avec son chemin interne dans la configuration de déploiement existante. Ne pas recréer le conteneur sans reprendre ses volumes, ports et authentification. Ce branchement dépend du fichier Docker/Compose utilisé sur votre poste et reste à effectuer sur cette installation.

Sur le compte système qui exécute l’agent, l’administrateur prépare Node, npm et les dépendances Linux des navigateurs. Le hook installe les dépendances npm du projet et expose la même copie de Playwright au lanceur dans le parent du checkout. Il évite ainsi le conflit entre une installation globale ou mise en cache et celle du projet. Le script de préparation ne lance pas les tests.

## Choisir l’application testée

Le paramètre du jeu de données **BASE_URL** devient `DS_BASE_URL` et prime sur `ECLAT_BASE_URL`.

- Pour l’application locale mise à jour : serveur Éclat lancé sur l’agent Ubuntu, jeu de données `BASE_URL=http://127.0.0.1:3000`, variable serveur **ECLAT_LOCAL_TEST=1**.
- Pour le site publié : jeu de données avec son adresse publique et secret **ECLAT_SITES_TOKEN** disponible sur l’agent. Les changements de cette branche doivent d’abord être déployés sur le site.

`localhost` désigne la machine de l’agent, pas le conteneur Squash. Le secret Sites doit être injecté séparément, jamais dans le classeur.

## Lancement quotidien

Ouvrir **Campagnes → campagne Éclat → itération → Plan d’exécution**, puis utiliser **Exécuter les tests automatisés**. Dans la fenêtre récapitulative, vérifier les cas listés, les tags et la disponibilité de l’agent, puis confirmer le lancement. Consulter les résultats dans la suite automatisée créée par Squash.

ECL-TC-088 et ECL-TC-090 exécutent les profils F12 depuis ce même lancement et joignent un bilan par profil. Leur exécution est plus longue. Les contrôles manuels, éditoriaux, d’accessibilité reportée et Android natifs ne deviennent pas exécutables du seul fait de l’import Excel. Le script exclut les scénarios non codés ou partiels.

Si Squash n’affiche qu’un seul test automatisé, vérifier les références individuelles et la branche SCM : le classeur de scénario ne remplace pas le rattachement aux scripts.

Références officielles : [Playwright dans Squash TM 14](https://tm-fr.doc.squashtest.com/v14/user-guide/gestion-tests-automatises/techno/playwright.html), [hooks OpenTestFactory](https://opentestfactory.org/impl/reference/hooks.html), [fournisseur Playwright](https://opentestfactory.org/providers/playwright.html).
