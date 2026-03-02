# 🗺 Odessa Streets Bot

Telegram bot that translates street names in Odessa between old and new names.  
Send any part of a street name — the bot detects whether it's old or new and returns the other.

## Project Structure

```
├── app/
│   ├── bot.js                # Entry point
│   ├── client.js             # CLI demo
│   ├── Street.js             # Model
│   ├── street.bot.js         # Bot logic
│   ├── street.repository.js  # Database queries
│   ├── telegram.client.js    # Telegram API wrapper
│   └── db/
│       └── odessa_streets.db # SQLite database (341 streets)
├── .env                      # BOT_TOKEN goes here (see below)
└── package.json
```

## Setup

**1. Install dependencies**
```bash
npm install
```

**2. Create `.env` file**
```env
BOT_TOKEN=123456:ABC-DEF
```
Get a token from [@BotFather](https://t.me/BotFather) → `/newbot`.

**3. Run**
```bash
npm run dev    # with nodemon (auto-restart)
npm run run    # plain node
```

## Bot Commands

| Input | Result |
|---|---|
| `/start` or `/help` | Usage instructions |
| `Пушкінська` | 📛 **Пушкінська вул.** ➡️ Італійська вул. |
| `Героїв` | 🏷 **Героїв Крут вул.** ⬅️ *колишня* Валентини Терешкової вул. |
| `Гагаріна` | finds all streets where old or new name matches |

- Case-insensitive partial match across both name columns
- Returns up to 10 results; narrows with a more specific query
- Includes a 📖 article link where available

## CLI Demo

```bash
node --experimental-sqlite app/client.js              # built-in demo
node --experimental-sqlite app/client.js Суворовська  # search by term
```

## Requirements

- Node.js v22+ (uses built-in `node:sqlite` — no extra DB driver needed)
