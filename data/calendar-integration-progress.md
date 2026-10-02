# Google Agenda — 3 octobre 2026

Bouton personnel « Ajouter à Google Agenda » : ouvre la connexion Google avec une URL de retour conservant titre, date de retour, heure locale, fuseau et répétition hebdomadaire. Chaque utilisateur choisit son propre compte et son agenda dans Google; il vérifie la notification et confirme Enregistrer. Aucun compte central, jeton OAuth ou secret Google stocké.

Export ICS conservé sous « Autre calendrier (.ics) ». Les livres rendus restent dans l’historique; l’arrêt de la série doit être effectué dans Google Agenda. Aucun arrêt automatique ni synchronisation OAuth revendiqué. Aucun événement test créé dans un agenda personnel.

Tests : récurrence, fuseau, changement de jour/année, dates impossibles, rappel désactivé, export et API existante. Contrôle de l’éditeur Google après connexion non disponible dans le navigateur de test non connecté; parcours de connexion contrôlé jusqu’à Google, validation finale à effectuer avec un compte utilisateur.

## Connexion directe préparée

Google Identity Services, autorisation individuelle calendar.events.owned + adresse email pour vérifier le compte; création et actualisation par API dans l’agenda principal de l’utilisateur, alerte popup au début, répétition hebdomadaire sans fin, identifiant stable empêchant les créations répétées. Suppression de la série sur « Livres rendus » ou désactivation du rappel, après autorisation du même compte. Aucun token sauvegardé côté navigateur ou serveur. Les tests API sont simulés; aucun appel réel authentifié validé.

Activation bloquée : aucune variable Google présente dans Railway. Créer/configurer un client OAuth Web d’Éclat dans Google Cloud, activer Calendar API, écran de consentement externe, origine JavaScript https://eclat-v1-sync-production.up.railway.app. Ajouter GOOGLE_CALENDAR_CLIENT_ID à Railway (identifiant public, pas de secret requis par le modèle token). Réglages de confidentialité, domaine et publication/validation Google à compléter pour un accès au grand public; le mode test est limité aux comptes de test autorisés. La connexion Google de ChatGPT ne configure pas cette application.

Le bouton API n’apparaît que lorsque le client OAuth est configuré et chargé. Le bouton éditeur reste disponible en attendant.
