const AuthController = (() => {
  const USER = 'admin';
  const PASS = '123';

  function login(username, password) {
    if (username === USER && password === PASS) {
      StorageService.setSession({ authenticated: true, username, loginAt: new Date().toISOString() });
      return { success: true };
    }
    return { success: false, message: 'Usuário ou senha inválidos.' };
  }

  function logout() {
    StorageService.clearSession();
    window.location.href = 'login.html';
  }

  function requireAuth() {
    const session = StorageService.getSession();
    if (!session?.authenticated) {
      window.location.href = 'login.html';
      return false;
    }
    return true;
  }

  function redirectIfLogged() {
    const session = StorageService.getSession();
    if (session?.authenticated) window.location.href = 'dashboard.html';
  }

  return { login, logout, requireAuth, redirectIfLogged };
})();
