---
name: Chat timestamp timezones
description: Chat API timestamps must identify UTC so the browser can display the user's local time consistently.
---

Chat messages are persisted with legacy naive UTC datetimes. API responses should serialize them with an explicit UTC marker, and the frontend must treat older timezone-less values as UTC before formatting them locally.

**Why:** Local user messages and server assistant messages otherwise appear several hours apart in regions such as Nairobi, even though they belong to the same exchange.

**How to apply:** Use the shared API-date parser for restored and newly received chat timestamps; never pass a timezone-less server timestamp directly to `new Date()`.