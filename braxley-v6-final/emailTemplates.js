// ================================================================
//  BRAXLEY INSTITUTE — Email Templates
// ================================================================

const LOGO_PLACEHOLDER = '🎓';

const baseStyle = `
  font-family: Georgia, serif;
  max-width: 600px;
  margin: 0 auto;
  background: #ffffff;
`;

const headerHtml = (title) => `
<div style="background: linear-gradient(135deg, #0B1F3A 0%, #1a3560 100%); padding: 36px 48px; text-align: center;">
  <div style="font-family: Georgia, serif; font-size: 28px; color: #ffffff; letter-spacing: 0.04em;">
    Braxley<span style="color: #C9A84C;"> Institute</span>
  </div>
  <div style="font-size: 12px; color: rgba(184,196,212,0.8); letter-spacing: 0.16em; text-transform: uppercase; margin-top: 6px;">
    International Online Business Education
  </div>
</div>
<div style="background: #C9A84C; height: 4px;"></div>
`;

const footerHtml = `
<div style="background: #0B1F3A; padding: 28px 48px; text-align: center; margin-top: 40px;">
  <div style="font-size: 12px; color: rgba(184,196,212,0.6); line-height: 1.8;">
    © 2025 Braxley Institute. All rights reserved.<br>
    Founded December 31, 2025 · International Online Institution<br>
    <span style="color: #C9A84C;">admissions@braxley.edu</span>
  </div>
</div>
`;

// ── WELCOME EMAIL ─────────────────────────────────────────────
function welcomeEmail(user) {
  return {
    subject: 'Welcome to Braxley Institute — Account Created',
    html: `
    <div style="${baseStyle}">
      ${headerHtml('Welcome')}
      <div style="padding: 48px; background: #ffffff;">
        <p style="font-size: 18px; color: #0B1F3A; margin-bottom: 8px;">Dear ${user.first_name},</p>
        <p style="font-size: 15px; color: #5B6B82; line-height: 1.8; font-weight: 300;">
          Thank you for creating your account with <strong style="color: #0B1F3A;">Braxley Institute</strong>.
          Your student profile has been successfully registered.
        </p>
        <div style="background: #F4F6FA; border-left: 4px solid #C9A84C; padding: 20px 24px; margin: 28px 0;">
          <div style="font-size: 13px; color: #5B6B82; line-height: 2;">
            <strong style="color: #0B1F3A;">Email:</strong> ${user.email}<br>
            <strong style="color: #0B1F3A;">Country:</strong> ${user.country}<br>
            <strong style="color: #0B1F3A;">Registered:</strong> ${new Date().toLocaleDateString('en-GB', {day:'numeric',month:'long',year:'numeric'})}
          </div>
        </div>
        <p style="font-size: 15px; color: #5B6B82; line-height: 1.8; font-weight: 300;">
          Your next step is to complete your application and submit the required documents.
          Log in to your student portal to get started.
        </p>
        <div style="text-align: center; margin: 36px 0;">
          <a href="${process.env.SITE_URL}" style="background: linear-gradient(135deg, #C9A84C, #E2C06B); color: #0B1F3A; padding: 14px 40px; text-decoration: none; font-family: sans-serif; font-size: 13px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase;">
            GO TO STUDENT PORTAL →
          </a>
        </div>
      </div>
      ${footerHtml}
    </div>`
  };
}

