# Ayisha Soft — Node.js Website

The Ayisha Soft internship website (weeks 9–12), now served by a Node.js + Express server.

## Features

- Five pages: Home, Services, About, Portfolio, Contact
- Mobile navigation, dark/light mode, back-to-top button, scroll animations
- Portfolio filtering and image preview
- **Working contact form**: each message is emailed to your Gmail as a summary (via Nodemailer), with a backup copy in `data/messages.json`
- Spam protection: hidden honeypot field + max 5 messages per visitor every 15 minutes
- Clean URLs (`/about` works the same as `/about.html`) and a custom 404 page

## Requirements

- [Node.js](https://nodejs.org/) 18 or newer

## Getting started

```bash
npm install     # install Express, Nodemailer and dotenv
npm start       # run the server
```

Open <http://localhost:3000>.

For development, `npm run dev` restarts the server automatically when you change `server.js`.

To use a different port: `PORT=4000 npm start` (macOS/Linux) or `set PORT=4000 && npm start` (Windows CMD).

## Gmail setup (contact form emails)

The contact form sends each message to a Gmail inbox. Gmail needs an **App Password** (your normal password will not work):

1. Turn on **2-Step Verification** for the Gmail account: <https://myaccount.google.com/security>
2. Create an App Password at <https://myaccount.google.com/apppasswords> (name it e.g. "Ayisha Soft website") and copy the 16-character code.
3. Copy `.env.example` to a new file called `.env` and fill it in:

   ```
   GMAIL_USER=your.address@gmail.com
   GMAIL_APP_PASSWORD=abcd efgh ijkl mnop
   CONTACT_TO=                # optional: another inbox to receive messages
   ```
4. Run `npm start`. You should see `✉  Gmail ready: messages will be sent to ...`.

The email's **Reply-To** is the visitor's address, so you can just press *Reply* in Gmail to answer them.

To check the email design without sending anything: `npm run preview-email`, then open `data/email-preview.html`.

> Keep `.env` private. It is in `.gitignore`, so it won't be pushed to GitHub. When you deploy (Render, Railway, etc.) add the same values as environment variables on the host.

## Project structure

```
├── server.js            Express server and API routes
├── mailer.js            Builds and sends the Gmail summary email
├── .env.example         Template for your Gmail settings (copy to .env)
├── scripts/
│   └── preview-email.mjs  Preview the email without sending
├── package.json
├── public/              Everything the browser loads
│   ├── index.html, about.html, services.html, portfolio.html, contact.html, 404.html
│   ├── styles.css
│   ├── script.js
│   └── assets/          Images
└── data/
    └── messages.json    Backup of every contact message (git-ignored)
```

## API

| Method | Route          | Description                                  |
|--------|----------------|----------------------------------------------|
| GET    | `/api/health`  | Returns `{ "status": "ok" }`                 |
| POST   | `/api/contact` | JSON body `{ name, email, message }`. Emails the message. `201` sent · `400` invalid (with field `errors`) · `429` too many messages · `502` Gmail error · `503` Gmail not configured |
