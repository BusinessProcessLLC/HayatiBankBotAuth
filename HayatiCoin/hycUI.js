/* /HayatiCoin/hycUI.js v1.0.0 */
// CHANGELOG v1.0.0:
// - Initial release
// - Render HYC balance in cabinet header
// - Minimal gradient styling

import { formatHYC } from './hycService.js';
import { t } from './i18n.js';

/**
 * Render HYC balance in cabinet header
 */
export function renderHYCBalance(balance) {
  const userEmailEl = document.querySelector('.user-email');
  
  if (!userEmailEl) {
    console.warn('⚠️ [HYC] User email element not found');
    return;
  }
  
  // Check if HYC balance already exists
  let hycEl = document.querySelector('.hyc-balance');
  
  if (!hycEl) {
    // Create element
    hycEl = document.createElement('p');
    hycEl.className = 'hyc-balance';
    
    // Insert after user email
    userEmailEl.parentNode.insertBefore(hycEl, userEmailEl.nextSibling);
  }
  
  // Update balance
  hycEl.textContent = `💎 ${formatHYC(balance)} HYC`;
  
  console.log('✅ [HYC] Balance rendered:', formatHYC(balance));
}

/**
 * Update HYC balance (silent)
 */
export async function updateHYCBalance(newBalance) {
  renderHYCBalance(newBalance);
}