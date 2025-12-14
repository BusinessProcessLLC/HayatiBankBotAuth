// webapp/js/api.js
// All API calls to backend

import { API_URL } from './config.js';

/**
 * Check if Telegram chatId is linked to Firebase UID
 */
export async function checkTelegramBinding(chatId, initData) {
  try {
    const response = await fetch(`${API_URL}/api/check-telegram-binding`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chatId, initData })
    });
    
    if (!response.ok) {
      console.error('❌ Binding check failed:', response.status);
      return null;
    }
    
    const result = await response.json();
    console.log('✅ Binding check result:', result);
    return result;
  } catch (err) {
    console.error('❌ Error checking binding:', err);
    return null;
  }
}

/**
 * Silent login using existing Telegram binding
 */
export async function silentLogin(uid, chatId, initData) {
  try {
    const response = await fetch(`${API_URL}/api/silent-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid, chatId, initData })
    });
    
    if (!response.ok) {
      console.error('❌ Silent login failed:', response.status);
      return null;
    }
    
    const result = await response.json();
    console.log('✅ Silent login successful');
    return result;
  } catch (err) {
    console.error('❌ Error during silent login:', err);
    return null;
  }
}

/**
 * Validate Firebase auth token
 */
export async function validateToken(authToken, uid) {
  try {
    const response = await fetch(`${API_URL}/api/validate-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ authToken, uid })
    });
    
    if (!response.ok) {
      return false;
    }
    
    const result = await response.json();
    return result.valid === true;
  } catch (err) {
    console.error('❌ Error validating token:', err);
    return false;
  }
}

/**
 * Link Telegram account to Firebase user
 */
export async function linkTelegramAccount(uid, authToken, telegramData) {
  try {
    const { chatId, initData, user } = telegramData;
    
    if (!chatId || !initData) {
      console.warn('⚠️ No Telegram data available for linking');
      return false;
    }
    
    console.log('🔗 Linking Telegram account:', {
      chatId,
      username: user?.username,
      firstName: user?.first_name
    });
    
    const response = await fetch(`${API_URL}/api/link-telegram`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        uid, 
        chatId, 
        initData, 
        telegramUser: user,
        authToken 
      })
    });
    
    if (!response.ok) {
      console.error('❌ Linking failed:', response.status);
      return false;
    }
    
    const result = await response.json();
    console.log('✅ Telegram linked successfully');
    return result.success === true;
  } catch (err) {
    console.error('❌ Error linking Telegram:', err);
    return false;
  }
}
