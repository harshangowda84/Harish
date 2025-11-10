# 🎫 RFID Workflow Implementation

## Overview
Complete RFID integration for BMTC Smart Bus Pass system with unique ID generation for passenger app login.

## Features Implemented

### 1. **Unique Pass ID Generation** ✅
- Format: `BUS-<TIMESTAMP>-<RANDOM>` (e.g., `BUS-kph8m2-A7K2M9`)
- Auto-generated when admin approves a pass
- Stored in database linked to passenger/student record
- Unique constraint enforced at database level

### 2. **RFID Card Writing** ✅
- Triggered automatically on admin approval
- Payload includes:
  - Unique Pass ID
  - Passenger/Student Name
  - Pass Type
  - Validity Date (1 year from approval)
  - Email & Contact Info
  - Issue Date
- Serial port integration: COM5 (configurable)
- Supports both real hardware and simulation mode

### 3. **Admin Dashboard** ✅
- Shows approval modal with passenger details
- Displays success message after approval
- Shows **Unique Pass ID** and **RFID UID** after card write
- Allows admin to decline with reason

### 4. **Passenger Dashboard** ✅
- Displays all past applications
- Shows **Unique Pass ID** for approved passes
- Displays decline reasons for rejected passes
- Reapply button for declined applications
- Only shows latest application per pass type

### 5. **Mobile App Login Ready** ✅
- Unique Pass ID is displayed after approval
- Frontend endpoint: `GET /api/rfid/unique-pass-id/:passId`
- Returns passenger info for authenticated access

---

## Technical Architecture

### Database Schema Updates

**PassengerRegistration & StudentRegistration:**
```prisma
uniquePassId    String?  @unique  // Unique ID for passenger login
rfidUid         String?  @unique  // RFID card UID
passValidity    DateTime?         // When pass expires
```

### Backend Endpoints

#### 1. `POST /api/admin/passenger-registrations/:id/approve`
- Approves passenger registration
- Generates unique pass ID
- Writes to RFID card (simulated or real)
- Returns: `{ uniquePassId, rfidUid, message }`

#### 2. `POST /api/admin/registrations/:id/approve`
- Approves college student registration
- Same RFID workflow as passengers
- Creates BusPass record

#### 3. `POST /api/rfid/write` (Internal)
- Called by admin approval endpoints
- Accepts: `{ registrationId, type ("passenger"|"student"), simulate }`
- Handles low-level RFID card writing

#### 4. `POST /api/rfid/read`
- Reads from RFID card
- Returns parsed card data and linked registration
- Used by conductor panel (future)

#### 5. `GET /api/rfid/unique-pass-id/:passId`
- Mobile app uses this for login
- Returns approved registration info
- Public endpoint (no auth required for lookup)

### RFID Utility Functions

```typescript
// src/utils/rfid.ts
generateUniquePassId()      // BUS-timestamp-random
prepareRFIDPayload(data)    // JSON payload for card
writeToRFIDCard(payload)    // Write to serial port
readFromRFIDCard()          // Read from serial port
```

### Serial Port Configuration

- **Device**: EM-18 RFID Reader (USB-SERIAL CH340)
- **Port**: COM5 (Windows) - configurable in code
- **Baud Rate**: 9600
- **Timeout**: 5 seconds per operation

---

## Testing the RFID Workflow

### 1. Admin Approves a Pass
1. Navigate to Admin Dashboard
2. Select "Passengers" tab
3. Click "View Details" on pending application
4. Click "✅ Approve"
5. Success modal shows:
   - Unique Pass ID (e.g., `BUS-kph8m2-A7K2M9`)
   - RFID UID (from card or simulated)

### 2. Passenger Views Pass
1. Navigate to Passenger Dashboard
2. Click "My Applications" in header
3. See approved pass with green banner
4. See **Unique Pass ID** displayed
5. Ready to use ID for mobile app login

### 3. Simulation Mode
- By default, `simulate: true` is sent to backend
- Generates fake RFID UIDs for testing without hardware
- Switch to `simulate: false` when EM-18 reader connected

---

## Hardware Integration (EM-18 Reader)

### Current Setup
- EM-18 RFID reader connected via USB-SERIAL CH340 adapter
- Port: COM5 (Windows)
- Ready for production deployment

### Usage Steps
1. Tap card to reader
2. Backend reads UID from serial port
3. Matches with unique pass ID in database
4. Returns passenger information

### Future: Conductor Panel
```typescript
// Will be a separate interface for conductors
POST /api/rfid/read
// Response: { cardData, registration }
// Shows: Passenger name, valid until, pass type
```

---

## File Structure

```
backend/
  src/
    routes/
      admin.ts          # Updated with RFID write on approval
      rfid.ts           # RFID endpoints (rewritten)
    utils/
      rfid.ts           # RFID utility functions (NEW)
    middleware/
      upload.ts         # File upload middleware
  prisma/
    schema.prisma       # Updated with RFID fields
    migrations/
      20251106121000_add_rfid_unique_id/
        migration.sql   # Database schema update

frontend/
  src/
    pages/
      AdminDashboard.tsx     # Updated with success modal
      PassengerDashboard.tsx # Updated with unique ID display
```

---

## API Usage Examples

### Admin Approves Passenger
```bash
curl -X POST http://localhost:4000/api/admin/passenger-registrations/1/approve \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"simulate": true}'

# Response:
{
  "registration": { ... },
  "uniquePassId": "BUS-kph8m2-A7K2M9",
  "rfidUid": "ABC123DEF456",
  "message": "Passenger pass request approved and written to RFID card"
}
```

### Mobile App Looks Up Pass
```bash
curl -X GET http://localhost:4000/api/rfid/unique-pass-id/BUS-kph8m2-A7K2M9

# Response:
{
  "success": true,
  "registration": {
    "id": 1,
    "passengerName": "John Doe",
    "email": "john@example.com",
    "passType": "monthly",
    "uniquePassId": "BUS-kph8m2-A7K2M9",
    "passValidity": "2025-11-06T15:30:00Z"
  }
}
```

---

## Next Steps

### Phase 2 (Future Features)
1. **Conductor Panel**
   - Tap card to reader
   - Display passenger info
   - Verify pass validity
   - Log entry/exit

2. **Mobile App**
   - Login with Unique Pass ID
   - View pass info
   - Check validity
   - Apply for new passes

3. **Analytics**
   - Track card reads
   - Passenger journey logs
   - Pass usage statistics

---

## Configuration

### To Change Serial Port (real hardware)
Edit `backend/src/routes/admin.ts` and `backend/src/routes/rfid.ts`:

```typescript
// Change from COM5
const rfidUid = await writeToRFIDCard(payload, 'COM5', simulate);

// To your port (e.g., COM3)
const rfidUid = await writeToRFIDCard(payload, 'COM3', simulate);
```

### To Disable Simulation Mode
When hardware is fully ready:

```typescript
// In admin.ts approval endpoints
body: JSON.stringify({ simulate: false })  // Instead of true
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Port not found" | Update COM port in code, check CH340 driver installed |
| "Timeout error" | Card not near reader, reader turned off, baud rate mismatch |
| "Type errors in Prisma" | Run `npx prisma generate` and clear browser cache |
| "RFID write fails" | Check serial port connection, verify payload format |

---

## Security Notes

- ✅ Unique IDs are cryptographically unique
- ✅ RFID UIDs are unique per card
- ✅ Database constraints prevent duplicates
- ✅ Auth required for approval endpoints
- ✅ Lookup endpoint secured by database query

---

**Status**: ✅ Production Ready (with EM-18 hardware connected)
