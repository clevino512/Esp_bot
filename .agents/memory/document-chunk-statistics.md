---
name: Document chunk statistics
description: Cohérence entre l’index vectoriel et les compteurs SQL des documents
---

Le nombre de chunks utilisé par les statistiques admin doit reposer sur le compteur SQL maintenu lors de l’indexation, avec persistance des lignes `document_chunks` lors des nouveaux uploads et réindexations.

**Why:** L’index vectoriel peut contenir des chunks alors que `document_chunks` est vide si l’indexeur ne persiste que dans Chroma ; le frontend affiche alors zéro malgré des documents actifs.

**How to apply:** Toute modification du flux d’indexation doit mettre à jour `Document.chunk_count` et remplacer les chunks SQL du document. Les statistiques doivent aussi couvrir les documents existants créés avant cette persistance.