/* Ayisha Soft - Node.js (Express) server */

import dotenv from 'dotenv';
import express from 'express';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isMailConfigured, sendContactEmail, verifyMailer } from './mailer.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load GMAIL_USER, GMAIL_APP_PASSWORD, etc. from .env
dotenv.config({ path: path.join(__dirname, '.env'), quiet: true });

const app = express();
const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');
const DATA_DIR = path.join(__dirname, 'data');
const MESSAGES_FILE = path.join(DATA_DIR, 'messages.json');

app.disable('x-powered-by');
// Use the visitor's real IP when running behind a host such as Render or Railway
app.set('trust proxy', 1);
app.use(express.json({ limit: '10kb' }));


/* ==========================================
   Static website (HTML, CSS, JS, images)
   "/about" also works for "/about.html"
========================================== */

app.use(express.static(PUBLIC_DIR, { extensions: ['html'] }));


/* ==========================================
   Contact form validation (same rules as script.js)
========================================== */

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateContact(body = {}) {

    const name = String(body.name ?? '').trim();
    const email = String(body.email ?? '').trim();
    const message = String(body.message ?? '').trim();

    const errors = {};

    if (!name) errors.name = 'This field is required.';
    else if (name.length < 2) errors.name = 'Please enter at least 2 characters.';
    else if (name.length > 100) errors.name = 'Please keep your name under 100 characters.';

    if (!email) errors.email = 'This field is required.';
    else if (!EMAIL_PATTERN.test(email) || email.length > 254) errors.email = 'Please enter a valid email address.';

    if (!message) errors.message = 'This field is required.';
    else if (message.length < 10) errors.message = 'Please enter at least 10 characters.';
    else if (message.length > 5000) errors.message = 'Please keep your message under 5000 characters.';

    // Hidden "website" field: real visitors leave it empty, spam bots fill it in
    const isBot = Boolean(String(body.website ?? '').trim());

    return { errors, isBot, data: { name, email, message } };

}


/* ==========================================
   Simple JSON file storage
========================================== */

async function readMessages() {

    try {
        return JSON.parse(await readFile(MESSAGES_FILE, 'utf8'));
    } catch (error) {
        if (error.code === 'ENOENT') return [];
        throw error;
    }

}

// Queue writes so two submissions at once don't overwrite each other
let writeQueue = Promise.resolve();

function saveMessage(entry) {

    writeQueue = writeQueue.then(async () => {
        await mkdir(DATA_DIR, { recursive: true });
        const messages = await readMessages();
        messages.push(entry);
        await writeFile(MESSAGES_FILE, JSON.stringify(messages, null, 2));
    });

    return writeQueue;

}


/* ==========================================
   API routes
========================================== */

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});

/* Allow at most 5 messages per visitor every 15 minutes */
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 15 * 60 * 1000;
const recentSubmissions = new Map();

function isRateLimited(ip) {

    const now = Date.now();

    const times = (recentSubmissions.get(ip) || [])
        .filter(time => now - time < RATE_WINDOW_MS);

    if (times.length >= RATE_LIMIT) {
        recentSubmissions.set(ip, times);
        return true;
    }

    times.push(now);
    recentSubmissions.set(ip, times);

    return false;

}

app.post('/api/contact', async (req, res, next) => {

    try {

        const { errors, isBot, data } = validateContact(req.body);

        if (Object.keys(errors).length > 0) {
            return res.status(400).json({
                ok: false,
                message: 'Please correct the highlighted fields.',
                errors
            });
        }

        // Pretend it worked so bots don't retry
        if (isBot) {
            return res.status(201).json({ ok: true, message: 'Thank you! Your message has been sent.' });
        }

        if (isRateLimited(req.ip)) {
            return res.status(429).json({
                ok: false,
                message: 'You have sent several messages already. Please wait a few minutes and try again.'
            });
        }

        if (!isMailConfigured()) {
            console.error('Contact form used, but Gmail is not configured in .env');
            return res.status(503).json({
                ok: false,
                message: 'Sorry, the contact form is not available right now. Please try again later.'
            });
        }

        const entry = {
            id: Date.now().toString(36),
            ...data,
            receivedAt: new Date().toISOString(),
            ip: req.ip,
            userAgent: String(req.get('user-agent') || '').slice(0, 300)
        };

        try {

            const info = await sendContactEmail(entry);

            // Keep a backup copy of every message that was emailed
            await saveMessage({ ...entry, emailId: info.messageId });

        } catch (error) {

            console.error(`Could not send contact email: ${error.message}`);

            // Still keep the message so it isn't lost
            await saveMessage({ ...entry, emailError: error.message }).catch(() => {});

            return res.status(502).json({
                ok: false,
                message: 'Sorry, your message could not be sent right now. Please try again later.'
            });

        }

        res.status(201).json({
            ok: true,
            message: 'Thank you! Your message has been sent. We will get back to you soon.'
        });

    } catch (error) {
        next(error);
    }

});


/* ==========================================
   404 and error handling
========================================== */

app.use('/api', (req, res) => {
    res.status(404).json({ ok: false, message: 'API route not found.' });
});

app.use((req, res) => {
    res.status(404).sendFile(path.join(PUBLIC_DIR, '404.html'));
});

app.use((error, req, res, next) => {

    if (error.type === 'entity.parse.failed' || error.type === 'entity.too.large') {
        return res.status(400).json({ ok: false, message: 'Invalid request data.' });
    }

    console.error(error);

    res.status(500).json({ ok: false, message: 'Something went wrong. Please try again later.' });

});


app.listen(PORT, () => {
    console.log(`Ayisha Soft is running at http://localhost:${PORT}`);
    verifyMailer();
});
