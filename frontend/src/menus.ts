import { checkToken } from "./authCheck.js";
checkToken();

document.addEventListener("DOMContentLoaded", () => {
    const logoutBtn = document.getElementById("logoutBtn");

    if (!logoutBtn) return;

    logoutBtn.addEventListener("click", async () => {
        try {
            // Llamar al backend para limpiar la cookie
            await fetch("/api/v0/usuarios/logout", {
                method: "POST",
                credentials: "include" // por si usa cookies
            });

            // Borrar token del localStorage
            localStorage.removeItem("token");

            // Redirigir a login
            window.location.href = "./login.html";

        } catch (err) {
            console.error("Error al cerrar sesión:", err);
            alert("Error al cerrar sesión");
        }
    });
});
