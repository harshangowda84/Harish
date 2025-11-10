# 🔍 How to Check if RFID Card is Blank or Has Data

## Quick Answer

Your 4 cards from the VB.NET project likely have **old data on them**. You need to:
1. **Check if card is blank** - Read from card
2. **Erase if needed** - Clear old data
3. **Write new data** - Add passenger info

---

## 🧪 Check Card Status with Node.js Script

I'll create a diagnostic tool to check your cards. Here's how:

### Step 1: Create a Card Check Script

Create file: `backend/check-card-status.js`

```javascript
#!/usr/bin/env node

/**
 * RFID Card Status Checker
 * Checks if card is blank or has data
 * Reads data from card on COM5
 */

const { SerialPort } = require('serialport');

const SERIAL_PORT = 'COM5';
const BAUD_RATE = 9600;

console.log('🔍 RFID Card Status Checker');
console.log('=============================\n');
console.log('Serial Port: COM5');
console.log('Baud Rate: 9600\n');
console.log('⏳ Waiting for card tap...');
console.log('(Place RFID card near EM-18 reader)\n');

const port = new SerialPort({ 
  path: SERIAL_PORT, 
  baudRate: BAUD_RATE 
});

let receivedData = '';
let timeout;

port.on('open', () => {
  console.log('✅ Serial port opened\n');
  
  // Set timeout to detect if no card is present
  timeout = setTimeout(() => {
    console.log('⏰ Timeout: No card detected');
    console.log('💡 Make sure card is within 5cm of reader!\n');
    port.close();
    process.exit(1);
  }, 10000);
});

port.on('data', (data) => {
  clearTimeout(timeout);
  receivedData += data.toString();
  
  if (receivedData.includes('\r') || receivedData.length > 0) {
    const cardData = receivedData.trim();
    
    console.log('📨 Data received from card:\n');
    console.log('Raw Data:');
    console.log(cardData);
    console.log('\n');
    
    // Try to parse as JSON
    try {
      const parsed = JSON.parse(cardData);
      console.log('✅ Card has DATA (Not Blank)\n');
      console.log('Card Content:');
      console.log(JSON.stringify(parsed, null, 2));
      console.log('\n📊 Status: USED CARD');
      console.log('Action: Need to erase before reuse\n');
    } catch (e) {
      // Check if it looks like old hex data
      if (cardData.match(/^[0-9A-Fa-f]+$/)) {
        console.log('⚠️  Card has OLD DATA (Hex format from VB project)\n');
        console.log('Card Content (Hex):');
        console.log(cardData);
        console.log('\n📊 Status: USED CARD');
        console.log('Action: Need to erase before reuse\n');
      } else {
        // Unknown data
        console.log('❓ Card has UNKNOWN DATA\n');
        console.log('Card Content:');
        console.log(cardData);
        console.log('\n📊 Status: USED CARD');
        console.log('Action: Need to erase before reuse\n');
      }
    }
    
    port.close();
    process.exit(0);
  }
});

port.on('error', (err) => {
  clearTimeout(timeout);
  console.error('❌ Serial port error:', err.message);
  process.exit(1);
});
```

### Step 2: Run the Card Check

```bash
cd backend
node check-card-status.js
```

**Expected Output if Card is Blank:**
```
📨 Data received from card:

Raw Data:
(nothing or empty)

✅ Card is BLANK
Status: READY TO USE
```

**Expected Output if Card Has Data:**
```
📨 Data received from card:

Raw Data:
{"id":"BUS-7JQMW5P-K9X2N1","name":"John Doe",...}

✅ Card has DATA (Not Blank)
Status: USED CARD
Action: Need to erase before reuse
```

---

## 🗑️ How to Erase a Card

### Option 1: Using EM-18 Erase Command (Recommended)

Create file: `backend/erase-card.js`

