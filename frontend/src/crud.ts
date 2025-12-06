import { checkToken, getAuthHeaders } from "./authCheck.js";
checkToken();

interface ColMetadata {
    name: string;
    type: string;
    pretty_name: string;
    identity: boolean;
    references?: {
        table: string;
        column: string;
        display_column: string;
        pretty_name: string;
    };
}

function formatFecha(fecha?: string | null): string {
    if (!fecha) return '-';
    const fechaSimple = fecha.split('T')[0];
    const [year, month, day] = fechaSimple.split('-');
    return `${day}/${month}/${year}`;
}
// ----------------------------------------------------------
// UTILIDAD: Limpiar objeto (Saca nulls y undefined)
// ----------------------------------------------------------
function limpiarObjeto(obj: any) {
    const limpio: any = { ...obj };
    Object.keys(limpio).forEach(key => {
        // Borramos null, undefined. 
        // Nota: Dejamos "" (string vacío) por si quieres guardar texto vacío.
        // Si prefieres que vacío sea null, cambia la condición.
        if (limpio[key] === null || limpio[key] === undefined) {
            delete limpio[key];
        }
    });
    return limpio;
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

let pk: {pk: string}[];
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
    const res = await fetch(`/api/v0/metadata/${tabla}`, {
        headers: getAuthHeaders()
    });

    if (!res.ok) throw new Error("No se pudo obtener metadata");

    const data = await res.json();
    pk = data.pk;
    columnas = data.columns;


    generarTablaHTML();
    generarFormCrear();
    generarFormEditar();
}

