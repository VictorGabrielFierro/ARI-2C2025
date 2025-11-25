// Obtener elementos del DOM con verificación de null
const generarBtnFecha = document.getElementById("generarBtnFecha") as HTMLButtonElement | null;
const fechaInput = document.getElementById("fechaInput") as HTMLInputElement | null;
const resultadosDivFecha = document.getElementById("resultados") as HTMLDivElement | null;

if (!generarBtnFecha || !fechaInput || !resultadosDivFecha) {
    console.error("No se encontraron uno o más elementos del DOM requeridos.");
} else {
    generarBtnFecha.addEventListener("click", async () => {
        const fecha = fechaInput.value.trim();
        resultadosDivFecha.innerHTML = "";

        if (!fecha) {
            resultadosDivFecha.innerHTML = `<div class="error">Por favor, ingrese una fecha válida.</div>`;
            return;
        }

        try {
            const response = await fetch(`/api/v0/fecha/${encodeURIComponent(fecha)}`);
            const data = await response.json();

            // Si es un error general (objeto con campo "error")
            if (!Array.isArray(data)) {
                resultadosDivFecha.innerHTML = `<div class="error">${data.error || "Error inesperado"}</div>`;
                return;
            }

            // Si es un array con resultados por alumno
            data.forEach(item => {
                if (item.archivo) {
                    resultadosDivFecha.innerHTML += `
                    <div class="success">
                        ✅ ${item.mensaje}<br>
                        <a href="${item.archivo}" target="_blank">Ver certificado</a>
                    </div>
                    `;
                } else {
                    resultadosDivFecha.innerHTML += `
                    <div class="error">
                        ⚠️ ${item.mensaje}
                    </div>
                    `;
                }
            });

        } catch (error: any) {
            resultadosDivFecha.innerHTML = `<div class="error">❌ Error al conectar con el servidor: ${error.message}</div>`;
        }
    });
}
