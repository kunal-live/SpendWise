/**
 * SpendWise Email Service & Log System
 * Formats, logs, and manages outbound transactional emails (Password Reset, Email Verification, etc.)
 */

export interface EmailLogEntry {
  id: string;
  to: string;
  name: string;
  subject: string;
  type: "password_reset" | "email_verification" | "welcome" | "security_alert";
  logo: string;
  brandName: string;
  textBody: string;
  htmlBody: string;
  resetToken?: string;
  resetUrl?: string;
  timestamp: string;
}

// In-memory store for email logs
const emailLogs: EmailLogEntry[] = [];

/**
 * Generates a clean text & HTML password reset email with SpendWise logo, user's name, and reset message.
 */
export function sendPasswordResetEmail({
  email,
  name,
  resetToken,
  baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://spendwise.kunaljha8990.workers.dev"
}: {
  email: string;
  name: string;
  resetToken: string;
  baseUrl?: string;
}): EmailLogEntry {
  const recipientName = name || email.split("@")[0] || "Valued User";
  const resetUrl = `${baseUrl.replace(/\/$/, "")}/auth/reset-password?token=${encodeURIComponent(resetToken)}`;
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short"
  });

  const brandName = "SPENDWISE";
  const logoText = "💎 SPENDWISE | Personal Finance OS";

  // Formatted Text Version
  const textBody = `
================================================================================
${logoText}
================================================================================
To: ${recipientName} <${email}>
Subject: Reset Your SpendWise Password
Date: ${new Date().toUTCString()}

Hi ${recipientName},

We received a request to reset the password for your SpendWise account.

To reset your password, please click the secure link below or copy it into your browser:
${resetUrl}

Your Security Token: ${resetToken}
Valid for: 1 hour (expires at ${expiresAt})

If you did not request this password reset, please ignore this email or contact support at support@spendwise.app if you suspect unauthorized access. Your account remains completely secure.

Best regards,
The SpendWise Security Team
https://spendwise.app
================================================================================
`.trim();

  // Formatted HTML Version
  const htmlBody = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your SpendWise Password</title>
</head>
<body style="margin: 0; padding: 0; background-color: #FAF6EE; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #45423E;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #FAF6EE; padding: 40px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 560px; background-color: #FFFDF9; border: 1px solid #E5DFD3; border-radius: 24px; padding: 36px 30px; box-shadow: 0 10px 25px -5px rgba(20, 21, 26, 0.08);">
          
          <!-- Logo & Brand Header -->
          <tr>
            <td align="center" style="padding-bottom: 28px;">
              <table role="presentation" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="background: rgba(255, 107, 74, 0.1); border: 1px solid rgba(255, 107, 74, 0.25); border-radius: 16px; padding: 12px 20px;">
                    <div style="font-size: 22px; font-weight: 900; letter-spacing: -0.5px; color: #14151A;">
                      SPEND<span style="color: #FF6B4A;">WISE</span>
                    </div>
                  </td>
                </tr>
              </table>
              <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #7A756D; margin-top: 8px; font-weight: 600;">
                Personal Finance OS
              </div>
            </td>
          </tr>

          <!-- Greeting & Main Message -->
          <tr>
            <td>
              <h1 style="font-size: 22px; font-weight: 800; color: #14151A; margin: 0 0 14px 0; letter-spacing: -0.5px;">
                Reset Your Password
              </h1>
              <p style="font-size: 14px; line-height: 1.6; color: #45423E; margin: 0 0 20px 0;">
                Hello <strong style="color: #14151A;">${recipientName}</strong>,
              </p>
              <p style="font-size: 14px; line-height: 1.6; color: #45423E; margin: 0 0 24px 0;">
                We received a request to reset your password for your SpendWise account. Click the button below to choose a new password.
              </p>
            </td>
          </tr>

          <!-- Reset CTA Button -->
          <tr>
            <td align="center" style="padding: 10px 0 28px 0;">
              <table role="presentation" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="border-radius: 14px; background-color: #FF6B4A;">
                    <a href="${resetUrl}" target="_blank" style="display: inline-block; padding: 14px 32px; font-size: 14px; font-weight: 700; color: #FFFFFF; text-decoration: none; border-radius: 14px; background-color: #FF6B4A;">
                      Reset My Password &rarr;
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Token / Backup Link -->
          <tr>
            <td style="border-top: 1px solid #E5DFD3; padding-top: 20px;">
              <p style="font-size: 12px; line-height: 1.5; color: #7A756D; margin: 0 0 8px 0;">
                Button not working? Copy and paste this URL into your browser:
              </p>
              <div style="background-color: #F4EFE6; border: 1px solid #E5DFD3; border-radius: 10px; padding: 10px 14px; font-size: 11px; word-break: break-all; color: #FF6B4A; font-family: monospace;">
                ${resetUrl}
              </div>
            </td>
          </tr>

          <!-- Expiration & Security Notice -->
          <tr>
            <td style="padding-top: 20px;">
              <div style="background-color: rgba(255, 107, 74, 0.08); border: 1px solid rgba(255, 107, 74, 0.2); border-radius: 12px; padding: 14px; font-size: 12px; color: #45423E; line-height: 1.5;">
                &#9200; <strong>Expiration Notice:</strong> This link will expire in <strong>1 hour</strong> (at ${expiresAt}). If you did not request a password reset, you can safely ignore this email; your password will remain unchanged.
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top: 30px; border-top: 1px solid #E5DFD3; margin-top: 24px;">
              <p style="font-size: 11px; color: #7A756D; margin: 0 0 6px 0;">
                &copy; ${new Date().getFullYear()} SpendWise. All rights reserved.
              </p>
              <p style="font-size: 11px; color: #7A756D; margin: 0;">
                <a href="${baseUrl}/privacy" style="color: #7A756D; text-decoration: none;">Privacy Policy</a> &bull;
                <a href="${baseUrl}/terms" style="color: #7A756D; text-decoration: none;">Terms of Service</a> &bull;
                <a href="${baseUrl}/contact" style="color: #7A756D; text-decoration: none;">Help Center</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`.trim();

  const logEntry: EmailLogEntry = {
    id: `eml_${Math.random().toString(36).slice(2)}`,
    to: email,
    name: recipientName,
    subject: "Reset Your SpendWise Password",
    type: "password_reset",
    logo: logoText,
    brandName,
    textBody,
    htmlBody,
    resetToken,
    resetUrl,
    timestamp: new Date().toISOString()
  };

  emailLogs.push(logEntry);

  // Print structured, branded email log to stdout
  console.log("\n" + textBody + "\n");

  return logEntry;
}

/**
 * Get all recorded email logs
 */
export function getEmailLogs(): EmailLogEntry[] {
  return [...emailLogs];
}

/**
 * Get the latest email log for a specific recipient
 */
export function getLatestEmailForRecipient(email: string): EmailLogEntry | undefined {
  const normalized = email.trim().toLowerCase();
  for (let i = emailLogs.length - 1; i >= 0; i--) {
    if (emailLogs[i].to.toLowerCase() === normalized) {
      return emailLogs[i];
    }
  }
  return undefined;
}
