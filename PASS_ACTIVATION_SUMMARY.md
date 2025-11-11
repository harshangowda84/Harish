# Pass Activation & Validity System Update

## 🎯 Overview

This update changes how bus passes are activated and how their validity periods are calculated. The system now activates passes only when they are **first tapped** at the conductor panel, and handles day passes with special end-of-day expiry logic.

---

## 🔄 Key Changes

### 1. **First Tap Activation**
- **Previous Behavior**: Pass validity was set during admin approval
- **New Behavior**: Pass validity is set when user first taps card at conductor panel
- **Applies To**: All passenger passes (day, weekly, monthly) and student passes

### 2. **Day Pass Special Logic**
- **Day Pass Validity**: Now valid **until 11:59:59 PM of the same day**
- **Example**: If you activate at 10:00 PM, pass expires at 11:59:59 PM (valid for ~2 hours)
- **Reason**: Day passes should only work for the calendar day, not 24 hours

### 3. **Other Pass Types**
- **Weekly Pass**: Valid for **7 days** from the first tap
- **Monthly Pass**: Valid for **30 days** from the first tap  
- **Student Pass**: Valid for **365 days** (1 year) from the first tap

### 4. **Expired Pass Display**
- **Conductor Panel**: Now shows expired pass details (not just "invalid")
- **Admin Panel**: Now shows expired pass details when scanning cards
- **Benefit**: Conductors and admins can see who the pass belongs to even if expired

---

## 📋 Database Schema Changes

### Added Field: `renewalStartDate`
```prisma
model PassengerRegistration {
  // ... existing fields
  renewalStartDate DateTime?  // Date when renewal should start (for user-selected renewal date)
}

model StudentRegistration {
  // ... existing fields
  renewalStartDate DateTime?  // Date when renewal should start (for user-selected renewal date)
}
```

**Purpose**: Stores the user's choice for when a renewed pass should start (today or tomorrow).

---

## 🚀 How It Works

### **Step 1: Admin Approves Pass**
- Admin reviews and approves the application
- Pass is marked as `status: "approved"`
- **passValidity is NOT set yet** (remains `null`)

### **Step 2: User Gets Card Written**
- RFID card UID is written to the database
- Pass is linked to the card
- Still **no validity date** set

### **Step 3: First Tap at Conductor Panel** ✨
- User taps card for the first time
- System detects `passValidity === null`
- **Activates the pass** with validity calculated from current time:
  - **Day Pass**: Expiry = Today at 11:59:59 PM
  - **Weekly Pass**: Expiry = Current Date + 7 days
  - **Monthly Pass**: Expiry = Current Date + 30 days
  - **Student Pass**: Expiry = Current Date + 365 days
- Shows **"Pass Activated!"** animation for 1 second
- Pass is now active and usable

### **Step 4: Subsequent Taps**
- System checks if pass is still valid
- Shows:
  - ✅ **Valid Pass** (with days remaining)
  - ❌ **Expired Pass** (with expiry date and person details)

---

## 🎨 User Interface Updates

### **Conductor Dashboard**
1. **Activation Animation** (New)
   - Green gradient background
   - ✅ "Pass Activated!" message
   - Shows for 1 second on first tap
   - Confirms pass is now active

2. **Expired Pass Display** (Enhanced)
   - Red background with ❌ icon
   - Shows passenger/student name
   - Shows pass type and expiry date
   - Shows photo (if available)
   - Allows conductor to see who the expired pass belongs to

### **Admin Card Management**
1. **Expired Pass Handling** (Enhanced)
   - Scanned cards show full details even if expired
   - Status shows as "expired" instead of hiding info
   - Admin can still expire or erase expired cards

---

## 📝 API Changes

### **POST /api/conductor/scan-card**

**Enhanced Response for First Activation:**
```json
{
  "valid": true,
  "id": 123,
  "type": "passenger",
  "passengerName": "John Doe",
  "passType": "day",
  "passNumber": "PASS123",
  "validUntil": "2025-11-11T23:59:59.999Z",
  "status": "activated",
  "message": "✅ Pass activated successfully! Valid for 1 days",
  "photoPath": "photo123.jpg",
  "activated": true
}
```

