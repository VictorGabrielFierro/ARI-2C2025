import { checkToken, getAuthHeaders } from "./authCheck.js";
checkToken();

/**
 * inscripcion.ts
 * - Carga lista de materias (panel izquierdo)
 * - Muestra cursada más reciente en el panel central
 * - Muestra inscripciones del alumno (panel derecho)
 * - Permite Inscribirse y Desinscribirse
 *
 * Requisitos:
 * - El login debe dejar token en localStorage ("token")
 * - Preferible: si el login guarda LU en localStorage ("lu") lo usará.
 *   Si no existe, intentará obtener información del usuario desde
 *   /api/v0/usuarios/validar-token (si el backend devuelve info).
 */

/* ---------------------------
   Tipos
   --------------------------- */
type Materia = {
    MateriaId: number;
    Nombre: string;
    Descripcion?: string | null;
};

type Cursada = {
    MateriaId: number;
    Cuatrimestre: number;
    Profesor?: string | null;
    Aula?: string | null;
    Horario?: string | null;
    Cupos?: number | null;
    [k: string]: any;
};

type Inscripcion = {
    MateriaId: number;
    Cuatrimestre: number;
    nombre?: string;
    descripcion?: string;
};

/* ---------------------------
   Selectores del DOM
   --------------------------- */
const listaMateriasEl = document.getElementById("listaMaterias") as HTMLUListElement;
const listaInscriptoEl = document.getElementById("listaInscripto") as HTMLUListElement;
const tituloMateriaEl = document.getElementById("tituloMateria") as HTMLElement;
const infoCursadaEl = document.getElementById("infoCursada") as HTMLDivElement;
const btnAccion = document.getElementById("btnAccion") as HTMLButtonElement;

/* ---------------------------
   Estado
   --------------------------- */
let materias: Materia[] = [];
let inscripciones: Inscripcion[] = [];
let materiaSeleccionada: Materia | null = null;
let cursadaSeleccionada: Cursada | null = null;
let usuarioLU: string | null = null;

/* ---------------------------
   Utilidades
   --------------------------- */
function obtenerToken(): string | null {
    return localStorage.getItem("token");
}

/**
 * Intenta obtener LU del localStorage o desde validar-token si el backend la devuelve.
 */
