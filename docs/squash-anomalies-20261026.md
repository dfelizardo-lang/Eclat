# Campagne Squash du 26 octobre : état des anomalies

Rapport analysé : 81 cas, 59 succès, 15 échecs et 7 erreurs. Les tests restent exécutés par l'agent local Squash/Playwright. Aucun workflow de validation GitHub Actions n'a été lancé pour cette correction.

## Cause de publication confirmée

Le connecteur Sites confirme un domaine `eclatsclassiques.com` actif sur le projet Éclat `appgprj_6ac6046c0cac8191ac91e757021e9f4a`, avec la cible `custom-domains.chatgpt.site`. Le service Railway déclare également ce domaine, mais cette déclaration ne modifie pas son DNS. Le fichier `library-loans-form.js` reçu via l'adresse directe Railway correspond au checkout validé ; le fichier reçu via le domaine public diffère. Il ne faut donc pas assimiler le déploiement Railway réussi à une mise à jour du domaine public.

## Suivi de tous les cas non réussis

| Cas | Constat et traitement | Validation restante |
| --- | --- | --- |
| 002 | Navigation enfant aboutissant au carnet adulte sur la publication publique. Assertion conservée. | Retester sur la publication de référence ; corriger le lien si le défaut persiste. |
| 026, 031 | Arrêt continu et action Réessayer déjà implémentés dans le checkout, contrairement au comportement observé publiquement. Contrôles de session audio conservés. | Validation navigateur sur la bonne publication. |
| 035, 088, 090, 093 | Parcours enfant et profils mobiles : le helper responsive réutilise désormais les helpers de formulaire qui attendent les commandes disponibles. Règles de reflow à 200 % présentes dans le checkout. | Profils complets sur l'agent local ; les clics/formulaires ne sont pas forcés. |
| 040, 085 | Réduction des animations et contraste sombre déjà implémentés dans les feuilles de style du checkout. Contrôles animations et axe inchangés. | Vérifier la feuille réellement publiée puis refaire les scans. |
| 049, 052, 053, 058, 068, 071, 092 | Le helper de création d'emprunt ne remplit plus la liste indépendante `borrowAgain`, masquée dans le panneau bibliothèque. Les contrôles date/photo, transaction et identité des fiches restent actifs. L'export vérifie la date et la photo plutôt qu'une liste de souhaits du carnet. | Exécuter les parcours locaux ; 058 conserve le contrôle d'arrêt des rappels. |
| 050 | Contrôle de rejet d'un formulaire vide conservé. Le checkout exige une photo ; aucune suppression d'assertion ni acceptation du formulaire vide. | Refaire le cas sur la publication de référence. |
| 055 | Message JPEG/PNG/WebP présent dans le checkout ; texte différent sur le domaine public. | Vérifier la publication, puis tester les fichiers invalides et trop volumineux. |
| 062 | Fichier de sécurité présent et test Node réussi. L'appel HTTP public expire ; délai explicite de 20 s, avec maintien de l'exigence HTTP 400 et d'une erreur JSON. | Mesurer la réponse API réelle depuis l'agent local ; une expiration reste une erreur. |
| 065, 067 | Formulaire enfant parfois non ouvert ; la limite 2 000 et son message existent dans le checkout. Les attentes de visibilité, de validation et de sauvegarde restent conservées. | Reproduire sur la publication de référence avant une nouvelle modification du produit. |
| 077 | Conservation de l'historique expiré déjà implémentée, test Node réussi. Assertion de conservation maintenue. | Validation navigateur avec la bonne version du lecteur. |

## Vérifications réalisées

Les 50 tests Node du dépôt et du lanceur passent, après récupération du commit historique du catalogue et utilisation d'un répertoire temporaire accessible. La syntaxe et la découverte des cas Playwright sont vérifiées. Les parcours navigateur ne sont pas validés ici : le téléchargement officiel Chromium ne fournit pas une archive exploitable dans cet environnement.

Diagnostic facultatif depuis la racine du checkout :

```sh
node automation/playwright/scripts/verify-deployment.cjs
```

Ce diagnostic ne modifie aucun service et compare quatre fichiers de comportement du domaine cible avec le checkout. Il ne remplace pas les tests fonctionnels.

## Étape bloquante

Choisir et raccorder la publication de référence du domaine, conformément au choix de conserver Railway. Ne pas détacher le domaine de Sites avant d'avoir préparé et vérifié son routage DNS vers Railway. Aucune configuration DNS, aucun domaine et aucune publication Sites n'ont été modifiés pendant ce diagnostic.
