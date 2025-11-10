#!/usr/bin/env node

/**
 * RFID Card Status Checker
 * Checks if card is blank or has data
 * Reads data from card on COM5
 * 
 * Usage: node check-card-status.js
 */

const { SerialPort } = require('serialport');

const SERIAL_PORT = 'COM5';
const BAUD_RATE = 9600;

console.log('\n🔍 RFID Card Status Checker');
console.log('=============================\n');
console.log('Serial Port: ' + SERIAL_PORT);
console.log('Baud Rate: ' + BAUD_RATE + '\n');
console.log('⏳ Waiting for card tap...');
console.log('(Place RFID card near EM-18 reader, within 5cm)\n');

const port = new SerialPort({ 
  path: SERIAL_PORT, 
  baudRate: BAUD_RATE 
});

let receivedData = '';
let timeout;
let dataReceived = false;

port.on('open', () => {
  console.log('✅ Serial port opened\n');
  
  // Set timeout to detect if no card is present
  timeout = setTimeout(() => {
    if (!dataReceived) {
      console.log('⏰ Timeout: No card detected after 10 seconds');
      console.log('💡 Make sure card is within 5cm of reader!');
      console.log('💡 Check that EM-18 reader is powered on!\n');
      port.close();
      process.exit(1);
    }
  }, 10000);
});

port.on('data', (data) => {
  dataReceived = true;
  clearTimeout(timeout);
  
  receivedData += data.toString();
  
  // Check if we have complete data
  if (receivedData.includes('\r') || receivedData.length > 50) {
    const cardData = receivedData.trim();
    
    console.log('📨 Data received from card:\n');
    console.log('Raw Data:', cardData);
    console.log('Data Length:', cardData.length, 'bytes');
    console.log('Data Type:', cardData.match(/^[0-9A-Fa-f\s\-:]+$/) ? 'Hex' : 'Text/JSON');
    console.log('\n------- DETAILED ANALYSIS -------\n');
    
    if (cardData.length === 0) {
      console.log('✅ Card is BLANK (No data stored)');
      console.log('\n📊 Status: READY TO USE');
      console.log('Next: Use this card in admin dashboard to approve a pass');
      console.log('      Place card near reader when prompted\n');
      port.close();
      process.exit(0);
    }
    
    // Try to parse as JSON (our new system)
    try {
      const parsed = JSON.parse(cardData);
      console.log('✅ Card has NEW SYSTEM DATA (JSON Format)\n');
      console.log('Parsed Data:');
      console.log(JSON.stringify(parsed, null, 2));
      
      // Show specific fields if they exist
      if (parsed.uniquePassId) {
        console.log('\n📌 Unique Pass ID:', parsed.uniquePassId);
      }
      if (parsed.passType) {
        console.log('📌 Pass Type:', parsed.passType);
      }
      if (parsed.passengerName) {
        console.log('📌 Passenger Name:', parsed.passengerName);
      }
      if (parsed.passValidity) {
        console.log('📌 Pass Validity:', parsed.passValidity);
      }
      
      console.log('\n📊 Status: ACTIVE CARD (Issued Pass)');
      console.log('Card Owner:', parsed.passengerName || parsed.studentName || 'Unknown');
      console.log('\n⚠️  Options:');
      console.log('   1. Replace: Erase & approve new passenger');
      console.log('   2. Keep: This card already has a valid pass\n');
      port.close();
      process.exit(0);
    } catch (e) {
      // Check if it looks like hex data (old VB.NET system)
      if (cardData.match(/^[0-9A-Fa-f\s\-:]+$/)) {
        console.log('⚠️  Card has OLD SYSTEM DATA (Hex Format)\n');
        console.log('Hex Content:', cardData);
        console.log('Hex Length:', cardData.replace(/\s/g, '').length, 'hex chars');
        
        // Try to decode hex
        try {
          const hexString = cardData.replace(/\s/g, '');
          const decoded = Buffer.from(hexString, 'hex').toString('utf-8');
          console.log('Decoded:', decoded);
        } catch (err) {
          console.log('(Could not decode as UTF-8)');
        }
        
        console.log('\n📊 Status: LEGACY CARD');
        console.log('From: Old VB.NET System');
        console.log('\n⚠️  Options:');
        console.log('   1. Erase with NFC Tools app (recommended)');
        console.log('   2. Overwrite: Just approve new passenger');
        console.log('      (New data replaces old data)\n');
        port.close();
        process.exit(0);
      } else {
        // Unknown data
        console.log('❓ Card has UNKNOWN/MIXED DATA\n');
        console.log('Content:', cardData);
        console.log('Length:', cardData.length, 'bytes');
        
        // Try to show as ASCII
        try {
          const charCodes = Array.from(cardData).map((c, i) => {
            const code = c.charCodeAt(0);
            return `0x${code.toString(16).padStart(2, '0')} (${code >= 32 && code <= 126 ? c : '?'})`;
          }).join(' ');
          console.log('\nByte-by-byte:', charCodes);
        } catch (err) {
          // ignore
        }
        
        console.log('\n📊 Status: UNKNOWN DATA');
        console.log('Could not identify card format');
        console.log('\n⚠️  Options:');
        console.log('   1. Erase with NFC Tools app');
        console.log('   2. Overwrite with new pass\n');
        port.close();
        process.exit(0);
      }
    }
  }
});

port.on('error', (err) => {
  clearTimeout(timeout);
  console.error('❌ Serial port error:', err.message);
  console.log('\n💡 Troubleshooting:');
  console.log('   1. Check COM5 exists: Get-PnpDevice -PresentOnly | Where-Object {$_.Class -eq "Ports"}');
  console.log('   2. Check EM-18 reader is powered and connected');
  console.log('   3. Try different COM port (COM3, COM7, etc.)');
  process.exit(1);
});

port.on('close', () => {
  clearTimeout(timeout);
});
