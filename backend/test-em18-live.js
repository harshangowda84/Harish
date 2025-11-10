/**
 * Live EM-18 RFID Reader Test
 * This script continuously listens for RFID cards
 * Press Ctrl+C to stop
 */

const { SerialPort } = require("serialport");

const PORT = "COM5";
const BAUD_RATE = 9600;

console.log("🔍 EM-18 RFID Live Reader Test");
console.log("================================\n");
console.log(`Port: ${PORT}`);
console.log(`Baud Rate: ${BAUD_RATE}`);
console.log("\n⏳ Opening serial port...\n");

const port = new SerialPort({ 
  path: PORT, 
  baudRate: BAUD_RATE,
  autoOpen: true
});

let receivedData = "";

port.on("open", () => {
  console.log("✅ Serial port opened successfully!");
  console.log("📡 Listening for RFID cards...");
  console.log("💡 Place a card near the EM-18 reader");
  console.log("⌨️  Press Ctrl+C to exit\n");
});

port.on("data", (data) => {
  const newData = data.toString();
  
  // Show raw data
  console.log("📨 Raw data received:", JSON.stringify(newData));
  console.log("📨 Hex:", Buffer.from(newData).toString('hex'));
  console.log("📨 Bytes:", Array.from(Buffer.from(newData)).map(b => `0x${b.toString(16).padStart(2, '0')}`).join(' '));
  
  receivedData += newData;
  
  // Check if we have a complete UID
  if (receivedData.includes("\r") || receivedData.includes("\n") || receivedData.length >= 12) {
    const uid = receivedData.trim();
    console.log("\n✅ ================================");
    console.log("✅ CARD DETECTED!");
    console.log("✅ UID:", uid);
    console.log("✅ Length:", uid.length);
    console.log("✅ ================================\n");
    
    // Reset for next card
    receivedData = "";
    
    console.log("📡 Ready for next card...\n");
  }
});

port.on("error", (err) => {
  console.error("\n❌ Serial port error:", err.message);
  console.error("\n💡 Troubleshooting:");
  console.error("   1. Check if EM-18 is connected to USB");
  console.error("   2. Verify COM port (try COM3, COM4, COM7, COM8, COM9, COM10)");
  console.error("   3. Make sure no other program is using the port");
  console.error("   4. Check Device Manager > Ports (COM & LPT)");
  process.exit(1);
});

port.on("close", () => {
  console.log("\n👋 Serial port closed");
  process.exit(0);
});

// Handle Ctrl+C gracefully
process.on("SIGINT", () => {
  console.log("\n\n👋 Closing serial port...");
  port.close();
});

// Keep alive
setInterval(() => {
  // Just keep the process running
}, 1000);
