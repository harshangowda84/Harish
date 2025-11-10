# ⚡ Quick Card Management Guide

## 3-Step Process for Your 4 Cards

### Step 1: Check Card Status
```bash
cd backend
node check-card-status.js
```
**Then**: Place card near EM-18 reader
**Result**: Shows if card is blank or has data

### Step 2: Erase If Needed
```bash
node erase-card.js
```
**Then**: Place card near EM-18 reader
**Result**: Card is now blank

### Step 3: Verify It's Blank
```bash
node check-card-status.js
```
**Then**: Place same card near reader
**Result**: Should show "✅ Card is BLANK"

---

## Your 4 Cards Workflow

### Card #1
```
1. node check-card-status.js → Place card near reader → Check status
   (If shows data, do step 2)
2. node erase-card.js → Place card near reader → Erase
3. node check-card-status.js → Place card near reader → Verify blank ✅
   (If still has data, use NFC Tools app)
```

### Card #2
```
(Repeat same steps as Card #1)
```

### Card #3
```
(Repeat same steps as Card #1)
```

### Card #4
```
(Repeat same steps as Card #1)
```

---

## What Each Script Does

### `check-card-status.js`
```
✅ Opens serial port on COM5
✅ Waits for card tap
✅ Reads data from card
✅ Tells you: Blank OR Has Data

Output:
- "Card is BLANK" → Use directly
- "Card has DATA" → Run erase script
```

### `erase-card.js`
```
✅ Opens serial port on COM5
✅ Sends erase command to card
✅ Clears all data
✅ Makes card blank

Output:
- "Erase command completed" → Done!
- Then verify with check script
```

---

## Expected Terminal Output

### If Card is BLANK:
```
🔍 RFID Card Status Checker
=============================

Serial Port: COM5
Baud Rate: 9600

⏳ Waiting for card tap...
(Place RFID card near EM-18 reader, within 5cm)

✅ Serial port opened

📨 Data received from card:

✅ Card is BLANK (No data)

📊 Status: READY TO USE
Next: Use this card in admin dashboard to approve a pass
```

### If Card HAS DATA:
```
🔍 RFID Card Status Checker
=============================

Serial Port: COM5
Baud Rate: 9600

⏳ Waiting for card tap...

✅ Serial port opened

📨 Data received from card:

Card Content (Hex - Old Format):
0000A1B2C3D4E5F6

⚠️  Card has OLD DATA from previous system

📊 Status: USED CARD
Action: Need to erase before reuse
       Run: node erase-card.js
```

### Erase Successful:
```
🗑️  RFID Card Eraser
====================

Serial Port: COM5
Baud Rate: 9600

⏳ Waiting for card to erase...

✅ Serial port opened

📝 Sending erase command...

Sending empty data to card...
✅ Command sent

✅ Erase command completed

🧹 Card should now be blank/erased

💡 Verify with: node check-card-status.js
```

---

## Troubleshooting

### Problem: Script says "No card detected"
```
Solution:
1. Move card closer to reader (within 5cm)
2. Wait 2-3 seconds
3. Make sure card is centered on reader
4. Check EM-18 reader is powered on
5. Try again
```

### Problem: "Serial port error: Port not found"
```
Solution:
1. Check EM-18 is connected on COM5:
   Get-PnpDevice -PresentOnly | Where-Object {$_.Class -eq "Ports"}

2. If on different port (COM3, COM7, etc.):
   Edit script and change: SERIAL_PORT = 'COM5' to your port

3. Restart EM-18 reader
4. Try again
```

### Problem: Erase doesn't work
```
Solution 1: Try again
   node erase-card.js

Solution 2: Use NFC Tools app
   - Android: Download "NFC Tools" from Play Store
   - iOS: Download "NFC Tools" from App Store
   - Open app
   - Place card on phone NFC reader
   - Select "Format" or "Clear"
   - Card is now blank

Solution 3: Just overwrite with new data
   - Go to dashboard
   - Approve a new passenger
   - Place card near reader
   - New data overwrites old data
```

