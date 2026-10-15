# Couverture des 96 cas Squash

Premier essai Ubuntu transmis par l’utilisateur (commit d33e77d) : 54 réussites, 12 échecs, 30 ignorés. Les réussites de précontrôles ne valident pas intégralement leurs cas Squash.

Les corrections de scripts après cet essai concernent les médias, les fixtures bibliothèques et la fin de transaction IndexedDB. Leur validation navigateur reste à effectuer sur Ubuntu. Les règles produit sont maintenant appliquées dans l’application : routes canoniques, bibliothèques accessibles en mode simplifié et rejet du formulaire adulte incomplet. Nouvelle exécution navigateur requise.

Les quatre tests de rattachement API passent sur API simulée. L’API Squash réelle reste à vérifier.

| Référence | Cas | Couverture | Dernier essai | Limite / mode |
| --- | --- | --- | --- | --- |
| ECL-TC-001 | Charger accueil | Scénario codé | Premier essai Ubuntu : Réussi | Playwright |
| ECL-TC-002 | Liens internes | Précontrôle partiel | Nouvelle exécution Ubuntu requise | Routes existantes couvertes ; page accessibilité reportée. |
| ECL-TC-003 | URL directe | Précontrôle partiel | Nouvelle exécution Ubuntu requise | Routes existantes et redirections couvertes ; page accessibilité reportée. |
| ECL-TC-004 | Public enfants | Scénario codé | Premier essai Ubuntu : Réussi | Playwright |
| ECL-TC-005 | Retour adultes | Scénario codé | Premier essai Ubuntu : Réussi | Playwright |
| ECL-TC-006 | Lien accueil enfants | Scénario codé | Premier essai Ubuntu : Réussi | Playwright |
| ECL-TC-007 | Ouvrir chaque envie | Scénario codé | Premier essai Ubuntu : Réussi | Playwright |
| ECL-TC-008 | Renouveler envies | Scénario codé | Premier essai Ubuntu : Réussi | Playwright |
| ECL-TC-009 | Métadonnées lecteur | Précontrôle partiel | Premier essai Ubuntu : Réussi | Couverture partielle : voir matrice des scénarios et compléter avant rattachement. |
| ECL-TC-010 | Authenticité extraits | Non implémenté / autre outillage | Premier essai Ubuntu : Ignoré | Playwright et revue humaine. Sources éditoriales et échantillon approuvé à fournir. |
| ECL-TC-011 | Intégrité corpus | Non implémenté / autre outillage | Premier essai Ubuntu : Ignoré | Contrôle de données / API avec outillage complémentaire. Manifeste de référence versionné à fournir. |
| ECL-TC-012 | Suite même œuvre | Scénario codé | Premier essai Ubuntu : Réussi | Playwright |
| ECL-TC-013 | Épuisement passages | Scénario codé | Nouvelle exécution Ubuntu requise | Annonce de fin et proposition explicite d’une autre œuvre. |
| ECL-TC-014 | Explorer auteur | Scénario codé | Premier essai Ubuntu : Réussi | Playwright |
| ECL-TC-015 | Auteur unique | Scénario codé | Premier essai Ubuntu : Réussi | Playwright |
| ECL-TC-016 | Démarrer audio | Scénario codé | Premier essai Ubuntu : Réussi | Playwright |
| ECL-TC-017 | Qualité écoute | Non implémenté / autre outillage | Premier essai Ubuntu : Ignoré | Vérification humaine. Contrôle non implémenté dans cette version. Aucun succès automatique attribué. |
| ECL-TC-018 | Aucun autoplay | Scénario codé | Premier essai Ubuntu : Réussi | Playwright |
| ECL-TC-019 | Pause et reprise | Précontrôle partiel | Premier essai Ubuntu : Réussi | Couverture partielle : voir matrice des scénarios et compléter avant rattachement. |
| ECL-TC-020 | Arrêter audio | Scénario codé | Premier essai Ubuntu : Réussi | Playwright |
| ECL-TC-021 | Fermer lecteur audio | Scénario codé | Premier essai Ubuntu : Réussi | Playwright |
| ECL-TC-022 | Voix féminine initiale | Scénario codé | Premier essai Ubuntu : Réussi | Playwright |
| ECL-TC-023 | Changer voix | Scénario codé | Premier essai Ubuntu : Réussi | Playwright |
| ECL-TC-024 | Changer pendant écoute | Scénario codé | Premier essai Ubuntu : Réussi | Playwright |
| ECL-TC-025 | Enchaîner adultes | Scénario codé | Premier essai Ubuntu : Échec. Script corrigé, nouvelle exécution requise. | Playwright |
| ECL-TC-026 | Interrompre continu | Précontrôle partiel | Premier essai Ubuntu : Échec. Script corrigé, nouvelle exécution requise. | Couverture partielle : voir matrice des scénarios et compléter avant rattachement. |
| ECL-TC-027 | Histoire du soir | Scénario codé | Premier essai Ubuntu : Réussi | Playwright |
| ECL-TC-028 | Fin histoire | Scénario codé | Nouvelle exécution Ubuntu requise | Choix B : enchaînement naturel puis arrêt sans reprise automatique. |
| ECL-TC-029 | Audio introuvable | Scénario codé | Premier essai Ubuntu : Échec. Script corrigé, nouvelle exécution requise. | Playwright |
| ECL-TC-030 | Audio lent | Scénario codé | Premier essai Ubuntu : Réussi | Playwright |
| ECL-TC-031 | Réseau interrompu | Non implémenté / autre outillage | Premier essai Ubuntu : Ignoré | Playwright. Contrôle non implémenté dans cette version. Aucun succès automatique attribué. |
| ECL-TC-032 | Ajouter favori | Scénario codé | Premier essai Ubuntu : Réussi | Playwright |
| ECL-TC-033 | Persistance favori | Scénario codé | Premier essai Ubuntu : Réussi | Playwright |
| ECL-TC-034 | Retirer favori | Scénario codé | Premier essai Ubuntu : Réussi | Playwright |
| ECL-TC-035 | Taille 200 pour cent | Non implémenté / autre outillage | Premier essai Ubuntu : Ignoré | Playwright et revue humaine. Contrôle non implémenté dans cette version. Aucun succès automatique attribué. |
| ECL-TC-036 | Espacement | Scénario codé | Premier essai Ubuntu : Réussi | Playwright |
| ECL-TC-037 | Persistance confort | Scénario codé | Premier essai Ubuntu : Réussi | Playwright |
| ECL-TC-038 | Modes contraste | Non implémenté / autre outillage | Premier essai Ubuntu : Ignoré | Playwright et revue humaine. Référentiel et seuils applicables à fournir. |
| ECL-TC-039 | Affichage simplifié | Scénario codé | Premier essai Ubuntu : Échec | Playwright |
| ECL-TC-040 | Animations réduites | Non implémenté / autre outillage | Premier essai Ubuntu : Ignoré | Playwright et revue humaine. Contrôle non implémenté dans cette version. Aucun succès automatique attribué. |
| ECL-TC-041 | Synthèse page | Non implémenté / autre outillage | Premier essai Ubuntu : Ignoré | Playwright et revue humaine. Contrôle non implémenté dans cette version. Aucun succès automatique attribué. |
| ECL-TC-042 | Vitesse de page | Scénario codé | Premier essai Ubuntu : Réussi | Playwright |
| ECL-TC-043 | Rétablir confort | Scénario codé | Premier essai Ubuntu : Réussi | Playwright |
| ECL-TC-044 | Code postal valide | Scénario codé | Premier essai Ubuntu : Échec. Script corrigé, nouvelle exécution requise. | Playwright |
| ECL-TC-045 | Code postal invalide | Scénario codé | Premier essai Ubuntu : Réussi | Playwright |
| ECL-TC-046 | Absence et panne | Scénario codé | Premier essai Ubuntu : Échec. Script corrigé, nouvelle exécution requise. | Playwright |
| ECL-TC-047 | Panneau enfants | Scénario codé | Premier essai Ubuntu : Réussi | Playwright |
| ECL-TC-048 | Permissions | Précontrôle partiel | Premier essai Ubuntu : Échec. Script corrigé, nouvelle exécution requise. | Couverture partielle : voir matrice des scénarios et compléter avant rattachement. |
| ECL-TC-049 | Annuler emprunt | Scénario codé | Premier essai Ubuntu : Réussi | Playwright |
| ECL-TC-050 | Validation emprunt | Scénario codé | Premier essai Ubuntu : Échec | Playwright |
| ECL-TC-051 | Créer emprunt | Scénario codé | Premier essai Ubuntu : Échec. Script corrigé, nouvelle exécution requise. | Playwright |
| ECL-TC-052 | Modifier fiche | Scénario codé | Premier essai Ubuntu : Réussi | Playwright |
| ECL-TC-053 | Marquer rendu | Scénario codé | Premier essai Ubuntu : Réussi | Playwright |
| ECL-TC-054 | Galerie photo | Scénario codé | Premier essai Ubuntu : Réussi | Playwright |
| ECL-TC-055 | Fichier invalide | Scénario codé | Nouvelle exécution Ubuntu requise | JPEG/PNG/WebP, refus GIF, fichier de 11 Mo, une photo adulte et limite de 50 enfants. |
| ECL-TC-056 | Caméra mobile | Non implémenté / autre outillage | Premier essai Ubuntu : Ignoré | Playwright et revue humaine. Contrôle non implémenté dans cette version. Aucun succès automatique attribué. |
| ECL-TC-057 | Lien calendrier | Scénario codé | Premier essai Ubuntu : Réussi | Playwright |
| ECL-TC-058 | Notice rappel | Non implémenté / autre outillage | Premier essai Ubuntu : Ignoré | Playwright et revue humaine. Contrôle non implémenté dans cette version. Aucun succès automatique attribué. |
| ECL-TC-059 | Rappel réel | Non implémenté / autre outillage | Premier essai Ubuntu : Ignoré | Vérification humaine. Compte Agenda de test et fenêtre d’observation à fournir. |
| ECL-TC-060 | Veille nominale | Précontrôle partiel | Premier essai Ubuntu : Réussi | Couverture partielle : voir matrice des scénarios et compléter avant rattachement. |
| ECL-TC-061 | Favoris veille | Précontrôle partiel | Premier essai Ubuntu : Réussi | Couverture partielle : voir matrice des scénarios et compléter avant rattachement. |
| ECL-TC-062 | URL dangereuse | Non implémenté / autre outillage | Premier essai Ubuntu : Ignoré | Contrôle de données / API avec outillage complémentaire. Instrumentation serveur et politique des redirections requises. |
| ECL-TC-063 | Veille indisponible | Précontrôle partiel | Premier essai Ubuntu : Réussi | Couverture partielle : voir matrice des scénarios et compléter avant rattachement. |
| ECL-TC-064 | Annuler livre | Scénario codé | Premier essai Ubuntu : Réussi | Playwright |
| ECL-TC-065 | Enregistrer livre | Scénario codé | Premier essai Ubuntu : Réussi | Playwright |
| ECL-TC-066 | Étoiles exclusives | Scénario codé | Premier essai Ubuntu : Réussi | Playwright |
| ECL-TC-067 | Validation jeunesse | Scénario codé | Nouvelle exécution Ubuntu requise | Titre/auteur 250 caractères, commentaire 2 000 ; bornes et refus du dépassement. |
| ECL-TC-068 | Exporter données fictives | Précontrôle partiel | Premier essai Ubuntu : Réussi | Couverture partielle : voir matrice des scénarios et compléter avant rattachement. |
| ECL-TC-069 | Export vide | Scénario codé | Premier essai Ubuntu : Réussi | Playwright |
| ECL-TC-070 | Confidentialité export | Scénario codé | Premier essai Ubuntu : Réussi | Playwright |
| ECL-TC-071 | Import valide | Précontrôle partiel | Premier essai Ubuntu : Réussi | Couverture partielle : voir matrice des scénarios et compléter avant rattachement. |
| ECL-TC-072 | Fusion idempotente | Scénario codé | Premier essai Ubuntu : Réussi | Playwright |
| ECL-TC-073 | Import corrompu | Scénario codé | Premier essai Ubuntu : Réussi | Playwright |
| ECL-TC-074 | Import absent | Scénario codé | Premier essai Ubuntu : Réussi | Playwright |
| ECL-TC-075 | Isolation contexte | Scénario codé | Premier essai Ubuntu : Réussi | Playwright |
| ECL-TC-076 | Stockage saturé | Précontrôle partiel | Premier essai Ubuntu : Réussi | Couverture partielle : voir matrice des scénarios et compléter avant rattachement. |
| ECL-TC-077 | Historique | Scénario codé | Nouvelle exécution Ubuntu requise | Une entrée par extrait, dernière date, conservation au-delà de 400 jours et rechargement. |
| ECL-TC-078 | Crédits disponibles | Précontrôle partiel | Premier essai Ubuntu : Réussi | Couverture partielle : voir matrice des scénarios et compléter avant rattachement. |
| ECL-TC-079 | Liens crédits | Non implémenté / autre outillage | Premier essai Ubuntu : Ignoré | Contrôle de données / API avec outillage complémentaire. Inventaire des liens attendu à fournir. |
| ECL-TC-080 | État publié | Non implémenté / autre outillage | Premier essai Ubuntu : Ignoré | Playwright et revue humaine. Justificatifs d’audit éventuels à fournir. |
| ECL-TC-081 | Contact responsable | Non implémenté / autre outillage | Premier essai Ubuntu : Ignoré | Playwright et revue humaine. Responsable et contact approuvés à fournir. |
| ECL-TC-082 | Lien évitement | Scénario codé | Premier essai Ubuntu : Réussi | Playwright |
| ECL-TC-083 | Fenêtres clavier | Non implémenté / autre outillage | Premier essai Ubuntu : Ignoré | Playwright et revue humaine. Contrôle non implémenté dans cette version. Aucun succès automatique attribué. |
| ECL-TC-084 | Parcours clavier complet | Non implémenté / autre outillage | Premier essai Ubuntu : Ignoré | Playwright et revue humaine. Contrôle non implémenté dans cette version. Aucun succès automatique attribué. |
| ECL-TC-085 | Scan automatique | Scénario codé | Premier essai Ubuntu : Réussi | Playwright |
| ECL-TC-086 | NVDA et VoiceOver | Non implémenté / autre outillage | Premier essai Ubuntu : Ignoré | Vérification humaine. Contrôle non implémenté dans cette version. Aucun succès automatique attribué. |
| ECL-TC-087 | TalkBack | Non implémenté / autre outillage | Premier essai Ubuntu : Ignoré | Vérification humaine. Contrôle non implémenté dans cette version. Aucun succès automatique attribué. |
| ECL-TC-088 | Petit écran | Scénario codé | Exécution Squash/agent requise | 98 profils/modes F12, bilan joint par profil. |
| ECL-TC-089 | Zoom 200 et 400 | Non implémenté / autre outillage | Premier essai Ubuntu : Ignoré | Vérification humaine. Contrôle non implémenté dans cette version. Aucun succès automatique attribué. |
| ECL-TC-090 | Orientation tactile | Scénario codé | Exécution Squash/agent requise | 98 profils/modes F12, bilan joint par profil. |
| ECL-TC-091 | Entrées HTML | Précontrôle partiel | Premier essai Ubuntu : Réussi | Couverture partielle : voir matrice des scénarios et compléter avant rattachement. |
| ECL-TC-092 | Navigateurs | Scénario codé | Premier essai Ubuntu : Réussi | Playwright |
| ECL-TC-093 | Performance | Non implémenté / autre outillage | Premier essai Ubuntu : Ignoré | Playwright. Profil de mesure et budgets à convenir. |
| ECL-TC-094 | Installer et mettre à jour | Non implémenté / autre outillage | Premier essai Ubuntu : Ignoré | Appium / appareil Android. Deux paquets signés et appareil à fournir. |
| ECL-TC-095 | Audio hors connexion | Non implémenté / autre outillage | Premier essai Ubuntu : Ignoré | Appium / appareil Android. Build embarquant les médias à fournir. |
| ECL-TC-096 | Export Android | Non implémenté / autre outillage | Premier essai Ubuntu : Ignoré | Appium / appareil Android. Build et accès aux dialogues natifs requis. |
