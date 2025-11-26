document.addEventListener('DOMContentLoaded', () => {
    const welcomeEl = document.getElementById('welcome');
    if (!welcomeEl) return;

    // Obtener token de localStorage o cookie
    let token = localStorage.getItem('token');
    if (!token) {
        const cookie = document.cookie.split('; ').find(c => c.startsWith('token='));
        if (cookie) token = decodeURIComponent(cookie.split('=')[1]);
    }
    if (!token) return;

    try {
        const parts = token.split('.');
        if (parts.length < 2) return;
        const payload = JSON.parse(atob(parts[1]));
        const fullName = payload.nombre ?? payload.name ?? payload.username ?? '';
        const firstName = fullName ? String(fullName).split(' ')[0] : (payload.username ?? '');
        welcomeEl.textContent = `Bienvenido, ${firstName}`;
    } catch (e) {
        console.error('Error decoding token in menuUsuario:', e);
    }
});
