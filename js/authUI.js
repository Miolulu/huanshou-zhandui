import { login, register, isLoggedIn, cleanupLegacyAuthData } from './auth.js';
import { showScreen, showToast } from './appShell.js';

export function initAuth(onAuthenticated) {
  cleanupLegacyAuthData();

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
    tabLogin?.classList.add('active');
    tabRegister?.classList.remove('active');
    formLogin?.classList.remove('hidden');
    formRegister?.classList.add('hidden');
    if (errLogin) errLogin.textContent = '';
    if (errRegister) errRegister.textContent = '';
  }

  function showRegisterTab() {
    tabRegister?.classList.add('active');
    tabLogin?.classList.remove('active');
    formRegister?.classList.remove('hidden');
    formLogin?.classList.add('hidden');
    if (errLogin) errLogin.textContent = '';
    if (errRegister) errRegister.textContent = '';
  }

  tabLogin?.addEventListener('click', showLoginTab);
  tabRegister?.addEventListener('click', showRegisterTab);

  formLogin?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (errLogin) errLogin.textContent = '';
    try {
      const username = document.getElementById('auth-login-username').value;
      const password = document.getElementById('auth-login-password').value;
      await login(username, password);
      showToast('登录成功');
      onAuthenticated();
    } catch (err) {
      if (errLogin) errLogin.textContent = err.message;
    }
  });

  formRegister?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (errRegister) errRegister.textContent = '';
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
      if (errRegister) errRegister.textContent = err.message;
    }
  });

  showLoginTab();
}
