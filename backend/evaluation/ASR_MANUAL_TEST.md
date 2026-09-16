# Test manuel de `/voice/transcribe`

Dans Swagger (`/docs`), ouvrir `POST /voice/transcribe`, cliquer sur **Try it out**, choisir un court fichier audio, laisser `language=fr`, puis essayer successivement `model=tiny`, `model=base` et `model=medium`.

Vérifier que la réponse contient au minimum : texte transcrit, langue, durée audio, confiance, temps de traitement, RTF, moteur et modèle. Utiliser le script de benchmark pour les mesures finales, car il garantit l'utilisation du même corpus pour les trois variantes.