**Enhanced Response for Expired Pass:**
```json
{
  "valid": false,
  "id": 123,
  "type": "passenger",
  "passengerName": "John Doe",
  "passType": "weekly",
  "passNumber": "PASS456",
  "validUntil": "2025-11-05T10:30:00.000Z",
  "timeRemaining": "-6d",
  "status": "expired",
  "message": "❌ Pass has expired",
  "photoPath": "photo456.jpg"
}
```

### **POST /api/passenger/renew/:id**

**Enhanced Request Body:**
```json
{
  "startDate": "today" | "tomorrow"
}
```

**Purpose**: User selects whether renewed pass starts today or tomorrow.

---

## ✅ Benefits of This System

1. **🎟️ Fair Usage**: Users only start consuming pass validity when they first use it
2. **📅 Day Pass Logic**: Day passes work for calendar day (not 24 hours)
3. **🔍 Better Tracking**: Conductors can see expired pass details for verification
4. **🎯 Accurate Timing**: Passes start exactly when the user first taps
5. **📊 Admin Control**: Admins can still manage expired passes
6. **🔄 Flexible Renewal**: Users choose renewal start date (today/tomorrow)

---

## 🧪 Testing Guide

### **Test Case 1: Day Pass Activation at Night**
1. Admin approves a day pass application
2. Write RFID card
3. User taps card at **10:00 PM**
4. ✅ Expected: Pass valid until **11:59:59 PM** (not 10:00 PM next day)
5. At **12:00 AM**: Pass is expired

### **Test Case 2: Weekly Pass First Tap**
1. Admin approves weekly pass (Nov 11)
2. Write RFID card
3. User taps card for first time on **Nov 13 at 3:00 PM**
4. ✅ Expected: Pass valid until **Nov 20 at 3:00 PM** (7 days from tap)

### **Test Case 3: Expired Pass Scan**
1. Create a pass and expire it (or wait for expiry)
2. Tap expired card at conductor panel
3. ✅ Expected: 
   - Red background
   - Shows name, photo, pass type
   - Shows expiry date
   - Message: "❌ Pass has expired"

### **Test Case 4: Renewal with Date Selection**
1. User has expired pass
2. Click "Renew Pass" button
3. ✅ Expected: Modal appears with "Start Today" and "Start Tomorrow" options
4. Select "Start Tomorrow"
5. Tap card at conductor
6. ✅ Expected: Pass starts from tomorrow's date

---

## 🔧 Files Modified

### Backend
1. `backend/src/routes/conductor.ts` - Added first-tap activation logic, day pass end-of-day expiry
2. `backend/src/routes/passenger.ts` - Added `startDate` parameter for renewal
3. `backend/src/routes/admin.ts` - Enhanced to show expired pass details
4. `backend/prisma/schema.prisma` - Added `renewalStartDate` field

### Frontend
1. `frontend/src/pages/ConductorDashboard.tsx` - Added activation animation, handles expired display
2. `frontend/src/pages/PassengerDashboard.tsx` - Added renewal date selection modal
3. `frontend/src/pages/AdminDashboard.tsx` - No changes needed (uses conductor scan endpoint)

---

## 🎯 Next Steps

### For Users:
1. Apply for pass and get admin approval
2. Get RFID card written
3. **First tap at conductor**: This activates your pass ✨
4. Use pass normally until expiry
5. Renew before/after expiry (no documents needed)

### For Conductors:
1. Scan cards as usual
2. Watch for "Pass Activated!" message on first tap
3. Can see expired pass details for verification

### For Admins:
1. Approve passes as usual
2. Write RFID cards
3. Users activate on first conductor tap (automatic)
4. Use Card Management to expire/erase cards if needed

---

## 📞 Support

If you encounter any issues:
1. Check that backend is running on port 4000
2. Check that frontend is running on port 5173
3. Ensure EM-18 reader is connected to COM5
4. Check browser console for errors

---

**Date**: November 11, 2025  
**Version**: 2.0 (First Tap Activation System)
