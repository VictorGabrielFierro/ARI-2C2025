import { checkToken, getAuthHeaders } from "./authCheck.js";
checkToken();
// Obtener elementos del DOM con verificación de null
const generarBtnLU = document.getElementById("generarBtnLU") as HTMLButtonElement | null;
const resultadosDivLU = document.getElementById("resultados") as HTMLDivElement | null;
const containerDivLU = document.getElementById("container") as HTMLDivElement | null;
const luInput = document.getElementById("luInput") as HTMLInputElement | null;

if (!generarBtnLU || !resultadosDivLU || !containerDivLU || !luInput) {
    console.error("No se encontraron uno o más elementos del DOM requeridos.");
} else {
    generarBtnLU.addEventListener("click", async () => {
        const lu = luInput.value.trim();
        resultadosDivLU.innerHTML = "";

        if (!lu) {
            resultadosDivLU.innerHTML = `<div class="error">Por favor, ingrese un LU válido.</div>`;
            return;
        }

        try {
            const response = await fetch(`/api/v0/alumnos/lu/${encodeURIComponent(lu)}`, {
                headers: getAuthHeaders()
            });
            const data = await response.json();

            resultadosDivLU.innerHTML = "";

            if (response.ok) {
                if (data.archivo) {
                    resultadosDivLU.innerHTML = `
                    <div class="success">
                        ✅ ${data.mensaje}<br>
                        <a href="${data.archivo}" target="_blank">Ver certificado</a>
                    </div>
                    `;
                } else {
                    resultadosDivLU.innerHTML = `
                    <div class="error">
                        ⚠️ ${data.mensaje}
                    </div>
                    `;
                }
            } else {
                resultadosDivLU.innerHTML = `
                <div class="error">
                    ❌ Error: ${data.error || 'Error inesperado del servidor'}
                </div>
                `;
            }

            if (resultadosDivLU.innerHTML && containerDivLU) {
                containerDivLU.style.paddingBottom = "35px";
            }

        } catch (error: any) {
            resultadosDivLU.innerHTML = `<div class="error">❌ Error al conectar con el servidor: ${error.message}</div>`;
        }
    });
}