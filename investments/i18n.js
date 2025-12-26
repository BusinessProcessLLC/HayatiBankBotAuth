/* /webapp/investments/i18n.js v1.1.2 */
// CHANGELOG v1.1.2:
// - Added investment.* keys for Level 1 dashboard
// CHANGELOG v1.1.1:
// - ADDED: Missing 20L.stats.remaining key
// - FIXED: 20L.dashboard.addCounterparty key
// CHANGELOG v1.1.0:
// - Added 20L system keys
// CHANGELOG v1.0.0:
// - Initial release
// - Support for RU/EN languages
// - Centralized translations for entire app

const translations = {
  ru: {

        
    // Investment Level 1 (NEW v1.1.2)
    'investment.level1.title': '📊 Инвестиции: Уровень №1',
    'investment.level1.subtitle': 'Цифровые финансовые активы',
    'investment.balance.title': '💰 Баланс активов',
    'investment.balance.bot': 'Бот (USDT)',
    'investment.balance.hodl': 'HODL (BTC)',
    'investment.balance.projects': 'Проекты',
    'investment.balance.liquidity': 'Ликвидность (RUB)',
    'investment.balance.total': 'Итого',
    'investment.list.title': '📋 Мои инвестиции',
    'investment.list.empty': 'У вас пока нет активных инвестиций',
    'investment.list.addFirst': 'Добавьте первую инвестицию для начала',
    'investment.item.roi': 'ROI',
    'investment.item.status': 'Статус',
    'investment.item.date': 'Дата',
    'investment.status.active': 'Активна',
    'investment.status.completed': 'Завершена',
    'investment.status.pending': 'В ожидании',
    'investment.crypto.title': '₿ Крипто-портфель',
    'investment.crypto.empty': 'Нет криптоактивов',
    'investment.crypto.balance': 'Баланс',
    'investment.loading': 'Загрузка инвестиций...',

  },
  
  en: {

    // Investment Level 1 (NEW v1.1.2)
    'investment.level1.title': '📊 Investments: Level #1',
    'investment.level1.subtitle': 'Digital Financial Assets',
    'investment.balance.title': '💰 Asset Balance',
    'investment.balance.bot': 'Bot (USDT)',
    'investment.balance.hodl': 'HODL (BTC)',
    'investment.balance.projects': 'Projects',
    'investment.balance.liquidity': 'Liquidity (RUB)',
    'investment.balance.total': 'Total',
    'investment.list.title': '📋 My Investments',
    'investment.list.empty': 'You have no active investments yet',
    'investment.list.addFirst': 'Add your first investment to get started',
    'investment.item.roi': 'ROI',
    'investment.item.status': 'Status',
    'investment.item.date': 'Date',
    'investment.status.active': 'Active',
    'investment.status.completed': 'Completed',
    'investment.status.pending': 'Pending',
    'investment.crypto.title': '₿ Crypto Portfolio',
    'investment.crypto.empty': 'No crypto assets',
    'investment.crypto.balance': 'Balance',
    'investment.loading': 'Loading investments...',

  }
};

// Current language (default: ru)
let currentLanguage = 'ru';

/**
 * Get translation for key
 */
export function t(key, lang = null) {
  const language = lang || currentLanguage;
  return translations[language]?.[key] || key;
}

/**
 * Set current language
 */
export function setLanguage(lang) {
  if (translations[lang]) {
    currentLanguage = lang;
    console.log(`🌍 Language set to: ${lang}`);
    return true;
  }
  console.warn(`⚠️ Language not supported: ${lang}`);
  return false;
}

/**
 * Get current language
 */
export function getCurrentLanguage() {
  return currentLanguage;
}

/**
 * Get all supported languages
 */
export function getSupportedLanguages() {
  return Object.keys(translations);
}

// Auto-detect language from Telegram
if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
  const tgLang = window.Telegram.WebApp.initDataUnsafe?.user?.language_code;
  if (tgLang === 'en') {
    setLanguage('en');
  }
}

console.log('🌍 i18n initialized:', currentLanguage);