import sgMail from '@sendgrid/mail';

// Initialize SendGrid with API key
const apiKey = process.env.SENDGRID_API_KEY;
if (apiKey) {
  sgMail.setApiKey(apiKey);
}

const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'admin@nimbus.app';
const FROM_NAME = process.env.SENDGRID_FROM_NAME || 'Nimbus Admin';
const ADMIN_URL = process.env.ADMIN_URL || 'http://localhost:5173';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

async function sendEmail(options: EmailOptions): Promise<void> {
  if (!apiKey) {
    console.warn('SendGrid API key not configured. Email not sent:', options.subject);
    return;
  }

  try {
    await sgMail.send({
      to: options.to,
      from: {
        email: FROM_EMAIL,
        name: FROM_NAME,
      },
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, ''), // Strip HTML for text fallback
    });
    console.log(`Email sent to ${options.to}: ${options.subject}`);
  } catch (error: any) {
    console.error('SendGrid error:', error?.response?.body || error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
}

export async function sendInvitationEmail(
  email: string,
  token: string,
  inviterName?: string
): Promise<void> {
  const invitationUrl = `${ADMIN_URL}/accept-invitation?token=${token}`;
  const inviter = inviterName || 'An admin';

  await sendEmail({
    to: email,
    subject: 'You\'ve been invited to Nimbus Admin',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .container {
              background: #f9fafb;
              border-radius: 8px;
              padding: 32px;
            }
            h1 {
              color: #111827;
              margin-top: 0;
            }
            .button {
              display: inline-block;
              background: #0066cc;
              color: white !important;
              padding: 12px 24px;
              text-decoration: none;
              border-radius: 6px;
              margin: 24px 0;
              font-weight: 600;
            }
            .footer {
              color: #6b7280;
              font-size: 14px;
              margin-top: 32px;
              padding-top: 24px;
              border-top: 1px solid #e5e7eb;
            }
            .warning {
              color: #dc2626;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Welcome to Nimbus!</h1>
            <p>${inviter} has invited you to join the Nimbus Admin team.</p>
            <p>Click the button below to set your password and activate your account:</p>
            <a href="${invitationUrl}" class="button">Accept Invitation</a>
            <div class="footer">
              <p><strong>This invitation link expires in 7 days.</strong></p>
              <p>If you didn't expect this invitation, you can safely ignore this email.</p>
              <p class="warning">Never share this link with anyone. It grants access to your admin account.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  });
}

export async function sendPasswordResetEmail(
  email: string,
  token: string
): Promise<void> {
  const resetUrl = `${ADMIN_URL}/reset-password?token=${token}`;

  await sendEmail({
    to: email,
    subject: 'Reset your Nimbus Admin password',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .container {
              background: #f9fafb;
              border-radius: 8px;
              padding: 32px;
            }
            h1 {
              color: #111827;
              margin-top: 0;
            }
            .button {
              display: inline-block;
              background: #0066cc;
              color: white !important;
              padding: 12px 24px;
              text-decoration: none;
              border-radius: 6px;
              margin: 24px 0;
              font-weight: 600;
            }
            .footer {
              color: #6b7280;
              font-size: 14px;
              margin-top: 32px;
              padding-top: 24px;
              border-top: 1px solid #e5e7eb;
            }
            .warning {
              color: #dc2626;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Password Reset Request</h1>
            <p>You requested to reset your password for Nimbus Admin.</p>
            <p>Click the button below to reset your password:</p>
            <a href="${resetUrl}" class="button">Reset Password</a>
            <div class="footer">
              <p><strong>This reset link expires in 1 hour.</strong></p>
              <p>If you didn't request this password reset, you can safely ignore this email. Your password will remain unchanged.</p>
              <p class="warning">Never share this link with anyone. It grants access to reset your password.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  });
}

export async function sendPasswordChangedConfirmation(
  email: string
): Promise<void> {
  await sendEmail({
    to: email,
    subject: 'Your Nimbus Admin password was changed',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .container {
              background: #f9fafb;
              border-radius: 8px;
              padding: 32px;
            }
            h1 {
              color: #111827;
              margin-top: 0;
            }
            .footer {
              color: #6b7280;
              font-size: 14px;
              margin-top: 32px;
              padding-top: 24px;
              border-top: 1px solid #e5e7eb;
            }
            .warning {
              color: #dc2626;
              font-size: 14px;
              font-weight: 600;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Password Changed</h1>
            <p>This is a confirmation that your Nimbus Admin password was successfully changed.</p>
            <p>If you made this change, no further action is needed.</p>
            <div class="footer">
              <p class="warning">If you did NOT change your password, please contact your administrator immediately.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  });
}

export async function sendAccountActivatedEmail(
  email: string,
  role: string
): Promise<void> {
  await sendEmail({
    to: email,
    subject: 'Your Nimbus Admin account is now active',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .container {
              background: #f9fafb;
              border-radius: 8px;
              padding: 32px;
            }
            h1 {
              color: #111827;
              margin-top: 0;
            }
            .info-box {
              background: white;
              border: 1px solid #e5e7eb;
              border-radius: 6px;
              padding: 16px;
              margin: 24px 0;
            }
            .button {
              display: inline-block;
              background: #0066cc;
              color: white !important;
              padding: 12px 24px;
              text-decoration: none;
              border-radius: 6px;
              margin: 24px 0;
              font-weight: 600;
            }
            .footer {
              color: #6b7280;
              font-size: 14px;
              margin-top: 32px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Welcome to Nimbus Admin!</h1>
            <p>Your admin account has been successfully activated.</p>
            <div class="info-box">
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Role:</strong> ${role}</p>
            </div>
            <p>You can now log in to the Nimbus Admin dashboard:</p>
            <a href="${ADMIN_URL}/login" class="button">Go to Login</a>
            <div class="footer">
              <p>If you have any questions or need assistance, please contact your administrator.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  });
}
