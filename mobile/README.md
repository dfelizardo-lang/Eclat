# Éclat Android — premier client de test

Client Capacitor 8.5.2, Java 21 / SDK Android 36. Identifiant de test :
`io.github.dfelizardo.eclat.test`. Aucun compte mobile ni infrastructure nouvelle.

## Compiler et tester

Depuis `mobile/` : `npm ci`, `npm test`, `npm run apk`.
La commande génère `android/` puis l'APK signé avec une clé de développement locale.
Android Studio peut ouvrir le projet généré. Le workflow GitHub **APK Android de test**
compile automatiquement lors des changements de `mobile/` sur main et conserve
`eclat-test.apk` dans l'artefact `eclat-android-test`, avec son SHA-256.
Ce fichier est destiné aux essais, pas à Google Play.

Sur Android, télécharger l'APK, autoriser ponctuellement l'installation depuis
le navigateur ou le gestionnaire de fichiers, puis ouvrir **Éclat — Test**.
La version web reste disponible et possède aussi un manifeste d'installation :
dans Chrome, menu > Ajouter à l'écran d'accueil / Installer si proposé.

## Fonctionnement et limites

- Interface, styles et copie réelle du corpus sont embarqués. Les identifiants,
  textes, sources, éditions et droits du catalogue sont conservés.
- Les routes `/api/` utilisent le serveur Railway existant, via CapacitorHttp natif.
  La rotation quotidienne et les actualités nécessitent le réseau ; aucune garantie
  générale de fonctionnement hors connexion ou d'audio n'est donnée.
- Les photos utilisent les sélecteurs système Android ; aucune permission de stockage
  générale n'est ajoutée. Caméra et galerie doivent être vérifiées sur téléphone.
- Favoris, historique et carnets restent locaux. Les données du navigateur ne sont
  pas transférées dans l'APK ; elles ne sont ni effacées ni remplacées.
- Sauvegarde cloud Android désactivée pour les carnets personnels.
- Google Identity Services pour le web est désactivé dans le client natif. Le lien
  Google Agenda peut être ouvert dans le navigateur ; la connexion automatique
  devra utiliser un flux OAuth Android adapté avant publication.
- L'APK utilise une identité de test et une clé de développement. Une clé stable
  devra être conservée pour les futures mises à jour ; les builds CI avec une nouvelle
  clé peuvent nécessiter une réinstallation, qui supprime les données de l'APK.
  Ne pas désinstaller une version contenant un carnet important sans export.

## Avant publication Google Play

Définir l'identifiant final, la signature et la sauvegarde/export des carnets ;
valider sur appareils réels photos, retour Android, favoris, lectures et réseau ;
configurer Google Agenda pour Android ; préparer confidentialité, données collectées,
public enfant, captures et fiche Google Play. Aucun compte Play ni publication créée.
