# Hidden Passes Management Guide

## Overview
This feature allows admins to temporarily hide approved passes from the main dashboard without permanently deleting them, and then restore them whenever needed.

## Changes Made

### Frontend Changes (AdminDashboard.tsx)

**1. New Tab: "Hidden Passes"**
- Added new `archived` tab between "Approved Passes" and "Card Management"
- Tab displays count of hidden passes
- Orange color theme (#f59e0b) for visibility

**2. Removed Hide Button**
- Deleted the "🗑️ Hide" button from the approved passes table
- This prevents accidental hiding of passes

**3. New Restore Functionality**
- Hidden passes tab shows all archived passes
- Each archived pass has a "↩️ Restore" button
- Restoring brings the pass back to the "Approved Passes" tab

**4. Updated State Management**
- Added `archivedStudents` and `archivedPassengers` states
- Updated `getItems()` function to handle archived tab
- Updated table rendering logic to show appropriate actions based on tab

### Backend Changes (admin.ts)

**1. New Endpoints**

#### GET /api/admin/archived-passes
- Fetches all archived (hidden) passes
- Returns both students and passengers
- Returns:
```json
{
  "students": [...],
  "passengers": [...],
  "total": number
}
```

#### POST /api/admin/student-passes/:id/restore
- Changes student pass status from 'archived' to 'approved'
- Returns: `{ success: true, message: "...", pass: {...} }`

#### POST /api/admin/passenger-passes/:id/restore
- Changes passenger pass status from 'archived' to 'approved'
- Returns: `{ success: true, message: "...", pass: {...} }`

**2. Existing Endpoints (No Changes)**
- `/api/admin/student-passes/:id/hide` - Still works, sets status to 'archived'
- `/api/admin/passenger-passes/:id/hide` - Still works, sets status to 'archived'

## How to Use

### Viewing Hidden Passes
1. Go to Admin Dashboard
2. Click on "📦 Hidden Passes" tab
3. See all hidden approved passes

### Restoring a Hidden Pass
1. Open the "Hidden Passes" tab
2. Find the pass you want to restore
3. Click "↩️ Restore" button
4. Confirm the action
5. Pass automatically moves back to "Approved Passes" tab

### Current Dashboard Behavior
- **College Students Tab**: Pending approvals for college students
- **Passengers Tab**: Pending approvals for passengers
- **Approved Passes Tab**: All active, approved passes (without hide button)
- **Hidden Passes Tab**: All archived/hidden passes with restore button
- **Card Management Tab**: RFID card scanning and management

## Data Flow

```
Approved Pass → Hide Button → Status Changes to 'archived' → Appears in Hidden Passes Tab
                                                          ↓
                                                    Click Restore
                                                          ↓
                                            Status Changes Back to 'approved'
                                                          ↓
                                            Returns to Approved Passes Tab
```

## Database Changes
- No new database tables created
- Uses existing `status` field in StudentRegistration and PassengerRegistration
- New status value: 'archived' (in addition to existing 'pending' and 'approved')

## Real-Time Updates
- Hidden passes tab updates every 30 seconds (auto-refresh)
- Status badges show: Active, Expired, or Deleted
- Restore action immediately reflects in UI

## Benefits
✅ No data loss - passes aren't deleted, just hidden
✅ Easy recovery - restore with one click
✅ Clean dashboard - keeps main approved list focused
✅ Audit trail - all passes remain in database for history
✅ Flexible - can hide/restore multiple times if needed