// ── APPLICATION SUBMITTED ─────────────────────────────────────
function applicationSubmittedEmail(user, application, payment) {
  return {
    subject: `Application Received — APP-${String(application.id).padStart(4,'0')} | Braxley Institute`,
    html: `
    <div style="${baseStyle}">
      ${headerHtml('Application Received')}
      <div style="padding: 48px; background: #ffffff;">
        <p style="font-size: 18px; color: #0B1F3A; margin-bottom: 8px;">Dear ${user.first_name},</p>
        <p style="font-size: 15px; color: #5B6B82; line-height: 1.8; font-weight: 300;">
          We have successfully received your application to <strong style="color: #0B1F3A;">Braxley Institute</strong>.
          Our Admissions Committee will review your file within <strong>3 business days</strong>.
        </p>

        <div style="border: 1px solid #E8EDF3; margin: 28px 0;">
          <div style="background: #F4F6FA; padding: 16px 24px; border-bottom: 1px solid #E8EDF3;">
            <strong style="font-size: 13px; letter-spacing: 0.1em; text-transform: uppercase; color: #0B1F3A;">Application Summary</strong>
          </div>
          <div style="padding: 20px 24px;">
            <table style="width: 100%; border-collapse: collapse; font-size: 14px; font-family: sans-serif;">
              <tr><td style="padding: 8px 0; color: #5B6B82; width: 160px;">Application ID</td><td style="color: #0B1F3A; font-weight: 600;">APP-${String(application.id).padStart(4,'0')}</td></tr>
              <tr><td style="padding: 8px 0; color: #5B6B82;">Programme</td><td style="color: #0B1F3A;">${application.program}</td></tr>
              <tr><td style="padding: 8px 0; color: #5B6B82;">Duration</td><td style="color: #C9A84C; font-weight: 600;">${application.duration}</td></tr>
              <tr><td style="padding: 8px 0; color: #5B6B82;">Payment</td><td style="color: #1B6B3A; font-weight: 600;">${payment.amount} ${payment.currency} via ${payment.method} ✓</td></tr>
              <tr><td style="padding: 8px 0; color: #5B6B82;">Status</td><td><span style="background: #FFF8E6; color: #8B6914; padding: 3px 10px; font-size: 11px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase;">🟡 UNDER REVIEW</span></td></tr>
            </table>
          </div>
        </div>

        <p style="font-size: 14px; color: #5B6B82; line-height: 1.8; font-weight: 300;">
          You will receive a decision notification by email${process.env.TELEGRAM_BOT_TOKEN ? ' and Telegram' : ''}.
          If you have any questions, please contact us at
          <a href="mailto:admissions@braxley.edu" style="color: #C9A84C;">admissions@braxley.edu</a>.
        </p>
      </div>
      ${footerHtml}
    </div>`
  };
}

// ── PAYMENT RECEIVED ──────────────────────────────────────────
function paymentReceivedEmail(user, payment, application) {
  return {
    subject: `Payment Confirmed — ${payment.amount} ${payment.currency} | Braxley Institute`,
    html: `
    <div style="${baseStyle}">
      ${headerHtml('Payment Confirmed')}
      <div style="padding: 48px; background: #ffffff;">
        <div style="text-align: center; margin-bottom: 36px;">
          <div style="font-size: 56px; margin-bottom: 12px;">✅</div>
          <div style="font-family: Georgia, serif; font-size: 28px; color: #0B1F3A;">Payment Confirmed</div>
          <div style="font-size: 14px; color: #5B6B82; margin-top: 8px;">Your application fee has been received</div>
        </div>

        <div style="background: #E6F4EE; border-left: 4px solid #1B6B3A; padding: 20px 24px; margin: 28px 0;">
          <table style="width: 100%; font-size: 14px; font-family: sans-serif;">
            <tr><td style="padding: 6px 0; color: #5B6B82; width: 160px;">Transaction ID</td><td style="color: #0B1F3A; font-weight: 600;">${payment.transaction_ref || payment.id}</td></tr>
            <tr><td style="padding: 6px 0; color: #5B6B82;">Amount Paid</td><td style="color: #1B6B3A; font-weight: 700; font-size: 16px;">${payment.amount} ${payment.currency}</td></tr>
            <tr><td style="padding: 6px 0; color: #5B6B82;">Method</td><td style="color: #0B1F3A;">${payment.method}</td></tr>
            <tr><td style="padding: 6px 0; color: #5B6B82;">Programme</td><td style="color: #0B1F3A;">${application.program}</td></tr>
            <tr><td style="padding: 6px 0; color: #5B6B82;">Date</td><td style="color: #0B1F3A;">${new Date().toLocaleDateString('en-GB', {day:'numeric',month:'long',year:'numeric',hour:'2-digit',minute:'2-digit'})}</td></tr>
          </table>
        </div>

        <p style="font-size: 14px; color: #5B6B82; line-height: 1.8; font-weight: 300; text-align: center;">
          Your application is now <strong style="color: #0B1F3A;">under academic review</strong>.<br>
          Expect a decision within <strong>3 business days</strong>.
        </p>
      </div>
      ${footerHtml}
    </div>`
  };
}

