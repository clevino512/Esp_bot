---
name: Secure transcript access
description: The public chatbot must validate registrar-issued student access before answering personal grade requests.
---

Personal transcript requests are protected by a registrar-managed allowlist. The client only collects the student's full name and identifier for UX; the backend validates both on every request and stores only an HMAC digest of the identifier.

**Why:** The chatbot is intentionally public, but grade data is personal and must not be released based on a browser-only check or an unverified name.

**How to apply:** Keep the verification mandatory for text and voice transcript flows, never persist the raw identifier, and use the admin registry to deactivate access immediately.