import { login, register, isLoggedIn } from './auth.js';
import { showScreen, showToast } from './appShell.js';

export function initAuth(onAuthenticated) {
  if (isLoggedIn()) {
    onAuthenticated();
    return;
  }

  showScreen('auth');
  const tabLogin = document.getElementById('tab-login');
  const tabRegister = document.getElementById('tab-register');
  const formLogin = document.getElementById('form-login');
  const formRegister = document.getElementById('form-register');
  const errLogin = document.getElementById('auth-login-error');
  const errRegister = document.getElementById('auth-register-error');

  function showLoginTab() {
    tabLogin.classList.add('active');
    tabRegister.classList.remove('active');
    formLogin.classList.remove('hidden');
    formRegister.classList.add('hidden');
    errLogin.textContent = '';
    errRegister.textContent = '';
  }

  function showRegisterTab() {
    tabRegister.classList.add('active');
    tabLogin.classList.remove('active');
    formRegister.classList.remove('hidden');
    formLogin.classList.add('hidden');
    errLogin.textContent = '';
    errRegister.textContent = '';
  }

  tabLogin.onclick = showLoginTab;
  tabRegister.onclick = showRegisterTab;

  formLogin.onsubmit = async (e) => {
    e.preventDefault();
    errLogin.textContent = '';
    try {
      const username = document.getElementById('auth-login-username').value;
      const password = document.getElementById('auth-login-password').value;
      await login(username, password);
      showToast('登录成功');
      onAuthenticated();
    } catch (err) {
      errLogin.textContent = err.message;
    }
  };

  formRegister.onsubmit = async (e) => {
    e.preventDefault();
    errRegister.textContent = '';
    try {
      const username = document.getElementById('auth-reg-username').value;
      const password = document.getElementById('auth-reg-password').value;
      const password2 = document.getElementById('auth-reg-password2').value;
      const nickname = document.getElementById('auth-reg-nickname').value;
      if (password !== password2) throw new Error('两次密码不一致');
      await register(username, password, nickname);
      showToast('注册成功，欢迎加入幻兽战队！');
      onAuthenticated();
    } catch (err) {
      errRegister.textContent = err.message;
    }
  };
}
