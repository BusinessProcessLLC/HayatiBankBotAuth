/* /webapp/js/i18n-manager.js v1.0.5 */
// CHANGELOG v1.0.5:
// - FIXED: Shared preferences priority for language detection
// - FIXED: setLanguage now updates currentLang before loading dictionary
// - ADDED: Shared prefs persistence (hayati_prefs_v1)

class I18nManager {
  constructor() {
    this.currentLang = 'ru';
    this.translations = {};
    this.fallback = {};
    this.initialized = false;
    this.supportedLanguages = ['ru', 'en', 'ar'];
    this.sharedPrefsKey = 'hayati_prefs_v1';
    this.prefsChangedEvent = 'hayatiPrefsChanged';
  }

  readSharedPrefs() {
    try {
      const raw = localStorage.getItem(this.sharedPrefsKey);
      return raw ? JSON.parse(raw) : {};
    } catch (_error) {
      return {};
    }
  }

  writeSharedPrefs(patch = {}) {
    try {
      const current = this.readSharedPrefs();
      const next = {
        language: patch.language || current.language || 'ru',
        currency: patch.currency || current.currency || 'USD',
        metricSystem: patch.metricSystem || current.metricSystem || 'imperial',
        timezone: patch.timezone || current.timezone || 'utc',
        updatedAtMs: Number(patch.updatedAtMs || Date.now())
      };
      localStorage.setItem(this.sharedPrefsKey, JSON.stringify(next));
      window.dispatchEvent(new CustomEvent(this.prefsChangedEvent, {
        detail: { prefs: next, source: 'i18n-manager' }
      }));
      return next;
    } catch (_error) {
      return null;
    }
  }

  async init() {
    console.log('[i18n] Initializing...');

    this.currentLang = this.detectLanguage();
    console.log(`[i18n] Detected language: ${this.currentLang}`);

    try {
      await this.loadLanguage('ru');
      this.fallback = { ...this.translations };

      if (this.currentLang !== 'ru') {
        await this.loadLanguage(this.currentLang);
      }

      this.initialized = true;
      console.log(`[i18n] Ready (${Object.keys(this.translations).length} keys)`);

      window.dispatchEvent(new CustomEvent('i18nReady', {
        detail: { lang: this.currentLang }
      }));
    } catch (err) {
      console.error('[i18n] Initialization failed:', err);
      this.initialized = false;
    }
  }

  detectLanguage() {
    try {
      const shared = this.readSharedPrefs();
      const sharedLanguage = String(shared.language || '').toLowerCase();
      if (sharedLanguage && this.supportedLanguages.includes(sharedLanguage)) {
        console.log('[i18n] Language from shared prefs:', sharedLanguage);
        return sharedLanguage;
      }

      const saved = localStorage.getItem('hayati_lang');
      if (saved && this.supportedLanguages.includes(saved)) {
        console.log('[i18n] Language from localStorage:', saved);
        return saved;
      }
    } catch (e) {
      console.warn('[i18n] localStorage not available');
    }

    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      const tgUser = window.Telegram.WebApp.initDataUnsafe?.user;
      if (tgUser?.language_code) {
        const lang = tgUser.language_code.toLowerCase().split('-')[0];
        if (this.supportedLanguages.includes(lang)) {
          console.log('[i18n] Language from Telegram:', lang);
          return lang;
        }
      }
    }

    if (typeof navigator !== 'undefined' && navigator.language) {
      const lang = navigator.language.toLowerCase().split('-')[0];
      if (this.supportedLanguages.includes(lang)) {
        console.log('[i18n] Language from browser:', lang);
        return lang;
      }
    }

