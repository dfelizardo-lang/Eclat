# Ma bibliothèque — 3 octobre 2026

URL enregistrée par utilisateur sur son appareil; actualités et nouveautés réellement extraites du site source, liens officiels et cœur « À demander au bibliothécaire ». Favoris conservés indépendamment du renouvellement de l’accueil, aucune réservation automatique. Actualisation à l’ouverture/manuelle et toutes les 5 minutes quand le panneau est ouvert; cache serveur 5 minutes. Aucune promesse de flux instantané ni de compatibilité avec tous les portails.

Adaptateur AFI/Orphée testé sur le site du Pays de Meaux fourni : déduplication des carrousels, priorité livres papier, exclusion des disques. Flux RSS/Atom découverts sur le même domaine et actualités HTML d’autres sites pris en charge; message explicite et lien vers le site quand aucune information n’est lisible. Titres et auteurs seulement, aucun texte de livre récupéré dans le corpus.

Requêtes serveur HTTPS bornées : hôtes publics, résolution DNS vérifiée et adresse épinglée, redirections vérifiées, limites temps/taille/concurrence/cache. Aucun accès aux adresses locales, métadonnées cloud ou sites exigeant une connexion.

Tests : 14 tests Node réussis (corpus, rotation, calendrier, Google simulé, parseur, liens et adresses). DNS externe interdit dans le runtime local Node; contrôle réel prévu après déploiement Railway. Google OAuth prêt côté code mais désactivé faute de GOOGLE_CALENDAR_CLIENT_ID; ce blocage est indépendant du suivi de bibliothèque.

Extension : tout domaine public HTTPS accepté; détection de rubriques Nouveautés/Actualités dans le HTML de portails différents, titres et auteurs quand fournis. Les paramètres de notice restent dans les identifiants (seuls les paramètres de suivi sont retirés). Les nouveautés apparues depuis la précédente consultation sont signalées; premier chargement sans faux marquage. Source Meaux vérifiée par API Railway : 2 livres papier et 12 actualités, le 3 octobre à 00 h 33 Paris.

Demandes finales : relecture automatique du site enregistré à chaque arrivée sur Emprunts, même panneau fermé; appel refresh=1 contournant le cache de 5 minutes. Maximum 20 nouveautés de livres, actualités séparées et cœurs conservés indépendamment de la limite. Détection générique de rubriques Nouveautés/Actualités testée sur un second format HTML et des notices différenciées par paramètres d’URL.

Marne et Gondoire — 3 octobre : URL Osiros fournie préservée avec ses paramètres. La source renvoie une page « Vérification de sécurité » avec ALTCHA/validation humaine, pas les notices. Détection explicite du blocage ajoutée; lien vers l’URL originale toujours disponible, même sans résultat. Aucun contournement de la vérification ni liste inventée. Récupération de ces nouveautés bloquée tant qu’un flux ou accès public automatisable n’est pas fourni par la bibliothèque.

Navigation corrigée : les deux actions principales restent visibles; Ma bibliothèque ouvre sa vue sans bascule implicite, Nouveaux Emprunts ouvre uniquement son formulaire; retour à la liste explicite. Changement d’URL accepté pendant une consultation, ancienne requête navigateur annulée et réponse obsolète ignorée.
