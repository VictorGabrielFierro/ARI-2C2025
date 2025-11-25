import { Alumno } from "./tipos/index.js";

// --- Funciones auxiliares ---
function formatFecha(fecha?: string | null): string {
    if (!fecha) return '-';
    const fechaSimple = fecha.split('T')[0];
    const [year, month, day] = fechaSimple.split('-');
    return `${day}/${month}/${year}`;
}

// --- Cargar alumnos ---
async function cargarAlumnos(): Promise<void> {
    const mensajeDiv = document.getElementById('mensaje') as HTMLDivElement;
    const tabla = document.getElementById('tablaAlumnos') as HTMLTableElement;

    if (!mensajeDiv || !tabla) return;

    try {
        const res = await fetch('/api/v0/alumnos');
        if (!res.ok) throw new Error(`Error al obtener alumnos: ${res.status}`);
        const alumnos: Alumno[] = await res.json();

        const tbody = tabla.querySelector('tbody');
        if (!tbody) return;
        tbody.innerHTML = '';

        alumnos.forEach(a => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${a.lu}</td>
                <td>${a.apellido}</td>
                <td>${a.nombres}</td>
                <td>${a.titulo ?? '-'}</td>
                <td>${formatFecha(a.titulo_en_tramite)}</td>
                <td>${formatFecha(a.egreso)}</td>
            `;
            tbody.appendChild(tr);
        });

        mensajeDiv.textContent = '';
    } catch (err: any) {
        console.error(err);
        mensajeDiv.textContent = 'Error al cargar alumnos: ' + (err.message ?? err);
    }
}

// --- Modales ---
export function abrirModal(id: string): void {
    const modal = document.getElementById(id) as HTMLDivElement;
    if (modal) modal.style.display = 'flex';
}

export function cerrarModal(id: string): void {
    const modal = document.getElementById(id) as HTMLDivElement;
    if (modal) {
        modal.style.display = 'none';
        // Limpiar mensajes dentro del modal
        const mensajes = modal.querySelectorAll<HTMLDivElement>('.mensaje');
        mensajes.forEach(m => m.textContent = '');
    }
}

// --- Inicializar botones de cerrar modales ---
['cerrarModalEliminar', 'cerrarModalCrear', 'cerrarModalEditar'].forEach(id => {
    const btn = document.getElementById(id);
    if (btn) btn.addEventListener('click', () => {
        cerrarModal(id.replace('cerrar', '').toLowerCase());
    });
});

// --- Cerrar modales al hacer clic fuera ---
window.addEventListener('click', (event) => {
    ['modalEliminar', 'modalCrear', 'modalEditar', 'modalLUEditar'].forEach(id => {
        const modal = document.getElementById(id);
        if (modal && event.target === modal) modal.style.display = 'none';
    });
});

// --- CRUD Alumnos ---
export async function eliminarAlumno(): Promise<void> {
    const input = document.getElementById('luEliminar') as HTMLInputElement;
    const mensajeModal = document.getElementById("mensajeModalEliminar") as HTMLDivElement;
    if (!input || !mensajeModal) return;

    const lu = input.value.trim();
    if (!lu) return;

    try {
        const res = await fetch(`/api/v0/alumnos/${encodeURIComponent(lu)}`, { method: "DELETE" });
        const data = await res.json();
        if (res.ok) {
            mensajeModal.style.color = 'green';
            mensajeModal.textContent = data.mensaje;
            await cargarAlumnos();
        } else {
            mensajeModal.style.color = 'red';
            mensajeModal.textContent = `Error: ${data.error}`;
        }
    } catch (err: any) {
        console.error(err);
        mensajeModal.textContent = "Ocurrió un error inesperado.";
    }
}

function initFormCrearAlumno(): void {
    const form = document.getElementById('formCrearAlumno') as HTMLFormElement;
    const mensajeModal = document.getElementById("mensajeModalCrear") as HTMLDivElement;
    if (!form || !mensajeModal) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const alumno: Alumno = {
            lu: (document.getElementById("luInput") as HTMLInputElement).value.trim(),
            apellido: (document.getElementById("apellidoInput") as HTMLInputElement).value.trim(),
            nombres: (document.getElementById("nombresInput") as HTMLInputElement).value.trim(),
            titulo: (document.getElementById("tituloInput") as HTMLInputElement).value.trim() || null,
            titulo_en_tramite: (document.getElementById("tituloTramiteInput") as HTMLInputElement).value || null,
            egreso: (document.getElementById("egresoInput") as HTMLInputElement).value || null
        };

        try {
            const res = await fetch('/api/v0/alumno', {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(alumno)
            });
            const data = await res.json();
            if (res.ok) {
                mensajeModal.style.color = 'green';
                mensajeModal.textContent = data.mensaje;
                await cargarAlumnos();
                form.reset();
            } else {
                mensajeModal.style.color = 'red';
                mensajeModal.textContent = `Error: ${data.error}`;
            }
        } catch (err: any) {
            console.error(err);
            mensajeModal.textContent = "Ocurrió un error inesperado.";
        }
    });
}

function initFormEditarAlumno(): void {
    const form = document.getElementById("formEditarAlumno") as HTMLFormElement;
    const mensajeDiv = document.getElementById("mensajeModalEditar") as HTMLDivElement;
    if (!form || !mensajeDiv) return;

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const alumnoActualizado = {
            luNuevo: (document.getElementById("luNuevoInput") as HTMLInputElement).value.trim() || null,
            apellido: (document.getElementById("apellidoEditarInput") as HTMLInputElement).value.trim() || null,
            nombres: (document.getElementById("nombresEditarInput") as HTMLInputElement).value.trim() || null,
            titulo: (document.getElementById("tituloEditarInput") as HTMLInputElement).value.trim() || null,
            titulo_en_tramite: (document.getElementById("tituloTramiteEditarInput") as HTMLInputElement).value || null,
            egreso: (document.getElementById("egresoEditarInput") as HTMLInputElement).value || null
        };

        const luVieja = (document.getElementById("luViejoInput") as HTMLInputElement).value.trim();

        try {
            const res = await fetch(`/api/v0/alumno/${encodeURIComponent(luVieja)}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(alumnoActualizado)
            });
            const data = await res.json();

            if (res.ok) {
                mensajeDiv.style.color = "green";
                mensajeDiv.textContent = data.mensaje;
                await cargarAlumnos();
                form.reset();
            } else {
                mensajeDiv.style.color = "red";
                mensajeDiv.textContent = data.error ?? "Error al actualizar";
            }
        } catch (err: any) {
            mensajeDiv.style.color = "red";
            mensajeDiv.textContent = "Error al actualizar alumno.";
            console.error(err);
        }
    });
}

// --- Inicialización ---
window.addEventListener('DOMContentLoaded', () => {
    cargarAlumnos();
    initFormCrearAlumno();
    initFormEditarAlumno();
});

// Exponer al scope global para que los onclick del HTML funcionen
(window as any).abrirModal = abrirModal;
(window as any).cerrarModal = cerrarModal;
(window as any).eliminarAlumno = eliminarAlumno;