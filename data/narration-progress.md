# Narration enfants — 4 octobre 2026

Deux voix françaises Piper : Conteuse (Siwis, choix initial) et Conteur (Tom).
Les enregistrements sont fabriqués au build Docker, puis servis depuis le service
Railway existant. Aucun abonnement vocal, clé API, appel à un fournisseur de synthèse
ou génération à chaque écoute. Les ressources de l'hébergement existant restent
nécessaires : logiciel gratuit ne signifie pas hébergement gratuit.

Le build utilise les 75 entrées réellement lisibles côté enfants (57 extraits
éditoriaux et 18 fenêtres historiques déjà présentes). Les 150 enregistrements
ne constituent pas de nouveaux extraits ni une validation des droits historiques.
Chaque fichier contient le texte exact et sa référence. Le manifeste conserve ID,
empreinte du texte, source, modèle, durée et empreinte du fichier. Les prochains
ajouts au catalogue produisent leurs deux enregistrements au prochain build.

Modèles épinglés sur `c10ece1aade47bb51c153c893d14e5bf8e5b7117` :

* Siwis : modèle `fr_FR-siwis-medium`, corpus SIWIS (University of Edinburgh),
  attribution CC BY 4.0 selon la fiche de modèle :
  https://huggingface.co/rhasspy/piper-voices/blob/c10ece1aade47bb51c153c893d14e5bf8e5b7117/fr/fr_FR/siwis/medium/MODEL_CARD
  Source du corpus : https://datashare.is.ed.ac.uk/handle/10283/2353
  Licence : https://creativecommons.org/licenses/by/4.0/
* Tom : modèle `fr_FR-tom-medium`, Tom Darboux / Tjiho, provenance AGPL v3
  indiquée par la fiche et licence du dépôt d'origine :
  https://huggingface.co/rhasspy/piper-voices/blob/c10ece1aade47bb51c153c893d14e5bf8e5b7117/fr/fr_FR/tom/medium/MODEL_CARD
  Sources complètes non modifiées et licence :
  https://git.bksp.space/Tjiho/French-tts-model-piper
* Moteur Piper original MIT, version 2023.11.14-2 :
  https://github.com/rhasspy/piper/tree/2023.11.14-2
  https://github.com/rhasspy/piper/blob/2023.11.14-2/LICENSE.md
  Phonémiseur eSpeak NG GPL v3 : https://github.com/espeak-ng/espeak-ng
  Encodeur FFmpeg : https://ffmpeg.org/legal.html

Moteur et modèles utilisés sans modification dans le build de production ; ils
ne sont pas inclus dans l'image runtime ni dans l'APK. Le dépôt public contient
les scripts reproductibles et les liens vers leurs sources. Les fichiers audio
sont des sorties de synthèse, pas les modèles. Les licences des jeux de données
ne sont pas remplacées par l'étiquette MIT générique du dépôt de modèles.

Les builds Android suivants embarquent les MP3 et le manifeste, contrôlés par
SHA-256. Ils n'ont pas besoin d'une application de voix tierce. Un ancien APK
déjà installé ne reçoit pas ces nouveaux fichiers automatiquement. La lecture
web demande une connexion ; aucune promesse de cache web hors ligne intégral.

Pause, reprise, arrêt et vitesse disponibles. Changer de voix relance le passage
avec une seule lecture active. Les réglages de voix restent sur l'appareil ; les
favoris, carnets et historiques ne sont pas effacés. La douceur est subjective,
ces voix synthétiques ne sont pas assimilées à un enregistrement humain.

Vérification en production le 4 octobre 2026 : commit
`274ac9c7b81c0e2e1fb60966738cd20bbefc73e1`, déploiement Railway
`770b0204-e21b-474d-8ca8-6b03900a5140` SUCCESS. Les 75 IDs du manifeste
correspondent aux lectures enfants actives. Les 150 MP3 ont été téléchargés
depuis la production : 42 775 470 octets, tailles et SHA-256 conformes ; les
150 fichiers sont décodables par ffprobe. Lecture Conteuse, changement vers
Conteur et pause vérifiés dans le navigateur public. La qualité subjective et
les différents appareils mobiles restent à tester par l'utilisateur.

Contrôles locaux : 14 tests de narration, restriction d'autoplay mobile,
catalogue/API, rotation, conservation des anciens IDs et bundle Android passent.
La dernière finition ajoute la pause/reprise sur Histoire du soir, les libellés
accessibles des commandes audio et la vitesse côté enfants sans liste de voix
du système. Les fichiers de corpus n'ont pas changé : 50 titres actifs,
114 extraits éditoriaux vérifiés, plus les 32 fenêtres historiques exclues de
ce compteur. Historique et favoris conservés.
