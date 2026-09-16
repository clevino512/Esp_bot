from app.voice.metrics import normalize_text, word_error_rate


def test_normalize_text():
    assert normalize_text(" Bonjour,  ESPA ! ") == "bonjour espa"


def test_wer_identical_is_zero():
    assert word_error_rate("bonjour espa", "bonjour espa") == 0.0


def test_wer_one_substitution():
    assert word_error_rate("bonjour espa", "bonjour unibot") == 0.5


def test_wer_empty_reference():
    assert word_error_rate("", "") == 0.0
    assert word_error_rate("", "bonjour") == 1.0
