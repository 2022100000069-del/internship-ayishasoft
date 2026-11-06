/* Ayisha Soft - Gmail sender (Nodemailer) */

import nodemailer from 'nodemailer';

// Settings are read on first use, after server.js has loaded the .env file
let config;
let transporter;

function getConfig() {

    if (!config) {

        const user = process.env.GMAIL_USER?.trim();

        config = {
            user,
            // Google shows App Passwords with spaces ("abcd efgh ijkl mnop"); remove them
            pass: process.env.GMAIL_APP_PASSWORD?.replace(/\s+/g, ''),
            to: process.env.CONTACT_TO?.trim() || user,
            timeZone: process.env.TIME_ZONE || 'Asia/Dhaka'
        };

        if (config.user && config.pass) {
            transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: { user: config.user, pass: config.pass }
            });
        }

    }

    return config;

}

export function isMailConfigured() {

    getConfig();

    return Boolean(transporter);

}


/* Check the Gmail login when the server starts */
export async function verifyMailer() {

    const { to } = getConfig();

    if (!transporter) {
        console.warn('⚠  Gmail is not configured. Add GMAIL_USER and GMAIL_APP_PASSWORD to your .env file.');
        return false;
    }

    try {
        await transporter.verify();
        console.log(`✉  Gmail ready: messages will be sent to ${to}`);
        return true;
    } catch (error) {
        console.error(`✖  Gmail login failed: ${error.message}`);
        console.error('   Check GMAIL_USER and GMAIL_APP_PASSWORD in your .env file.');
        return false;
    }

}


function escapeHtml(text) {

    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

}


/* Build and send the summary email for one contact message */
export async function sendContactEmail({ name, email, message, receivedAt, ip, userAgent }) {

    const { user, to, timeZone } = getConfig();

    if (!transporter) {
        throw new Error('Gmail is not configured.');
    }

    const date = new Date(receivedAt);

    const when = date.toLocaleString('en-GB', {
        timeZone,
        dateStyle: 'full',
        timeStyle: 'short'
    }) + ` (${timeZone})`;

    const wordCount = message.split(/\s+/).filter(Boolean).length;

    // Keep the subject on one line
    const safeName = name.replace(/[\r\n]+/g, ' ').slice(0, 80);

    const text = [
        'New message from the Ayisha Soft contact form',
        '',
        `Name:     ${name}`,
        `Email:    ${email}`,
        `Received: ${when}`,
        `Length:   ${wordCount} words, ${message.length} characters`,
        '',
        'Message:',
        '------------------------------------------',
        message,
        '------------------------------------------',
        '',
        `Reply to this email to answer ${name} directly.`,
        '',
        `IP: ${ip || 'unknown'}`,
        `Browser: ${userAgent || 'unknown'}`
    ].join('\n');

    const row = (label, value) => `
        <tr>
            <td style="padding:8px 12px 8px 24px;color:#5b6573;font-weight:bold;width:100px;vertical-align:top;">${label}</td>
            <td style="padding:8px 24px 8px 12px;color:#1c2430;">${value}</td>
        </tr>`;

    const html = `
<div style="font-family:Arial,Helvetica,sans-serif;background:#f3f5f9;padding:24px;">
    <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:10px;overflow:hidden;border:1px solid #e1e6ee;">
        <div style="background:#1755a5;color:#ffffff;padding:18px 24px;">
            <div style="font-size:13px;opacity:.85;">Ayisha Soft · Contact form</div>
            <div style="font-size:20px;font-weight:bold;margin-top:4px;">New message from ${escapeHtml(name)}</div>
        </div>
        <table style="width:100%;border-collapse:collapse;margin-top:8px;font-size:14px;">
            ${row('Name', escapeHtml(name))}
            ${row('Email', `<a href="mailto:${escapeHtml(email)}" style="color:#1755a5;">${escapeHtml(email)}</a>`)}
            ${row('Received', escapeHtml(when))}
            ${row('Length', `${wordCount} words, ${message.length} characters`)}
        </table>
        <div style="padding:8px 24px 4px;color:#5b6573;font-weight:bold;font-size:14px;">Message</div>
        <div style="margin:0 24px 20px;padding:14px 16px;background:#f7f9fc;border-left:4px solid #1755a5;border-radius:4px;white-space:pre-wrap;color:#1c2430;font-size:14px;line-height:1.5;">${escapeHtml(message)}</div>
        <div style="padding:0 24px 20px;">
            <a href="mailto:${escapeHtml(email)}?subject=${encodeURIComponent('Re: Your message to Ayisha Soft')}" style="display:inline-block;background:#1755a5;color:#ffffff;text-decoration:none;padding:10px 18px;border-radius:6px;font-weight:bold;font-size:14px;">Reply to ${escapeHtml(name)}</a>
        </div>
        <div style="padding:12px 24px;background:#f7f9fc;color:#8a94a3;font-size:12px;border-top:1px solid #e1e6ee;">
            IP: ${escapeHtml(ip || 'unknown')}<br>
            Browser: ${escapeHtml(userAgent || 'unknown')}
        </div>
    </div>
</div>`;

    return transporter.sendMail({
        from: { name: 'Ayisha Soft Website', address: user },
        to,
        replyTo: { name: safeName, address: email },
        subject: `New contact message from ${safeName}`,
        text,
        html
    });

}
