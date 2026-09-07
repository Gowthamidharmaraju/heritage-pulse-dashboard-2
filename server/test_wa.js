const express = require('express');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const app = express();
const PORT = 3005;
let currentQrCodeUrl = '';
let isConnected = false;

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  }
});

client.on('qr', (qr) => {
  console.log('\n📲 QR Code Generated! Open http://localhost:3005 in your browser to scan!\n');
  qrcode.generate(qr, { small: true });
  currentQrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(qr)}`;
});

client.on('ready', () => {
  isConnected = true;
  console.log('\n✅ WhatsApp Web Client is CONNECTED & READY!');
  console.log('Sending test WhatsApp message to +919133565544...\n');
  
  const chatId = '919133565544@c.us';
  const message = '⏳ *Waiting for your approval*\n\n📄 *Article Title:* Ancient Sculptures of Hampi\n✍️ *Submitted By:* Pavitra\n\n🔗 *Review Link:* http://localhost:3000/#content-detail?id=HP-2026-006';
  
  client.sendMessage(chatId, message).then(res => {
    console.log('🚀 Test WhatsApp message delivered to +919133565544 via whatsapp-web.js!');
  }).catch(err => {
    console.error('❌ Failed to send message:', err);
  });
});

client.on('authenticated', () => {
  console.log('🔑 WhatsApp Session Authenticated!');
});

app.get('/', (req, res) => {
  if (isConnected) {
    return res.send(`
      <html>
        <head><title>WhatsApp Connected</title></head>
        <body style="font-family: sans-serif; text-align: center; padding: 40px; background: #0f172a; color: #fff;">
          <h1 style="color: #10b981;">✅ WhatsApp Connected &amp; Authenticated!</h1>
          <p>Your server is linked to WhatsApp. Automated background messages are active!</p>
        </body>
      </html>
    `);
  }
  if (!currentQrCodeUrl) {
    return res.send(`
      <html>
        <head><title>Generating QR...</title><meta http-equiv="refresh" content="3"></head>
        <body style="font-family: sans-serif; text-align: center; padding: 40px; background: #0f172a; color: #fff;">
          <h2>Generating WhatsApp QR Code...</h2>
          <p>Please wait 3 seconds for the QR code to load.</p>
        </body>
      </html>
    `);
  }
  res.send(`
    <html>
      <head>
        <title>Scan WhatsApp QR Code</title>
        <meta http-equiv="refresh" content="5">
      </head>
      <body style="font-family: sans-serif; text-align: center; padding: 30px; background: #0f172a; color: #fff;">
        <h1 style="color: #f59e0b;">📲 Scan QR Code with your WhatsApp Phone</h1>
        <p style="color: #cbd5e1; font-size: 1.1rem;">Open WhatsApp on <strong>8008712251</strong> &rarr; tap <strong>Settings / Menu</strong> &rarr; <strong>Linked Devices</strong> &rarr; <strong>Link a Device</strong> &rarr; Scan below:</p>
        <div style="background: #fff; padding: 20px; display: inline-block; border-radius: 16px; margin: 20px 0; box-shadow: 0 8px 32px rgba(0,0,0,0.5);">
          <img src="${currentQrCodeUrl}" alt="WhatsApp QR Code" style="width: 320px; height: 320px; display: block;">
        </div>
        <p style="color: #94a3b8; font-size: 0.9rem;">This page auto-refreshes every 5 seconds until scanned.</p>
      </body>
    </html>
  `);
});

app.listen(PORT, () => {
  console.log(`QR Web Page Live at http://localhost:${PORT}`);
});

client.initialize();
