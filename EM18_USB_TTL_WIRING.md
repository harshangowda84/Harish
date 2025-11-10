# EM-18 RFID Reader to USB TTL Wiring Guide

## 📌 Quick Reference

| EM-18 Pin | Color | USB TTL Pin | Function |
|-----------|-------|-------------|----------|
| **GND** | Black | GND | Ground |
| **VCC** | Red | +5V | Power Supply |
| **TX** | Yellow | RXD | RFID Data Out |
| **(NO RX)** | N/A | N/A | EM-18 is TX-only! |

---

## 🔌 EM-18 RFID Reader Pinout

**Your EM-18 has 9 pins (NOT the standard 4-pin version):**

```
Looking at EM-18 from the front (label side up):

Left Side:          Right Side:
VCC   [1]           DAT0  [6]
GND   [2]           DAT1  [7]
BUZZ  [3]           TX    [8]
NC    [4]           SEL   [9]
NC    [5]
```

### Pin Details:
- **Pin 1: VCC** (Power) - Red wire → USB TTL +5V
- **Pin 2: GND** (Ground) - Black wire → USB TTL GND
- **Pin 3: BUZZ** (Buzzer) - Optional (beep on card detect)
- **Pin 4: NC** (Not Connected) - Leave empty
- **Pin 5: NC** (Not Connected) - Leave empty
- **Pin 6: DAT0** (Data Pin 0) - Parallel data (not used in serial mode)
- **Pin 7: DAT1** (Data Pin 1) - Parallel data (not used in serial mode)
- **Pin 8: TX** (Transmit) - Yellow wire → USB TTL RXD
- **Pin 9: SEL** (Select) - Mode select pin (see below)

### ⚠️ Important: EM-18 Does NOT Have RX Pin!
```
This EM-18 is a READ-ONLY device!
- Can only SEND data (TX)
- Cannot RECEIVE commands (NO RX)
- Cannot erase cards via commands
- Cannot be configured via serial
```

---

## 🔗 USB TTL Adapter Pinout

### Common USB TTL Adapters (CH340, PL2303, FT232RL):

```
┌─────────────────────────┐
│   USB TTL Adapter       │
├─────────────────────────┤
│ ⬜ GND  (Black)    [1]  │
│ ⬜ CTS  (Gray)     [2]  │
│ ⬜ VCC  (Red)      [3]  │
│ ⬜ TXD  (Orange)   [4]  │
│ ⬜ RXD  (Yellow)   [5]  │
│ ⬜ DTR  (Green)    [6]  │
│                         │
└─────────────────────────┘
```

---

## 🔧 Wiring Connection

### **Method 1: Direct Wiring (Recommended - 3 wires only)**

```
EM-18 RFID Reader          USB TTL Adapter
════════════════           ═══════════════

Pin 1 (VCC) ────────────── +5V  [Red]
Pin 2 (GND) ────────────── GND  [Black]
Pin 8 (TX)  ────────────── RXD  [Yellow]
(NO RX pin on EM-18!)
```

### **Wiring Diagram:**

```
                    EM-18 RFID Reader
                    ┌──────────────┐
                    │              │
         VCC  ●─────┤ 1  VCC       │
                    │   2  GND  ●──┼────── GND (Black)
         GND  ●─────┤ 3  BUZZ      │
                    │   4  NC      │
         NC         │   5  NC  ●─┐ │
                    │   6  DAT0   │ │
         DAT0 ●─────┤   7  DAT1   │ │
                    │   8  TX  ────┼─●────── TX (Yellow)
         DAT1 ●─────┤   9  SEL   │ │
                    │              │
         TX   ●─────┤              │
                    │              │
         SEL  ●─────┤              │
                    └──────────────┘
                         │
                         │
                    USB TTL Adapter
                    ┌──────────────┐
                    │              │
              ●─────┤ +5V  [Red]   │ USB
              ●─────┤ GND  [Black] │ Cable
              ●─────┤ RXD  [Yellow]│
                    │              │
                    └──────────────┘
                         │
                         │
                    Computer USB Port
```

---

## 📋 Step-by-Step Wiring Instructions

