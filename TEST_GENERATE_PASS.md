# 🧪 Quick Test Guide - Generate Pass Button

## Current Status ✅
- Backend: Running on http://localhost:4000
- Frontend: Running on http://localhost:5173
- "🎫 Generate Pass" button: Added to Approved Passes tab
- Progress stages: Updated to show "📖 Reading card UID from EM-18..."

---

## Step-by-Step Test

### 1. Open Admin Dashboard
```
URL: http://localhost:5173
Login: admin@example.com / password
```

### 2. Register a New Passenger
```
Tab: "🎫 Passengers"
Fill form:
  - Name: "Test Passenger"
  - Email: test@example.com
  - Pass Type: "Daily"
Click: "Register"
```

### 3. Approve Registration
```
See new entry in "🎫 Passengers" tab
Click: "✅ Approve" button
Watch: Progress modal with 6 stages (green gradient)
Wait: For completion
```

**Progress Stages (Approve):**
- 📋 Loading registration...
- 🔑 Generating unique BMTC pass ID...
- 📱 Waiting for RFID card tap...
- 📖 Reading card UID from EM-18...
- ✅ Card UID captured!
- 💾 Saving to database...

### 4. Entry Moves to Approved Passes
```
After approval completes:
Tab: "✅ Approved Passes"
See approved entry with:
  - Passenger name
  - Pass ID (BUS-xxxxxxx-xxxxx)
  - New button: "🎫 Generate Pass"
```

### 5. Click Generate Pass (NEW!)
```
Click: "🎫 Generate Pass" button
Watch: Progress modal (amber gradient) - same 6 stages
When reaches 65%: "📖 Reading card UID from EM-18..."
  → Place blank RFID card near EM-18 reader
Wait: For progress to reach 100%
```

### 6. See Success Modal
```
Shows:
✅ Pass generated successfully!
🎟️ Unique Pass ID: BUS-20251106-abc123
📌 RFID Card UID: 0000A1B2C3D4E5F6
```

---

## Backend Logs (What You'll See)

### No Card Placed (Expected)
```
Reading RFID card UID from EM-18...
✅ Serial port opened, waiting for card tap...
⏰ Timeout: No card detected
Error: RFID read timeout - no card detected
```

### Card Placed Successfully
```
Reading RFID card UID from EM-18...
✅ Serial port opened, waiting for card tap...
📌 Received card data: 0000A1B2C3D4E5F6
✅ Card UID read successfully!
Passenger registration saved with RFID UID
```

---

## Verify Data Stored

```bash
# Check card status after generating pass
cd backend
node check-card-status.js

# Place the same card near reader
# Output should show:
# NEW SYSTEM DATA
# Unique Pass ID: BUS-20251106-abc123
# Passenger Name: Test Passenger
# Pass Type: Daily
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Button not showing | Refresh browser (Ctrl+R) |
| No progress modal | Check browser console for errors |
| Timeout error | Make sure card is placed during 65% stage |
| "Card not detected" | Check EM-18 wiring (GND, VCC, TX to COM5) |
| "Port not available" | Verify COM5 is correct in `rfid.ts` |

---

## Test Matrix

Test all scenarios:

```
Test 1: Student Registration + Generate Pass
  ✓ Register student
  ✓ Approve (gets BMTC ID)
  ✓ Generate Pass (read card #1)
  ✓ Success modal shows ID

Test 2: Passenger Registration + Generate Pass
  ✓ Register passenger
  ✓ Approve (gets BMTC ID)
  ✓ Generate Pass (read card #2)
  ✓ Success modal shows ID

Test 3: Multiple Cards
  ✓ Card #1: Student pass
  ✓ Card #2: Passenger daily
  ✓ Card #3: Student pass
  ✓ Card #4: Passenger monthly
  ✓ Each has unique BMTC ID + Card UID linked

Test 4: Verify Database
  ✓ check-card-status.js shows data for each card
  ✓ Each card UID maps to unique BMTC ID
  ✓ Passenger details visible in stored data
```

---

## Expected Results ✅

After successful test:

1. ✅ New "🎫 Generate Pass" button visible in Approved Passes tab
2. ✅ Button shows progress stages: 0% → 100% (amber gradient)
3. ✅ When clicked, waits for card placement at 65%
4. ✅ Reads card UID when card is placed
5. ✅ Success modal shows BMTC ID + Card UID
6. ✅ Database stores both IDs linked to passenger
7. ✅ All 4 cards can be issued unique passes
8. ✅ check-card-status.js shows pass data for each card

---

## Next: Conductor Panel

After this test passes, we'll create conductor panel for:
- Reading BMTC ID from card at bus door
- Validating pass (check expiry, type)
- Recording boarding transaction
