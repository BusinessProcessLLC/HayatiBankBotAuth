// app.js - MVP VERSION
// Минимальная логика: Firebase Auth → отправка UID в Telegram

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { 
  getFirestore, 
  doc, 
  setDoc,
  serverTimestamp 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// ============================================
// 1. FIREBASE КОНФИГУРАЦИЯ
// ============================================
const firebaseConfig = {
  apiKey: "AIzaSyB5CJlw23KPmN5HbY6S9gQKbUgb41_RxMw",
  authDomain: "tms-test-nlyynt.firebaseapp.com",
  databaseURL: "https://tms-test-nlyynt.firebaseio.com",
  projectId: "tms-test-nlyynt",
  storageBucket: "tms-test-nlyynt.appspot.com",
  messagingSenderId: "1036707590928",
  appId: "1:1036707590928:web:3519c03e00297347d0eb95",
  measurementId: "G-BYXEPGS2LM"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ============================================
// 2. TELEGRAM WEBAPP
// ============================================
const tg = window.Telegram?.WebApp;
let telegramData = null;

if (tg) {
  tg.ready();
  tg.expand();
  telegramData = {
    chatId: tg.initDataUnsafe?.user?.id || null,
    username: tg.initDataUnsafe?.user?.username || null,
    firstName: tg.initDataUnsafe?.user?.first_name || null,
    lastName: tg.initDataUnsafe?.user?.last_name || null
  };
  log('✅ Telegram WebApp инициализирован', telegramData);
} else {
  log('⚠️ Запущено НЕ в Telegram (браузер)');
}

// ============================================
// 3. DOM ЭЛЕМЕНТЫ
// ============================================
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const loader = document.getElementById('loader');

const loginBtn = document.getElementById('loginBtn');
const registerBtn = document.getElementById('registerBtn');

const showRegisterLink = document.getElementById('showRegister');
const showLoginLink = document.getElementById('showLogin');

// ============================================
// 4. ПЕРЕКЛЮЧЕНИЕ ФОРМ
// ============================================

// Проверяем параметр mode в URL
const urlParams = new URLSearchParams(window.location.search);
const mode = urlParams.get('mode');

log('📋 URL параметры:', { mode });

// Функция переключения форм
function showForm(formType) {
  loginForm.classList.add('hidden');
  registerForm.classList.add('hidden');
  loader.classList.add('hidden');
  clearMessages();
  
  if (formType === 'register') {
    registerForm.classList.remove('hidden');
    log('📝 Показана форма регистрации');
  } else {
    loginForm.classList.remove('hidden');
    log('🔐 Показана форма входа');
  }
}

// Показываем нужную форму при загрузке
window.addEventListener('DOMContentLoaded', () => {
  if (mode === 'register') {
    showForm('register');
  } else {
    showForm('login');
  }
});

// Обработчики кнопок переключения
showRegisterLink.addEventListener('click', (e) => {
  e.preventDefault();
  showForm('register');
});

showLoginLink.addEventListener('click', (e) => {
  e.preventDefault();
  showForm('login');
});

// ============================================
// 5. ВХОД
// ============================================
loginBtn.addEventListener('click', async () => {
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;

  clearMessages();

  if (!email || !password) {
    showMessage('loginMessage', 'Заполните все поля', 'error');
    return;
  }

  try {
    loginBtn.disabled = true;
    log('🔐 Попытка входа:', email);

    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    log('✅ Вход успешен:', userCredential.user.uid);

    // Успешный вход обрабатывается в onAuthStateChanged
  } catch (error) {
    loginBtn.disabled = false;
    log('❌ Ошибка входа:', error.code);

    let errorMessage = 'Ошибка входа';
    if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
      errorMessage = 'Неверный email или пароль';
    } else if (error.code === 'auth/user-not-found') {
      errorMessage = 'Пользователь не найден';
    } else if (error.code === 'auth/too-many-requests') {
      errorMessage = 'Слишком много попыток. Попробуйте позже';
    }

    showMessage('loginMessage', errorMessage, 'error');
  }
});

// ============================================
// 6. РЕГИСТРАЦИЯ
// ============================================
registerBtn.addEventListener('click', async () => {
  const email = document.getElementById('registerEmail').value.trim();
  const password = document.getElementById('registerPassword').value;
  const passwordConfirm = document.getElementById('registerPasswordConfirm').value;

  clearMessages();

  if (!email || !password || !passwordConfirm) {
    showMessage('registerMessage', 'Заполните все поля', 'error');
    return;
  }

  if (password.length < 6) {
    showMessage('registerMessage', 'Пароль должен быть минимум 6 символов', 'error');
    return;
  }

  if (password !== passwordConfirm) {
    showMessage('registerMessage', 'Пароли не совпадают', 'error');
    return;
  }

  try {
    registerBtn.disabled = true;
    log('📝 Попытка регистрации:', email);

    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const uid = userCredential.user.uid;

    log('✅ Регистрация успешна:', uid);

    // Создаём базовую запись в Firestore
    await setDoc(doc(db, 'users', uid), {
      uid: uid,
      email: email,
      createdAt: serverTimestamp(),
      status: 'active'
    });

    log('✅ Firestore запись создана');

    // Успешная регистрация обрабатывается в onAuthStateChanged
  } catch (error) {
    registerBtn.disabled = false;
    log('❌ Ошибка регистрации:', error.code);

    let errorMessage = 'Ошибка регистрации';
    if (error.code === 'auth/email-already-in-use') {
      errorMessage = 'Этот email уже зарегистрирован';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Неверный формат email';
    } else if (error.code === 'auth/weak-password') {
      errorMessage = 'Слишком простой пароль';
    }

    showMessage('registerMessage', errorMessage, 'error');
  }
});

// ============================================
// 7. ГЛАВНАЯ ЛОГИКА: ОБРАБОТКА АВТОРИЗАЦИИ
// ============================================
onAuthStateChanged(auth, async (user) => {
  if (user) {
    log('🎉 Пользователь авторизован:', user.uid);
    
    // Показываем загрузчик
    loginForm.classList.add('hidden');
    registerForm.classList.add('hidden');
    loader.classList.remove('hidden');

    try {
      // Получаем ID token
      const token = await user.getIdToken();
      
      // Формируем payload для отправки боту
      const payload = {
        type: 'auth_success',
        uid: user.uid,
        email: user.email,
        token: token,
        telegram: telegramData
      };

      log('📦 Payload для бота:', payload);

      // ============================================
      // 🔥 КЛЮЧЕВОЙ МОМЕНТ: ОТПРАВКА В БОТА
      // ============================================
      
      if (tg && telegramData?.chatId) {
        // Вариант 1: Запущено в Telegram WebApp
        log('📤 Отправка через tg.sendData()...');
        
        tg.sendData(JSON.stringify(payload));
        
        log('✅ Данные отправлены в бота');
        
        // Закрываем через 1 секунду
        setTimeout(() => {
          log('🔒 Закрытие WebApp...');
          tg.close();
        }, 1000);
        
      } else {
        // Вариант 2: Запущено в браузере (deep link)
        log('🌐 Режим браузера, создание deep link...');
        
        const botUsername = 'HayatiHodlBot'; // ← ТВОЙ ТЕСТОВЫЙ БОТ
        const payloadB64 = btoa(JSON.stringify(payload));
        const deepLink = `https://t.me/${botUsername}?start=auth_${payloadB64}`;
        
        log('🔗 Deep link создан');
        
        loader.innerHTML = `
          <div style="text-align: center; padding: 20px;">
            <div style="font-size: 48px; margin-bottom: 16px;">✅</div>
            <h2 style="color: #667eea; margin-bottom: 16px;">Успешно!</h2>
            <p style="margin-bottom: 24px; color: #666;">
              Вы авторизованы как:<br>
              <strong>${user.email}</strong>
            </p>
            <a href="${deepLink}" 
               style="display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">
              Открыть бота в Telegram
            </a>
          </div>
        `;
      }
      
    } catch (error) {
      log('❌ Ошибка обработки авторизации:', error);
      loader.classList.add('hidden');
      loginForm.classList.remove('hidden');
      showMessage('loginMessage', 'Ошибка обработки. Попробуйте снова.', 'error');
    }
  }
});

// ============================================
// 8. ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================
function showMessage(elementId, text, type) {
  const el = document.getElementById(elementId);
  el.textContent = text;
  el.className = `message ${type}`;
  el.style.display = 'block';
}

function clearMessages() {
  document.querySelectorAll('.message').forEach(el => {
    el.style.display = 'none';
    el.textContent = '';
  });
}

function log(message, data = null) {
  const timestamp = new Date().toLocaleTimeString('ru-RU');
  const debugEl = document.getElementById('debug');
  
  let logText = `[${timestamp}] ${message}`;
  if (data) {
    logText += '\n' + JSON.stringify(data, null, 2);
  }
  
  console.log(message, data || '');
  debugEl.textContent += logText + '\n\n';
  debugEl.scrollTop = debugEl.scrollHeight;
}
