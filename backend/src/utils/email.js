const nodemailer = require('nodemailer');

let transporter;

// Only initialize email if credentials are configured
if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
} else {
  console.warn('Email configuration not set. Email verification will be skipped.');
}

const sendVerificationEmail = async (email, token) => {
  // Skip email sending if not configured
  if (!transporter) {
    console.log(`Email not configured. Skipping verification email for ${email}`);
    return;
  }

  const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Verify your DateDrop Account',
    html: `
      <h2>Welcome to DateDrop!</h2>
      <p>Please verify your email address by clicking the link below:</p>
      <a href="${verificationLink}">${verificationLink}</a>
      <p>This link expires in 24 hours.</p>
      <p>If you didn't create this account, please ignore this email.</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Verification email sent to ${email}`);
  } catch (err) {
    console.error('Failed to send email:', err);
    // Don't throw - allow signup to complete even if email fails
  }
};

module.exports = { sendVerificationEmail };
