# my-pals

A lightweight single-page web app to manage your personal network and stay consistent with follow-ups.

## What is implemented

This MVP covers the core user stories from the original spec:

- Add, edit, and delete contacts.
- Track contact details (phone, email, address), category (Friend, Colleague, Lead), notes, and important dates.
- Set contact frequency (monthly, quarterly, bi-annually, annually).
- Mark contacts as contacted (updates last contacted date).
- Sort contacts by nearest next contact date.
- Dashboard with:
  - Upcoming contacts (next 7 days)
  - Upcoming birthdays/anniversaries (next 30 days)
  - Analytics KPIs (total contacts, due this week, overdue, on-time rate)
- Search and filter by category and frequency.
- Reminder list for contacts due today/tomorrow.
- Local backup/export and restore/import in JSON format.

## Run locally

Because this is a static app, no build step is required.

```bash
python3 -m http.server 4173
```

Then open:

- <http://localhost:4173>

## Data storage

- Contacts are stored in browser localStorage under key `my-pals-data-v1`.
- Export creates a `my-pals-backup.json` file.
- Import restores contacts from that JSON format.

## Project structure

- `index.html` – App layout and UI sections.
- `styles.css` – Responsive styling.
- `app.js` – State management, CRUD, sorting, reminders, dashboard analytics, import/export.