// ----------------------------------------------------------
// GENERAR TABLA HTML DINÁMICAMENTE
// ----------------------------------------------------------
function generarTablaHTML() {
    const thead = document.getElementById("thead")!;
    thead.innerHTML = "";

    columnas.forEach(col => {
        const th = document.createElement("th");
        th.textContent = col.pretty_name;
        thead.appendChild(th);

        if (col.references){
            const thExtra = document.createElement("th")
            thExtra.textContent = col.references.pretty_name;
            thead.appendChild(thExtra)
        }
    });

    // // columnas display derivadas de metadata.references
    // columnasDisplay.forEach((cd: string) => {
    //     const th = document.createElement("th");
    //     th.textContent = cd.replace("_display", " (detalle)");
    //     thead.appendChild(th);
    // });

    // Agrego una columna para las acciones 
    const thAcciones = document.createElement("th");
    thAcciones.textContent = "Acciones";
    thead.appendChild(thAcciones);
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

    const sonTodasPK = columnas.every(col => pk.some(p => p.pk === col.name));

    if (sonTodasPK) {
        // CASO ESPECIAL: No hay campos editables reales
        const mensaje = document.createElement("p");
        mensaje.textContent = "No se permite editar. Elimine y cree otro.";
        mensaje.style.color = "red"; 
        
        form.appendChild(mensaje);
        
        // Importante: Hacemos return para NO agregar inputs ni el botón de guardar
        return; 
    }

    columnas.forEach(col => {
        // 1. VERIFICAMOS SI ES PK
        const esPK = pk.some(p => p.pk === col.name);

        const div = document.createElement("div");
        
        /// 2. Lógica del Label:
        //    - Si es PK    -> Muestra "Nombre (Identificador)"
        //    - Si no es PK -> Muestra "Nuevo Nombre"
        
        const textoLabel = esPK ? `${col.name} (Identificador)` : `Nuevo ${col.name}`;

        // Si es PK → input readonly (bloqueado)
        if (esPK) {
            div.innerHTML = `
                <label>${textoLabel}</label>
                <input id="editar_${col.name}" type="text" readonly style="background:#eee;">
            `;
        } else {
            div.innerHTML = `
                <label>${textoLabel}</label>
                <input id="editar_${col.name}" type="${tipoInput(col.type)}">
            `;
        }

        form.appendChild(div);
    });

    const btn = document.createElement("button");
    btn.textContent = "Actualizar";
    form.appendChild(btn);

    form.addEventListener("submit", editarRegistro);
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
        const res = await fetch(`/api/v0/crud/${tabla}/${plural}`, {
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

                if (col.references){
                    const tdExtra = document.createElement("td");
                    tdExtra.textContent = row[col.name + '_display'] ?? "-";
                    tr.appendChild(tdExtra);
                }
            });

            const tdAcciones = document.createElement("td");
            tdAcciones.innerHTML = `
                <button class="btn-editar-fila">Editar</button>
                <button class="btn-eliminar-fila">Eliminar</button>
            `;
            tdAcciones.querySelector(".btn-editar-fila")!.addEventListener("click", () => {
                editarFilaDesdeBoton(row);
            });
            tdAcciones.querySelector(".btn-eliminar-fila")!.addEventListener("click", () => {
                eliminarFilaDesdeBoton(row);
            });

            tr.appendChild(tdAcciones);

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
    const dataLimpia = limpiarObjeto(data);
    try {
        const res = await fetch(`/api/v0/crud/${tabla}/${singular}`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify(dataLimpia)
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
// EDITAR REGISTRO (Corregido)
// ----------------------------------------------------------
async function editarRegistro(e: Event) {
    e.preventDefault();

    const mensaje = document.getElementById("mensajeModalEditar")!;
    const data: any = {};

    columnas.forEach(col => {
        const input = document.getElementById(`editar_${col.name}`) as HTMLInputElement;
        // Si está vacío, ponemos null. 'limpiarObjeto' lo borrará.
        // Al no enviarlo, el Backend NO TOCARÁ esa columna (mantiene el valor viejo).
        data[col.name] = input.value === "" ? null : input.value;
    });

    // 1. Construimos el ID para la URL
    // Nota: encodeURIComponent AQUÍ es correcto para las PARTES (ej: 1600/17 -> 1600%2F17)
    const idUrl = pk
        .map(col => encodeURIComponent(data[col.pk])) 
        .join("__");

    // 2. Limpiamos el cuerpo (Sacamos los nulls)
    const dataLimpia = limpiarObjeto(data);

    try {
        // OJO AQUÍ: Quitamos el 'encodeURIComponent' externo que tenías antes.
        // Ya codificamos las partes arriba. Si codificas de nuevo, el '/' se vuelve '%252F' y falla.
        const res = await fetch(`/api/v0/crud/${tabla}/${singular}/${idUrl}`, {
            method: "PUT",
            headers: getAuthHeaders(),
            body: JSON.stringify(dataLimpia)
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

// Función para elimnar registros de la tabla desde las filas mismas con un boton
async function eliminarFilaDesdeBoton(row: any) {
    if (!confirm("¿Seguro que deseas eliminar este registro?")) return;

    // Construir ID compuesto
    const dataPK: any = {};

    pk.forEach(p => {
        dataPK[p.pk] = row[p.pk];
    });

    const idUrl = pk
        .map(col => encodeURIComponent(dataPK[col.pk]))
        .join("__");

    try {
        const res = await fetch(`/api/v0/crud/${tabla}/${plural}/${idUrl}`, {
            method: "DELETE",
            headers: getAuthHeaders()
        });

        const json = await res.json();
        if (!res.ok) throw new Error((json.code == 23503) ? `No se puede eliminar ya que la tabla ${json.tableWithError} referencia esta entrada` : json.error || "Error al eliminar");

        alert("Registro eliminado correctamente.");
        cargarRegistros();

    } catch (err: any) {
        alert("Error: " + err.message);
    }
}

// funcion para que al tocar el boton de editar desde una fila aparezca el menu para editar, precargado con la informacion correcta
function editarFilaDesdeBoton(row: any) {

    // Abrir modal editar
    abrirModal("modalEditar");

    // Para cada columna, completar el input correspondiente
    columnas.forEach(col => {
        const input = document.getElementById(`editar_${col.name}`) as HTMLInputElement;

        if (!input) return;

        // Si es PK → no editable
        const esPK = pk.some(p => p.pk === col.name);
        if (esPK) {
            input.value = row[col.name];
            input.readOnly = true; 
            input.style.backgroundColor = "#eee"; 
        } else {
            input.value = row[col.name] ?? "";
            input.readOnly = false;
            input.style.backgroundColor = "white";
        }
    });
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

    await cargarMetadata();
    await cargarRegistros();
});

// Exponer funciones globalmente
(window as any).abrirModal = abrirModal;
(window as any).cerrarModal = cerrarModal;