### Problem: Card shows old VB data
```
This is NORMAL! Your cards likely have:
- Old application numbers
- Old hex UIDs
- Previous passenger info

Solution:
1. Run: node erase-card.js
2. Or: Use NFC Tools to erase
3. Or: Just approve new passenger to overwrite

All options work fine!
```

---

## Usage Examples

### Example 1: Check All 4 Cards (One by One)
```bash
cd backend

echo "Checking Card #1..."
node check-card-status.js
# Place Card #1, check output

echo "Checking Card #2..."
node check-card-status.js
# Place Card #2, check output

echo "Checking Card #3..."
node check-card-status.js
# Place Card #3, check output

echo "Checking Card #4..."
node check-card-status.js
# Place Card #4, check output
```

### Example 2: Erase a Used Card
```bash
cd backend

echo "This card has old data"
echo "Running erase..."
node erase-card.js
# Place card, wait for completion

echo "Verifying..."
node check-card-status.js
# Place same card, confirm it's blank
```

### Example 3: Prepare All 4 Cards for Use
```bash
cd backend

for cardNum in 1 2 3 4; do
  echo "Processing Card #$cardNum..."
  
  echo "Step 1: Checking status..."
  node check-card-status.js
  # Place card
  # Wait for result
  
  if [ result shows data ]; then
    echo "Step 2: Erasing..."
    node erase-card.js
    # Place card
    # Wait for completion
  fi
  
  echo "Card #$cardNum ready!"
  echo ""
done

echo "All 4 cards ready to use!"
```

---

## Using Cards in Admin Dashboard

Once cards are blank and ready:

```
1. Go to: http://localhost:5173
2. Login: admin@example.com / password
3. Go to "🎓 College Students" or "🎫 Passengers" tab
4. Click "✅ Approve" on any pending registration
5. Progress modal appears
6. Place blank card near EM-18 reader
7. Wait for progress to complete
8. Success modal shows: Unique ID + RFID UID
9. Click "✅ Got it!"
10. Card now has new passenger data ✅
```

---

## Card Status Reference

| Status | How to Check | Action |
|--------|-------------|--------|
| **BLANK** | `check-card-status.js` → "Card is BLANK" | Use in dashboard |
| **OLD DATA** | `check-card-status.js` → Shows data | Run `erase-card.js` |
| **UNKNOWN** | `check-card-status.js` → Gibberish data | Run `erase-card.js` |
| **ERASED** | `check-card-status.js` → "Card is BLANK" | Ready to use |
| **HAS NEW DATA** | `check-card-status.js` → JSON with passenger | Already issued |

---

## File Locations

```
backend/
├── check-card-status.js    ← Run this to check card status
├── erase-card.js           ← Run this to erase a card
└── other files...
```

---

## Quick Commands

```bash
# Check card status
cd backend && node check-card-status.js

# Erase card
cd backend && node erase-card.js

# Both in sequence
cd backend && node check-card-status.js && node erase-card.js && node check-card-status.js
```

---

## Common Questions

**Q: My card still has data after running erase?**
A: Try NFC Tools app on phone instead - it's more reliable

**Q: Can I reuse the same card for multiple passengers?**
A: Yes, but each time you approve a new passenger, old data is overwritten

**Q: What if I mix up which card is blank?**
A: Run check script on each - it tells you immediately

**Q: Do I need to do anything special for each card?**
A: No, just repeat the process: check → erase (if needed) → done

**Q: Can I damage the card by erasing?**
A: No, RFID cards are designed to be rewritable indefinitely

---

## Summary

Your 4 cards from the VB.NET project:
- ✅ Can be reused
- ✅ Can be checked with `check-card-status.js`
- ✅ Can be erased with `erase-card.js`
- ✅ Ready to issue new passes with the new system

**Just run the scripts and follow the prompts!** 🚀
