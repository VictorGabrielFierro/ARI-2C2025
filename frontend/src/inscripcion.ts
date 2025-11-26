import { checkToken, getAuthHeaders } from "./authCheck.js";
checkToken();

/* ---------------------------
   Tipos (Igual que antes)
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

const mensajeAccionEl = document.getElementById("mensajeAccion") as HTMLElement;

/* ---------------------------
   Estado (Igual que antes)
   --------------------------- */
let materias: Materia[] = [];
let inscripciones: Inscripcion[] = [];
let materiaSeleccionada: Materia | null = null;
let cursadaSeleccionada: Cursada | null = null;

/* ---------------------------
   Utilidades (Igual que antes)
   --------------------------- */
function obtenerToken(): string | null {
    return localStorage.getItem("token");
}

// UTILIDAD PARA MOSTRAR MENSAJES
function mostrarMensajeEstado(mensaje: string, tipo: 'exito' | 'error' | 'neutro') {
    if (!mensajeAccionEl) return;
    
    mensajeAccionEl.textContent = mensaje;
    
    if (tipo === 'exito') {
        mensajeAccionEl.style.color = 'green';
    } else if (tipo === 'error') {
        mensajeAccionEl.style.color = 'red';
    } else {
        mensajeAccionEl.style.color = 'black';
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
    
    infoCursadaEl.innerHTML = htmlLines.join("\n");

    // Determinar si el usuario está inscripto a esta materia-cuatrimestre
    if (isInscripto(c.MateriaId, c.Cuatrimestre)) {
        btnAccion.textContent = "Desinscribirse";
        btnAccion.dataset.action = "desinscribir";
        btnAccion.style.display = "inline-block";
    } else {
        btnAccion.textContent = "Inscribirse";
        btnAccion.dataset.action = "inscribir";
        btnAccion.style.display = "inline-block";
        // Estilo opcional para el botón de inscribir
        btnAccion.style.backgroundColor = ""; // Volver al default
    }
}

/* ---------------------------
   Helpers de negocio
   --------------------------- */
function isInscripto(materiaId: number, cuatrimestre: number) {
    return inscripciones.some(i => i.MateriaId === materiaId && i.Cuatrimestre === cuatrimestre);
}

/* ---------------------------
   Llamados a API (Igual que antes)
   --------------------------- */

async function cargarMateriasDesdeAPI() {
    try {
        const res = await fetch("/api/v0/materias", { headers: getAuthHeaders() });
        if (!res.ok) throw new Error("Error al obtener materias");
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
        const res = await fetch(`/api/v0/cursa`, { headers: getAuthHeaders() });
        if (!res.ok) throw new Error("Error al obtener inscripciones");
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
        const res = await fetch(`/api/v0/cursadas/ultima/${materiaId}`, { headers: getAuthHeaders() });
        if (!res.ok) {
            // Manejo de errores silencioso para no romper flujo visual
            return null; 
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
    mostrarMensajeEstado("", "neutro");
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
   Inscribir / Desinscribir (MODIFICADOS)
   --------------------------- */
async function inscribir() {
    // Limpiamos mensaje previo
    mostrarMensajeEstado("", "neutro");

    if (!cursadaSeleccionada) {
        mostrarMensajeEstado("No hay cursada seleccionada.", "error");
        return;
    }

    try {
        const body = {
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

        // Recargar datos
        await cargarInscripcionesDesdeAPI();
        
        // Refrescar vista
        mostrarCursadaEnCentro(cursadaSeleccionada, materiaSeleccionada?.Nombre);
        
        // MENSAJE DE ÉXITO EN TEXTO
        mostrarMensajeEstado("✅ Inscripción realizada correctamente.", "exito");
        
    } catch (err: any) {
        console.error(err);
        mostrarMensajeEstado(`❌ ${err.message ?? "Error al inscribir"}`, "error");
    }
}

async function desinscribir() {
    // Limpiamos mensaje previo
    mostrarMensajeEstado("", "neutro");

    if (!cursadaSeleccionada) {
        mostrarMensajeEstado("No hay cursada seleccionada.", "error");
        return;
    }

    try {
        const body = {
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

        // MENSAJE DE ÉXITO EN TEXTO
        mostrarMensajeEstado("✅ Desinscripción realizada correctamente.", "exito");

    } catch (err: any) {
        console.error(err);
        mostrarMensajeEstado(`❌ ${err.message ?? "Error al desinscribir"}`, "error");
    }
}

/* ---------------------------
   Inicialización
   --------------------------- */
// Modificamos esto para recibir el evento 'e'
btnAccion.addEventListener("click", async (e) => {
    e.preventDefault(); // 🛑 ESTO EVITA LA RECARGA DE PÁGINA
    
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
