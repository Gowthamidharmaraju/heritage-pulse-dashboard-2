const fs = require('fs');
const path = require('path');
const db = require('./db');

console.log('====================================================');
console.log(' Heritage Pulse Database Sanitizer & Speed Optimizer');
console.log('====================================================\n');

const dbFile = path.join(__dirname, 'data.json');
if (!fs.existsSync(dbFile)) {
  console.error('❌ server/data.json not found!');
  process.exit(1);
}

const statsBefore = fs.statSync(dbFile);
const sizeBeforeMb = (statsBefore.size / (1024 * 1024)).toFixed(2);
console.log(`📊 Initial server/data.json file size: ${statsBefore.size.toLocaleString()} bytes (~${sizeBeforeMb} MB)`);

console.log('🔍 Scanning database for embedded base64 images...');
db.migrateBase64();

const statsAfter = fs.statSync(dbFile);
const sizeAfterMb = (statsAfter.size / (1024 * 1024)).toFixed(2);
const savedMb = ((statsBefore.size - statsAfter.size) / (1024 * 1024)).toFixed(2);

console.log(`\n✅ Optimization Complete!`);
console.log(`📊 New server/data.json file size: ${statsAfter.size.toLocaleString()} bytes (~${sizeAfterMb} MB)`);
if (statsBefore.size > statsAfter.size) {
  console.log(`🎉 Saved ${savedMb} MB of network and disk overhead!`);
} else {
  console.log('✨ Database was already clean and optimized.');
}
console.log('🚀 Dashboard API endpoints are now primed for high-speed delivery.\n');
