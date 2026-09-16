@echo off
cd /d %~dp0\..
pytest tests\test_asr_metrics.py tests\test_asr_engine.py tests\test_voice_response.py -v
pause