### **You Will Need:**
- ✅ EM-18 RFID Reader module
- ✅ USB TTL Serial Adapter (CH340/PL2303/FT232RL)
- ✅ Jumper wires or breadboard
- ✅ USB cable (USB-A to Micro-USB or Mini-USB)
- ✅ Computer with USB port

### **Steps:**

1. **Prepare Wires**
   ```
   - Cut 3 jumper wires: GND, VCC, TX
   - Strip ~5mm from each end
   - Use breadboard to organize if needed
   ```

2. **Connect Ground (GND) - FIRST!**
   ```
   EM-18 Pin 2 (GND) ──── USB TTL GND [Black]
   ```
   - This MUST be done first!
   - Establishes common reference point
   - Prevents potential damage

3. **Connect Power (VCC)**
   ```
   EM-18 Pin 1 (VCC) ──── USB TTL +5V [Red]
   ```
   - Powers the EM-18 reader
   - Typical draw: 50-100mA (safe for USB port)

4. **Connect TX (Transmit)**
   ```
   EM-18 Pin 8 (TX) ──── USB TTL RXD [Yellow]
   ```
   - EM-18 sends card data out through TX
   - USB TTL receives on RXD
   - RFID card UID flows here
   - This is the ONLY data line needed!

5. **Leave Other Pins Empty**
   ```
   Pins 3-7: Optional/Not used for serial mode
   - Pin 3 (BUZZ): Optional buzzer output
   - Pin 4-5 (NC): Leave unconnected
   - Pin 6-7 (DAT0/DAT1): Parallel mode (not used)
   - Pin 9 (SEL): Mode select (tied to GND for serial)
   ```

6. **Connect USB to Computer**
   ```
   - Plug USB TTL into computer USB port
   - Drivers should auto-install (or get from manufacturer)
   - Device appears as COM port (COM3, COM5, COM7, etc.)
   ```

7. **Verify in Device Manager (Windows)**
   ```
   Device Manager → Ports (COM & LPT)
   → Should see "USB-SERIAL CH340 (COM5)" or similar
   ```

---

## ⚡ Power Considerations

### **USB TTL Power Supply:**
```
Source: USB Port (5V / 500mA per USB 2.0 spec)

EM-18 Requirements:
  - Voltage: 4.5V - 5.5V (5V typical)
  - Current: 50mA (idle) to 100mA (active)
  - Power Consumption: ~0.5W

✅ Safe: USB port can easily supply this
```

### **Current Calculation:**
```
USB Port Supply: 500mA max
EM-18 Draw: ~100mA max
USB TTL Adapter Draw: ~50mA max
Total Draw: ~150mA

Remaining Budget: 350mA
Conclusion: ✅ SAFE - No external power needed
```

---

## 🔍 Troubleshooting Wiring

### **Problem: EM-18 Not Powering On**
```
Checks:
1. ✓ Verify +5V connected (should see LED on EM-18)
2. ✓ Check GND connection (use multimeter: GND-GND = 0Ω)
3. ✓ Confirm USB TTL has power (LED on adapter)
4. ✓ Try different USB port
5. ✓ Check adapter drivers installed

Solution:
- If no LED: Likely power issue
- Re-check +5V and GND wires
- Test with multimeter: 5V between +5V and GND
```

### **Problem: No Serial Data Received**
```
Checks:
1. ✓ TX/RX wires not swapped (common mistake!)
2. ✓ Yellow (RX) connected to RXD on USB TTL
3. ✓ Orange (TX) connected to TXD on USB TTL
4. ✓ COM port is correct (check Device Manager)
5. ✓ Baud rate is 9600 (not 115200)

Solution:
- Swap TX and RX wires
- Verify in Device Manager (if appears as COM5)
- Test with terminal software (PuTTY, Tera Term)
- Place card near reader - should see hex data
```

### **Problem: Garbage/Corrupted Data**
```
Checks:
1. ✓ Baud rate: Must be 9600 (NOT 115200)
2. ✓ Data bits: 8
3. ✓ Stop bits: 1
4. ✓ Parity: None
5. ✓ Flow control: None

Solution:
- Set all settings in terminal software
- Default 9600 is usually correct
- If still garbled, try 115200 (some EM-18 variants)
```

