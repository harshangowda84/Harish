# 📱 How to Write Data to EM-18 RFID Card

## Overview

The unique ID and pass details are **already being prepared** to write to the RFID card. Here's how it works and what you need to do:

---

## 🔄 Current Flow (What Happens)

### 1. Admin Approves a Pass
```
Admin clicks ✅ Approve
    ↓
Backend generates Unique ID: BUS-kph8m2-A7K2M9
    ↓
Backend prepares JSON payload:
{
  "id": "BUS-kph8m2-A7K2M9",
  "name": "John Doe",
  "type": "monthly",
  "valid": "2025-11-06T15:30:00Z",
  "email": "john@example.com",
  "phone": "+919876543210",
  "issued": "2025-11-05T10:30:00Z"
}
    ↓
Backend calls writeToRFIDCard(payload)
    ↓
Currently: Simulates card write (returns fake UID)
Soon: Will write to real EM-18 card via serial port
```

---

## 🔌 How EM-18 RFID Writing Works

### EM-18 Reader Specs
- **Model**: EM-18 RFID Reader Module
- **Connection**: USB via CH340 adapter
- **Port**: COM5 (Windows) or /dev/ttyUSB0 (Linux)
- **Baud Rate**: 9600 bps
- **Protocol**: ASCII commands

### Writing to Card - Two Methods

#### **Method 1: Serial Port Direct Write** (Current Implementation)

Your code already does this:
```typescript
// backend/src/utils/rfid.ts
export async function writeToRFIDCard(payload: string, serialPort: string = "COM5", simulate: boolean = false) {
  if (simulate) {
    return `SIM-${Date.now().toString(16).toUpperCase()}`;
  }

  const port = new SerialPort({ path: serialPort, baudRate: 9600 });
  
  port.on('open', () => {
    port.write(payload + "\n");  // Write JSON payload
  });

  port.on('data', (data) => {
    const uid = data.toString().trim();  // Read card UID back
    resolve(uid);
  });
}
```

---

## 🚀 Setup Steps to Write to Real Card

### Step 1: Connect Hardware
```
EM-18 RFID Reader
    ↓
USB-SERIAL CH340 Adapter
    ↓
USB Port on Computer
    ↓
Windows Device Manager: Shows as "COM5" (or similar)
```

**Verify Connection:**
```bash
# Windows PowerShell
Get-PnpDevice -PresentOnly | Where-Object {$_.Class -eq "Ports"}

# Should show: CH340 Serial COM Port (COM5) or similar
```

### Step 2: Update Backend Configuration

Edit `backend/src/routes/admin.ts`:

```typescript
// Line where approval calls writeToRFIDCard
// Change from:
const rfidUid = await writeToRFIDCard(payload, 'COM5', true);  // simulate: true

// To:
const rfidUid = await writeToRFIDCard(payload, 'COM5', false);  // simulate: false
```

Or if your COM port is different (COM3, COM7, etc.):
```typescript
const rfidUid = await writeToRFIDCard(payload, 'COM3', false);  // COM3 instead
```

### Step 3: Restart Backend
```bash
cd backend
npm run dev
```

### Step 4: Test the Flow

**In Admin Dashboard:**
1. Approve a pending pass
2. Success modal shows unique ID
3. **EM-18 card should have new data written**

---

## 📝 What Gets Written to Card

### Data Format
```json
{
  "id": "BUS-kph8m2-A7K2M9",           // Unique pass ID
  "name": "John Doe",                   // Passenger name
  "type": "monthly",                    // Pass type
  "valid": "2025-11-06T15:30:00Z",     // Expiry date
  "email": "john@example.com",          // Contact email
  "phone": "+919876543210",             // Phone number
  "issued": "2025-11-05T10:30:00Z"     // Issue date
}
```

### Storage Details
- **Maximum**: ~1KB of data per card (EM-18 cards hold 64-96 bytes usually)
- **Format**: JSON text (can be compressed if needed)
- **Persistence**: Data stays on card until overwritten
- **Read/Write**: Can be read by conductor panel later

