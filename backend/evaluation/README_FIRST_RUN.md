# Première exécution

Après récupération de la branche PFE, commencer par les tests unitaires puis tester `/voice/transcribe` avec un court fichier audio français en modèle `base`. Une fois ce test réussi, enregistrer le corpus et lancer le benchmark tiny/base/medium.

Les modèles Whisper sont téléchargés au premier chargement ; la première exécution peut donc être sensiblement plus longue. Le benchmark doit être lancé dans des conditions comparables pour les trois modèles.
