import { Router } from 'express';
import { Request, Response } from "express";
import { generarTituloPorFecha, generarTituloPorLU } from '../certificados.js';
import { validarFecha, validarLU, validarAlumno } from "../validaciones.js";
import { cargarJSON, eliminarAlumnoPorLU, insertarAlumno, editarAlumno } from "../bd/modificaciones-alumnos.js";
import { obtenerTablaAlumnos } from "../bd/consultas-alumnos.js"
import { ResultadoRespuesta } from "../tipos/index.js";
import { ERRORES } from "../constantes/errores.js";
import { EXITOS } from "../constantes/exitos.js";
import { verificarTokenMiddleware, requireRole } from "../auth.js";


const router = Router();

// Ruta de los archivos a guardar
const salida = '/certificados';

// Obtener certificado por LU
router.get("/lu/:lu", verificarTokenMiddleware, async (req: Request, res: Response) => {
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
        const requester = (req as any).user;
        if (requester?.rol !== 'administrador' && requester?.lu !== LU) {
            return res.status(403).json({ error: 'Acceso denegado' });
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
router.get("/fecha/:fecha", verificarTokenMiddleware, requireRole('administrador'), async (req: Request, res: Response) => {
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
router.patch("/archivo", verificarTokenMiddleware, requireRole('administrador'), async (req: Request, res: Response) => {
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
})

// Obtener tabla alumnos
router.get("/alumnos", verificarTokenMiddleware, requireRole('administrador'), async (_: Request, res: Response) => {
    try {
        const alumnos = await obtenerTablaAlumnos(); 
        res.json(alumnos); 
    } catch (err) {
        res.status(500).json({ error: "Error interno del servidor" });
    }
});


// Eliminar un alumno
router.delete("/alumnos/:lu", verificarTokenMiddleware, requireRole('administrador'), async (req: Request, res: Response) => {
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
router.post("/alumno", verificarTokenMiddleware, requireRole('administrador'), async (req: Request, res: Response) => {
    const { lu, apellido, nombres, titulo, titulo_en_tramite, egreso } = req.body;
    const reglasValidacion = {
        lu: false,
        apellido: false,
        nombres: false,
        titulo: true,
        titulo_en_tramite: true,
        egreso: true
    };
    // Validar campos obligatorios
    const resultadoValidacion = validarAlumno(
        { lu, apellido, nombres, titulo, titulo_en_tramite, egreso },
        reglasValidacion
    );
    if (!resultadoValidacion.valido) {
        // lanzar el error correspondiente al front
        return res.status(400).json({ error: resultadoValidacion.error });
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
router.put("/alumno/:lu", verificarTokenMiddleware, requireRole('administrador'), async (req: any, res: Response) => {
    try {
        const luViejo = decodeURIComponent(req.params.lu); // LU vieja
        const { luNuevo: lu, apellido, nombres, titulo, titulo_en_tramite, egreso } = req.body;;

        // Validar LU vieja
        if (!luViejo || !validarLU(luViejo)) {
            return res.status(400).json({ error: ERRORES.LU_INVALIDA });
        }
        // Validar campos obligatorios
        const reglasValidacion = {
            lu: true,
            apellido: true,
            nombres: true,
            titulo: true,
            titulo_en_tramite: true,
            egreso: true
        };
        const resultadoValidacion = validarAlumno(
            { lu, apellido, nombres, titulo, titulo_en_tramite, egreso },
            reglasValidacion
        );
        if (!resultadoValidacion.valido) {
            // lanzar el error correspondiente al front
            return res.status(400).json({ error: resultadoValidacion.error });
        }
        await editarAlumno({ 
            luViejo: luViejo.trim(),
            luNuevo: lu ?? null,
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

export default router;