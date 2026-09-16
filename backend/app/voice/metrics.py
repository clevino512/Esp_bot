"""Métriques d'évaluation ASR utilisées pour le PFE UniBot ESPA."""
import re
import unicodedata


def normalize_text(text: str) -> str:
    """Normalise une transcription avant comparaison."""
    text = unicodedata.normalize("NFKC", text).lower().strip()
    text = re.sub(r"[^\w\s'-]", " ", text, flags=re.UNICODE)
    return " ".join(text.split())


def word_error_rate(reference: str, hypothesis: str) -> float:
    """Calcule WER = (substitutions + suppressions + insertions) / mots de référence."""
    ref = normalize_text(reference).split()
    hyp = normalize_text(hypothesis).split()

    if not ref:
        return 0.0 if not hyp else 1.0

    previous = list(range(len(hyp) + 1))
    for i, ref_word in enumerate(ref, start=1):
        current = [i]
        for j, hyp_word in enumerate(hyp, start=1):
            substitution = previous[j - 1] + int(ref_word != hyp_word)
            insertion = current[j - 1] + 1
            deletion = previous[j] + 1
            current.append(min(substitution, insertion, deletion))
        previous = current

    return previous[-1] / len(ref)
