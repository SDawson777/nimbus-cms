// Quick test script for SendGrid email integration
// Run with: node server/test-email.js

require('dotenv').config();

async function testEmail() {
  console.log('🔍 Checking SendGrid configuration...\n');
  
  // Check env vars
  const apiKey = process.env.SENDGRID_API_KEY;
  const fromEmail = process.env.SENDGRID_FROM_EMAIL;
  const fromName = process.env.SENDGRID_FROM_NAME;
  const adminUrl = process.env.ADMIN_URL || 'http://localhost:5173';

  console.log('Environment Variables:');
  console.log(`  SENDGRID_API_KEY: ${apiKey ? '✅ Set (length: ' + apiKey.length + ')' : '❌ Missing'}`);
  console.log(`  SENDGRID_FROM_EMAIL: ${fromEmail || '❌ Missing'}`);
  console.log(`  SENDGRID_FROM_NAME: ${fromName || '❌ Missing'}`);
  console.log(`  ADMIN_URL: ${adminUrl}\n`);

  if (!apiKey) {
    console.error('❌ SENDGRID_API_KEY is not set in .env file');
    process.exit(1);
  }

  if (!fromEmail) {
    console.error('❌ SENDGRID_FROM_EMAIL is not set in .env file');
    process.exit(1);
  }

  // Import SendGrid
  console.log('📦 Loading SendGrid module...');
  const sgMail = require('@sendgrid/mail');
  sgMail.setApiKey(apiKey);
  console.log('✅ SendGrid initialized\n');

  // Test email address
  const testEmail = fromEmail; // Send to yourself for testing
  const testToken = 'test_token_' + Date.now();

  console.log(`📧 Sending test invitation email to: ${testEmail}\n`);

  try {
    const msg = {
      to: testEmail,
      from: {
        email: fromEmail,
        name: fromName || 'Nimbus Admin',
      },
      subject: '🧪 Test: Admin Invitation',
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
              .success {
                background: #d1fae5;
                border: 1px solid #6ee7b7;
                color: #065f46;
                padding: 12px;
                border-radius: 6px;
                margin: 16px 0;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>🧪 SendGrid Test Email</h1>
              <div class="success">
                <strong>✅ SUCCESS!</strong> Your SendGrid integration is working correctly.
              </div>
              <p>This is a test invitation email from Nimbus Admin.</p>
              <p>If you're seeing this, your email configuration is set up correctly:</p>
              <ul>
                <li>SendGrid API Key: Valid</li>
                <li>Sender Email: ${fromEmail} (verified)</li>
                <li>Email delivery: Working</li>
              </ul>
              <p>Here's what a real invitation link would look like:</p>
              <a href="${adminUrl}/accept-invitation?token=${testToken}" class="button">
                Accept Invitation (Test)
              </a>
              <div class="footer">
                <p><strong>This is a test email.</strong></p>
                <p>You can now invite real admin users through the Nimbus Admin dashboard.</p>
                <p>Test timestamp: ${new Date().toISOString()}</p>
              </div>
            </div>
          </body>
        </html>
      `,
      text: `
SendGrid Test Email - SUCCESS!

Your SendGrid integration is working correctly.

This is a test invitation email from Nimbus Admin.

Configuration:
- SendGrid API Key: Valid
- Sender Email: ${fromEmail} (verified)
- Email delivery: Working

Test link: ${adminUrl}/accept-invitation?token=${testToken}

This is a test email. You can now invite real admin users through the Nimbus Admin dashboard.

Test timestamp: ${new Date().toISOString()}
      `.trim(),
    };

    const response = await sgMail.send(msg);
    
    console.log('✅ Email sent successfully!\n');
    console.log('Response:');
    console.log(`  Status: ${response[0].statusCode}`);
    console.log(`  Headers: ${JSON.stringify(response[0].headers, null, 2)}\n`);
    
    console.log('📬 Check your inbox at:', testEmail);
    console.log('\n🎉 SUCCESS! Email integration is working.\n');
    console.log('Next steps:');
    console.log('  1. Check your email inbox');
    console.log('  2. Look for the test email (check spam if not in inbox)');
    console.log('  3. Once confirmed, you can start inviting real admins\n');
    
  } catch (error) {
    console.error('\n❌ Failed to send email:\n');
    
    if (error.response) {
      console.error('SendGrid Error Response:');
      console.error(`  Status: ${error.response.statusCode}`);
      console.error(`  Body: ${JSON.stringify(error.response.body, null, 2)}`);
      
      // Common error messages
      if (error.response.body.errors) {
        console.error('\nError Details:');
        error.response.body.errors.forEach(err => {
          console.error(`  - ${err.message}`);
          if (err.field) console.error(`    Field: ${err.field}`);
          if (err.help) console.error(`    Help: ${err.help}`);
        });
      }
      
      // Specific troubleshooting
      console.error('\n🔧 Troubleshooting:');
      if (error.response.body.errors?.some(e => e.message.includes('sender'))) {
        console.error('  → Sender email not verified in SendGrid');
        console.error('  → Go to: https://app.sendgrid.com/settings/sender_auth');
        console.error(`  → Verify: ${fromEmail}`);
      }
      if (error.response.body.errors?.some(e => e.message.includes('authorization'))) {
        console.error('  → API key is invalid or expired');
        console.error('  → Regenerate key at: https://app.sendgrid.com/settings/api_keys');
      }
    } else {
      console.error(error.message);
      console.error('\nFull error:', error);
    }
    
    process.exit(1);
  }
}

// Run the test
testEmail().catch(err => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