async function obtenerLU(): Promise<string | null> {
    const luLocal = localStorage.getItem("lu");
    if (luLocal) return luLocal;

    // Intentar pedir info al endpoint validar-token (si lo devuelve)
    try {
        const token = obtenerToken();
        if (!token) return null;

        const res = await fetch("/api/v0/usuarios/validar-token", {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (!res.ok) return null;

        // Si el endpoint devuelve un JSON con la info del usuario (p.ej. { lu: "123", ... })
        const data = await res.json();
        if (data?.lu) {
            localStorage.setItem("lu", data.lu);
            return data.lu;
        }

        return null;
    } catch (err) {
        console.error("Error al intentar obtener LU desde validar-token:", err);
        return null;
    }
}

/* ---------------------------
   Rendering
   --------------------------- */

function limpiarSeleccion() {
    const lis = listaMateriasEl.querySelectorAll("li");
    lis.forEach(li => li.classList.remove("selected"));
}

function marcarMateriaEnLista(materiaId: number) {
    limpiarSeleccion();
    const li = listaMateriasEl.querySelector<HTMLLIElement>(`li[data-id="${materiaId}"]`);
    if (li) li.classList.add("selected");
}

function renderListaMaterias() {
    listaMateriasEl.innerHTML = "";
    materias.forEach(m => {
        const li = document.createElement("li");
        li.textContent = m.Nombre;
        li.setAttribute("data-id", String(m.MateriaId));
        li.title = m.Descripcion ?? "";
        li.addEventListener("click", async () => {
            await onClickMateria(m.MateriaId);
        });
        listaMateriasEl.appendChild(li);
    });
}

function renderInscripciones() {
    listaInscriptoEl.innerHTML = "";
    inscripciones.forEach(i => {
        const li = document.createElement("li");
        li.textContent = i.nombre ?? `Materia ${i.MateriaId} - ${i.Cuatrimestre}`;
        li.setAttribute("data-materiaid", String(i.MateriaId));
        li.setAttribute("data-cuatrimestre", String(i.Cuatrimestre));
        li.addEventListener("click", async () => {
            // al seleccionar una inscripcion, mostramos los detalles de esa cursada
            const materiaId = Number(li.getAttribute("data-materiaid"));
            const cuatrimestre = Number(li.getAttribute("data-cuatrimestre"));
            await mostrarCursadaPorMateriaYCuatri(materiaId, cuatrimestre);
        });
        listaInscriptoEl.appendChild(li);
    });
}

function mostrarCursadaEnCentro(c: Cursada | null, nombreMateria?: string) {
    if (!c) {
        tituloMateriaEl.textContent = "Seleccione una materia";
        infoCursadaEl.innerHTML = `<p>No hay información de cursada para la materia seleccionada.</p>`;
        btnAccion.style.display = "none";
        cursadaSeleccionada = null;
        return;
    }

    cursadaSeleccionada = c;
    tituloMateriaEl.textContent = nombreMateria ?? `Materia ${c.MateriaId}`;

    // Construir HTML con los campos más relevantes (puede extenderse)
    const htmlLines: string[] = [];
    htmlLines.push(`<p><strong>Cuatrimestre:</strong> ${c.Cuatrimestre}</p>`);
    if (c.Profesor) htmlLines.push(`<p><strong>Profesor:</strong> ${c.Profesor}</p>`);
    // if (c.Aula) htmlLines.push(`<p><strong>Aula:</strong> ${c.Aula}</p>`);
    // if (c.Horario) htmlLines.push(`<p><strong>Horario:</strong> ${c.Horario}</p>`);
    // if (typeof c.Cupos !== "undefined" && c.Cupos !== null) htmlLines.push(`<p><strong>Cupos:</strong> ${c.Cupos}</p>`);
    // if (c["Descripcion"] || c["descripcion"]) {
    //     htmlLines.push(`<p><strong>Descripción:</strong> ${c["Descripcion"] ?? c["descripcion"]}</p>`);
    // }

    infoCursadaEl.innerHTML = htmlLines.join("\n");

    // Determinar si el usuario está inscripto a esta materia-cuatrimestre
    if (usuarioLU && isInscripto(usuarioLU, c.MateriaId, c.Cuatrimestre)) {
        btnAccion.textContent = "Desinscribirse";
        btnAccion.dataset.action = "desinscribir";
        btnAccion.style.display = "inline-block";
    } else {
        btnAccion.textContent = "Inscribirse";
        btnAccion.dataset.action = "inscribir";
        btnAccion.style.display = "inline-block";
    }
}

/* ---------------------------
   Helpers de negocio
   --------------------------- */
function isInscripto(lu: string, materiaId: number, cuatrimestre: number) {
    return inscripciones.some(i => i.MateriaId === materiaId && i.Cuatrimestre === cuatrimestre && String(lu) === String((i as any).lu ?? lu));
}

/* ---------------------------
   Llamados a API
   --------------------------- */

async function cargarMateriasDesdeAPI() {
    try {
        const res = await fetch("/api/v0/materias", {
            headers: getAuthHeaders()
        });

        if (!res.ok) {
            throw new Error("Error al obtener materias");
        }

        const data: Materia[] = await res.json();
        materias = data;
        renderListaMaterias();
    } catch (err: any) {
        console.error(err);
        listaMateriasEl.innerHTML = `<li style="color:red;">Error al cargar materias</li>`;
    }
}

async function cargarInscripcionesDesdeAPI() {
    try {
        if (!usuarioLU) return;
        const res = await fetch(`/api/v0/cursa/${encodeURIComponent(usuarioLU)}`, {
            headers: getAuthHeaders()
        });

        if (!res.ok) {
            throw new Error("Error al obtener inscripciones");
        }

        const data: Inscripcion[] = await res.json();
        inscripciones = data;
        renderInscripciones();
    } catch (err: any) {
        console.error(err);
        listaInscriptoEl.innerHTML = `<li style="color:red;">Error al cargar inscripciones</li>`;
    }
}

async function obtenerCursadaMasRecienteAPI(materiaId: number): Promise<Cursada | null> {
    try {
        const res = await fetch(`/api/v0/cursadas/ultima/${materiaId}`, {
            headers: getAuthHeaders()
        });
        if (!res.ok) {
            if (res.status === 400) throw new Error("ID de materia inválido");
            if (res.status === 404) throw new Error("No hay cursadas para esta materia");
            if (res.status === 500) throw new Error("Error al obtener la cursada");
            //throw new Error("Error al obtener cursada");
        }
        const data: Cursada = await res.json();
        return data;
    } catch (err) {
        console.error(err);
        return null;
    }
}

/* ---------------------------
   Acciones usuario
   --------------------------- */

async function onClickMateria(materiaId: number) {
    materiaSeleccionada = materias.find(m => m.MateriaId === materiaId) ?? null;
    if (!materiaSeleccionada) return;

    marcarMateriaEnLista(materiaId);
    // Cargar la cursada mas reciente para esa materia
    const c = await obtenerCursadaMasRecienteAPI(materiaId);
    await mostrarCursadaPorMateriaYCuatri(materiaId, c?.Cuatrimestre ?? -1, c);
}

async function mostrarCursadaPorMateriaYCuatri(materiaId: number, cuatrimestre: number, cursadaYaCargada?: Cursada | null) {
    // Si ya tenemos la cursada pasada por parámetro y coincide, la usamos
    let cursada = cursadaYaCargada ?? null;
    if (!cursada && cuatrimestre !== -1) {
        // Si cuatrimestre es -1 -> no hay cursada
        // Si desdeInscripcion pedimos mostrar la cursada específica del inscripto, el endpoint puede no existir
        // Para simplicidad, si desdeInscripcion usamos la misma información que vino en inscripciones
        cursada = await obtenerCursadaMasRecienteAPI(materiaId);
    }

    // Mostrar
    mostrarCursadaEnCentro(cursada, materiaSeleccionada?.Nombre);
}

/* ---------------------------
   Inscribir / Desinscribir
   --------------------------- */
async function inscribir() {
    if (!usuarioLU) {
        alert("No se pudo detectar su LU. Por favor inicie sesión nuevamente.");
        return;
    }
    if (!cursadaSeleccionada) {
        alert("No hay cursada seleccionada para inscribirse.");
        return;
    }

    try {
        const body = {
            lu: usuarioLU,
            materiaId: cursadaSeleccionada.MateriaId,
            cuatrimestre: cursadaSeleccionada.Cuatrimestre
        };

        const res = await fetch("/api/v0/cursa", {
            method: "POST",
            headers: {
                ...getAuthHeaders(),
                "Content-Type": "application/json"
            },
            body: JSON.stringify(body)
        });

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data?.error || "Error al inscribir");
        }

        // recargar inscripciones
        await cargarInscripcionesDesdeAPI();
        // refrescar vista central para cambiar el botón
        mostrarCursadaEnCentro(cursadaSeleccionada, materiaSeleccionada?.Nombre);
        alert("Inscripción realizada correctamente.");
    } catch (err: any) {
        console.error(err);
        alert(err.message ?? "Error al inscribir");
    }
}