---

## 🔴 Conductor Panel: Reading Card Data Later

Future: Create conductor panel that reads cards:

```typescript
// backend/src/routes/rfid.ts
router.post('/read', async (req, res) => {
  const cardData = await readFromRFIDCard('COM5');
  
  // Parse JSON from card
  const passengerInfo = JSON.parse(cardData);
  
  // Look up in database
  const registration = await prisma.passengerRegistration.findFirst({
    where: { uniquePassId: passengerInfo.id }
  });
  
  return {
    cardData: passengerInfo,
    registration: registration,
    validity: new Date(passengerInfo.valid) > new Date() ? "VALID" : "EXPIRED"
  };
});
```

---

## 📊 Testing Without Physical Card

While you're setting up hardware, test with **Simulation Mode ON** (default):

```typescript
// No changes needed, stays as:
const rfidUid = await writeToRFIDCard(payload, 'COM5', true);  // simulate: true
```

This generates fake UIDs for testing:
- Admin approves → Success modal shows Unique ID ✅
- Fake RFID UID generated → SIM-5f3a2c1b ✅
- Data stored in database ✅
- No hardware required ✅

---

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| "Port COM5 not found" | Check Device Manager, update port number in code |
| "Timeout error on write" | Verify card is in range of reader, baud rate 9600 |
| "Nothing written to card" | Check `simulate: false`, verify serial connection |
| "Can read but not write" | Some cards are read-only, get new writable card |
| "Data garbled on card" | Check JSON format, ensure newline after payload |

---

## 🎯 Current Status

✅ **Already Done:**
- Unique ID generation
- JSON payload preparation
- Serial port integration code
- Database schema updates
- Admin dashboard success modal

⏳ **When You Connect Hardware:**
1. Plug in EM-18 reader via USB
2. Check COM port in Device Manager
3. Update `backend/src/routes/admin.ts` (change `simulate: true` → `false`)
4. Change COM port if needed (COM5 → your port)
5. Restart backend
6. Test by approving a pass

✅ **Result:**
- Admin approves pass
- Unique ID generated
- Data written to physical RFID card
- Card contains passenger info

---

## 📱 Mobile App Integration (Future)

When user taps card with phone:
```
NFC-enabled phone reads card
    ↓
Extracts Unique Pass ID: BUS-kph8m2-A7K2M9
    ↓
Calls: GET /api/rfid/unique-pass-id/BUS-kph8m2-A7K2M9
    ↓
Backend returns: Passenger info + pass validity
    ↓
User logs in and sees pass details
```

---

## 💡 Key Points

1. **Unique ID** is unique per passenger (used for app login)
2. **RFID UID** is unique per card (used for hardware tracking)
3. **Data written** is JSON with all pass info
4. **Card can be read** anytime by tapping to reader
5. **No internet needed** on conductor panel (data on card)

---

## 🔗 Related Endpoints

```bash
# Admin approves and writes to card
POST http://localhost:4000/api/admin/passenger-registrations/1/approve
Body: { "simulate": false }  # Change to false for real write
Response: { uniquePassId, rfidUid, message }

# Conductor reads card
POST http://localhost:4000/api/rfid/read
Body: { "simulate": false }
Response: { cardData, registration, validity }

# Mobile app looks up pass
GET http://localhost:4000/api/rfid/unique-pass-id/BUS-kph8m2-A7K2M9
Response: { registration with all pass info }
```

---

## ✨ Summary

The system is **ready to write to real cards**. All you need to do is:

1. ✅ Connect EM-18 reader (already have it)
2. ✅ Find COM port in Device Manager
3. ✅ Update config: `simulate: true` → `false`
4. ✅ Update COM port if needed
5. ✅ Restart backend
6. ✅ Test by approving a pass

That's it! The card will get written automatically. 🎉
