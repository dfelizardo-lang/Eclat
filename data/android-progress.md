# Progression Android — 3 octobre 2026

Première base Android Capacitor créée à partir de main a1908fb9180bf400ebc8829278e9bc961af9795b.
Client local : interface et catalogue embarqués, routes API vers Railway existant,
identité de test distincte. Aucun service ou compte supplémentaire.
Manifeste web et icônes ajoutés pour l'installation depuis un navigateur compatible.

Contrôles locaux : 2 tests du client Android et 13 tests corpus/rotation/calendrier/actualités réussis.
Projet natif généré et synchronisé ; compilation APK confiée au workflow GitHub, SDK absent ici.
Aucun test sur téléphone réel effectué. Pas de publication Google Play.
Les données web ne sont pas effacées ; elles restent distinctes de celles de l'APK.
La connexion Google Agenda web n'est pas activée dans le client Android.

Corpus inchangé : 42 œuvres actives (21 par public), dont 30 avec 90 extraits éditoriaux
vérifiés ; 12 œuvres historiques et leurs 32 fenêtres conservées, à ne pas compter
comme 32 extraits éditoriaux distincts validés. Objectif 200/600 non atteint.

## Résultat vérifié

Compilation GitHub Actions 37076963207 : SUCCESS, commit
6b6de1aec40e8e5c1ea325f434a59fa102042426.
Artefact eclat-android-test, ID 11256823642 ; fichier eclat-test.apk :
5 163 493 octets, SHA-256
b0d3775ae78f5ede4121f615a34064800d5572e2569a7b51f3a1e18e20984c85.
Archive extraite et empreinte vérifiée ; manifeste Android, classes.dex,
les trois interfaces et le catalogue embarqué présents.
Railway SUCCESS sur ce commit ; manifeste et icône PNG servis en HTTP 200,
accueil et ouverture d'une lecture vérifiés dans le navigateur.
L'APK est disponible pour essais ; toujours aucun test sur téléphone réel.
La release automatique avec accès contents:write a été refusée par la validation
et n'a pas été ajoutée. Workflow conservé en lecture seule avec artefact de test.
