# Event Registration System - Node.js + Express + SQLite

## Features
- Create events
- View event list and details
- Register users for events
- View all registrations
- Cancel registrations
- SQLite database storage
- Simple frontend included

## How to Run

### Method 1: Using run.bat
Double-click `run.bat`.

### Method 2: Using VS Code Terminal
```bash
npm install
npm start
```

Open in browser:

```text
http://localhost:3000
```

## API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | /api/health | Check server |
| POST | /api/events | Create event |
| GET | /api/events | View all events |
| GET | /api/events/:id | View one event |
| POST | /api/register | Register user |
| GET | /api/registrations | View registrations |
| PUT | /api/registrations/:id/cancel | Cancel registration |

## Database
The app creates `events.db` automatically when server starts.
