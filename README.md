# ⚡ GrindOS

> **No excuses. Just results.**

GrindOS is a brutally honest AI-powered task planner built for people who want to get things done — not feel good about not doing them. It roasts you, tracks you, and refuses to let you slack.

---

## Features

- **AI Task Generation** — Speak your goals, get a structured daily plan. Powered by voice input + AI.
- **Toxic Motivation** — Choose your pain level: Mild, Spicy, or Brutal. The AI adjusts its roast accordingly.
- **Daily Recap** — End-of-day AI roast based on your actual performance. Ouch.
- **Streak Tracking** — Consecutive days of productivity. Don't break the chain.
- **Progress View** — Category breakdowns, completion rates, and historical stats.
- **History** — Browse past days and see what you actually did.
- **Dark / Light Mode** — Because even toxic people need options.
- **Cloud Sync** — Tasks, settings, and stats synced via Appwrite. Works across installs.
- **Auth** — Sign up, log in, log out. Your data is yours.

---

## Tech Stack

| Layer | Tech |
|---|---|
| Framework | [Expo](https://expo.dev) + [Expo Router](https://expo.github.io/router) |
| Language | TypeScript |
| Backend / DB | [Appwrite](https://appwrite.io) (Database + Auth) |
| AI | `@rork-ai/toolkit-sdk` |
| State | React Query + Context |
| UI | React Native (custom components, no UI lib) |

---

## Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/donkorBN/GrindOS.git
cd GrindOS
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment

Create a `.env` file in the root:

```env
EXPO_PUBLIC_APPWRITE_ENDPOINT=https://<your-region>.cloud.appwrite.io/v1
EXPO_PUBLIC_APPWRITE_PROJECT_ID=<your-project-id>
EXPO_PUBLIC_APPWRITE_DATABASE_ID=<your-database-id>
EXPO_PUBLIC_APPWRITE_TASKS_COLLECTION_ID=tasks
EXPO_PUBLIC_APPWRITE_SETTINGS_COLLECTION_ID=settings
EXPO_PUBLIC_APPWRITE_STATS_COLLECTION_ID=stats
```

### 4. Start the dev server

```bash
npx expo start
```

Scan the QR code with [Expo Go](https://expo.dev/go) on your phone.

---

## Appwrite Setup

1. Create a project at [cloud.appwrite.io](https://cloud.appwrite.io)
2. Create a database named `toxic-planner`
3. Create three collections: `tasks`, `settings`, `stats` (see `services/appwrite.ts` for field definitions)
4. Add your app as a Platform: **Project → Platforms → Add Platform**
   - iOS: bundle ID `app.rork.toxic-motivation-planner`
   - Web: hostname `localhost`

---

## Project Structure

```
app/
  (auth)/        # Splash, Login, Signup screens
  (tabs)/        # Main app tabs (Today, History, Progress, Settings)
components/      # Reusable UI components
constants/       # Colors, categories, toxic messages
hooks/           # useThemeColors
providers/       # AuthProvider, TaskProvider
services/        # Appwrite client
types/           # TypeScript interfaces
utils/           # Date utilities
```

---

## License

MIT
