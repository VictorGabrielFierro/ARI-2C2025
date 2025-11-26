document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("registerForm") as HTMLFormElement | null;
    const resultadosDivRegister = document.getElementById("mensaje") as HTMLDivElement | null;

    if (!form || !resultadosDivRegister) {
        console.error("No se encontró el formulario o el div de mensajes");
        return;
    }

    const rolSelect = document.getElementById("rol") as HTMLSelectElement | null;
    const luInputEl = document.getElementById("lu") as HTMLInputElement | null;

    if (!rolSelect || !luInputEl) {
        console.error("No se encontró rol o lu en el DOM");
        return;
    }

    // Mostrar/ocultar campo LU según rol
    rolSelect.addEventListener("change", () => {
        const val = rolSelect.value;
        if (val === "administrador") {
            luInputEl.style.display = "none";
            luInputEl.value = ""; // limpiar LU si se selecciona administrador
        } else {
            luInputEl.style.display = "block";
        }
    });

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        // Logs de depuración
        console.log("Submit disparado");
        console.log("Formulario:", form);
        console.log("Div mensajes:", resultadosDivRegister);

        const usernameInput = document.getElementById("username") as HTMLInputElement | null;
        const passwordInput = document.getElementById("password") as HTMLInputElement | null;
        const emailInput = document.getElementById("email") as HTMLInputElement | null;
        const rolInput = document.getElementById("rol") as HTMLSelectElement | null;
        const luInput = document.getElementById("lu") as HTMLInputElement | null;

        const username = usernameInput?.value ?? "";
        const password = passwordInput?.value ?? "";
        const email = emailInput?.value ?? "";
        const rol = rolInput?.value ?? "";
        const lu = luInput?.value ?? "";

        // Validación de rol en frontend
        const allowedRoles = ["usuario", "administrador"];
        if (!allowedRoles.includes(rol)) {
            resultadosDivRegister.textContent = "Rol inválido";
            resultadosDivRegister.className = "error";
            return;
        }

        try {
            const res = await fetch("/api/v0/usuarios/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password, email, rol, lu }),
            });

            const data = await res.json();

            if (res.ok) {
                resultadosDivRegister.textContent = "Registro exitoso!";
                resultadosDivRegister.className = "success";
                localStorage.setItem("token", data.token);

                // Redirigir al menú principal
                setTimeout(() => {
                    window.location.href = "./login.html"; // o la ruta relativa correcta al menú
                }, 1000); // espera 1 segundo para que el usuario vea el mensaje
            }
            else {
                resultadosDivRegister.textContent = data.error || "ACOMODAR ESTO";
                resultadosDivRegister.className = "error";
            }
        } catch (err) {
            console.error(err);
            resultadosDivRegister.textContent = "Error de conexión al servidor";
            resultadosDivRegister.className = "error";
        }
    });
});
