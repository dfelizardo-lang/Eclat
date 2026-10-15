# Installer, exécuter et rattacher les tests

`squash-cases.json` répertorie les 96 références de l’export du 15 octobre 2026.
`implemented` signifie que le scénario est codé, pas qu’il est validé sur le site
publié. Les cas `pending` sont déclarés `test.skip`. Les précontrôles `partial`
peuvent être exécutés mais ne sont pas rattachés en masse. La couverture exacte
est dans [COVERAGE.md](COVERAGE.md).

## Installation

Depuis `automation/playwright`, avec Node 20 ou supérieur recommandé :

```bash
npm ci
npx playwright install --with-deps chromium firefox webkit
npm run test:list
node --test scripts/link-squash.test.cjs
```

Les trois moteurs sont nécessaires à ECL-TC-092. Les autres tests utilisent
Chromium. `npm test` lance toute la suite et non seulement l’accueil.

## Essai local sans secret Sites

Depuis la racine du dépôt, dans un premier terminal :

```bash
npm ci
npm start
```

Dans un second terminal, depuis `automation/playwright` :

```bash
ECLAT_LOCAL_TEST=1 ECLAT_BASE_URL=http://127.0.0.1:3000 npm test
```

L’autorisation locale est limitée à une origine loopback. Les routes du serveur
Express local et celles du site publié peuvent différer, notamment les routes
sans extension. Ne pas affaiblir une assertion pour masquer un écart produit.

## Site publié

Le domaine accepté reste `https://eclat-lecture.dfelizardo680502.chatgpt.site`.
Fournir `ECLAT_SITES_TOKEN` via le secret de l’agent. Pour un essai interactif Bash :

```bash
read -rsp 'Jeton Sites : ' ECLAT_SITES_TOKEN
printf '\n'
export ECLAT_SITES_TOKEN
npm test
unset ECLAT_SITES_TOKEN
```

`DS_BASE_URL` fourni par Squash est prioritaire sur `ECLAT_BASE_URL`. Traces et
vidéos sont désactivées. Le jeton est envoyé uniquement à l’origine Éclat. Ne
pas enregistrer de secrets dans Git ou dans les rapports.

Les tests audio d’interface servent un WAV synthétique par interception et
utilisent les vrais éléments HTMLAudio. Ils ne valident ni les MP3 publiés ni
la qualité de prononciation. Les scans axe ne certifient pas une conformité RGAA.
Les contrôles éditoriaux, humains et Android gardent leur mode propre.

## Rattachement en masse à Squash

Le dépôt SCM Eclat et la technologie Playwright ont déjà été définis en masse.
Le script modifie seulement `automated_test_reference` avec
`PATCH /api/rest/latest/test-cases/{id}`. Il conserve la technologie, le dépôt,
les scénarios, les statuts et les exigences.

La documentation effective et les droits de l’instance doivent être vérifiés :
`http://localhost:8090/squash/api/rest/latest/docs/api-documentation.html`.
Le plugin REST doit être installé. Une simulation sur l’API réelle est requise.
L’intégration a été testée sur API simulée, pas encore sur cette instance Squash.

Créer un jeton API personnel Squash dans Mon compte. Il est différent du secret
JWT du serveur, du jeton Orchestrator et du jeton Sites. Ne jamais les partager
dans la conversation ni les ajouter dans un fichier versionné.

Depuis `automation/playwright` :

```bash
export SQUASH_URL=http://127.0.0.1:8090/squash
read -rsp 'Jeton API personnel Squash : ' SQUASH_API_TOKEN
printf '\n'
export SQUASH_API_TOKEN
npm run squash:plan
```

Lire `squash-plan.json`. La sélection porte uniquement sur les cas `implemented`.
Le script vérifie nom, référence, projet 1 et UUID si exposé par l’API. Il refuse
les redirections et une liaison existante différente. La sélection est fondée
sur les identifiants de l’export et ne convient pas telle quelle à une autre
instance.

Après revue du plan et validation des scripts sur l’agent :

```bash
npm run squash:apply
unset SQUASH_API_TOKEN
```

La première sauvegarde des références est conservée dans
`squash-link-backup.json`. Chaque écriture est relue et sa progression consignée
dans `squash-link-progress.json`. Une panne peut laisser une application partielle :
consulter ces fichiers et relancer une simulation avant reprise. Une seconde
application ne réécrit pas les références déjà conformes. Aucun secret n’est
enregistré dans ces fichiers.

Exemples de références, avec un identifiant unique par titre de test :

```text
Eclat/automation/playwright/tests#accueil.spec.js#ECL-TC-001
Eclat/automation/playwright/tests#eclat.spec.js#ECL-TC-032
```

Le test d’accueil garde sa référence d’origine. Ne pas la recopier sur les
autres cas : cela ferait répéter le même scénario.

## Orchestrator

Installer les dépendances dans le checkout réellement utilisé par l’agent, pas
seulement dans un clone Ubuntu séparé. Le fichier de configuration présent dans
`tests` reprend celle du projet lorsque le fournisseur démarre depuis ce dossier.
Les rapports JUnit/HTML standards sont conservés et la variable
`PLAYWRIGHT_JUNIT_OUTPUT_NAME` du fournisseur est prise en compte.

Après rattachement, revenir à l’itération et lancer le plan automatisé. Les cas
exclus ne deviennent pas automatisés du seul fait de figurer dans la campagne.

Références : [OpenTestFactory Playwright](https://opentestfactory.org/providers/playwright.html),
[association Squash 14](https://tm-fr.doc.squashtest.com/v14/user-guide/gestion-tests-automatises/associer-script-automatise.html).

## Blocage commun avant exécution : deux installations Playwright

Le journal du 15 octobre 2026 signalait `Playwright Test did not expect test.use() to be called here`, puis `No tests found`, avant toute assertion applicative. Cette erreur est reproduite lorsque le lanceur utilise une autre copie de Playwright que celle importée par les tests, même si les versions sont identiques.

Le hook prépare maintenant les dépendances du projet puis expose cette même installation dans le dossier parent du checkout, d’où le fournisseur lance `npx`. Le contrôle compare les chemins réels des paquets et refuse de remplacer une installation étrangère. Le `test.use()` des tests est conservé.

La vérification `scripts/link-workspace-runner.test.cjs` reproduit la commande `npx --no-install playwright test` depuis un workspace isolé, avec la référence et la configuration Squash. Elle vérifie le cas 001 et les 96 cas sans lancer de navigateur. La validation du scénario complet reste à effectuer depuis Squash.
