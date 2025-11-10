# 🎫 BMTC Pass Generation Workflow

## Updated Flow

### Step 1: Register Passenger/Student
```
Admin Dashboard → "🎓 College Students" or "🎫 Passengers" tab
→ Fill registration form
→ Click "Register"
```

### Step 2: Approve Registration
```
College/Passenger tab → See pending registrations
→ Click "✅ Approve" button
→ Watch progress modal
```

**Progress Stages:**
- 📋 Loading registration...
- 🔑 Generating unique BMTC pass ID (e.g., BUS-20251106-abc123)
- 📱 Waiting for RFID card tap...
- 📖 Reading card UID from EM-18...
- ✅ Card UID captured!
- 💾 Saving to database...

### Step 3: See Success Modal
```
Shows:
✅ BMTC Pass Generated
🎟️ Unique Pass ID: BUS-20251106-abc123
📌 Card UID: 0000A1B2C3D4E5F6
```

### Step 4: Generate Pass to Card (From Approved Passes Tab)
```
Go to "✅ Approved Passes" tab
→ See all approved registrations with BMTC Pass IDs
→ Click "🎫 Generate Pass" button next to each approved pass
→ Watch progress modal again
→ Place card near EM-18 reader during write
→ Card now has the pass data
```

---

## Key Points

✅ **Two-Step Process:**
1. **Approve** - Validates registration + generates unique BMTC ID
2. **Generate Pass** - Writes pass data to physical RFID card

✅ **Unique BMTC Pass ID:**
- Format: `BUS-{timestamp}-{random}`
- Generated automatically on approval
- Stored in database
- Displayed in success modal

✅ **When to Place Card:**
- For **Approve**: No card needed (just reads when nearby)
- For **Generate Pass**: Place card when progress reaches 65% ("Reading card UID...")

✅ **Database Links:**
- Registration → Unique BMTC Pass ID
- Card UID → BMTC Pass ID
- Track which card has which pass

---

## Testing

```
1. Add Student: "John Doe" (STU001)
2. Click Approve → See BMTC ID generated
3. Click Generate Pass → Place card #1 → Success
4. Add Passenger: "Jane Smith" (passenger_daily)
5. Click Approve → See BMTC ID generated
6. Click Generate Pass → Place card #2 → Success
7. Repeat for cards #3 and #4
```

---

## Success Indicators

✅ Unique BMTC ID shown after approval
✅ Card UID captured from physical card
✅ Progress modal shows correct stages
✅ Generate Pass button in Approved Passes tab
✅ All 4 cards can have passes issued
✅ Data persists in database
