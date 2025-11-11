/**
 * 🧪 MANUAL DATE OVERRIDE FOR TESTING PASS EXPIRY
 * 
 * ⚠️  EDIT THE TEST_OVERRIDE_DATE BELOW TO CHANGE THE SYSTEM DATE ⚠️
 * 
 * After editing, restart backend: npm run dev
 * The conductor panel will use this date to check pass validity
 */

// ============================================
// 📅 EDIT THIS VALUE TO TEST DIFFERENT DATES
// ============================================

const TEST_OVERRIDE_DATE: Date | null = null;

// 🔄 TO TEST, UNCOMMENT ONE OF THESE OPTIONS:

// ✅ Option 1: Test TODAY (all passes valid)
// const TEST_OVERRIDE_DATE = new Date();

// ❌ Option 2: Test TOMORROW (Day pass expires, Weekly/Monthly valid)
// const TEST_OVERRIDE_DATE = new Date(new Date().getTime() + 24 * 60 * 60 * 1000);

// ❌ Option 3: Test 8 DAYS LATER (Day + Weekly expire, Monthly valid)
// const TEST_OVERRIDE_DATE = new Date(new Date().getTime() + 8 * 24 * 60 * 60 * 1000);

// ❌ Option 4: Test 31 DAYS LATER (All 3 expire)
// const TEST_OVERRIDE_DATE = new Date(new Date().getTime() + 31 * 24 * 60 * 60 * 1000);

// ✅ Option 5: Test 365 DAYS LATER (Only yearly passes valid)
// const TEST_OVERRIDE_DATE = new Date(new Date().getTime() + 365 * 24 * 60 * 60 * 1000);

// ============================================
// 🔧 HELPER FUNCTIONS (DO NOT EDIT)
// ============================================

/**
 * Get current date (respects override if set)
 */
export function getNow(): Date {
  if (TEST_OVERRIDE_DATE) {
    console.log(`🧪 TEST MODE: Using date ${TEST_OVERRIDE_DATE.toLocaleString()}`);
    return new Date(TEST_OVERRIDE_DATE);
  }
  return new Date();
}

/**
 * Get current date as ISO string for debugging
 */
export function getNowString(): string {
  return getNow().toLocaleString();
}

/**
 * Check if pass is valid given current date
 */
export function isPassValid(passValidity: Date | null): boolean {
  if (!passValidity) return false;
  return passValidity > getNow();
}

/**
 * Get remaining time until expiry
 */
export function getTimeRemaining(passValidity: Date | null): string {
  if (!passValidity) return "N/A";
  
  const now = getNow();
  const diff = passValidity.getTime() - now.getTime();
  
  if (diff <= 0) return "Expired";
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  
  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
}
