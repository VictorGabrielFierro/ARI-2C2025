import { Alumno } from "./tipos/index.js";
import { checkToken, getAuthHeaders } from "./authCheck.js";
checkToken();

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

// --- Funciones auxiliares ---
function formatFecha(fecha?: string | null): string {
    if (!fecha) return '-';
    const fechaSimple = fecha.split('T')[0];
    const [year, month, day] = fechaSimple.split('-');
    return `${day}/${month}/${year}`;
}

async function cargarAlumnos(): Promise<void> {
    const mensajeDiv = document.getElementById('mensaje') as HTMLDivElement;
    const tabla = document.getElementById('tablaAlumnos') as HTMLTableElement;

    if (!mensajeDiv || !tabla) return;

    try {
        // Tomamos el token del localStorage
        const token = localStorage.getItem("token");
        if (!token) throw new Error("No hay token disponible. Por favor logueate.");

        // Hacemos fetch enviando el token en el header Authorization
        const res = await fetch('/api/v0/alumnos/alumnos', {
            headers: getAuthHeaders()
        });

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

export async function eliminarAlumno(): Promise<void> {
    const input = document.getElementById('luEliminar') as HTMLInputElement;
    const mensajeModal = document.getElementById("mensajeModalEliminar") as HTMLDivElement;
    if (!input || !mensajeModal) return;

    const lu = input.value.trim();
    if (!lu) return;

    try {
        const res = await fetch(`/api/v0/alumnos/alumnos/${encodeURIComponent(lu)}`, {
            method: "DELETE",
            headers: getAuthHeaders()
        });

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

export function initFormCrearAlumno(): void {
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
            const res = await fetch('/api/v0/alumnos/alumno', {
                method: "POST",
                headers: getAuthHeaders(),
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

export function initFormEditarAlumno(): void {
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
            const res = await fetch(`/api/v0/alumnos/alumno/${encodeURIComponent(luVieja)}`, {
                method: "PUT",
                headers: getAuthHeaders(),
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

window.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem("token");
    if (!token) {
        window.location.href = "./login.html";
        return;
    }

    try {
        const res = await fetch("/api/v0/usuarios/validar-token", {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (!res.ok) {
            localStorage.removeItem("token");
            window.location.href = "./login.html";
            return;
        }

        const contenido = document.getElementById("contenido");
        if (contenido) contenido.style.display = "block";

        cargarAlumnos();
        initFormCrearAlumno();
        initFormEditarAlumno();
    } catch (err) {
        window.location.href = "./login.html";
    }
});

// Exponer al scope global para que los onclick del HTML funcionen
(window as any).abrirModal = abrirModal;
(window as any).cerrarModal = cerrarModal;
(window as any).eliminarAlumno = eliminarAlumno;