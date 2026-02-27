// ================================================================
//  BRAXLEY INSTITUTE — Notifications Service
//  Handles: Gmail (Nodemailer) + Telegram Bot
// ================================================================

const nodemailer = require('nodemailer');
const TelegramBot = require('node-telegram-bot-api');
const templates = require('./emailTemplates');

// ── EMAIL TRANSPORTER (Gmail) ─────────────────────────────────
let transporter = null;

function getTransporter() {
  if (!transporter && process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });
    console.log('✅ Gmail transporter initialized:', process.env.GMAIL_USER);
  }
  return transporter;
}

async function sendEmail(to, templateFn, ...args) {
  const t = getTransporter();
  if (!t) {
    console.warn('⚠️  Email not configured — skipping email to', to);
    return false;
  }
  try {
    const { subject, html } = templateFn(...args);
    await t.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME || 'Braxley Institute'}" <${process.env.GMAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log(`📧 Email sent → ${to} | ${subject}`);
    return true;
  } catch (err) {
    console.error('❌ Email error:', err.message);
    return false;
  }
}

// ── TELEGRAM BOT ──────────────────────────────────────────────
let bot = null;

function getBot() {
  if (!bot && process.env.TELEGRAM_BOT_TOKEN) {
    bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: false });
    console.log('✅ Telegram bot initialized');
  }
  return bot;
}

async function sendTelegramAdmin(message) {
  const b = getBot();
  if (!b || !process.env.TELEGRAM_ADMIN_CHAT_ID) {
    console.warn('⚠️  Telegram not configured — skipping notification');
    return false;
  }
  try {
    await b.sendMessage(process.env.TELEGRAM_ADMIN_CHAT_ID, message, { parse_mode: 'HTML' });
    console.log('📲 Telegram admin notification sent');
    return true;
  } catch (err) {
    console.error('❌ Telegram error:', err.message);
    return false;
  }
}

// ── NOTIFICATION EVENTS ───────────────────────────────────────

// Новый студент зарегистрировался
async function onUserRegistered(user) {
  await sendEmail(user.email, templates.welcomeEmail, user);

  await sendTelegramAdmin(
    `🆕 <b>New Student Registered</b>\n\n` +
    `👤 Name: <b>${user.first_name} ${user.last_name}</b>\n` +
    `📧 Email: ${user.email}\n` +
    `🌍 Country: ${user.country}\n` +
    `📅 Date: ${new Date().toLocaleString('ru-RU')}`
  );
}

// Заявка подана (после оплаты)
async function onApplicationSubmitted(user, application, payment) {
  // Email студенту
  await sendEmail(user.email, templates.applicationSubmittedEmail, user, application, payment);

  // Email себе (администратору)
  if (process.env.ADMIN_EMAIL) {
    await sendEmail(process.env.ADMIN_EMAIL, templates.adminPaymentEmail, user, payment, application);
  }

  // Telegram себе
  const methodEmoji = payment.method === 'Kaspi Pay' ? '🟠' : payment.method === 'PayPal' ? '🔵' : '💳';
  await sendTelegramAdmin(
    `💰 <b>NEW PAYMENT + APPLICATION!</b>\n\n` +
    `${methodEmoji} Method: <b>${payment.method}</b>\n` +
    `💵 Amount: <b>${payment.amount} ${payment.currency}</b>\n\n` +
    `👤 Student: <b>${user.first_name} ${user.last_name}</b>\n` +
    `📧 Email: ${user.email}\n` +
    `🌍 Country: ${user.country}\n` +
    `📚 Programme: <b>${application.program}</b>\n` +
    `⏱ Duration: ${application.duration}\n\n` +
    `🔗 APP-${String(application.id).padStart(4,'0')}\n` +
    `📅 ${new Date().toLocaleString('ru-RU')}\n\n` +
    `👆 Войдите в админ панель для рассмотрения заявки`
  );
}

// Решение принято (принят/отклонён)
async function onDecisionMade(user, application, status) {
  if (status === 'accepted') {
    await sendEmail(user.email, templates.acceptedEmail, user, application);
    await sendTelegramAdmin(
      `✅ <b>Application ACCEPTED</b>\n\n` +
      `👤 ${user.first_name} ${user.last_name}\n` +
      `📚 ${application.program}\n` +
      `📧 Acceptance email sent to ${user.email}`
    );
  } else if (status === 'rejected') {
    await sendEmail(user.email, templates.rejectedEmail, user, application);
    await sendTelegramAdmin(
      `❌ <b>Application Rejected</b>\n\n` +
      `👤 ${user.first_name} ${user.last_name}\n` +
      `📚 ${application.program}\n` +
      `📧 Rejection email sent to ${user.email}`
    );
  }
}

// Stripe webhook — платёж подтверждён
async function onStripePaymentConfirmed(user, payment, application) {
  await sendEmail(user.email, templates.paymentReceivedEmail, user, payment, application);

  if (process.env.ADMIN_EMAIL) {
    await sendEmail(process.env.ADMIN_EMAIL, templates.adminPaymentEmail, user, payment, application);
  }

  await sendTelegramAdmin(
    `💳 <b>Stripe Payment CONFIRMED</b>\n\n` +
    `👤 ${user.first_name} ${user.last_name}\n` +
    `📧 ${user.email}\n` +
    `💵 ${payment.amount} ${payment.currency}\n` +
    `🔗 Ref: ${payment.transaction_ref}\n` +
    `📅 ${new Date().toLocaleString('ru-RU')}`
  );
}

module.exports = {
  onUserRegistered,
  onApplicationSubmitted,
  onDecisionMade,
  onStripePaymentConfirmed,
  sendTelegramAdmin,
};
