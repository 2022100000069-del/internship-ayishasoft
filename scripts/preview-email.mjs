/* Builds a sample contact email WITHOUT sending it, so you can check the design.
   Run: npm run preview-email   →  then open data/email-preview.html in your browser */

import nodemailer from 'nodemailer';
import { writeFileSync, mkdirSync } from 'node:fs';

// Swap the Gmail connection for one that just returns the email as JSON
const createRealTransport = nodemailer.createTransport;
nodemailer.createTransport = () => createRealTransport({ jsonTransport: true });

process.env.GMAIL_USER ||= 'you@gmail.com';
process.env.GMAIL_APP_PASSWORD ||= 'preview';

const { sendContactEmail } = await import('../mailer.js');

const info = await sendContactEmail({
    name: 'Rahim Ahmed',
    email: 'rahim@example.com',
    message: 'Hi Ayisha Soft,\n\nWe need an e-commerce website for our clothing shop. Can we talk next week?\n\nThanks!',
    receivedAt: new Date().toISOString(),
    ip: '203.0.113.7',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/130'
});

const mail = JSON.parse(info.message);

mkdirSync(new URL('../data/', import.meta.url), { recursive: true });
writeFileSync(new URL('../data/email-preview.html', import.meta.url), mail.html);

console.log(`Subject: ${mail.subject}\n`);
console.log(mail.text);
console.log('\nHTML version saved to data/email-preview.html');
