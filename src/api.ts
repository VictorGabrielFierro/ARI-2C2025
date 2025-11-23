import express, { Request, Response } from "express";
import { generarTituloPorFecha, generarTituloPorLU } from './certificados.js';
import { validarFecha, validarLU, validarNombreApellidoTitulo } from "./validaciones.js";
import { carpetaDelArchivoActual } from "./utils.js";
import { cargarJSON, eliminarAlumnoPorLU, insertarAlumno, editarAlumno } from "./modificaciones-bd.js";
import { obtenerTablaAlumnos } from "./consultas-bd.js"
import { ResultadoRespuesta } from "./tipos/index.js";
import path from 'path';
import { ERRORES } from "./constantes/errores.js";
import { EXITOS } from "./constantes/exitos.js";

const app = express();
const PORT = 3000;
const __dirname = carpetaDelArchivoActual()

// Ruta de los archivos a guardar
const salida = '/certificados';

// Middleware para poder recibir JSON en el body
app.use(express.json());

// Servir archivos estáticos desde ../frontend
app.use(express.static(path.join(__dirname, '../frontend')));
// Servir certificados
app.use('/certificados', express.static('/home/manu/Escritorio/TallerBasesDeDatos/certificados'));


// Para que al abrir http://localhost:3000/ vaya directo a index.html
app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor AIDA escuchando en http://localhost:${PORT}`);
});

// Obtener certificado por LU
app.get("/api/v0/lu/:lu", async (req: Request, res: Response) => {
    const luParam = req.params.lu;

    // Verifico que lu no sea undefined, null o vacio y quito espacios al final
    if (typeof luParam !== "string" || !luParam.trim()) {
      return res.status(400).json({ error: ERRORES.LU_INVALIDA });
    }

    const LU = luParam.trim();

    try {
        if(!validarLU(LU)){
            return res.status(400).json({ error: ERRORES.LU_INVALIDA });
        } 
        
        const resultadoTitulo = await generarTituloPorLU(LU, salida);
        if (resultadoTitulo.error == null) {
            const respuesta = {
                mensaje: `${EXITOS.CERTIFICADO_GENERADO_CORRECTAMENTE} LU: ${resultadoTitulo.lu}`,
                archivo: resultadoTitulo.archivo,
            };
            return res.status(200).json(respuesta);
        } else {
            // Si ejecuta esto el error se produjo en generarTitulo()
            switch (resultadoTitulo.error) {
                case ERRORES.ALUMNO_NO_EGRESADO:
                    return res.status(400).json({ error: `${ERRORES.CERTIFICADO_NO_GENERADO} LU: ${LU}. Descripcion de error: ${resultadoTitulo.error}` });
                case ERRORES.FALLA_AL_GENERAR_CERTIFICADO:
                    return res.status(400).json({ error: `${ERRORES.CERTIFICADO_NO_GENERADO} LU: ${LU}. Descripcion de error: ${resultadoTitulo.error}` });
                default:
                    // Otro error inesperado
                    return res.status(500).json({ error: ERRORES.INTERNO });
            }
        }
        
    } catch (err: any) {
        // Si ejecuta esto el error se produjo en obtenerDatosAlumnoPorLU()
        const mensaje = err?.message ?? String(err);
        if (mensaje === ERRORES.ALUMNO_NO_ENCONTRADO) {
            return res.status(404).json({ error: mensaje });
        }
        if (mensaje === ERRORES.FALLA_AL_CONSULTAR_BD) {
            return res.status(500).json({ error: mensaje });
        }
        // Otro error inesperado
        return res.status(500).json({ error: ERRORES.INTERNO });
    }
});

// Obtener certificados por fecha
app.get("/api/v0/fecha/:fecha", async (req: Request, res: Response) => {
    const fechaPAram = req.params.fecha;

    // Verifico que lu no sea undefined, null o vacio y quito espacios al final
    if (typeof fechaPAram !== "string" || !fechaPAram.trim()) {
        return res.status(400).json({ error: ERRORES.FECHA_INVALIDA });
    }
    const fecha = fechaPAram.trim();
    try {
        if (!validarFecha(fecha)){
            return res.status(400).json({ error: ERRORES.FECHA_INVALIDA });
        } 
        
        const titulos = await generarTituloPorFecha(fecha, salida);
        const resultadoJSON: ResultadoRespuesta[] = [];

        for (const titulo of titulos) {
            if (titulo.error == null){
                resultadoJSON.push({
                    mensaje: `${EXITOS.CERTIFICADO_GENERADO_CORRECTAMENTE} LU: ${titulo.lu}`,
                    archivo: titulo.archivo!,
                });
            } else {
                resultadoJSON.push({
                    mensaje: `${ERRORES.CERTIFICADO_NO_GENERADO} LU: ${titulo.lu}. Descripcion de error: ${titulo.error}`,
                    archivo: null,
                });
            }
        }
        return res.status(200).json(resultadoJSON);
    } catch (err: any) {
        // Si ejecuta esto el error se produjo en obtenerDatosAlumnoPorFecha()
        const mensaje = err?.message ?? String(err);
        if (mensaje === ERRORES.SIN_ALUMNOS_EGRESADOS_EN_FECHA_PROPORCIONADO) {
            return res.status(404).json({ error: mensaje });
        }
        if (mensaje === ERRORES.FALLA_AL_CONSULTAR_BD) {
            return res.status(500).json({ error: mensaje });
        }
        // Otro error inesperado
        return res.status(500).json({ error: ERRORES.INTERNO });
    }
    
});

