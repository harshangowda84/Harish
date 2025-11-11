"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.readFromRFIDCard = exports.writeToRFIDCard = exports.prepareRFIDPayload = exports.generateUniquePassId = void 0;
const serialport_1 = require("serialport");
/**
 * Generate a unique pass ID
 */
function generateUniquePassId() {
    // Format: BUS-<TIMESTAMP>-<RANDOM>
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `BUS-${timestamp}-${random}`;
}
exports.generateUniquePassId = generateUniquePassId;
/**
 * Prepare RFID card data in JSON format
 */
function prepareRFIDPayload(data) {
    return JSON.stringify({
        id: data.uniquePassId,
        name: data.passengerName,
        type: data.passType,
        valid: data.validity.toISOString(),
        email: data.email,
        phone: data.phoneNumber || "",
        issued: new Date().toISOString()
    });
}
exports.prepareRFIDPayload = prepareRFIDPayload;
/**
 * Read RFID card UID via serial port (EM-18 compatible)
 * EM-18 is READ-ONLY - we read the card's physical UID
 * Returns the UID or null if failed
 */
async function writeToRFIDCard(payload, serialPort = "COM5", simulate = false) {
    if (simulate) {
        // Simulation mode: return a fake UID
        console.log("Simulation mode: Returning fake UID");
        return `SIM-${Date.now().toString(16).toUpperCase()}`;
    }
    try {
        console.log("Reading RFID card UID from EM-18...");
        const port = new serialport_1.SerialPort({ path: serialPort, baudRate: 9600 });
        return new Promise((resolve, reject) => {
            let receivedData = "";
            let dataReceived = false;
            port.on("open", () => {
                console.log("✅ Serial port opened, waiting for card tap...");
                console.log("⏱️  You have 30 seconds to place the card on the reader");
                // EM-18 automatically sends data when card is detected
                // No need to send a command - just wait for data
            });
            port.on("data", (data) => {
                const newData = data.toString();
                console.log(`📨 Received raw data: ${JSON.stringify(newData)}`);
                console.log(`📨 Received hex: ${Buffer.from(newData).toString('hex')}`);
                receivedData += newData;
                dataReceived = true;
                // Check if we have a complete UID (usually ends with \r or is a full line)
                if (receivedData.includes("\r") || receivedData.includes("\n") || receivedData.length >= 12) {
                    const uid = receivedData.trim();
                    console.log(`✅ Got complete UID: ${uid}`);
                    port.close();
                    resolve(uid);
                }
            });
            port.on("error", (err) => {
                console.error("❌ Serial port error:", err);
                port.close();
                reject(err);
            });
            // Timeout after 30 seconds (give user time to place card)
            setTimeout(() => {
                if (!dataReceived) {
                    console.log("⏰ Timeout: No card detected after 30 seconds");
                    console.log("💡 Please check:");
                    console.log("   - EM-18 is powered (LED should be on)");
                    console.log("   - Card is placed within 5cm of reader");
                    console.log("   - Correct COM port (currently using: " + serialPort + ")");
                    port.close();
                    reject(new Error("RFID read timeout - no card detected"));
                }
            }, 30000);
        });
    }
    catch (err) {
        console.error("Error reading RFID card UID:", err);
        return null;
    }
}
exports.writeToRFIDCard = writeToRFIDCard;
/**
 * Read from RFID card via serial port
 */
async function readFromRFIDCard(serialPort = "COM5") {
    try {
        const port = new serialport_1.SerialPort({ path: serialPort, baudRate: 9600 });
        return new Promise((resolve, reject) => {
            let receivedData = "";
            port.on("open", () => {
                console.log("Serial port opened, reading from RFID card...");
            });
            port.on("data", (data) => {
                receivedData += data.toString();
                if (receivedData.includes("\r")) {
                    const uid = receivedData.trim();
                    port.close();
                    resolve(uid);
                }
            });
            port.on("error", (err) => {
                console.error("Serial port error:", err);
                reject(err);
            });
            // Timeout after 5 seconds
            setTimeout(() => {
                port.close();
                reject(new Error("RFID read timeout"));
            }, 5000);
        });
    }
    catch (err) {
        console.error("Error reading from RFID card:", err);
        return null;
    }
}
exports.readFromRFIDCard = readFromRFIDCard;