---

## 🧪 Testing the Connection

### **Test 1: Check Device Manager**
```powershell
# Windows PowerShell
Get-PnpDevice -PresentOnly | Where-Object {$_.Class -eq "Ports"}

# Expected Output:
# Name: USB-SERIAL CH340 (COM5)
# Status: OK
```

### **Test 2: Use PuTTY Terminal**
```
1. Download PuTTY (free)
2. Select Serial connection type
3. Port: COM5 (or your COM number)
4. Speed: 9600
5. Click Open
6. Place RFID card near reader
7. You should see hex data: 0000A1B2C3D4E5F6
```

### **Test 3: Use Node.js Script**
```bash
cd backend
node check-card-status.js
# Should detect EM-18 on COM5
# Place card - should read data
```

### **Test 4: Use Our Backend Script**
```bash
cd backend
npm run dev
# In another terminal:
curl http://localhost:4000/api/rfid/write \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"uniqueId":"TEST-123"}'
# Should write to card (if placed near reader)
```

---

## 📐 Physical Assembly

### **Option 1: Breadboard Layout**
```
USB TTL Adapter        Jumper Wires       EM-18 Reader
═══════════════        ════════════       ════════════
GND [Black] ───●─────●─────●──────────── GND (Pin 1)
VCC [Red]   ───●─────●─────●──────────── +5V (Pin 2)
RXD [Yellow]───●─────●─────●──────────── TX (Pin 3)
TXD [Orange]───●─────●─────●──────────── RX (Pin 4)
```

### **Option 2: Direct Soldering**
```
If you want a permanent connection:

1. Solder 4 wires directly to EM-18 pins
2. Solder other ends to USB TTL adapter
3. Use heat shrink tubing over solder joints
4. Avoid crossing wires (prevents interference)
5. Secure with cable ties
```

### **Option 3: Connector Cables**
```
For easy swapping:

1. Use 0.1" pitch headers on EM-18
2. Use female jumper cables
3. Plug into EM-18 headers
4. Plug other end into USB TTL
5. Can disconnect without soldering
```

---

## 🎯 Pin Identification Guide

### **How to Identify EM-18 Pins:**
```
Looking at EM-18 from the front (label side up):

         ┌─────────────────┐
         │  EM-18 RFID     │
         │                 │
    GND  │ ●  1      4  ●  │ RX
   +5V   │ ●  2      3  ●  │ TX
         │                 │
         │ (Keep label up) │
         └─────────────────┘
         
Orientation:
- Label faces UP
- Pin numbers: 1,2 on LEFT, 3,4 on RIGHT
- Count from top-left: GND, +5V, TX, RX
```

### **How to Identify USB TTL Pins:**
```
Looking at USB TTL adapter (label side up):

    ┌──────────────────┐
    │ USB TTL Adapter  │
    │  (CH340 Example) │
    ├──────────────────┤
    │ GND    [Black]   │ ← Pin 1
    │ CTS    [Gray]    │ ← Pin 2 (usually skip)
    │ VCC    [Red]     │ ← Pin 3
    │ TXD    [Orange]  │ ← Pin 4
    │ RXD    [Yellow]  │ ← Pin 5
    │ DTR    [Green]   │ ← Pin 6 (usually skip)
    │                  │
    └──────────────────┘
     │
     └─→ USB connector (to computer)
```

---

## 🔐 Safety Precautions

### **DO:**
- ✅ Connect GND first
- ✅ Verify voltage with multimeter before power-on
- ✅ Use shielded USB cable if experiencing interference
- ✅ Keep wire connections tight
- ✅ Use appropriate wire gauge (22-24 AWG recommended)

### **DON'T:**
- ❌ Connect +5V directly to GND (short circuit!)
- ❌ Mix up TX and RX (won't damage, just won't work)
- ❌ Exceed 5.5V on EM-18
- ❌ Use USB hubs if experiencing power issues
- ❌ Leave wires uninsulated (crossing wires cause interference)

---

## 📦 Alternative USB TTL Adapters

### **Adapter Comparison:**

