document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("loginForm") as HTMLFormElement | null;
    const resultadosDivLogin = document.getElementById("mensaje") as HTMLDivElement | null;

    if (!form || !resultadosDivLogin) {
        console.error("No se encontró el formulario o el div de mensajes");
        return;
    }

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const usernameInput = document.getElementById("username") as HTMLInputElement | null;
        const passwordInput = document.getElementById("password") as HTMLInputElement | null;

        const username = usernameInput?.value ?? "";
        const password = passwordInput?.value ?? "";

        try {
            const res = await fetch("/api/v0/usuarios/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password }),
            });

            const data = await res.json();

            if (res.ok) {
                resultadosDivLogin.textContent = "Login exitoso!";
                resultadosDivLogin.className = "success";
                localStorage.setItem("token", data.token);

                // Decodificar token (sin verificar) para obtener el rol y redirigir según rol
                try {
                    const parts = data.token.split('.');
                    if (parts.length >= 2) {
                        const payload = JSON.parse(atob(parts[1]));
                        const rol = payload.rol ?? payload.role ?? "usuario";
                        setTimeout(() => {
                            if (rol === 'administrador') {
                                window.location.href = "./menuAdministrador.html";
                            } else if (rol === 'usuario') {
                                window.location.href = "./menuUsuario.html";
                            } else {
                                // por defecto, enviar al menú de usuario
                                window.location.href = "./menuUsuario.html";
                            }
                        }, 500);
                    } else {
                        // token inesperado, llevar al menu por defecto
                        window.location.href = "./menuUsuario.html";
                    }
                } catch (e) {
                    console.error('Error decodificando token:', e);
                    window.location.href = "./menuUsuario.html";
                }
            }
            else {
                resultadosDivLogin.textContent = data.error || "Usuario o contraseña incorrectos";
                resultadosDivLogin.className = "error";
            }
        } catch (err) {
            console.error(err);
            resultadosDivLogin.textContent = "Error de conexión al servidor";
            resultadosDivLogin.className = "error";
        }
    });
});
