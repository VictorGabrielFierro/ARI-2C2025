document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("registerForm") as HTMLFormElement | null;
    const resultadosDivRegister = document.getElementById("mensaje") as HTMLDivElement | null;

    if (!form || !resultadosDivRegister) {
        console.error("No se encontró el formulario o el div de mensajes");
        return;
    }

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        // Logs de depuración
        console.log("Submit disparado");
        console.log("Formulario:", form);
        console.log("Div mensajes:", resultadosDivRegister);

        const usernameInput = document.getElementById("username") as HTMLInputElement | null;
        const passwordInput = document.getElementById("password") as HTMLInputElement | null;
        const nameInput = document.getElementById("name") as HTMLInputElement | null;
        const emailInput = document.getElementById("email") as HTMLInputElement | null;

        const username = usernameInput?.value ?? "";
        const password = passwordInput?.value ?? "";
        const name = nameInput?.value ?? "";
        const email = emailInput?.value ?? "";

        try {
            const res = await fetch("/api/v0/usuarios/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password, name, email }),
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
