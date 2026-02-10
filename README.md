# Calendar Demo UI

A Google Calendar-like UI for demo purposes. Shows real-time calendar events and allows booking appointments.

## Features

- 📅 Week/Day/Month views (like Google Calendar)
- 🕐 Click on time slots to book appointments
- ⚡ Real-time sync with Google Calendar
- 🚫 Prevents double-booking
- 🗑️ Click events to delete them

## Setup

### 1. Install dependencies

```bash
cd calendar-demo-ui
npm install
```

### 2. Configure environment

Copy the example env file:
```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your values:

```env
# Paste your service account JSON (as a single line)
GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"gen-lang-client-0953815372",...}

# Calendar ID (the email of the calendar shared with service account)
CALENDAR_ID=ghosh.ishw@gmail.com

# Timezone
TIMEZONE=America/Los_Angeles
```

### 3. Run the app

```bash
npm run dev
```

Open http://localhost:3000

## Usage

- **View events**: Navigate using the arrows or switch between Month/Week/Day views
- **Book appointment**: Click on any empty time slot
- **Delete event**: Click on an existing event and confirm deletion

## For Demo

1. Open this UI on one screen
2. Open your Dify chatbot on another screen
3. When the chatbot books an appointment, refresh the calendar to see it appear
4. Show clients the real-time integration!

## Tech Stack

- Next.js 14
- FullCalendar
- Google Calendar API (Service Account)
- Tailwind CSS
