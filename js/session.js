// webapp/js/session.js
// Session management (localStorage)

const SESSION_KEY = 'hayati_session';

/**
 * Save session to localStorage
 */
export function saveSession(sessionData) {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
    console.log('💾 Session saved to localStorage');
    console.log('📅 Expires:', new Date(sessionData.tokenExpiry).toLocaleString());
    return true;
  } catch (err) {
    console.error('❌ Error saving session:', err);
    return false;
  }
}

/**
 * Get session from localStorage
 */
export function getSession() {
  try {
    const sessionStr = localStorage.getItem(SESSION_KEY);
    
    if (!sessionStr) {
      console.log('ℹ️ No session in localStorage');
      return null;
    }
    
    const session = JSON.parse(sessionStr);
    
    // Check if expired
    if (Date.now() >= session.tokenExpiry) {
      console.log('⏰ Session expired');
      clearSession();
      return null;
    }
    
    console.log('✅ Valid session found');
    console.log('👤 User:', session.email);
    
    return session;
  } catch (err) {
    console.error('❌ Error reading session:', err);
    clearSession();
    return null;
  }
}

/**
 * Clear session from localStorage
 */
export function clearSession() {
  try {
    localStorage.removeItem(SESSION_KEY);
    console.log('🗑️ Session cleared from localStorage');
    return true;
  } catch (err) {
    console.error('❌ Error clearing session:', err);
    return false;
  }
}
