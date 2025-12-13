// app.js


// 🔥 Firebase config (ЗАМЕНИ НА СВОЙ)
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

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

const tg = window.Telegram.WebApp;
tg.expand();

let mode = 'login';

const title = document.getElementById('title');
const submit = document.getElementById('submit');
const toggle = document.getElementById('toggle');

toggle.onclick = () => {
  mode = mode === 'login' ? 'register' : 'login';
  title.innerText = mode === 'login' ? 'Вход' : 'Регистрация';
  submit.innerText = mode === 'login' ? 'Войти' : 'Зарегистрироваться';
  toggle.innerText =
    mode === 'login'
      ? 'Нет аккаунта? Зарегистрироваться'
      : 'Уже есть аккаунт? Войти';
};

submit.onclick = async () => {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  try {
    let userCredential;

    if (mode === 'login') {
      userCredential = await auth.signInWithEmailAndPassword(email, password);
    } else {
      userCredential = await auth.createUserWithEmailAndPassword(email, password);
    }

    const user = userCredential.user;

    tg.sendData(JSON.stringify({
      type: 'auth_success',
      uid: user.uid,
      email: user.email
    }));

    tg.close();

  } catch (err) {
    alert(err.message);
  }
};
