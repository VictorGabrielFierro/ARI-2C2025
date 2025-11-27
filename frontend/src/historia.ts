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

async function llenarTabla(cursadas: any[]) {
    const tbody = document.querySelector("#tablaHistoria tbody")!;
    tbody.innerHTML = "";

    const cursadasConDatos = await Promise.all(
        cursadas.map(async cur => {
            const res = await fetch(
                `/api/v0/crud/aida.materias/materia/${encodeURIComponent(cur.MateriaId)}`,
                { headers: getAuthHeaders() }
            );

            if (!res.ok) throw new Error("Error obteniendo materia");

            const materia = await res.json();

            return {
                ...cur,
                nombre: materia[0].Nombre,
            };
        })
    );

    cursadasConDatos.forEach(c => {
        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${c.nombre}</td>
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
