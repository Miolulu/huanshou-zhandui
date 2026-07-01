import { login, isLoggedIn, cleanupLegacyAuthData } from './auth.js';
import { showScreen, showToast } from './appShell.js';

export function initAuth(onAuthenticated) {
  cleanupLegacyAuthData();

  if (isLoggedIn()) {
    onAuthenticated();
    return;
  }

  showScreen('auth');
  const formLogin = document.getElementById('form-login');
  const errLogin = document.getElementById('auth-login-error');

  formLogin?.reset();

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
}
