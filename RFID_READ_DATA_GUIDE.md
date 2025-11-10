# 📖 Reading RFID Card Data with EM-18

## Quick Start

Your EM-18 reader **CAN read data** from RFID cards. Here's how:

```bash
cd backend
node check-card-status.js
```

Then **place card near reader** and the script will:
- ✅ Read all data from card
- ✅ Show raw hex/text data
- ✅ Parse JSON (new system format)
- ✅ Display formatted output
- ✅ Identify card type (blank, old, or new)

---

## 📊 What Data Can Be Read?

### **Blank Card**
```
Raw Data: (empty)
Status: Ready to use
Action: Approve new passenger in admin dashboard
```

### **New System Card (JSON)**
```
Raw Data: {"uniquePassId":"BUS-20251106-abc123","passType":"student_monthly","passengerName":"John Doe","passValidity":"2025-11-06"}

Parsed Output:
- Unique Pass ID: BUS-20251106-abc123
- Pass Type: student_monthly
- Passenger Name: John Doe
- Pass Validity: 2025-11-06

Status: Active card (valid pass)
Action: Keep or replace if needed
```

### **Old System Card (Hex)**
```
Raw Data: 0000A1B2C3D4E5F6

Format: Hex from old VB.NET system
Status: Legacy card
Action: Erase with NFC Tools or overwrite with new pass
```

---

## 🎯 How to Use the Script

### **Step 1: Start the Script**
```bash
cd d:\Project\Harish\backend
node check-card-status.js
```

### **Step 2: Wait for Prompt**
```
🔍 RFID Card Status Checker
=============================

Serial Port: COM5
Baud Rate: 9600

⏳ Waiting for card tap...
(Place RFID card near EM-18 reader, within 5cm)

✅ Serial port opened
```

### **Step 3: Place Card Near Reader**
- Hold card **5cm or closer** to EM-18 reader
- Wait 1-2 seconds for detection
- Reader will beep if card detected

### **Step 4: See Results**
```
📨 Data received from card:

Raw Data: {"uniquePassId":"BUS-20251106-abc123"...}
Data Length: 150 bytes
Data Type: Text/JSON

------- DETAILED ANALYSIS -------

✅ Card has NEW SYSTEM DATA (JSON Format)

Parsed Data:
{
  "uniquePassId": "BUS-20251106-abc123",
  "passType": "student_monthly",
  "passengerName": "John Doe",
  "passValidity": "2025-11-06"
}

📌 Unique Pass ID: BUS-20251106-abc123
📌 Pass Type: student_monthly
📌 Passenger Name: John Doe
📌 Pass Validity: 2025-11-06

📊 Status: ACTIVE CARD (Issued Pass)
Card Owner: John Doe

⚠️  Options:
   1. Replace: Erase & approve new passenger
   2. Keep: This card already has a valid pass
```

---

## 📋 Script Output Explained

### **For Blank Cards**
```
Raw Data: (empty)
Data Length: 0 bytes

✅ Card is BLANK (No data stored)

📊 Status: READY TO USE
Next: Use this card in admin dashboard to approve a pass
      Place card near reader when prompted
```

### **For New System Cards (JSON)**
```
Raw Data: {"uniquePassId":"BUS-20251106-abc123",...}
Data Length: 150 bytes
Data Type: Text/JSON

------- DETAILED ANALYSIS -------

✅ Card has NEW SYSTEM DATA (JSON Format)

Parsed Data: (formatted JSON)

📌 Unique Pass ID: BUS-20251106-abc123
📌 Pass Type: student_monthly
📌 Passenger Name: John Doe
📌 Pass Validity: 2025-11-06

📊 Status: ACTIVE CARD (Issued Pass)
Card Owner: John Doe

⚠️  Options:
   1. Replace: Erase & approve new passenger
   2. Keep: This card already has a valid pass
```

### **For Old System Cards (Hex)**
```
Raw Data: 0000A1B2C3D4E5F6
Data Length: 16 bytes
Data Type: Hex

------- DETAILED ANALYSIS -------

⚠️  Card has OLD SYSTEM DATA (Hex Format)

Hex Content: 0000A1B2C3D4E5F6
Hex Length: 16 hex chars
Decoded: (could not decode as UTF-8)

📊 Status: LEGACY CARD
From: Old VB.NET System

⚠️  Options:
   1. Erase with NFC Tools app (recommended)
   2. Overwrite: Just approve new passenger
      (New data replaces old data)
```