// ── ACCEPTED EMAIL ────────────────────────────────────────────
function acceptedEmail(user, application) {
  return {
    subject: `🎓 Congratulations! You've Been Accepted — Braxley Institute`,
    html: `
    <div style="${baseStyle}">
      ${headerHtml('Acceptance Letter')}
      <div style="padding: 48px; background: #ffffff;">
        <div style="text-align: center; margin-bottom: 40px;">
          <div style="font-size: 72px; margin-bottom: 16px;">🎓</div>
          <div style="font-family: Georgia, serif; font-size: 32px; color: #0B1F3A; line-height: 1.2;">
            Congratulations,<br><em style="color: #C9A84C;">${user.first_name}!</em>
          </div>
        </div>

        <div style="border: 2px solid #C9A84C; padding: 32px 36px; margin: 28px 0; text-align: center;">
          <p style="font-size: 16px; color: #0B1F3A; line-height: 1.9; font-weight: 300; margin: 0; font-family: Georgia, serif; font-style: italic;">
            "The Admissions Committee of Braxley Institute is pleased to inform you
            that you have been <strong style="font-style: normal; font-weight: 700;">accepted</strong> to the
            <strong style="font-style: normal; color: #C9A84C;">${application.program}</strong> programme.
            Welcome to our global community of learners."
          </p>
        </div>

        <div style="background: #F4F6FA; padding: 20px 24px; margin: 24px 0;">
          <table style="width: 100%; font-size: 14px; font-family: sans-serif;">
            <tr><td style="padding: 6px 0; color: #5B6B82;">Programme</td><td style="color: #0B1F3A; font-weight: 600;">${application.program}</td></tr>
            <tr><td style="padding: 6px 0; color: #5B6B82;">Duration</td><td style="color: #C9A84C; font-weight: 600;">${application.duration}</td></tr>
            <tr><td style="padding: 6px 0; color: #5B6B82;">Admission Year</td><td style="color: #0B1F3A;">2025</td></tr>
            <tr><td style="padding: 6px 0; color: #5B6B82;">Application ID</td><td style="color: #0B1F3A;">APP-${String(application.id).padStart(4,'0')}</td></tr>
          </table>
        </div>

        <div style="text-align: center; margin-top: 36px;">
          <a href="${process.env.SITE_URL}" style="background: linear-gradient(135deg, #C9A84C, #E2C06B); color: #0B1F3A; padding: 16px 48px; text-decoration: none; font-family: sans-serif; font-size: 13px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase;">
            ACCESS STUDENT PORTAL →
          </a>
        </div>
      </div>
      ${footerHtml}
    </div>`
  };
}