// Cargar alumnos desde archivo (JSON)
app.patch("/api/v0/archivo", async (req: Request, res: Response) => {
    const alumnos = req.body;
    try {
        // Verificar que no esté vacío
        if (!Array.isArray(alumnos) || alumnos.length === 0) {
            return res.status(400).send({ error: ERRORES.ARCHIVO_INVALIDO });
        }
        for (const alumno of alumnos) {
            if (!alumno.lu || !alumno.apellido || !alumno.nombres) {
                return res.status(400).json({ error: `${ERRORES.ARCHIVO_INVALIDO}: faltan campos en uno o más registros.` });
            }
        }

        // Procesar el JSON
        await cargarJSON(alumnos);

        // Enviar respuesta exitosa
        return res.status(200).send({ mensaje: EXITOS.DATOS_CARGADOS_CORRECTAMENTE });

    } catch (err: any) {
        // Si ejecuta esto el error se produjo en cargarJSON()
        const mensaje = err?.message ?? String(err);
        if (mensaje === ERRORES.ARCHIVO_INVALIDO) {
            return res.status(404).json({ error: mensaje });
        }
        // Otro error inesperado
        return res.status(500).json({ error: ERRORES.INTERNO });
    }
});

// Obtener tabla alumnos
app.get("/api/v0/alumnos", async (_: Request, res: Response) => {
    try {
        const alumnos = await obtenerTablaAlumnos(); 
        res.json(alumnos); 
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error interno del servidor" });
    }
});


// Eliminar un alumno
app.delete("/api/v0/alumnos/:lu", async (req: Request, res: Response) => {
    const luParam = req.params.lu;

    // Verifico que lu no sea undefined, null o vacio y quito espacios al final
    if (typeof luParam !== "string" || !luParam.trim()) {
        return res.status(400).json({ error: ERRORES.LU_INVALIDA });
    }

    const LU = luParam.trim();

    try {
        if(!validarLU(LU)){
            return res.status(400).json({ error: ERRORES.LU_INVALIDA });
        } 
        
        await eliminarAlumnoPorLU(LU);
        return res.status(200).json({ mensaje: `Alumno ${LU} eliminado correctamente` });
        
    } catch (err: any) {
        // Si ejecuta esto el error se produjo en eliminarAlumnoPorLU()
        const mensaje = err?.message ?? String(err);
        if (mensaje === ERRORES.ALUMNO_NO_ENCONTRADO) {
            return res.status(404).json({ error: mensaje });
        }
        if (mensaje === ERRORES.FALLA_AL_CONSULTAR_BD) {
            return res.status(500).json({ error: mensaje });
        }
        // Otro error inesperado
        return res.status(500).json({ error: ERRORES.INTERNO });
    }
});

// Crear un alumno
app.post("/api/v0/alumno", async (req: Request, res: Response) => {
    const { lu, apellido, nombres, titulo, titulo_en_tramite, egreso } = req.body;

    // Validar campos obligatorios
    if (!validarLU(lu)) {
        return res.status(400).json({ error: ERRORES.LU_INVALIDA });
    }
    if (!validarNombreApellidoTitulo(apellido)) {
        return res.status(400).json({ error: ERRORES.APELLIDO_INVALIDO });
    }
    if (!validarNombreApellidoTitulo(nombres)) {
        return res.status(400).json({ error: ERRORES.NOMBRES_INVALIDOS });
    }
    if (titulo && !validarNombreApellidoTitulo(titulo)) {
        return res.status(400).json({ error: ERRORES.TITULO_INVALIDO }); // puede ser null
    }
    if (titulo_en_tramite && !validarFecha(titulo_en_tramite)) {  // puede ser null
        return res.status(400).json({ error: ERRORES.TITULO_EN_TRAMITE_INVALIDO });
    }
    if (egreso && !validarFecha(egreso)) {  // puede ser null
        return res.status(400).json({ error: ERRORES.EGRESO_INVALIDO });
    }
    try {
        const nuevoAlumno = await insertarAlumno({
            lu,
            apellido,
            nombres,
            titulo,
            titulo_en_tramite,
            egreso,
        });

        return res.status(201).json({
            mensaje: EXITOS.ALUMNO_CREADO_CORRECTAMENTE,
            alumno: nuevoAlumno,
        });

    } catch (err: any) {
        // Si ejecuta esto el error se produjo en insertarAlumno()
        const mensaje = err?.message ?? String(err);
        if (mensaje === ERRORES.LU_DUPLICADA) {
            return res.status(400).json({ error: mensaje });
        }
        if (mensaje === ERRORES.FALLA_AL_CONSULTAR_BD || mensaje === ERRORES.FALLA_AL_CARGAR_DATOS) {
            return res.status(500).json({ error: mensaje });
        }
        // Otro error inesperado
        return res.status(500).json({ error: ERRORES.INTERNO });
    }
});