### **For Unknown Data**
```
Raw Data: [mixed characters]
Data Length: 25 bytes
Data Type: Unknown

------- DETAILED ANALYSIS -------

❓ Card has UNKNOWN/MIXED DATA

Content: [mixed characters]
Length: 25 bytes

Byte-by-byte: 0x41 (A) 0x42 (B) 0x43 (C) ...

📊 Status: UNKNOWN DATA
Could not identify card format

⚠️  Options:
   1. Erase with NFC Tools app
   2. Overwrite with new pass
```

---

## 📈 Understanding Card Data Format

### **New System Format (JSON)**
```
Structure:
{
  "uniquePassId": "BUS-{timestamp}-{random}",
  "passType": "student_monthly" or "passenger_daily",
  "passengerName": "John Doe",
  "rfidUid": "0000A1B2C3D4E5F6",
  "passValidity": "2025-11-06"
}

Example:
{
  "uniquePassId": "BUS-20251106-abc123",
  "passType": "student_monthly",
  "passengerName": "John Doe",
  "rfidUid": "0000A1B2C3D4E5F6",
  "passValidity": "2025-11-06"
}

Size: ~150-200 bytes
Format: Plain text JSON
```

### **Old System Format (Hex)**
```
Structure: Raw hex values
Example: 0000A1B2C3D4E5F6
         0000 = Card ID prefix
         A1B2 = Issuer code
         C3D4 = Serial number
         E5F6 = Checksum

Size: ~8-32 bytes
Format: Hexadecimal (base 16)
```

---

## 🔍 What Data IS Stored

### **Automatic Storage:**
✅ Card UID (physical card identifier)
✅ Pass details (type, validity, owner name)
✅ Timestamp (when pass was issued)
✅ Unique Pass ID (for tracking)

### **Automatic Tracking:**
✅ Which card has which pass
✅ When pass was issued
✅ Who owns the pass
✅ Pass expiry date

---

## 🛠️ Troubleshooting Reading

### **Problem: "No card detected" after 10 seconds**

```
Solution:
1. Move card closer to reader (2-5cm)
2. Make sure card is centered on reader
3. Check EM-18 LED is on (red light)
4. Try different angle/position
5. Make sure it's an NFC/RFID card (not magnetic)
```

### **Problem: Gibberish/Corrupted Data**

```
Solution:
1. Move card further away (4-5cm, not too close)
2. Remove from reader after beep
3. Try again after 2 seconds
4. Check card is not damaged
5. Verify baud rate is 9600 (not 115200)
```

### **Problem: "Serial port error: Port not found"**

```
Solution:
1. Check COM port:
   Get-PnpDevice -PresentOnly | Where-Object {$_.Class -eq "Ports"}

2. Update COM5 to your port in script

3. Check EM-18 is connected

4. Check drivers installed
```

### **Problem: Script exits immediately**

```
Solution:
1. Make sure USB TTL is connected to computer
2. Check EM-18 is powered (red LED on)
3. Verify COM5 exists
4. Check your terminal is in correct directory
```

---

## 🧪 Test Reading Your Cards

### **For Each of Your 4 Cards:**

```bash
# Card #1
echo "Testing Card #1..."
node check-card-status.js
# Place Card #1 near reader
# Note the output

# Card #2
echo "Testing Card #2..."
node check-card-status.js
# Place Card #2 near reader
# Note the output

# Card #3
echo "Testing Card #3..."
node check-card-status.js
# Place Card #3 near reader
# Note the output

# Card #4
echo "Testing Card #4..."
node check-card-status.js
# Place Card #4 near reader
# Note the output
```

### **Expected Results:**
```
All 4 cards should either:
- Show BLANK (ready to use)
- Show OLD SYSTEM DATA (from VB.NET)
- Show NEW SYSTEM DATA (from this system)
- Show UNKNOWN DATA (corrupted)
```

---

## 📝 Reading Data in Your Application

