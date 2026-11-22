# Forshizu (Shizu)

A two-person couples app: quiz games (normal + spicy), Ludo, Watch Together, private chat with pop-up messages.
Static files + Firebase Firestore. Open `index.html` from any web host (needs https).

## Files
- `index.html` – login, pairing, lobby, quiz games, chat page
- `ludo.html` – Ludo with built-in mini chat
- `watch.html` – Watch Together with built-in mini chat
- `chat.js` – shared message pop-ups + compact chat panel
- `questions.js` – built-in question bank (120 spicy + 60 normal)
- `firestore.rules` – database rules (replace test mode)

## Setup
1. In `index.html` set `ALLOWED_USERS = ['name1','name2']` (lowercase) so only the two of you can sign up.
2. Firebase console > Firestore > Rules: paste `firestore.rules`, replace `REPLACE_USER1/2` with the same names, Publish.
3. Sign up both accounts, then pair them with each other's username or code (tap your code to copy it).
4. Questions: `QUESTION_SOURCE` in `index.html` is `'builtin'` (default). Use `'auto'` to try your Apps Script first, `'server'` for Apps Script only.

## Watch Together
Either of you pastes a link and taps Load; the other phone follows. Play, pause and seek stay in sync.
Works with YouTube, Vimeo, direct video / stream links (.mp4 .webm .m3u8) and your own file (📁, both pick the same file).
Netflix, Prime, Disney+ and similar sites cannot be embedded by any web app: open the page on both phones and use the shared countdown.
