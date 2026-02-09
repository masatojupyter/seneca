
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';

// Load .env from project root
dotenv.config({ path: path.join(__dirname, '../.env') });

async function verifySmtp() {
  console.log('Checking SMTP Configuration...');
  
  const host = process.env.SMTP_HOST;

  const port = '465'; // Try 465
  // const port = process.env.SMTP_PORT;

  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;
  const from = process.env.SMTP_FROM;

  console.log(`Host: ${host}`);
  console.log(`Port: ${port}`);
  console.log(`User: ${user}`);
  console.log(`From: ${from}`);
  console.log(`Pass: ${pass ? '********' : '(not set)'}`);

  if (!host || !port || !user || !pass) {
    console.error('Missing SMTP configuration.');
    return;
  }

  const transporter = nodemailer.createTransport({
    host,
    port: 465,
    secure: true, // Force true for 465
    auth: {
      user,
      pass,
    },
  });

  try {
    console.log('Verifying connection...');
    await transporter.verify();
    console.log('✅ SMTP Connection verified successfully!');
  } catch (error) {
    console.error('❌ SMTP Connection failed:', error);
  }
}

verifySmtp();
