// Función simple para convertir CSV a JSON
function csvToJson(csvText: string) {
    const lines = csvText.trim().split("\n");
    const headers = lines[0].split(",");
    return lines.slice(1).map(line => {
        const values = line.split(",");
        const obj: Record<string, string> = {};
        headers.forEach((h, i) => obj[h.trim()] = values[i]?.trim() || "");
        return obj;
    });
}

const generarBtnArchivo = document.getElementById("generarBtnArchivo") as HTMLButtonElement | null;
const resultadosDivArchivo = document.getElementById("resultados") as HTMLDivElement | null;
const containerDivArchivo = document.getElementById("container") as HTMLDivElement | null;
const fileInput = document.getElementById("csvInput") as HTMLInputElement | null;

if (!generarBtnArchivo || !resultadosDivArchivo || !containerDivArchivo || !fileInput) {
    console.error("No se encontraron los elementos del DOM requeridos.");
} else {
    generarBtnArchivo.addEventListener("click", async () => {
        resultadosDivArchivo.innerHTML = "";

        if (!fileInput.files || fileInput.files.length === 0) {
            resultadosDivArchivo.innerHTML = `<div class="error">Por favor, seleccione un archivo CSV.</div>`;
            return;
        }

        const file = fileInput.files[0];

        try {
            const text = await file.text();
            const alumnos = csvToJson(text);

            if (!alumnos || alumnos.length === 0) {
                resultadosDivArchivo.innerHTML = `<div class="error">❌ Archivo vacío o inválido.</div>`;
                return;
            }

            const response = await fetch("/api/v0/archivo", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(alumnos),
            });

            const data = await response.json();

            if (response.ok) {
                resultadosDivArchivo.innerHTML = `<div class="success">✅ ${data.mensaje}</div>`;
            } else {
                resultadosDivArchivo.innerHTML = `<div class="error">❌ Error: ${data.error || "Error inesperado"}.</div>`;
            }

            containerDivArchivo.style.paddingBottom = "35px";

        } catch (error: any) {
            resultadosDivArchivo.innerHTML = `<div class="error">❌ Error al conectar con el servidor: ${error.message}</div>`;
        }
    });
}
