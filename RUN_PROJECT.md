# 🚀 Quick Start Guide - BMTC Smart Bus Pass System

## Prerequisites
- Node.js installed
- EM-18 RFID reader connected to COM5
- USB-TTL adapter

## 1. Start Backend Server
```powershell
cd backend
npm run dev
```
Backend runs on: **http://localhost:4000**

## 2. Start Frontend Server
```powershell
cd frontend
npm run dev
```
Frontend runs on: **http://localhost:5173**

## 3. Access Application

### Admin Panel
```
URL: http://localhost:5173
Click: 👨‍💼 Admin Login
Email: admin@example.com
Password: password

Actions:
- Approve registrations
- Generate passes (writes to RFID card)
```

### Conductor Panel
```
URL: http://localhost:5173
Click: 🚌 Conductor Panel
Click: 🎫 Access Panel

Actions:
- Scan Card (reads RFID card)
- Validate passenger pass
```

### College Portal
```
URL: http://localhost:5173
Click: 🏢 College Login
Email: college@example.com
Password: password

Actions:
- Register students
- Bulk upload via CSV
```

### Passenger Portal
```
URL: http://localhost:5173
Click: 🎫 Passenger Login
Email: passenger@example.com
Password: password

Actions:
- Register for bus pass
- Choose pass type (day/weekly/monthly)
```

## 4. Database Management (Optional)
```powershell
cd backend
npx prisma studio
```
Opens Prisma Studio on: **http://localhost:5555**

## 5. RFID Card Testing

### Test EM-18 Reader
```powershell
cd backend
node check-card-status.js
```
Place card on reader to see UID and data.

### Your 4 Cards
1. `0B0026E03BF6`
2. `0B0026E8FE3B` (Already assigned to bnvhn - day pass)
3. `0B0026CBC721`
4. `0B0026E29659`

## 6. Typical Workflow

### Issue a New Pass
1. Admin Login → Passengers tab
2. See pending registrations
3. Click "✅ Approve"
4. Go to "✅ Approved Passes" tab
5. Click "🎫 Generate Pass"
6. **Place RFID card when prompted** (at 65% progress)
7. Success! Pass issued with BMTC ID

### Validate Pass at Bus Door
1. Conductor Panel → Click "🎫 Scan Card"
2. **Place RFID card on EM-18 reader**
3. See passenger details:
   - ✅ Valid Pass (green) or ❌ Invalid (red)
   - Passenger name, pass type, expiry date

## 7. Troubleshooting

### Backend not starting?
```powershell
# Kill all node processes
taskkill /F /IM node.exe

# Restart backend
cd backend
npm run dev
```

### COM5 port busy?
Only ONE application can use COM5 at a time:
- Close Prisma Studio if running
- Kill any test scripts: `taskkill /F /IM node.exe`
- Restart backend

### Card not detected?
- Check EM-18 wiring: VCC, GND, TX connected
- Verify COM5 in Device Manager
- Card must be within 5cm of reader
- Wait for blue light + beep before removing card

## 8. Stop Servers
```powershell
# Press Ctrl+C in each terminal
# Or kill all Node processes
taskkill /F /IM node.exe
```

---

## 📝 Notes

- **Timeout**: 10 seconds to place card after clicking scan/generate
- **Port**: COM5 is hardcoded (change in `backend/src/utils/rfid.ts`)
- **Database**: SQLite file at `backend/prisma/dev.db`
- **RFID**: EM-18 is read-only (reads UID only, stores data in database)

## 🎯 Key URLs
- Frontend: http://localhost:5173
- Backend API: http://localhost:4000
- Prisma Studio: http://localhost:5555

---

**System Ready!** 🚌💳✨