// Editar un alumno
app.put("/api/v0/alumno/:lu", async (req: Request, res: Response) => {
    const { lu } = req.params;  // LU vieja
    const { luNuevo, apellido, nombres, titulo, titulo_en_tramite, egreso } = req.body;

    // Validar LU vieja
    if (!lu || !validarLU(lu)) {
        return res.status(400).json({ error: ERRORES.LU_INVALIDA });
    }

    // SACAR ESTE CODIGO REPETIDO
    // Validar campos obligatorios
    if (!validarLU(luNuevo)) {
        return res.status(400).json({ error: ERRORES.LU_INVALIDA });
    }
    if (!validarNombreApellidoTitulo(apellido)) {
        return res.status(400).json({ error: ERRORES.APELLIDO_INVALIDO });
    }
    if (!validarNombreApellidoTitulo(nombres)) {
        return res.status(400).json({ error: ERRORES.NOMBRES_INVALIDOS });
    }
    if (titulo && !validarNombreApellidoTitulo(titulo)) {
        return res.status(400).json({ error: ERRORES.TITULO_INVALIDO }); // puede ser null
    }
    if (titulo_en_tramite && !validarFecha(titulo_en_tramite)) {  // puede ser null
        return res.status(400).json({ error: ERRORES.TITULO_EN_TRAMITE_INVALIDO });
    }
    if (egreso && !validarFecha(egreso)) {  // puede ser null
        return res.status(400).json({ error: ERRORES.EGRESO_INVALIDO });
    }
    try {
        await editarAlumno({ 
            luViejo: lu.trim(),
            luNuevo,
            apellido,
            nombres,
            titulo,
            titulo_en_tramite,
            egreso,
        });

        return res.status(200).json({
            mensaje: EXITOS.ALUMNO_ACTUALIZADO_CORRECTAMENTE,
        });

    } catch (err: any) {
        // Si ejecuta esto el error se produjo en obtenerDatosAlumnoPorLU() o editarAlumno()
        const mensaje = err?.message ?? String(err);
        if (mensaje === ERRORES.LU_DUPLICADA) {
            return res.status(400).json({ error: mensaje });
        }
        if (mensaje === ERRORES.ALUMNO_NO_ENCONTRADO) {
            return res.status(404).json({ error: mensaje });
        }
        if (mensaje === ERRORES.FALLA_AL_CONSULTAR_BD || mensaje === ERRORES.FALLA_AL_CARGAR_DATOS) {
            return res.status(500).json({ error: mensaje });
        }
        // Otro error inesperado
        return res.status(500).json({ error: ERRORES.INTERNO });
    }
});

// // Obtener un alumno
// app.get("/api/v0/alumno/:lu", async (req: Request, res: Response) => {
//     const luParam = req.params.lu;

//     // Verifico que lu no sea undefined, null o vacio y quito espacios al final
//     if (typeof luParam !== "string" || !luParam.trim()) {
//         return res.status(400).json({ error: ERRORES.LU_INVALIDA });
//     }

//     const LU = luParam.trim();
//     if(!validarLU(LU)){
//         return res.status(400).json({ error: ERRORES.LU_INVALIDA });
//     } 
//     try {
//         const alumno = await obtenerDatosAlumnoPorLU(LU);
//         // Devolver los datos del alumno tal como los espera el frontend
//         return res.json({
//             lu: alumno.lu,
//             apellido: alumno.apellido,
//             nombres: alumno.nombres,
//             titulo: alumno.titulo,                     // puede ser null
//             titulo_en_tramite: alumno.titulo_en_tramite, // puede ser null
//             egreso: alumno.egreso                       // puede ser null
//         });
        
//     } catch (err: any) {
//         // Si ejecuta esto el error se produjo en obtenerDatosAlumnoPorLU()
//         const mensaje = err?.message ?? String(err);
//         if (mensaje === ERRORES.ALUMNO_NO_ENCONTRADO) {
//             return res.status(404).json({ error: mensaje });
//         }
//         if (mensaje === ERRORES.FALLA_AL_CONSULTAR_BD) {
//             return res.status(500).json({ error: mensaje });
//         }
//         // Otro error inesperado
//         return res.status(500).json({ error: ERRORES.INTERNO });
//     }
// });