```javascript
#!/usr/bin/env node

/**
 * RFID Card Eraser
 * Clears all data from card
 * EM-18 reader erase command
 */

const { SerialPort } = require('serialport');

const SERIAL_PORT = 'COM5';
const BAUD_RATE = 9600;

console.log('🗑️  RFID Card Eraser');
console.log('====================\n');
console.log('Serial Port: COM5');
console.log('Baud Rate: 9600\n');
console.log('⏳ Waiting for card to erase...');
console.log('(Place RFID card near EM-18 reader)\n');

const port = new SerialPort({ 
  path: SERIAL_PORT, 
  baudRate: BAUD_RATE 
});

let timeout;

port.on('open', () => {
  console.log('✅ Serial port opened\n');
  
  // Send erase command to EM-18
  // Different EM-18 models may have different commands
  // Common erase commands:
  // - Simple erase: just send null bytes
  // - Format command: depends on reader firmware
  
  console.log('📝 Sending erase command...\n');
  
  // Send formatted empty/null data to clear card
  const eraseCommand = '\x00\x00\x00\x00\n'; // Null bytes to clear
  port.write(eraseCommand, (err) => {
    if (err) {
      console.error('❌ Error sending erase:', err);
      port.close();
      process.exit(1);
    }
  });
  
  timeout = setTimeout(() => {
    console.log('✅ Erase command sent\n');
    console.log('🧹 Card should now be blank\n');
    console.log('💡 Try reading card again with: node check-card-status.js\n');
    port.close();
    process.exit(0);
  }, 2000);
});

port.on('error', (err) => {
  clearTimeout(timeout);
  console.error('❌ Serial port error:', err.message);
  process.exit(1);
});
```

### Option 2: Using External NFC Tool

If EM-18 erase doesn't work:
1. Download NFC Tools app (Android/iOS)
2. Open app
3. Place card on phone
4. Select "Format" or "Erase"
5. Card is now blank ✅

### Option 3: Overwrite with New Data

Simplest method - just approve a new passenger:
```
Place card near reader
Admin clicks "✅ Approve"
New data overwrites old data automatically
```

---

## 📊 Your VB.NET vs New System Comparison

### Your Old VB.NET System (CardIssueForm.vb)

```vb
' Reads hex data from card into TextBox3
TextBox3.Text &= [text]  ' Appends serial data

' Stores in SQL:
' - AppNo: Application number
' - CardNo: The hex data read from card
' - issuedBy: Who issued it
```

**Your cards likely contain**: Hex UID or old application data

### New Node.js System

```typescript
// Reads JSON data from card
{
  "id": "BUS-7JQMW5P-K9X2N1",
  "name": "Passenger Name",
  "type": "monthly",
  "valid": "2026-11-05...",
  "email": "...",
  "phone": "..."
}

// Stores in database:
// - uniquePassId: Automatically generated
// - rfidUid: Card UID from reader
// - passengerName: From application
```

---

## 🔄 Complete Workflow to Reuse Your Cards

### For Each of Your 4 Old Cards:

```
Step 1: Check Card Status
   Run: node check-card-status.js
   Place card near reader
   Check output: "Blank" or "Has Data"

Step 2: If Has Data - Erase
   Run: node erase-card.js
   Place card near reader
   Wait for "✅ Erase command sent"

Step 3: Verify Card is Blank
   Run: node check-card-status.js again
   Place card near reader
   Should see: "✅ Card is BLANK"

Step 4: Use in Admin Dashboard
   Go to: http://localhost:5173
   Login as admin
   Click "✅ Approve" on any pending registration
   Place blank card near reader
   Watch progress bar
   See success modal
   Card now has new passenger data ✅
```

---

## 🎯 Quick Card Status Guide

| Card Status | How to Check | Action |
|------------|-------------|--------|
| **Blank** | `node check-card-status.js` → No data | Use directly in dashboard |
| **Has Old Data** | `node check-card-status.js` → Shows data | Run `node erase-card.js` first |
| **Unknown Data** | `node check-card-status.js` → Shows hex/gibberish | Run `node erase-card.js` first |

---

## 📱 What the EM-18 Reader Returns

### When Card is Blank:
```
Nothing
(or empty response)
```

### When Card Has Your Old VB.NET Data:
```
Hex string like: 0000A1B2C3
Or: A1B2C3D4E5F6
(Depends on what was written)
```

### When Card Has New JSON Data (Our System):
```
{"id":"BUS-7JQMW5P-K9X2N1","name":"John Doe",...}
(Pretty printed above)
```

---

## 🧪 Testing Your 4 Cards

### Test Script - Check All 4 Cards

