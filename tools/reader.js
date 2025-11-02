#!/usr/bin/env node

/**
 * RFID Reader Prototype for BMTC Smart Bus Pass
 * 
 * This script simulates or reads from an EM-18 RFID reader connected via USB-TTL.
 * In simulation mode, it generates random UIDs.
 * In real mode, it reads from a serial port and posts UIDs to the backend.
 * 
 * Usage:
 *   node reader.js --simulate        (use simulated UIDs)
 *   node reader.js --port /dev/ttyUSB0  (read from real EM-18, macOS/Linux)
 *   node reader.js --port COM3       (read from real EM-18, Windows)
 * 
 * Wiring (EM-18 to USB-TTL Adapter):
 *   EM-18 GND -----> GND
 *   EM-18 5V  -----> 5V
 *   EM-18 TX  -----> RX (USB-TTL RX)
 */

const readline = require("readline");

const SERVER_URL = process.env.SERVER_URL || "http://localhost:4000";
const API_ENDPOINT = `${SERVER_URL}/api/rfid/scan`;
const SIMULATE = process.argv.includes("--simulate");
const PORT = process.argv.includes("--port")
  ? process.argv[process.argv.indexOf("--port") + 1]
  : null;

async function postUID(uid) {
  try {
    const response = await fetch(API_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rfidUid: uid }),
    });
    const json = await response.json();
    console.log(`✓ UID posted: ${uid}`, json);
  } catch (err) {
    console.error(`✗ Failed to post UID ${uid}:`, err.message);
  }
}

function generateUID() {
  // Generate a random 10-char hex UID (EM-18 format)
  return "AABBCCDDEE".split("")
    .map(() => Math.floor(Math.random() * 16).toString(16).toUpperCase())
    .join("");
}

async function simulateMode() {
  console.log("🔄 RFID Reader (Simulation Mode)");
  console.log(`   Backend: ${API_ENDPOINT}`);
  console.log("   Generating random UIDs every 3 seconds...\n");

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  setInterval(async () => {
    const uid = generateUID();
    console.log(`📡 Generated UID: ${uid}`);
    await postUID(uid);
  }, 3000);

  rl.on("line", (line) => {
    if (line.toLowerCase() === "exit" || line.toLowerCase() === "quit") {
      console.log("Goodbye!");
      process.exit(0);
    }
  });
}

async function serialMode(portName) {
  try {
    const SerialPort = require("serialport").SerialPort;
    console.log(`🔄 RFID Reader (Serial Mode on ${portName})`);
    console.log(`   Backend: ${API_ENDPOINT}`);
    console.log("   Reading from EM-18...\n");

    const port = new SerialPort({ path: portName, baudRate: 9600 });

    port.on("open", () => {
      console.log("✓ Serial port opened");
    });

    port.on("data", async (data) => {
      const uid = data.toString().trim();
      if (uid.length === 10) {
        console.log(`📡 Read UID: ${uid}`);
        await postUID(uid);
      }
    });

    port.on("error", (err) => {
      console.error("✗ Serial port error:", err.message);
    });

    port.on("close", () => {
      console.log("Serial port closed");
    });

    process.on("SIGINT", () => {
      port.close(() => {
        console.log("Goodbye!");
        process.exit(0);
      });
    });
  } catch (err) {
    console.error("✗ Serial mode requires 'serialport' package");
    console.error("   Install with: npm install serialport");
    process.exit(1);
  }
}

async function main() {
  if (SIMULATE) {
    await simulateMode();
  } else if (PORT) {
    await serialMode(PORT);
  } else {
    console.log("RFID Reader - BMTC Smart Bus Pass\n");
    console.log("Usage:");
    console.log("  --simulate         Simulate random UIDs (no hardware needed)");
    console.log("  --port <PORT>      Read from real EM-18 on serial port");
    console.log("                     Examples: /dev/ttyUSB0 (Linux), COM3 (Windows)\n");
    console.log("Environment:");
    console.log("  SERVER_URL (default: http://localhost:4000)");
    console.log("\nExample:");
    console.log("  node reader.js --simulate");
    console.log("  node reader.js --port /dev/ttyUSB0");
    process.exit(0);
  }
}

main().catch(console.error);
