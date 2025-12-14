// webapp/js/auth.js
// Firebase Authentication logic

import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  sendPasswordResetEmail
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

import { 
  doc, 
  setDoc,
  serverTimestamp 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

import { linkTelegramAccount } from './api.js';
import { saveSession } from './session.js';
import { showCabinet, showAuthScreen, showLoadingScreen, showError } from './ui.js';

/**
 * Login with email and password
 */
export async function login(auth, email, password, telegramData) {
  try {
    showLoadingScreen('Вход в систему...');
    
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    const token = await user.getIdToken();
    
    console.log('✅ Login successful:', user.email);
    
    // Link Telegram if available
    if (telegramData?.chatId) {
      await linkTelegramAccount(user.uid, token, telegramData);
    }
    
    // Save session to localStorage
    saveSession({
      authToken: token,
      tokenExpiry: Date.now() + (30 * 24 * 60 * 60 * 1000), // 30 days
      uid: user.uid,
      email: user.email
    });
    
    // Show cabinet
    showCabinet({ uid: user.uid, email: user.email });
    
    return { success: true };
    
  } catch (error) {
    let errorMessage = 'Ошибка входа';
    
    if (error.code === 'auth/invalid-credential') {
      errorMessage = 'Неверный email или пароль';
    } else if (error.code === 'auth/user-not-found') {
      errorMessage = 'Пользователь не найден';
    } else if (error.code === 'auth/wrong-password') {
      errorMessage = 'Неверный пароль';
    } else if (error.code === 'auth/too-many-requests') {
      errorMessage = 'Слишком много попыток. Попробуйте позже';
    }
    
    showAuthScreen('login');
    showError('loginError', errorMessage);
    
    return { success: false, error: errorMessage };
  }
}

/**
 * Register new user
 */
export async function register(auth, db, email, password, passwordConfirm, telegramData) {
  try {
    // Validation
    if (!email || !password || !passwordConfirm) {
      showError('registerError', 'Заполните все поля');
      return { success: false };
    }
    
    if (password.length < 6) {
      showError('registerError', 'Пароль должен быть минимум 6 символов');
      return { success: false };
    }
    
    if (password !== passwordConfirm) {
      showError('registerError', 'Пароли не совпадают');
      return { success: false };
    }
    
    showLoadingScreen('Регистрация...');
    
    // Create Firebase Auth user
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    const token = await user.getIdToken();
    
    const tgUser = telegramData?.user;
    const tgChatId = telegramData?.chatId;
    
    // Create user document in Firestore with full structure
    await setDoc(doc(db, 'users', user.uid), {
      // SSOT: Firebase Auth UID
      uid: user.uid,
      email: user.email,
      
      // Timestamps
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      
      // Status
      status: 'active',
      createdBy: tgChatId ? 'telegram-mini-app' : 'web',
      
      // Profile
      profile: {
        createdAt: serverTimestamp(),
        userType: tgChatId ? 'telegram' : 'web',
        riskLevel: 'unknown',
        segment: 'registered' // lead → registered → active
      },
      
      // Contacts
      contacts: {
        email: user.email,
        phone: null,
        telegram: tgUser?.username ? `https://t.me/${tgUser.username}` : null
      },
      
      // Telegram metadata (if registered from Telegram)
      ...(tgUser && {
        tgId: tgUser.id,
        tgUsername: tgUser.username || null,
        tgLanguage: tgUser.language_code || null,
        tgIsPremium: tgUser.is_premium || false,
        nameFirst: tgUser.first_name || null,
        nameLast: tgUser.last_name || null,
        nameFull: `${tgUser.first_name || ''}${tgUser.last_name ? ' ' + tgUser.last_name : ''}`.trim() || null
      }),
      
      // Arrays
      telegramAccounts: [],
      userAccessIDs: tgChatId ? [String(tgChatId), tgChatId] : [],
      userActionCasesPermitted: [
        'balanceShow',
        'paymentsShow',
        'expenseItemsShowAll'
      ]
    });
    
    console.log('✅ User document created in Firestore');
    console.log('✅ Registration successful:', user.email);
    
    // Link Telegram if available
    if (tgChatId) {
      await linkTelegramAccount(user.uid, token, telegramData);
    }
    
    // Save session
    saveSession({
      authToken: token,
      tokenExpiry: Date.now() + (30 * 24 * 60 * 60 * 1000),
      uid: user.uid,
      email: user.email
    });
    
    // Show cabinet
    showCabinet({ uid: user.uid, email: user.email });
    
    return { success: true };
    
  } catch (error) {
    let errorMessage = 'Ошибка регистрации';
    
    if (error.code === 'auth/email-already-in-use') {
      errorMessage = 'Этот email уже зарегистрирован';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Неверный формат email';
    } else if (error.code === 'auth/weak-password') {
      errorMessage = 'Слишком простой пароль';
    }
    
    showAuthScreen('register');
    showError('registerError', errorMessage);
    
    return { success: false, error: errorMessage };
  }
}

/**
 * Reset password
 */
export async function resetPassword(auth, email) {
  try {
    if (!email) {
      showError('resetError', 'Введите email');
      return { success: false };
    }
    
    await sendPasswordResetEmail(auth, email);
    
    console.log('✅ Password reset email sent');
    
    return { success: true };
    
  } catch (error) {
    let errorMessage = 'Ошибка отправки';
    
    if (error.code === 'auth/user-not-found') {
      errorMessage = 'Пользователь с таким email не найден';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Неверный формат email';
    }
    
    showError('resetError', errorMessage);
    
    return { success: false, error: errorMessage };
  }
}