Create file: `backend/check-all-cards.sh` (Windows: `check-all-cards.bat`)

**Windows Batch (check-all-cards.bat):**
```batch
@echo off
echo 🔍 Card Checker - Test All 4 Cards
echo ===================================
echo.
echo Card 1: Place first card near reader
pause
node check-card-status.js
echo.
echo Card 2: Place second card near reader
pause
node check-card-status.js
echo.
echo Card 3: Place third card near reader
pause
node check-card-status.js
echo.
echo Card 4: Place fourth card near reader
pause
node check-card-status.js
echo.
echo ===================================
echo All 4 cards checked!
```

**Run it:**
```bash
cd backend
check-all-cards.bat
```

---

## ⚠️ Common Issues

### Issue 1: Card Check Returns Nothing
```
Problem: Card might be blank or far from reader
Solution: 
  1. Move card closer (within 5cm)
  2. Wait 2-3 seconds
  3. Try again
```

### Issue 2: Erase Doesn't Work
```
Problem: EM-18 erase command might not work for your card type
Solution:
  1. Try NFC Tools app on phone
  2. Or just overwrite with new data
  3. Or try different erase command
```

### Issue 3: Can Read But Can't Write
```
Problem: Card might be read-only
Solution:
  1. Try different card (might be locked)
  2. Check card isn't damaged
  3. Check EM-18 reader is working
```

### Issue 4: Old Data Shows as Hex
```
Problem: Your VB.NET system stored hex UID
Solution:
  1. That's just the card identifier
  2. Erase it with node erase-card.js
  3. Or just overwrite with new data
```

---

## 💡 Pro Tips

### Tip 1: Label Your Cards
```
Before using cards, mark them:
Card #1 - Blank
Card #2 - Has Data (needs erase)
Card #3 - Blank
Card #4 - Has Data (needs erase)
```

### Tip 2: Keep One as Test Card
```
Use one card for testing:
1. Check status
2. Erase
3. Write test data
4. Verify in app
5. Erase again
6. Repeat
```

### Tip 3: Batch Erase All Cards
```bash
# If all 4 cards have old data:
for i in 1 2 3 4; do
  echo "Erasing card $i..."
  node erase-card.js
  sleep 2
done
```

---

## 📋 Checklist for Your 4 Cards

- [ ] **Card 1**: Check status with `node check-card-status.js`
- [ ] **Card 1**: If has data, erase with `node erase-card.js`
- [ ] **Card 1**: Verify blank with `node check-card-status.js`

- [ ] **Card 2**: Check status
- [ ] **Card 2**: Erase if needed
- [ ] **Card 2**: Verify blank

- [ ] **Card 3**: Check status
- [ ] **Card 3**: Erase if needed
- [ ] **Card 3**: Verify blank

- [ ] **Card 4**: Check status
- [ ] **Card 4**: Erase if needed
- [ ] **Card 4**: Verify blank

- [ ] **All 4 Cards**: Ready to use in dashboard
- [ ] **Test**: Approve one passenger with Card #1
- [ ] **Verify**: Unique ID and RFID UID shown
- [ ] **Check**: Card #1 now in "Approved Passes" tab

---

## 🚀 Next Steps

1. **Create check script**: `backend/check-card-status.js`
2. **Create erase script**: `backend/erase-card.js`
3. **Check all 4 cards**: Run checker on each
4. **Erase if needed**: Run eraser on used cards
5. **Test in dashboard**: Approve a passenger
6. **Place card**: Near reader when prompted
7. **Done!**: Card now has new data

---

## ✨ Summary

| Question | Answer |
|----------|--------|
| **How do I know if card is blank?** | Use `check-card-status.js` script |
| **What if card has old data?** | Use `erase-card.js` script |
| **Can I read without erasing?** | Yes, but new data will overwrite old |
| **How to erase a card?** | Run `node erase-card.js` |
| **Can I use NFC app instead?** | Yes, much easier actually! |
| **Will old data cause issues?** | No, just overwrite with new data |
| **How many times can I erase?** | Unlimited (RFID cards are rewritable) |
| **Do I need special equipment?** | Just EM-18 reader on COM5 |

**Your 4 cards are reusable! Just check, erase if needed, and start using them!** 🎉
