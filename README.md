# Telegram Feedback Bot

This project is a multilingual Telegram bot for collecting client feedback in English, Russian, and Uzbek.

## What it does

The bot:

1. Asks the client to choose a language.
2. Collects name and phone number.
3. Asks which manager worked with the client.
4. Collects a manager rating from 1 to 5 and a required comment.
5. Collects a service department rating from 1 to 5 and a required comment.
6. Asks whether the client will work with you again.
7. If the answer is `No`, asks for the reason.
8. Stores the completed feedback in encrypted local storage.

## Safety features

- Uses an `ENCRYPTION_KEY` to encrypt saved feedback before writing it to disk.
- Refuses to start without a valid bot token, encryption key, and manager list.
- Limits and sanitizes text fields to reduce accidental data abuse.
- Stores only the minimum feedback data needed for follow-up.
- Can send each completed feedback to your Telegram admin chat in readable form.
- Keeps phone numbers masked in admin notifications by default.
- Persists active survey sessions in `DATA_DIR`, so short service restarts do not reset users to the first step.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy `.env.example` to `.env`.

3. Fill in the environment variables:

- `BOT_TOKEN`: your Telegram bot token from BotFather.
- `ENCRYPTION_KEY`: a 64-character hex string.
- `MANAGERS`: comma-separated manager names shown in the bot.
- `ADMIN_CHAT_ID`: Telegram chat ID where readable feedback should be sent.
- `ADMIN_INCLUDE_FULL_PHONE`: set to `true` only if you want full phone numbers in admin messages.
- `DATA_DIR`: folder for encrypted feedback backups. Keep `./data` locally.

4. Generate a strong encryption key if needed:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

5. Run the bot:

```bash
npm start
```

6. Read saved feedback locally when needed:

```bash
npm run read:feedback
```

## Notes

- The bot is designed for private chats with users.
- Feedback is saved to `data/feedback-log.jsonl`.
- Saved entries are encrypted with AES-256-GCM.
- `npm run read:feedback` decrypts and prints saved feedback using your local `ENCRYPTION_KEY`.
- If `ADMIN_CHAT_ID` is set, every completed survey is also sent to that Telegram chat in readable form.
- If you want a dashboard later, we can add export to Google Sheets, email alerts, or an admin panel.

## 24/7 Hosting

If you close the terminal, close the Codex/VS Code session, log out, or your computer sleeps, a locally running bot stops. For true 24/7 work, the bot should run on a hosted service.

I prepared this project for Railway deployment with [railway.toml](C:/Users/Matrix Fitness UZB/Documents/Codex/2026-04-24/i-want-to-make-a-telegram/railway.toml).

Suggested Railway setup:

1. Push this folder to GitHub.
2. Create a Railway project and deploy the repo as a service.
3. Add these environment variables in Railway:
   - `BOT_TOKEN`
   - `ENCRYPTION_KEY`
   - `MANAGERS`
   - `ADMIN_CHAT_ID`
   - `ADMIN_INCLUDE_FULL_PHONE`
   - `DATA_DIR=/app/data`
4. Attach a Railway Volume and mount it to `/app/data`.
5. Deploy.

This keeps the bot online as a persistent service and preserves your encrypted backup file across restarts and redeploys.
