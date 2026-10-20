# Automatiser au maximum, conserver les preuves humaines utiles

État du 15 octobre 2026 : 81 scénarios codés et sélectionnables par le rattachement
Squash, 5 cas mixtes avec contrôles automatiques, 7 bloqués par un prérequis et
3 évaluations humaines. « Codé » ne signifie pas « exécuté avec succès ».

## Ce qui tourne depuis Squash

Les 23 scénarios nouvellement sélectionnables sont :
002, 003, 009, 011, 019, 026, 031, 035, 040, 041, 048, 058, 060, 061, 062,
063, 068, 071, 076, 078, 079, 091 et 093.

Les références existantes, identifiants et UUID sont conservés. Aucun nouvel
import de cas n'est nécessaire pour les liens. Les scripts attendent les fins de
transaction et joignent les preuves de données, réseau, profils et mesures.

Les parties mesurables des cas mixtes tournent aussi dans des cas déjà liés :

| Cas mixte | Contrôle automatique | Lancé avec |
| --- | --- | --- |
| 010 Authenticité | Comparaison exacte avec une référence éditoriale indépendante, si fournie | 011 |
| 038 Contrastes | axe color-contrast, résultats incomplets et preuves du focus | 085 |
| 056 Caméra | Sélecteur de capture, annulation et repli galerie | 054 |
| 083 Fenêtres | Tab/Maj+Tab, confinement, Échap et restitution du focus | 085 |
| 084 Clavier | Navigation et enregistrement sans clic ni focus programmatique | 085 |

Le succès du précontrôle ne valide pas l'exigence humaine ou native restante du
cas mixte. Garder le cas original distinct dans Squash.

Le cas 011 compare les 182 passages à un manifeste SHA-256 versionné. Ce manifeste
est une référence technique de non-régression et ne constitue pas une approbation
de l'authenticité, des droits ou de la fidélité aux éditions d'origine.

Le cas 062 exerce le téléchargement réel côté serveur avec DNS/HTTPS instrumentés,
y compris les redirections privées, puis vérifie le refus par l'API de l'application.
Il installe les dépendances racine du checkout si elles sont absentes. Les requêtes
sortantes du test instrumenté sont simulées ; aucune IP privée n'est contactée.

## Les contrôles longs

Conserver une suite standard et une suite F12 approfondie dans Squash :

| Suite | Cas |
| --- | --- |
| F12 approfondi | 035 (texte 200 %), 088 (responsive), 090 (orientation), 093 (mesures) |
| Navigateurs | 092 (Chromium, Firefox, WebKit) |
| Standard | Les autres scénarios automatisés |

Le 093 joint les mesures de navigation et d'interaction pour les 98 profils/modes
F12. Son succès signifie « collecte terminée ». Sans budgets approuvés, il n'émet
aucun verdict de conformité de performance. L'émulation ne reproduit pas le CPU
ni le réseau d'un téléphone réel.

## Référence éditoriale pour 010

Définir `ECLAT_EDITORIAL_REFERENCE` sur l'agent avec le chemin absolu d'un JSON
issu d'une comparaison indépendante et approuvée. Ne pas le produire à partir du
catalogue que l'on cherche à vérifier. Le format est :

```json
{
  "approvedBy": "identité du relecteur",
  "sourceRevision": "édition, version ou référence stable",
  "passages": [
    {
      "id": "identifiant du passage",
      "text": "texte approuvé exact",
      "author": "auteur",
      "workTitle": "titre",
      "source": "https://adresse-de-reference"
    }
  ]
}
```

Le rapport liste les passages comparés ; il ne prétend pas avoir validé les
passages absents de cet échantillon. Le cas 010 reste mixte jusqu'à validation de
son référentiel et du périmètre d'échantillonnage.

## Prérequis techniques, distincts des tests manuels

| Cas | Ce qui manque avant d'achever son automatisation |
| --- | --- |
| 056 | Agent Android pilotant le sélecteur et les permissions réels |
| 059 | Compte Agenda de test, calendrier dédié, horaire et observation de notification |
| 080–081 | Page accessibilité différée, statut justifié, responsable et contact approuvés |
| 089 | Agent capable de commander et de vérifier le zoom réel du navigateur ; un viewport réduit ou un zoom CSS ne suffit pas |
| 094 | Deux APK de même identité/signature et agent Android pour installation/mise à jour |
| 095 | APK contenant les deux voix et agent Android isolé pour tester le mode avion |
| 096 | Agent Android pilotant les dialogues natifs de partage et d'import |

Les tests F12 existants ne valident ni les dialogues Android natifs, ni le mode
avion d'un APK, ni sa mise à jour. Aucun script fictif ne remplace ces preuves.

## Ce qui nécessite une appréciation humaine

- 017 : intelligibilité, prononciation et concordance lors d'une écoute réelle.
- 086 : qualité des annonces et parcours sur NVDA/Windows et VoiceOver/macOS.
- 087 : annonces et gestes réels de TalkBack.
- Compléments de 038, 083 et 084 : cas de contraste non décidables automatiquement,
  superpositions, visibilité et logique de l'ordre de lecture/focus.

Les scans automatiques ne constituent pas un audit RGAA complet.

## Mise en service

Récupérer la branche dans le clone qui sert l'application locale, puis redémarrer
son processus Node : des corrections concernent le serveur, les métadonnées du
lecteur et la limite de 20 nouveautés. Le checkout de l'agent récupère les tests
à chaque exécution ; cela ne met pas automatiquement à jour l'application testée.

Depuis `automation/playwright`, `node scripts/readiness.cjs` affiche la couverture.
Pour rattacher les 23 références supplémentaires : utiliser `npm run squash:plan`,
examiner les nouveaux liens, puis `npm run squash:apply` avec le jeton personnel
Squash dans `SQUASH_API_TOKEN`. La deuxième application est idempotente.

Validation locale : tests Node de l'application et de l'infrastructure, découverte
réelle des 96 références par le lanceur Playwright. Les nouvelles assertions
navigateur doivent encore être exécutées sur l'agent Ubuntu depuis Squash.
