import { getAuthHeaders, checkToken } from "./authCheck.js";
checkToken();

async function obtenerHistoria() {
    
    try {
        const res = await fetch(`/api/v0/crud/aida.cursa/cursa/actualLU`, {
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
            <td>${(c.Cuatrimestre as any).split('T')[0]}</td>
            <td>${(c.FechaInscripcion as any).split('T')[0]}</td>
            <td>${c.NotaFinal ?? "-"}</td>
        `;

        tbody.appendChild(tr);
    });
}

// Iniciar
window.addEventListener("DOMContentLoaded", () => {
    obtenerHistoria();
});
