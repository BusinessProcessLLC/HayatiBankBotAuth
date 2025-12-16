// webapp/js/cabinet/accounts.js v1.2.7
// Account management logic

import { API_URL } from '../config.js';
import { getSession } from '../session.js';

/**
 * Get user's accounts
 */
export async function getUserAccounts() {
  try {
    const session = getSession();
    
    if (!session) {
      throw new Error('No active session');
    }
    
    console.log('📋 Fetching accounts...');
    console.log('🔗 API URL:', API_URL);
    console.log('🔑 Has token:', !!session.authToken);
    
    const url = `${API_URL}/api/accounts?authToken=${encodeURIComponent(session.authToken)}`;
    console.log('📡 Request URL:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📨 Response status:', response.status);
    console.log('📨 Response headers:', response.headers);
    
    // Log response text for debugging
    const responseText = await response.text();
    console.log('📨 Response text (first 200 chars):', responseText.substring(0, 200));
    
    if (!response.ok) {
      // Try to parse as JSON
      try {
        const errorData = JSON.parse(responseText);
        throw new Error(errorData.error || `Failed to fetch accounts: ${response.status}`);
      } catch (parseError) {
        // If not JSON, show the HTML error
        throw new Error(`Server returned HTML instead of JSON. Status: ${response.status}`);
      }
    }
    
    // Parse response
    const result = JSON.parse(responseText);
    console.log(`✅ Fetched ${result.accounts.length} accounts`);
    
    return result.accounts;
    
  } catch (err) {
    console.error('❌ Error fetching accounts:', err);
    throw err;
  }
}

/**
 * Get account by ID
 */
export async function getAccountById(accountId) {
  try {
    const session = getSession();
    
    if (!session) {
      throw new Error('No active session');
    }
    
    const response = await fetch(
      `${API_URL}/api/accounts/${accountId}?authToken=${encodeURIComponent(session.authToken)}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to fetch account: ${response.status}`);
    }
    
    const result = await response.json();
    console.log(`✅ Fetched account: ${accountId}`);
    
    return result.account;
    
  } catch (err) {
    console.error('❌ Error fetching account:', err);
    throw err;
  }
}

/**
 * Create new account
 */
export async function createAccount(type, profile) {
  try {
    const session = getSession();
    
    if (!session) {
      throw new Error('No active session');
    }
    
    console.log(`🔨 Creating ${type} account...`);
    
    const response = await fetch(`${API_URL}/api/accounts/create`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        type,
        profile,
        authToken: session.authToken
      })
    });
    
    console.log('📨 Create account response status:', response.status);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create account');
    }
    
    const result = await response.json();
    console.log(`✅ Account created: ${result.account.accountId}`);
    
    return result.account;
    
  } catch (err) {
    console.error('❌ Error creating account:', err);
    throw err;
  }
}

/**
 * Delete account
 */
export async function deleteAccount(accountId) {
  try {
    const session = getSession();
    
    if (!session) {
      throw new Error('No active session');
    }
    
    console.log(`🗑️ Deleting account: ${accountId}`);
    
    const response = await fetch(`${API_URL}/api/accounts/${accountId}`, {
      method: 'DELETE',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        authToken: session.authToken
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete account');
    }
    
    console.log(`✅ Account deleted: ${accountId}`);
    
    return true;
    
  } catch (err) {
    console.error('❌ Error deleting account:', err);
    throw err;
  }
}