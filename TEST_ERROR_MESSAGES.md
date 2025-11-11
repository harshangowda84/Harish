# Error Message Testing Guide

## New Feature: Helpful Error Messages

The admin dashboard now shows **specific, actionable error messages** instead of generic "Failed" errors.

### Test Scenarios

#### ✅ Scenario 1: Card Not Placed (RFID Timeout)
**Expected Error Message:**
```
❌ RFID card not detected! Please place the card near EM-18 reader...
```

**Steps:**
1. Go to **Admin Dashboard** → **Passengers** tab
2. Find a pending passenger registration
3. Click **✅ Approve**
4. Progress bar appears with stages
5. **DO NOT place card** when prompted
6. Wait for 30 seconds
7. **Result:** Beautiful error modal shows specific message

---

#### ✅ Scenario 2: Port Conflict (Prisma Studio Open)
**Expected Error Message:**
```
❌ COM5 port not available. Close Prisma Studio or other processes using COM5...
```

**Steps:**
1. Open **Prisma Studio** in another window (port 5555)
2. Go to **Admin Dashboard** → **Passengers** tab
3. Click **✅ Approve** on any pending registration
4. **DO NOT place card**
5. **Result:** Error modal shows port conflict message

---

#### ✅ Scenario 3: Success Case (Card Placed)
**Expected Result:**
```
✅ Pass Approved!
RFID card data written successfully

Unique Pass ID: [12-char ID]
RFID UID: [12-char hex UID]
```

**Steps:**
1. Ensure EM-18 is connected to COM5
2. Go to **Admin Dashboard** → **Passengers** tab
3. Click **✅ Approve**
4. **Place RFID card** within 5-8cm of reader
5. You should see:
   - Blue light on EM-18
   - Beep sound
   - Progress bar reaches 100%
6. **Result:** Success modal shows BMTC ID and card UID

---

## Error Modal UI

### What's New:
- ❌ Beautiful error modal with red gradient header
- 📋 Clear error message from backend
- 💡 **Troubleshooting section** with helpful tips:
  - Ensure EM-18 reader is connected to COM5
  - Place card within 5-8cm of reader
  - Make sure Prisma Studio is closed
  - Check blue light and beep sound
- 🔄 "Try Again" button to retry the operation

### Technical Details Included:
- Backend returns both `error` (user message) and `details` (technical info)
- Frontend displays user message prominently
- Technical details shown in parentheses
- Network errors also handled gracefully

---

## Backend Error Detection Logic

The backend now detects specific error types:

```typescript
if (errorMsg.includes('RFID read timeout'))
  → "Please place the card near EM-18..."

if (errorMsg.includes('Port is not open') || errorMsg.includes('ENOENT'))
  → "Close Prisma Studio or other processes using COM5..."

if (errorMsg.includes('no card detected'))
  → "No card detected within 30 seconds..."

// Generic fallback
→ "Failed to approve [Student/Passenger] registration"
```

---

## Testing Checklist

- [ ] Test without placing card → See timeout message
- [ ] Test with Prisma Studio open → See port conflict
- [ ] Test with valid card → See success modal
- [ ] Check troubleshooting section appears
- [ ] Verify "Try Again" button works
- [ ] Test on both Student and Passenger tabs
- [ ] Verify error details are helpful
- [ ] Confirm UI is responsive on mobile

---

## Login Credentials for Testing

### Admin
- Email: `admin@example.com`
- Password: `admin123`

### Passengers (to test their flows)
- Email: `passenger@example.com`
- Password: `pass123`

---

## All 4 RFID Cards Available

| Card # | UID | Status |
|--------|-----|--------|
| Card #1 | `0B0026E03BF6` | ✅ Ready |
| Card #2 | `0B0026E8FE3B` | ✅ Has pass (bnvhn) |
| Card #3 | `0B0026CBC721` | ✅ Ready |
| Card #4 | `0B0026E29659` | ✅ Ready |

---

## Quick Commands

**Start all servers:**
```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd frontend
npm run dev

# Terminal 3: Prisma Studio (optional)
cd backend
npx prisma studio
```

**Check hardware:**
```bash
cd backend
node test-em18-live.js
```

**View database:**
```bash
cd backend
npx prisma studio
```
