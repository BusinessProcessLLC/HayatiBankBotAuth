// webapp/js/config.js
// API Configuration Management

export const FIREBASE_CONFIG = {
  apiKey: "AIzaSyB5CJlw23KPmN5HbY6S9gQKbUgb41_RxMw",
  authDomain: "tms-test-nlyynt.firebaseapp.com",
  databaseURL: "https://tms-test-nlyynt.firebaseio.com",
  projectId: "tms-test-nlyynt",
  storageBucket: "tms-test-nlyynt.appspot.com",
  messagingSenderId: "1036707590928",
  appId: "1:1036707590928:web:3519c03e00297347d0eb95",
  measurementId: "G-BYXEPGS2LM"
};

// Global API_URL variable
export let API_URL = null;

/**
 * Fetch API configuration from backend
 * Tries to load from backend's /api/config endpoint
 */
export async function fetchApiConfig() {
  // Priority 1: Manual override in localStorage
  const manualOverride = localStorage.getItem('hayati_api_url');
  if (manualOverride) {
    API_URL = manualOverride;
    console.log('🔧 Using API_URL from localStorage:', API_URL);
    return true;
  }

  // Priority 2: Try to fetch from likely backend URL
  // Since we're on GitHub Pages, we need to guess where backend is
  const possibleBackends = [
    'https://hayati-bank-test.loca.lt',  // LocalTunnel
    'http://localhost:3000'               // Local dev
  ];

  for (const backendUrl of possibleBackends) {
    try {
      console.log(`🔍 Trying backend: ${backendUrl}`);
      
      const response = await fetch(`${backendUrl}/api/config`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(3000) // 3 second timeout
      });

      if (response.ok) {
        const config = await response.json();
        API_URL = config.apiUrl;
        
        console.log(`✅ API config loaded from: ${backendUrl}`);
        console.log(`🌐 Using API_URL: ${API_URL}`);
        console.log(`🔧 Environment: ${config.environment}`);
        
        return true;
      }
    } catch (err) {
      console.warn(`⚠️ Backend not available: ${backendUrl}`);
    }
  }

  // Fallback: use default
  API_URL = 'http://localhost:3000';
  console.warn('⚠️ Using fallback API_URL:', API_URL);
  console.warn('💡 Set manually: localStorage.setItem("hayati_api_url", "YOUR_URL")');
  
  return false;
}

// Helper functions for manual URL management
window.setApiUrl = function(url) {
  localStorage.setItem('hayati_api_url', url);
  console.log('✅ API_URL saved to localStorage:', url);
  console.log('🔄 Reload page to apply');
};

window.getApiUrl = function() {
  return API_URL;
};

window.clearApiUrl = function() {
  localStorage.removeItem('hayati_api_url');
  console.log('✅ API_URL cleared');
  console.log('🔄 Reload page to use auto-detection');
};
