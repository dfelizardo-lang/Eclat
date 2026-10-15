# Règles produit validées le 15 octobre 2026

- Emprunt adulte : une photo d’ensemble et une date de retour obligatoires. Une date passée est autorisée. Modification, clôture conservée dans l’historique et réouverture restent possibles.
- Carnet enfant : titre et auteur obligatoires, 250 caractères chacun ; commentaire facultatif de 2 000 caractères maximum ; note et photos facultatives.
- Photos : JPEG, PNG et WebP uniquement, sans plafond applicatif de taille du fichier. Une photo adulte, 50 par livre enfant. Les images sont redimensionnées localement pour leur stockage ; les limites matérielles du navigateur restent applicables. Un lot dépassant les 50 photos est refusé sans changer les photos présentes.
- Navigation : les adresses courtes des pages existantes redirigent vers leur adresse canonique `.html` ; `/index.html` redirige vers `/`.
- Mode simplifié : seules les illustrations décoratives disparaissent ; les fonctions restent accessibles.
- Lecture libre adulte : enchaînement tant que le mode est actif. Un arrêt explicite annule également les relances en attente.
- Histoire du soir : **choix B**, plusieurs histoires jusqu’à l’arrêt demandé. Pas de répétition avant épuisement du cycle disponible, puis nouveau cycle.
- Même œuvre : ne pas répéter ses passages déjà lus ; annoncer l’épuisement et proposer un bouton pour découvrir une autre œuvre.
- Sauvegardes : validation complète avant modification, fusion par identifiant, version ayant la date de modification la plus récente, conservation de l’existant en cas d’égalité. Déduplication dans le fichier entrant également. Les sauvegardes anciennes gardent leurs fiches existantes, même sans les nouveaux champs obligatoires à la saisie. Les écritures locales sont restaurées si un import échoue ; une erreur de restauration est annoncée explicitement.
- Historique : une dernière date de lecture par extrait et par public, conservée localement sans expiration automatique. L’évitement de répétition récent peut continuer à utiliser une fenêtre de 30 jours sans effacer cet historique.
- Réseau/audio : échec visible et action « Réessayer » ; délai de 15 secondes pour les requêtes de bibliothèque, le chargement audio et les interruptions de lecture. Le texte et les données locales restent disponibles.
- Agenda : ajout externe sur action explicite ; conserver les indications de suppression de la série. Aucun ajout silencieux.

## Vérification à terminer

La page d’accessibilité reste reportée. Les sources éditoriales de référence et des seuils chiffrés de performance ne sont pas encore fournis.

Les profils d’émulation ne prouvent ni les performances d’un vrai appareil ni le fonctionnement d’une application Android native. La configuration `automation/playwright/playwright.devices.config.js` couvre les 98 profils et modes issus des 46 appareils du catalogue Chromium DevTools, plus les 207 profils fournis par la version installée de Playwright (téléphones, tablettes, ordinateurs, orientations et moteurs). Elle collecte les temps de navigation sans inventer de seuil de performance.

Catalogue F12 : `automation/playwright/devtools-devices.json`, photographie versionnée du catalogue public Chromium DevTools avec URL source et empreinte SHA-256. Les modes pliés/dépliés sont inclus comme dimensions de fenêtre ; les charnières physiques ne sont pas simulées par ces seuls profils. Les noms disponibles peuvent évoluer avec la version du navigateur.
