import { IRecordSet} from "mssql";
import { checkToken, getAuthHeaders } from "./authCheck.js";
checkToken();

interface ColMetadata {
    name: string;
    type: string;
    nullable: boolean;
    identity: boolean;
    editable: boolean;
}

function formatFecha(fecha?: string | null): string {
    if (!fecha) return '-';
    const fechaSimple = fecha.split('T')[0];
    const [year, month, day] = fechaSimple.split('-');
    return `${day}/${month}/${year}`;
}

// ----------------------------------------------------------
// UTILIDAD: leer parámetros de la URL
// ----------------------------------------------------------
function getParam(name: string): string {
    return new URLSearchParams(window.location.search).get(name) || "";
}

const tabla = getParam("tabla");           // ej: "materias"
const singular = getParam("singular");     // ej: "materia"
const plural = getParam("plural");         // ej: "materias"

let pk: IRecordSet<any>;
let columnas: ColMetadata[] = [];

// ----------------------------------------------------------
// MODALES
// ----------------------------------------------------------
export function abrirModal(id: string) {
    const modal = document.getElementById(id);
    if (modal) modal.style.display = "flex";
}

export function cerrarModal(id: string) {
    const modal = document.getElementById(id);
    if (!modal) return;

    modal.style.display = "none";

    const mensajes = modal.querySelectorAll(".mensaje");
    mensajes.forEach(m => (m.textContent = ""));
}

// ----------------------------------------------------------
// OBTENER METADATA + ARMAR PANTALLA
// ----------------------------------------------------------
async function cargarMetadata() {
    const res = await fetch(`/api/v0/metadata/aida.${tabla}`, {
        headers: getAuthHeaders()
    });

    if (!res.ok) throw new Error("No se pudo obtener metadata");

    const data = await res.json();
    pk = data.pk;
    columnas = data.columns;

    generarTablaHTML();
    generarFormCrear();
    generarFormEditar();
    generarFormEliminar();
}

// ----------------------------------------------------------
// GENERAR TABLA HTML DINÁMICAMENTE
// ----------------------------------------------------------
function generarTablaHTML() {
    const thead = document.getElementById("thead")!;
    thead.innerHTML = "";

    columnas.forEach(col => {
        const th = document.createElement("th");
        th.textContent = col.name;
        thead.appendChild(th);
    });
}

// ----------------------------------------------------------
// GENERAR FORMULARIO DE CREAR
// ----------------------------------------------------------
function generarFormCrear() {
    const form = document.getElementById("formCrear") as HTMLFormElement;
    form.innerHTML = "";

    columnas
        .filter(c => !c.identity)
        .forEach(col => {
            const div = document.createElement("div");
            div.innerHTML = `
                <label>${col.name}</label>
                <input id="crear_${col.name}" type="${tipoInput(col.type)}">
            `;
            form.appendChild(div);
        });

    const btn = document.createElement("button");
    btn.textContent = "Crear";
    form.appendChild(btn);

    form.addEventListener("submit", crearRegistro);
}

// ----------------------------------------------------------
// GENERAR FORMULARIO DE EDITAR
// ----------------------------------------------------------
function generarFormEditar() {
    const form = document.getElementById("formEditar") as HTMLFormElement;
    form.innerHTML = "";

    columnas.forEach(col => {
        const div = document.createElement("div");
        div.innerHTML = `
            <label>${col.name}</label>
            <input id="editar_${col.name}" type="${tipoInput(col.type)}">
        `;
        form.appendChild(div);
    });

    const btn = document.createElement("button");
    btn.textContent = "Actualizar";
    form.appendChild(btn);

    form.addEventListener("submit", editarRegistro);
}

// ----------------------------------------------------------
// GENERAR FORMULARIO DE ELIMINAR
// ----------------------------------------------------------
function generarFormEliminar() {
    const form = document.getElementById("formEliminar") as HTMLFormElement;
    form.innerHTML = "";

    columnas.forEach(col => {
        const div = document.createElement("div");
        div.innerHTML = `
            <label>${col.name}</label>
            <input id="eliminar_${col.name}" type="${tipoInput(col.type)}">
        `;
        form.appendChild(div);
    });

    const btn = document.createElement("button");
    btn.textContent = "Eliminar";
    form.appendChild(btn);

    form.addEventListener("submit", eliminarRegistro);
}

// ----------------------------------------------------------
// TIPO INPUT SEGÚN SQL
// ----------------------------------------------------------
function tipoInput(sqlType: string) {
    if (sqlType.includes("date")) return "date";
    if (sqlType.includes("int") || sqlType.includes("decimal")) return "number";
    return "text";
}

// ----------------------------------------------------------
// CARGAR DATOS EN TABLA
// ----------------------------------------------------------
async function cargarRegistros() {
    const mensaje = document.getElementById("mensaje")!;
    const tbody = document.getElementById("tbody")!;

    try {
        const res = await fetch(`/api/v0/crud/aida.${tabla}/${plural}`, {
            headers: getAuthHeaders()
        });

        if (!res.ok) throw new Error("Error al obtener registros");

        const data = await res.json();

        tbody.innerHTML = "";

        data.forEach((row: any) => {
            const tr = document.createElement("tr");

            columnas.forEach(col => {
                const td = document.createElement("td");
                td.textContent = (col.type == 'date') ? formatFecha(row[col.name]) : (row[col.name] ?? "-");
                tr.appendChild(td);
            });

            tbody.appendChild(tr);
        });

        mensaje.textContent = "";
    } catch (err: any) {
        mensaje.textContent = err.message;
    }
}