async function desinscribir() {
    if (!usuarioLU) {
        alert("No se pudo detectar su LU. Por favor inicie sesión nuevamente.");
        return;
    }
    if (!cursadaSeleccionada) {
        alert("No hay cursada seleccionada para desinscribirse.");
        return;
    }

    try {
        const body = {
            lu: usuarioLU,
            materiaId: cursadaSeleccionada.MateriaId,
            cuatrimestre: cursadaSeleccionada.Cuatrimestre
        };

        const res = await fetch("/api/v0/cursa", {
            method: "DELETE",
            headers: {
                ...getAuthHeaders(),
                "Content-Type": "application/json"
            },
            body: JSON.stringify(body)
        });

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data?.error || "Error al desinscribir");
        }

        await cargarInscripcionesDesdeAPI();
        mostrarCursadaEnCentro(cursadaSeleccionada, materiaSeleccionada?.Nombre);
        alert("Desinscripción realizada correctamente.");
    } catch (err: any) {
        console.error(err);
        alert(err.message ?? "Error al desinscribir");
    }
}

/* ---------------------------
   Inicialización
   --------------------------- */
btnAccion.addEventListener("click", async () => {
    const action = btnAccion.dataset.action;
    if (action === "inscribir") {
        await inscribir();
    } else if (action === "desinscribir") {
        await desinscribir();
    }
});

window.addEventListener("DOMContentLoaded", async () => {
    // Verificar token y obtener LU
    const token = obtenerToken();
    if (!token) {
        window.location.href = "./login.html";
        return;
    }

    const lu = await obtenerLU();
    if (!lu) {
        // Forzamos volver a login si no conseguimos LU
        window.location.href = "./login.html";
        return;
    }
    usuarioLU = lu;

    // Cargar datos iniciales
    await Promise.all([
        cargarMateriasDesdeAPI(),
        cargarInscripcionesDesdeAPI()
    ]);

    // Opcional: seleccionar la primera materia por defecto
    if (materias.length > 0) {
        await onClickMateria(materias[0].MateriaId);
    }
});

// Exponer funciones al scope global si lo necesitás (no estrictamente necesario)
(window as any).onClickMateria = onClickMateria;
(window as any).inscribir = inscribir;
(window as any).desinscribir = desinscribir;
