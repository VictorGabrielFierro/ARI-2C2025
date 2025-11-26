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
                localStorage.setItem("lu",'369/23');

                // Redirigir al menú principal
                setTimeout(() => {
                    window.location.href = "./menuAdministrador.html"; // o la ruta relativa correcta al menú
                }, 1000); // espera 1 segundo para que el usuario vea el mensaje
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