// ----------------------------------------------------------
// CREAR REGISTRO
// ----------------------------------------------------------
async function crearRegistro(e: Event) {
    e.preventDefault();

    const form = document.getElementById("formCrear")!;
    const mensaje = document.getElementById("mensajeModalCrear")!;

    const data: any = {};

    columnas.filter(c => !c.identity).forEach(col => {
        data[col.name] = (document.getElementById(`crear_${col.name}`) as HTMLInputElement).value || null;
    });

    try {
        const res = await fetch(`/api/v0/crud/aida.${tabla}/${singular}`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify(data)
        });

        const json = await res.json();

        if (!res.ok) throw new Error(json.error || "Error al crear");

        mensaje.style.color = "green";
        mensaje.textContent = json.mensaje;

        cargarRegistros();
        (form as HTMLFormElement).reset();
    } catch (err: any) {
        mensaje.style.color = "red";
        mensaje.textContent = err.message;
    }
}

// ----------------------------------------------------------
// EDITAR REGISTRO
// ----------------------------------------------------------
async function editarRegistro(e: Event) {
    e.preventDefault();

    const mensaje = document.getElementById("mensajeModalEditar")!;
    const data: any = {};

    columnas.forEach(col => {
        data[col.name] = (document.getElementById(`editar_${col.name}`) as HTMLInputElement).value || null;
    });

    const id = pk
    .map(col => encodeURIComponent(data[col.pk]))   // obtengo cada valor PK desde data
    .join("__");  // los concateno con separador


    try {
        const res = await fetch(`/api/v0/crud/aida.${tabla}/${singular}/${encodeURIComponent(id)}`, {
            method: "PUT",
            headers: getAuthHeaders(),
            body: JSON.stringify(data)
        });
        const json = await res.json();

        if (!res.ok) throw new Error(json.error || "Error al actualizar");

        mensaje.style.color = "green";
        mensaje.textContent = json.mensaje;

        cargarRegistros();
    } catch (err: any) {
        mensaje.style.color = "red";
        mensaje.textContent = err.message;
    }
}

// ----------------------------------------------------------
// ELIMINAR REGISTRO
// ----------------------------------------------------------
export async function eliminarRegistro(e: Event) {
    e.preventDefault();
    const mensaje = document.getElementById("mensajeModalEliminar")!;
    const data: any = {};

    columnas.forEach(col => {
        data[col.name] = (document.getElementById(`eliminar_${col.name}`) as HTMLInputElement).value || null;
    });

    const id = pk
    .map(col => encodeURIComponent(data[col.pk]))   // obtengo cada valor PK desde data
    .join("__");  // los concateno con separador


    try {
        const res = await fetch(`/api/v0/crud/aida.${tabla}/${plural}/${id}`, {
            method: "DELETE",
            headers: getAuthHeaders()
        });

        const json = await res.json();

        if (!res.ok) throw new Error(json.error || "Error al eliminar");

        mensaje.style.color = "green";
        mensaje.textContent = json.mensaje;

        cargarRegistros();
    } catch (err: any) {
        mensaje.style.color = "red";
        mensaje.textContent = err.message;
    }
}


function inicializarSelectorTablas() {
    const selector = document.getElementById("selectorTablas") as HTMLSelectElement;
    if (!selector) return;

    // Marca la opción correspondiente a la tabla actual
    selector.value = `${tabla}|${singular}|${plural}`;

    // Cuando el usuario selecciona otra tabla, recargar la página
    selector.addEventListener("change", () => {
        const [nuevaTabla, nuevoSingular, nuevoPlural] = selector.value.split("|");

        window.location.href = `crud.html?tabla=${nuevaTabla}&singular=${nuevoSingular}&plural=${nuevoPlural}`;
    });
}


// ----------------------------------------------------------
// INICIALIZACIÓN
// ----------------------------------------------------------
window.addEventListener("DOMContentLoaded", async () => {
    inicializarSelectorTablas()

    if (!tabla || !singular || !plural) {
        alert("Faltan parámetros en la URL (tabla, singular, plural)");
        return;
    }

    (document.getElementById("tituloCrud") as HTMLElement).textContent = `CRUD de ${tabla}`;
    (document.getElementById("tituloCrear") as HTMLElement).textContent = `Crear ${singular}`;
    (document.getElementById("tituloEditar") as HTMLElement).textContent = `Editar ${singular}`;
    (document.getElementById("tituloEliminar") as HTMLElement).textContent = `Eliminar ${singular}`;

    await cargarMetadata();
    await cargarRegistros();
});

// Exponer funciones globalmente
(window as any).abrirModal = abrirModal;
(window as any).cerrarModal = cerrarModal;
(window as any).eliminarRegistro = eliminarRegistro;