| Adapter | Chip | Voltage | Speed | Windows Driver | Notes |
|---------|------|---------|-------|----------------|-------|
| **CH340** | CH340G | 3.3V/5V | 9600-2M | Built-in (Win 10+) | 🟢 BEST - Cheap, reliable |
| **PL2303** | PL2303 | 3.3V/5V | 9600-2M | Need install | 🟡 Works but needs driver |
| **FT232RL** | FT232RL | 3.3V/5V | 9600-3M | Built-in | 🟢 Professional, expensive |
| **CP2102** | CP2102 | 3.3V/5V | 9600-1M | Built-in (Win 10+) | 🟢 Good alternative |

---

## 🛠️ Complete Shopping List

```
For EM-18 to USB TTL Connection:

Qty | Item | Est. Price | Notes
----|------|-----------|--------
1   | EM-18 RFID Reader | $8-12 | Module
1   | USB TTL Adapter | $3-8 | CH340 recommended
4   | Jumper Wires (M-F) | $1-3 | 20cm length
1   | Breadboard (optional) | $2-5 | For organization
1   | USB Cable (optional) | $2-5 | Already have computer

TOTAL: ~$15-33
```

---

## 🔗 Quick Wiring Checklist

Before powering on:

- [ ] EM-18 GND (Pin 1) → USB TTL GND [Black]
- [ ] EM-18 +5V (Pin 2) → USB TTL VCC [Red]
- [ ] EM-18 TX (Pin 3) → USB TTL RXD [Yellow]
- [ ] EM-18 RX (Pin 4) → USB TTL TXD [Orange]
- [ ] USB TTL connected to computer USB port
- [ ] All connections are tight and secure
- [ ] No wires are touching (no shorts)
- [ ] Device appears in Device Manager as COM port

**Ready to use!** ✅

---

## 📞 Quick Reference Commands

### **Check Serial Port (Windows PowerShell):**
```powershell
Get-PnpDevice -PresentOnly | Where-Object {$_.Class -eq "Ports"}
```

### **Check Serial Port (Windows Command Line):**
```cmd
mode
```

### **Test with Node.js:**
```bash
cd backend
node check-card-status.js
```

### **Read Raw Serial Data (Node.js):**
```javascript
const SerialPort = require('serialport');
const port = new SerialPort('COM5', { baudRate: 9600 });
port.on('data', (data) => console.log(data.toString('hex')));
```

---

## 📚 Additional Resources

- [EM-18 Datasheet](http://rfid.robotistan.com/em18_rfid_reader_manual.pdf)
- [CH340 Driver Downloads](https://www.wch.cn/downloads/ch341ser_exe.html)
- [PuTTY Terminal Software](https://www.putty.org/)
- [Node SerialPort Documentation](https://serialport.io/docs/guide-installation)

---

## ✅ Verification Steps

Once wired:

1. **Power Check**
   ```
   Multimeter between GND and +5V on EM-18
   Should read: 5.0V ± 0.5V
   ```

2. **LED Check**
   ```
   EM-18 should have LED:
   - Red LED: Always on (power indicator)
   - Green LED: Blinks on card detect
   ```

3. **Serial Port Check**
   ```powershell
   Get-PnpDevice -PresentOnly | Where-Object {$_.Class -eq "Ports"}
   Should show: USB-SERIAL CH340 (COM5) or similar
   ```

4. **Data Check**
   ```
   Place RFID card near reader
   Should see hex string: 0000A1B2C3D4E5F6...
   In terminal or serial monitor
   ```

**If all checks pass: Connection is correct! ✅**

---

## 🎓 Summary

**EM-18 to USB TTL Wiring:**
```
GND (Pin 1)  ──→  GND [Black]
+5V (Pin 2)  ──→  VCC [Red]
TX (Pin 3)   ──→  RXD [Yellow]
RX (Pin 4)   ──→  TXD [Orange]
```

**Key Points:**
- 4 wires total
- GND first, then +5V, then TX/RX
- Baud rate: 9600
- No external power needed (USB supplies enough)
- Check Device Manager for COM port

**You're ready to read RFID cards!** 🚀
