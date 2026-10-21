# Stratégie de validation GitHub / Squash

Objectif : éviter les batteries de tests automatiques à chaque petite correction, tout en gardant une preuve claire avant une campagne Squash.

## Sélection finale ciblée

La campagne `Eclat_20/10/26` avait 15 échecs à reprendre en priorité. La liste unique est stockée dans `final-regression-cases.json` afin que GitHub Actions et l'équipe Squash utilisent exactement la même sélection :

`ECL-TC-026, 031, 035, 040, 050, 055, 058, 067, 068, 077, 085, 088, 090, 092, 093`.

## Ordre de validation

1. **Pendant le développement** : aucun test Playwright de production n'est lancé automatiquement. Les PR vers `main` exécutent seulement la petite suite Node `Éclat - régressions des corrections Squash`.
2. **Avant fusion** : lancer manuellement `Prévalidation locale avant Squash` sur la branche à valider. Elle démarre le serveur du checkout et exécute les 15 cas ciblés sans dépendre de Railway.
3. **Après déploiement Railway** : lancer manuellement `Validation Railway des 15 échecs Squash`. Cette étape vérifie l'origine Railway et autorise explicitement le domaine `.up.railway.app`.
4. **Après validation de l'origine** : lancer manuellement `Validation publique des 15 échecs Squash` sur `https://eclatsclassiques.com`.
5. **Squash TM** : réexécuter d'abord les 15 cas en échec dans une exécution corrective. S'ils sont verts, lancer ensuite la campagne de non-régression complète afin de vérifier qu'aucun des anciens succès n'a régressé.

## Workflows et déclenchement

- `eclat-regressions.yml` : automatique sur PR et push `main`, rapide, sans navigateur distant.
- `squash-preflight.yml` : manuel, checkout local.
- `playwright-railway-regression.yml` : manuel uniquement, après déploiement.
- `playwright-public-regression.yml` : manuel uniquement, après validation Railway.
- `diagnose-public.yml` : manuel uniquement, réservé aux problèmes de routage/cache.
- `android-test.yml` : garde son déclenchement ciblé sur `main` uniquement lorsque les fichiers Android/audio concernés changent.

## Règles Squash

Un cas `manual`, `partial` ou `blocked` dans `squash-cases.json` ne doit jamais être déclaré automatiquement réussi. Le script `npm run squash:readiness` les affiche séparément. Les liaisons Squash ne doivent être appliquées avec `npm run squash:apply` qu'après examen du plan généré et uniquement avec le jeton API personnel prévu à cet effet.

Les validations GitHub ne remplacent pas l'exécution Squash : elles servent de sas technique avant la campagne, afin de ne pas utiliser Squash comme boucle de débogage.
