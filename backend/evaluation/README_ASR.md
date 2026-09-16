# Évaluation ASR — PFE UniBot ESPA

Cette évaluation compare les modèles Whisper `tiny`, `base` et `medium` avec le même corpus audio français.

## Préparation

1. Installer FFmpeg sur la machine hôte (Whisper en dépend pour décoder les formats audio).
2. Installer les dépendances Python : `pip install -r requirements.txt`.
3. Créer `backend/data/asr_test/` et y placer les enregistrements réels.
4. Copier `evaluation/asr_corpus_template.csv` vers un fichier de corpus et remplacer les exemples par les chemins et transcriptions de référence réels.

## Exécution

Depuis le dossier `backend` :

```bash
python scripts/evaluate_asr.py --dataset evaluation/asr_corpus.csv --output evaluation/results/asr_benchmark.json
```

Le script exécute successivement `tiny`, `base` et `medium` et enregistre, pour chaque échantillon : transcription, WER, durée audio, temps de traitement et Real-Time Factor.

## Interprétation

- WER plus faible = transcription plus fidèle.
- Temps de traitement plus faible = réponse plus rapide.
- RTF inférieur à 1 = traitement plus rapide que la durée réelle de l'audio.

Le modèle retenu pour le PFE doit être justifié par les mesures obtenues sur la machine de déploiement et le corpus ESPA. Ne pas inventer de valeurs pour le mémoire.
