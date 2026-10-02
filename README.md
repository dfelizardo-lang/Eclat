# Éclat V73 — service bibliothèques

Cette version n'est plus un simple fichier HTML autonome.

## Lancer localement

1. Installer Node.js 18 ou plus récent.
2. Dans ce dossier : `npm install`
3. Puis : `npm start`
4. Ouvrir `http://localhost:3000`

Le navigateur appelle `/api/bibliotheques?cp=XXXXX`.
Le serveur Éclat interroge ensuite le jeu public du Ministère de la Culture.
Ainsi, le navigateur ne contacte plus directement l'API distante et les problèmes CORS du fichier `file://` disparaissent.

## Déploiement

Le dossier peut être déployé sur un hébergement Node.js (Render, Railway, Fly.io, VPS, etc.).
Le port est lu depuis `process.env.PORT`.

## Propositions thématiques quotidiennes

Le service existant renouvelle automatiquement six propositions Adultes et six Enfants toutes les 24 heures, à 00:00 UTC (02:00 à Paris en été, 01:00 en hiver). L’API `/api/propositions-thematiques` fournit la sélection et la prochaine échéance. La sélection reste identique après un redémarrage et entre instances : elle est calculée à partir de la période UTC, sans stockage supplémentaire.

Les 72 intitulés de chaque public sont répartis par familles sémantiques et parcourus sur 12 jours sans répétition. Le navigateur actualise les cartes à l’échéance et à son retour au premier plan. Les extraits sont associés aux thèmes en favorisant la diversité des œuvres et auteurs ; l’historique personnel de lecture reste respecté. En cas d’échec temporaire de l’API, l’application conserve ses propositions et réessaie après une minute. La rotation réutilise le catalogue existant et n’ajoute pas d’ouvrages.

Vérification : `node --test daily-themes.test.js`.
