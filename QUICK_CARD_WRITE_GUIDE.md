# ⚡ Quick Start: Write Real RFID Cards

## 🎯 In 3 Steps

### Step 1: Prepare
```
✅ Backend running on http://localhost:4000
✅ Frontend running on http://localhost:5173
✅ EM-18 reader connected to COM5
✅ Real card write enabled (simulate: false)
```

### Step 2: Place Card
📍 Hold RFID card **within 5cm** of EM-18 reader

### Step 3: Approve
1. Open: http://localhost:5173
2. Login (admin@example.com / password)
3. Find pending registration
4. Click **✅ Approve**
5. See **Unique ID** in success modal
6. **Card is written!** 🎉

---

## 📊 What Happens

| Step | Action | Result |
|------|--------|--------|
| 1️⃣ | Click Approve | Unique ID generated |
| 2️⃣ | Card present | Data written to card |
| 3️⃣ | Success | ID shown, card stores data |
| 4️⃣ | Database | Pass marked approved, UID saved |

---

## 🔍 Check Status

**Backend running?**
```bash
Get-Process | Where-Object {$_.ProcessName -like "*node*"}
```

**Port 4000 listening?**
```bash
netstat -ano | findstr :4000
```

**EM-18 connected?**
```bash
Get-PnpDevice -PresentOnly | Where-Object {$_.Class -eq "Ports"}
```

---

## 🛠️ Test Without Dashboard

```bash
cd backend
node test-rfid-write.js
```

---

## 📝 Current Config

- **Serial Port**: COM5
- **Baud Rate**: 9600 bps
- **Mode**: REAL card write
- **Payload**: JSON with pass data
- **Card UID**: Auto-detected

---

## ✨ Done!

Your system is **100% ready** to write real RFID cards.

**Go to Admin Dashboard and approve a pass!** 🚀

For details: See `HOW_TO_WRITE_RFID_CARD.md` or `READY_FOR_REAL_CARDS.md`
