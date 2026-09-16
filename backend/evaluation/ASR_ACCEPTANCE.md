# Critères de validation de la phase ASR

La phase ASR sera considérée comme validée lorsque :

- l'endpoint `/voice/transcribe` accepte un enregistrement réel et renvoie une transcription française ;
- tiny, base et medium sont exécutables avec le même endpoint/script ;
- les tests unitaires passent ;
- un corpus réel a été enregistré ;
- le benchmark produit un JSON contenant WER, latence et RTF pour les trois modèles ;
- le modèle retenu est documenté à partir de ces mesures.

La présence du code seule ne suffit donc pas à déclarer la phase expérimentale terminée.
