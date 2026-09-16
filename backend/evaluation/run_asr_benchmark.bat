@echo off
cd /d %~dp0\..
python scripts\evaluate_asr.py --dataset evaluation\asr_corpus.csv --output evaluation\results\asr_benchmark.json
pause
