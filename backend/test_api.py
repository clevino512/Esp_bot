import json
import urllib.request
import os
import sys

urls = [
    'http://localhost:11434/api/tags',
    'http://localhost:11434/api/version'
]

for url in urls:
    try:
        with urllib.request.urlopen(url, timeout=5) as r:
            data = r.read().decode()
        print(url, 'OK')
        print(data[:400])
    except Exception as e:
        print(url, 'ERR', type(e).__name__, e)