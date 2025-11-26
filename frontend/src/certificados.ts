const API_BASE = "/api/v0";

async function obtenerToken() {
    return localStorage.getItem("token");
}

async function cargarCertificados() {
    const token = await obtenerToken();
    if (!token) {
        alert("No hay token. Debes iniciar sesión.");
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/certificados`, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (!res.ok) throw new Error("Error al obtener certificados");

        const lista = await res.json();
        llenarTabla(lista);

    } catch (error) {
        console.error(error);
        alert("No se pudieron cargar los certificados.");
    }
}

function llenarTabla(certificados: { archivo: string, lu: string }[]) {
    const tbody = document.querySelector("#tablaCertificados tbody")!;
    tbody.innerHTML = "";

    certificados.forEach(cert => {
        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${cert.lu}</td>
            <td>${cert.archivo}</td>
            <td><button class="descargar" data-file="${cert.archivo}">Descargar</button></td>
        `;

        tbody.appendChild(tr);
    });

    agregarEventosDescarga();
}

function agregarEventosDescarga() {
    const botones = document.querySelectorAll("button.descargar");

    botones.forEach(btn => {
        btn.addEventListener("click", async () => {
            const archivo = btn.getAttribute("data-file");
            if (!archivo) return;

            const token = localStorage.getItem("token");
            if (!token) {
                alert("Sesión expirada. Inicia sesión nuevamente.");
                window.location.href = "login.html";
                return;
            }

            try {
                const res = await fetch(`/api/v0/certificados/descargar/${archivo}`, {
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                });

                if (!res.ok) {
                    console.error(await res.text());
                    alert("Error al descargar el archivo");
                    return;
                }

                // Obtener contenido como Blob (archivo)
                const blob = await res.blob();

                // Crear URL temporal
                const url = window.URL.createObjectURL(blob);

                // Crear link oculto para forzar descarga
                const a = document.createElement("a");
                a.href = url;
                a.download = archivo;
                document.body.appendChild(a);
                a.click();
                a.remove();

                // Liberar URL
                window.URL.revokeObjectURL(url);

            } catch (error) {
                console.error(error);
                alert("Error al descargar el certificado.");
            }
        });
    });
}


cargarCertificados();
