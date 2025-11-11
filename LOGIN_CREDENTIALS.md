# 🔐 Login Credentials - BMTC Smart Bus Pass System

All demo credentials are now seeded in the database and match the credentials shown in each login page.

## Demo Accounts

### 👤 Admin Account
- **Email:** `admin@smartbus.local`
- **Password:** `password`
- **Role:** Admin (full system access)
- **Access:** http://localhost:5173 → Click "Admin Login" button

### 🏢 College Staff Account
- **Email:** `college@smartbus.local`
- **Password:** `password`
- **Role:** College (manage student registrations)
- **Access:** http://localhost:5173 → Click "College Login" button

### 🎫 Passenger Account
- **Email:** `passenger@smartbus.local`
- **Password:** `password`
- **Role:** Passenger (purchase bus passes)
- **Access:** http://localhost:5173 → Click "Passenger Login" button

### 🚌 Conductor Account
- **Email:** `conductor@smartbus.local`
- **Password:** `password`
- **Role:** Conductor (validate passes at bus door)
- **Access:** http://localhost:5173 → Click "Conductor Panel" button

---

## How to Access Each Role

### 1️⃣ Admin Dashboard
```
URL: http://localhost:5173/admin-login
Email: admin@smartbus.local
Password: password
```

**Admin Actions:**
- View pending student registrations
- View pending passenger pass requests
- Approve/Decline registrations
- Generate RFID passes (write to card)
- View approved passes dashboard
- Hide completed passes

### 2️⃣ College Dashboard
```
URL: http://localhost:5173/college-login
Email: college@smartbus.local
Password: password
```

**College Actions:**
- Manually register individual students
- View pending student registrations
- View approved student passes
- Bulk upload removed (use manual entry)

### 3️⃣ Passenger Dashboard
```
URL: http://localhost:5173/passenger-login
Email: passenger@smartbus.local
Password: password
```

**Passenger Actions:**
- Register for bus pass online
- Select pass type (day/weekly/monthly)
- Submit registration for admin approval
- View pass status

### 4️⃣ Conductor Panel
```
URL: http://localhost:5173/conductor-panel
Click "Conductor Panel" button on home
```

**Conductor Actions:**
- Scan RFID card to validate pass
- View passenger details
- Check pass expiry date
- Show valid/invalid pass status

---

## System Architecture

```
Frontend (Port 5173)
├── Admin Dashboard → Manages approvals & pass generation
├── College Dashboard → Student registration
├── Passenger Dashboard → Online registration
└── Conductor Panel → Real-time pass validation

Backend (Port 4000)
├── Authentication Routes → JWT login/logout
├── Admin Routes → Approval & pass generation
├── Registration Routes → Student & passenger registration
├── RFID Routes → Card reading/writing
└── Conductor Routes → Pass validation

Hardware (COM5)
└── EM-18 RFID Reader → Read/Write to 125kHz cards
```

---

## Database Status

✅ **Seeded Users:** 4 demo accounts created
- admin@smartbus.local
- college@smartbus.local
- passenger@smartbus.local
- conductor@smartbus.local

✅ **Database:** SQLite (dev.db)
- Location: `backend/prisma/dev.db`
- Migrations Applied: 4/4

---

## Quick Start Workflow

### 👨‍🎓 Student Pass Generation Workflow

1. **College Portal:**
   - Login with: `college@smartbus.local` / `password`
   - Register a new student manually
   - Submit registration

2. **Admin Portal:**
   - Login with: `admin@smartbus.local` / `password`
   - Go to "College Students" tab
   - Click "✅ Approve" button
   - Place RFID card on EM-18 reader when prompted
   - Pass is written to card with BMTC ID

3. **Conductor Panel:**
   - Click "Conductor Panel" on home
   - Tap same RFID card on reader
   - See pass details & expiry date

### 🎫 Individual Passenger Pass Workflow

1. **Passenger Portal:**
   - Login with: `passenger@smartbus.local` / `password`
   - Fill registration form (name, email, age, etc.)
   - Select pass type (day/weekly/monthly)
   - Submit for approval

2. **Admin Portal:**
   - Go to "Passengers" tab
   - Click "✅ Approve" button
   - Place card on reader
   - Pass is written to card

3. **Conductor Validation:**
   - Tap card on reader
   - Conductor sees "Valid Pass" or expired message

---

## Troubleshooting Login Issues

| Problem | Solution |
|---------|----------|
| "Invalid email or password" | Use exact email from list above (case-sensitive) |
| Email not found in system | Run `npx ts-node seed.ts` in backend folder |
| Database empty | Delete `backend/prisma/dev.db` and run migrations |
| Servers not running | Start both: `cd backend; npm run dev` & `cd frontend; npm run dev` |
| Can't reach localhost:5173 | Check frontend server is running on port 5173 |

---

## Resetting Credentials

To reset and re-seed the database:

```bash
cd backend
rm prisma/dev.db
npx prisma migrate deploy
npx ts-node seed.ts
```

Then restart both servers:
```bash
npm run dev  # backend
# In another terminal
cd ../frontend
npm run dev  # frontend
```

---

## Next Steps

- 📝 Create real student/passenger records
- 🎯 Test complete workflow: Register → Approve → Generate Pass → Validate
- 🔄 Test duplicate card detection
- ✅ Verify student ID uniqueness
- 📊 Check all admin dashboards and tabs

**System is ready for testing!** 🚀