// ── REJECTED EMAIL ────────────────────────────────────────────
function rejectedEmail(user, application) {
  return {
    subject: 'Admissions Decision — Braxley Institute',
    html: `
    <div style="${baseStyle}">
      ${headerHtml('Admissions Decision')}
      <div style="padding: 48px; background: #ffffff;">
        <p style="font-size: 18px; color: #0B1F3A; margin-bottom: 8px;">Dear ${user.first_name},</p>
        <p style="font-size: 15px; color: #5B6B82; line-height: 1.8; font-weight: 300;">
          Thank you for your interest in <strong style="color: #0B1F3A;">Braxley Institute</strong> and the time you invested in your application.
        </p>
        <div style="background: #FDE8E8; border-left: 4px solid #7A1B1B; padding: 20px 24px; margin: 28px 0;">
          <p style="font-size: 15px; color: #7A1B1B; line-height: 1.8; margin: 0; font-weight: 300;">
            After careful review by our Admissions Committee, we regret to inform you that your application
            for the <strong>${application.program}</strong> programme was not approved at this time.
          </p>
        </div>
        <p style="font-size: 14px; color: #5B6B82; line-height: 1.8; font-weight: 300;">
          You are welcome to reapply in the next admission cycle. If you have questions about your application,
          please contact us at <a href="mailto:admissions@braxley.edu" style="color: #C9A84C;">admissions@braxley.edu</a>.
        </p>
      </div>
      ${footerHtml}
    </div>`
  };
}

// ── ADMIN PAYMENT NOTIFICATION ────────────────────────────────
function adminPaymentEmail(user, payment, application) {
  return {
    subject: `💰 New Payment Received — ${payment.amount} ${payment.currency} | ${user.first_name} ${user.last_name}`,
    html: `
    <div style="${baseStyle}">
      ${headerHtml('New Payment')}
      <div style="padding: 36px 48px; background: #ffffff;">
        <div style="background: #E6F4EE; border-left: 4px solid #1B6B3A; padding: 20px 24px; margin-bottom: 24px;">
          <div style="font-size: 18px; color: #1B6B3A; font-weight: 700;">✅ New payment received!</div>
          <div style="font-size: 24px; color: #0B1F3A; font-weight: 700; margin-top: 8px;">${payment.amount} ${payment.currency}</div>
        </div>
        <table style="width: 100%; font-size: 14px; font-family: sans-serif; border-collapse: collapse;">
          <tr style="background: #F4F6FA;"><td style="padding: 10px 14px; color: #5B6B82; width: 160px;">Student</td><td style="padding: 10px 14px; font-weight: 600;">${user.first_name} ${user.last_name}</td></tr>
          <tr><td style="padding: 10px 14px; color: #5B6B82;">Email</td><td style="padding: 10px 14px;">${user.email}</td></tr>
          <tr style="background: #F4F6FA;"><td style="padding: 10px 14px; color: #5B6B82;">Programme</td><td style="padding: 10px 14px;">${application.program}</td></tr>
          <tr><td style="padding: 10px 14px; color: #5B6B82;">Payment Method</td><td style="padding: 10px 14px; font-weight: 600; color: #C9A84C;">${payment.method}</td></tr>
          <tr style="background: #F4F6FA;"><td style="padding: 10px 14px; color: #5B6B82;">Amount</td><td style="padding: 10px 14px; font-weight: 700; color: #1B6B3A;">${payment.amount} ${payment.currency}</td></tr>
          <tr><td style="padding: 10px 14px; color: #5B6B82;">Transaction Ref</td><td style="padding: 10px 14px; font-family: monospace;">${payment.transaction_ref || '—'}</td></tr>
          <tr style="background: #F4F6FA;"><td style="padding: 10px 14px; color: #5B6B82;">Date & Time</td><td style="padding: 10px 14px;">${new Date().toLocaleString('ru-RU')}</td></tr>
        </table>
        <div style="text-align: center; margin-top: 28px;">
          <a href="${process.env.SITE_URL}" style="background: #0B1F3A; color: #C9A84C; padding: 12px 32px; text-decoration: none; font-family: sans-serif; font-size: 12px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase;">
            OPEN ADMIN PANEL →
          </a>
        </div>
      </div>
      ${footerHtml}
    </div>`
  };
}

module.exports = {
  welcomeEmail,
  applicationSubmittedEmail,
  paymentReceivedEmail,
  acceptedEmail,
  rejectedEmail,
  adminPaymentEmail
};
