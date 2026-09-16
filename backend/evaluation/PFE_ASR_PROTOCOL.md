# Protocole expérimental ASR

## Objectif
Comparer Whisper tiny, base et medium pour la reconnaissance de questions universitaires prononcées en français.

## Variables contrôlées
Les trois modèles utilisent exactement les mêmes fichiers audio et les mêmes transcriptions de référence. La langue est fixée à `fr` et la tâche à `transcribe`.

## Indicateurs
- WER : erreurs lexicales par rapport à la transcription de référence.
- Latence : temps nécessaire au traitement d'un fichier audio.
- RTF : temps de traitement divisé par la durée audio.

## Procédure
1. Enregistrer le corpus de questions.
2. Vérifier manuellement les transcriptions de référence.
3. Exécuter `scripts/evaluate_asr.py` sur la machine cible.
4. Conserver la sortie JSON originale.
5. Reporter les moyennes dans le mémoire.
6. Justifier le modèle retenu à partir des mesures et des contraintes de déploiement.

## Limite méthodologique
Un petit corpus technique sert à valider l'intégration, mais la conclusion du PFE doit s'appuyer sur des enregistrements représentatifs des utilisateurs et conditions réelles. Aucun WER ou temps de réponse ne doit être estimé ou inventé.
