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
