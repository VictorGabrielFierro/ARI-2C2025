import { getAuthHeaders, checkToken } from "./authCheck.js";
checkToken();

async function obtenerHistoria() {
    const lu = localStorage.getItem('lu')
    try {
        const res = await fetch(`/api/v0/crud/aida.cursa/cursa/${encodeURIComponent(lu ?? '')}`, {
            headers: getAuthHeaders()
        });

        if (!res.ok) {
            throw new Error("No se pudo obtener la historia académica");
        }
        
        const datos = await res.json();        
        llenarTabla(datos);

    } catch (err) {
        console.error(err);
        alert("Error al cargar historia académica");
    }
}

function llenarTabla(cursadas: any[]) {
    const tbody = document.querySelector("#tablaHistoria tbody")!;
    tbody.innerHTML = "";

    cursadas.forEach(c => {
        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${c.MateriaId}</td>
            <td>${c.Cuatrimestre}</td>
            <td>${c.FechaInscripcion}</td>
            <td>${c.NotaFinal ?? "-"}</td>
        `;

        tbody.appendChild(tr);
    });
}

// Iniciar
window.addEventListener("DOMContentLoaded", () => {
    obtenerHistoria();
});
