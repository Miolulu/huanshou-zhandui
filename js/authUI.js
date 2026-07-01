import { login, register, isLoggedIn, cleanupLegacyAuthData } from './auth.js';
import { showScreen, showToast } from './appShell.js';

export function initAuth(onAuthenticated) {
  cleanupLegacyAuthData();

  if (isLoggedIn()) {
    try {
      onAuthenticated();
    } catch (err) {
      console.error(err);
      showScreen('auth');
      const errLogin = document.getElementById('auth-login-error');
      if (errLogin) errLogin.textContent = err.message || '自动登录失败，请重新登录';
    }
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
    if (window.__authShowLogin) {
      window.__authShowLogin();
      if (errLogin) errLogin.textContent = '';
      if (errRegister) errRegister.textContent = '';
      return;
    }
    tabLogin?.classList.add('active');
    tabRegister?.classList.remove('active');
    formLogin?.classList.remove('hidden');
    formRegister?.classList.add('hidden');
    if (errLogin) errLogin.textContent = '';
    if (errRegister) errRegister.textContent = '';
  }

  function showRegisterTab() {
    if (window.__authShowRegister) {
      window.__authShowRegister();
      if (errLogin) errLogin.textContent = '';
      if (errRegister) errRegister.textContent = '';
      return;
    }
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
      try {
        onAuthenticated();
      } catch (err) {
        console.error(err);
        if (errLogin) errLogin.textContent = err.message || '进入主界面失败，请刷新重试';
      }
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
      try {
        onAuthenticated();
      } catch (err) {
        console.error(err);
        if (errRegister) errRegister.textContent = err.message || '进入主界面失败，请刷新重试';
      }
    } catch (err) {
      if (errRegister) errRegister.textContent = err.message;
    }
  });

  showLoginTab();
}