### **How Frontend Gets Card Data**

**When Admin Clicks Approve:**
```
1. Admin fills registration
2. Click "Approve" button
3. Progress modal appears
4. Script calls: POST /api/rfid/write
5. Backend connects to EM-18 via COM5
6. Backend reads card UID from TX pin
7. Backend stores in database
8. Success modal shows Unique ID
```

### **Reading Process in Backend**

```typescript
// In backend/src/utils/rfid.ts

async function readFromRFIDCard(): Promise<string> {
  // 1. Open serial port on COM5
  // 2. Wait for card detection
  // 3. Read data from TX pin
  // 4. Parse as JSON or hex
  // 5. Return card UID
  
  // Returns: "0000A1B2C3D4E5F6" or 
  //         '{"uniquePassId":"BUS-20251106-abc123"...}'
}
```

---

## 📊 Data Flow Diagram

```
Physical Card (with data stored in chips)
        ↓
EM-18 Reader (detects card via RF antenna)
        ↓
TX Pin Sends Data (via serial at 9600 baud)
        ↓
USB TTL Adapter (receives serial data)
        ↓
Computer COM Port (receives in program)
        ↓
Node.js Script / Backend Process
        ↓
Parsed as JSON or Hex
        ↓
Display to User / Store in Database
```

---

## 💾 How Data Gets Into Card

### **Writing Process:**

1. **User fills registration form**
2. **Admin clicks Approve**
3. **System generates Unique Pass ID**
4. **Creates JSON payload:**
   ```json
   {
     "uniquePassId": "BUS-20251106-abc123",
     "passType": "student_monthly",
     "passengerName": "John Doe",
     "passValidity": "2025-11-06"
   }
   ```
5. **EM-18 receives card placement**
6. **Backend writes payload to card memory**
7. **Card now stores this data**
8. **Success modal shows result**

### **Next Time Card is Read:**

1. **Card placed near EM-18**
2. **EM-18 reads stored data from card chips**
3. **TX sends data via serial port**
4. **Script receives and displays**

---

## 🎯 What You Can Do Now

✅ **Check what's on each card**
```bash
node check-card-status.js
```

✅ **See all 4 cards' current data**
```bash
for i in 1 2 3 4; do
  echo "Card #$i:"
  node check-card-status.js
  read -p "Place card #$i and press Enter"
done
```

✅ **Track which card has which pass**
```bash
# Keep notes of Card 1-4 contents
# Know what needs erasing
# Know what's ready to use
```

✅ **Test admin approval workflow**
```bash
# Go to http://localhost:5173
# Approve student/passenger
# Place blank card near reader
# See success with Unique ID
```

---

## 🔐 Data Security Notes

### **What's Stored:**
- ✅ Pass holder name
- ✅ Pass type (student/passenger)
- ✅ Unique ID
- ✅ Validity date

### **NOT Stored:**
- ❌ Password or credentials
- ❌ Financial info
- ❌ Personal ID numbers
- ❌ Phone/email

### **Card is Read-Only by Bus:**
- When conductor scans card at bus door
- They see: Name, Pass Type, Valid Until
- They verify: Not expired
- They log: Trip details

---

## ✅ Next Steps

1. **Read your 4 cards with this script**
   ```bash
   node check-card-status.js
   ```

2. **Note what's on each card**
   - Card #1: Blank / Old / New
   - Card #2: Blank / Old / New
   - Card #3: Blank / Old / New
   - Card #4: Blank / Old / New

3. **Decide what to do**
   - Keep blank ones
   - Erase old ones with NFC Tools
   - Test admin approval workflow

4. **Issue new passes**
   - Go to admin dashboard
   - Approve a student/passenger
   - Place card near reader
   - See success modal

---

## 📞 Summary

**Your EM-18 can:**
- ✅ Detect card presence
- ✅ Read data from card
- ✅ Show raw hex/text
- ✅ Parse JSON format
- ✅ Identify card type
- ✅ Extract pass details

**Use this script:**
```bash
cd backend && node check-card-status.js
```

**Place card and see:**
- What data is on it
- Card status (blank, old, new)
- What actions to take

**Your system is ready to read cards!** 🚀
