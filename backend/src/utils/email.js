const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

const sendVerificationEmail = async (email, token) => {
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
    throw err;
  }
};

module.exports = { sendVerificationEmail };
