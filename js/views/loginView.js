document.addEventListener('DOMContentLoaded', () => {
  StorageService.seed();
  const theme = StorageService.getTheme();
  document.body.classList.remove('theme-light', 'theme-dark');
  document.body.classList.add(theme === 'dark' ? 'theme-dark' : 'theme-light');
  AuthController.redirectIfLogged();

  const form = document.getElementById('loginForm');
  const error = document.getElementById('loginError');
  if (!form) return;

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    const result = AuthController.login(username, password);
    if (!result.success) {
      error.textContent = result.message;
      return;
    }
    window.location.href = 'dashboard.html';
  });
});