    console.log('[i18n] Using default language: ru');
    return 'ru';
  }

  async loadLanguage(lang) {
    try {
      console.log(`[i18n] Loading ${lang}.json...`);

      const response = await fetch(`./i18n/${lang}.json`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (lang === 'ru') {
        this.fallback = data;
      }

      if (lang === this.currentLang) {
        this.translations = data;
      }

      console.log(`[i18n] Loaded ${lang}.json (${Object.keys(data).length} keys)`);
    } catch (err) {
      console.error(`[i18n] Failed to load ${lang}.json:`, err);

      if (Object.keys(this.fallback).length === 0) {
        throw new Error('Failed to load any translations');
      }
    }
  }

  t(key) {
    if (!this.initialized) {
      return key;
    }

    if (this.translations[key] !== undefined) {
      return this.translations[key];
    }

    if (this.fallback[key] !== undefined) {
      return this.fallback[key];
    }

    return key;
  }

  async setLanguage(lang) {
    if (!this.supportedLanguages.includes(lang)) {
      console.error(`[i18n] Language "${lang}" not supported`);
      return false;
    }

    if (this.currentLang === lang) {
      return true;
    }

    console.log(`[i18n] Switching to ${lang}...`);

    const prevLang = this.currentLang;

    try {
      this.currentLang = lang;
      await this.loadLanguage(lang);

      try {
        localStorage.setItem('hayati_lang', lang);
        this.writeSharedPrefs({ language: lang });
      } catch (e) {
        console.warn('[i18n] Could not save language preference');
      }

      window.dispatchEvent(new CustomEvent('languageChanged', {
        detail: { lang }
      }));

      await this.updatePageIncremental();

      return true;
    } catch (err) {
      this.currentLang = prevLang;
      console.error(`[i18n] Failed to switch to ${lang}:`, err);
      return false;
    }
  }

  async updatePageIncremental() {
    const BATCH_SIZE = 50;
    const elements = Array.from(document.querySelectorAll('[data-i18n]'));

    for (let i = 0; i < elements.length; i += BATCH_SIZE) {
      const batch = elements.slice(i, i + BATCH_SIZE);

      batch.forEach((element) => {
        const key = element.getAttribute('data-i18n');
        const translation = this.t(key);

        if (translation === key) return;

        const tagName = element.tagName.toLowerCase();

        if (tagName === 'input' || tagName === 'textarea') {
          if (element.hasAttribute('placeholder')) {
            element.placeholder = translation;
          }
        } else if (tagName === 'button') {
          const span = element.querySelector('span');
          if (span) {
            span.textContent = translation;
          } else {
            element.textContent = translation;
          }
        } else {
          element.textContent = translation;
        }
      });

      if (i + BATCH_SIZE < elements.length) {
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
    }

    const titleKey = document.querySelector('title')?.getAttribute('data-i18n');
    if (titleKey) {
      const titleTranslation = this.t(titleKey);
      if (titleTranslation !== titleKey) {
        document.title = titleTranslation;
      }
    }
  }

  updatePage() {
    requestAnimationFrame(() => {
      const elements = document.querySelectorAll('[data-i18n]');

      elements.forEach((element) => {
        const key = element.getAttribute('data-i18n');
        const translation = this.t(key);

        if (translation === key) return;

        const tagName = element.tagName.toLowerCase();

        if (tagName === 'input' || tagName === 'textarea') {
          if (element.hasAttribute('placeholder')) {
            element.placeholder = translation;
          }
        } else if (tagName === 'button') {
          const span = element.querySelector('span');
          if (span) {
            span.textContent = translation;
          } else {
            element.textContent = translation;
          }
        } else {
          element.textContent = translation;
        }
      });

      const titleKey = document.querySelector('title')?.getAttribute('data-i18n');
      if (titleKey) {
        const titleTranslation = this.t(titleKey);
        if (titleTranslation !== titleKey) {
          document.title = titleTranslation;
        }
      }
    });
  }

  getCurrentLanguage() {
    return this.currentLang;
  }

  getSupportedLanguages() {
    return [...this.supportedLanguages];
  }

  isSupported(lang) {
    return this.supportedLanguages.includes(lang);
  }
}

if (typeof window !== 'undefined') {
  window.i18n = new I18nManager();
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = I18nManager;
}
