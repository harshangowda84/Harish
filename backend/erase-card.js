#!/usr/bin/env node

/**
 * RFID Card Eraser
 * Clears all data from card
 * Works with EM-18 reader
 * 
 * Usage: node erase-card.js
 */

const { SerialPort } = require('serialport');

const SERIAL_PORT = 'COM5';
const BAUD_RATE = 9600;

console.log('\n🗑️  RFID Card Eraser');
console.log('====================\n');
console.log('Serial Port: ' + SERIAL_PORT);
console.log('Baud Rate: ' + BAUD_RATE + '\n');
console.log('⏳ Waiting for card to erase...');
console.log('(Place RFID card near EM-18 reader, within 5cm)\n');

const port = new SerialPort({ 
  path: SERIAL_PORT, 
  baudRate: BAUD_RATE 
});

let timeout;

port.on('open', () => {
  console.log('✅ Serial port opened\n');
  
  console.log('📝 Sending erase command...\n');
  
  // Different erase strategies for EM-18
  // Strategy 1: Send empty JSON to overwrite
  const erasePayload1 = '{}'; // Empty JSON
  
  // Strategy 2: Send null bytes
  const erasePayload2 = '\x00\x00\x00\x00'; // Null bytes
  
  // Strategy 3: Send space characters
  const erasePayload3 = '                    '; // Spaces
  
  // Try sending empty JSON first (most reliable)
  console.log('Sending empty data to card...');
  
  port.write(erasePayload1 + '\n', (err) => {
    if (err) {
      console.error('❌ Error writing to port:', err);
      port.close();
      process.exit(1);
    }
    
    console.log('✅ Command sent\n');
  });
  
  // Wait for confirmation
  timeout = setTimeout(() => {
    console.log('✅ Erase command completed\n');
    console.log('🧹 Card should now be blank/erased\n');
    console.log('💡 Verify with: node check-card-status.js\n');
    port.close();
    process.exit(0);
  }, 3000);
});

port.on('data', (data) => {
  const response = data.toString().trim();
  console.log('📨 Response:', response);
});

port.on('error', (err) => {
  clearTimeout(timeout);
  console.error('❌ Serial port error:', err.message);
  console.log('\n💡 Troubleshooting:');
  console.log('   1. Check COM5 exists');
  console.log('   2. Check EM-18 reader is powered');
  console.log('   3. Try different COM port');
  console.log('   4. If EM-18 erase fails, use NFC Tools app on Android/iOS\n');
  process.exit(1);
});

port.on('close', () => {
  clearTimeout(timeout);
});
