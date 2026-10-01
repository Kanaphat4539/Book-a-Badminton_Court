# Thai/English copy for login, registration, and news

`frontend/src/lib/auth-news-messages.cjs` owns the route-local copy for the login, registration, and static news screens. `messages.en` and `messages.th` must have exactly the same keys; `auth-news-messages.test.cjs` checks parity, non-empty strings, key coverage, and unknown-key passthrough.

Use `translate(key, locale)` only for UI-authored text. Login/register still submit the same fields and values, retain their existing validation attributes, preserve server-returned error messages verbatim, and keep success, token persistence, and navigation behavior unchanged. Do not translate usernames, names, majors, or any API payload/code.

News publication dates are retained as given and marked up with `<time dateTime>`. KMITL branding and example/email address semantics are not translated.
