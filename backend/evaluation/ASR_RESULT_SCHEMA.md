# Structure du résultat `asr_benchmark.json`

Pour chaque modèle : `model`, `sample_count`, `mean_wer`, `mean_processing_time_ms`, `mean_real_time_factor` et `samples`.

Pour chaque échantillon : chemin audio, transcription de référence, transcription produite, WER, temps de traitement, durée audio et RTF.

Cette structure permet de conserver les résultats détaillés avant de calculer ou présenter les moyennes dans le mémoire.
