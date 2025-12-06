import { Router } from 'express';
import { Request, Response } from "express";
import { generarTituloPorFecha, generarTituloPorLU } from '../certificados.js';
import { validarFecha, validarLU } from "../validaciones.js";
import { cargarJSON } from "../bd/modificaciones-alumnos.js";
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
            switch (resultadoTitulo.error) {
                case ERRORES.ALUMNO_NO_EGRESADO:
                    return res.status(400).json({ error: `${ERRORES.CERTIFICADO_NO_GENERADO} LU: ${LU}. Descripcion de error: ${resultadoTitulo.error}` });
                case ERRORES.FALLA_AL_GENERAR_CERTIFICADO:
                    return res.status(400).json({ error: `${ERRORES.CERTIFICADO_NO_GENERADO} LU: ${LU}. Descripcion de error: ${resultadoTitulo.error}` });
                default:
                    return res.status(500).json({ error: ERRORES.INTERNO });
            }
        }
        
    } catch (err: any) {
        const mensaje = err?.message ?? String(err);
        if (mensaje === ERRORES.ALUMNO_NO_ENCONTRADO) {
            return res.status(404).json({ error: mensaje });
        }
        if (mensaje === ERRORES.FALLA_AL_CONSULTAR_BD) {
            return res.status(500).json({ error: mensaje });
        }
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
        const mensaje = err?.message ?? String(err);
        if (mensaje === ERRORES.SIN_ALUMNOS_EGRESADOS_EN_FECHA_PROPORCIONADO) {
            return res.status(404).json({ error: mensaje });
        }
        if (mensaje === ERRORES.FALLA_AL_CONSULTAR_BD) {
            return res.status(500).json({ error: mensaje });
        }
        return res.status(500).json({ error: ERRORES.INTERNO });
    }
    
});

// Cargar alumnos desde archivo (JSON)
router.patch("/archivo", verificarTokenMiddleware, requireRole('administrador'), async (req: Request, res: Response) => {
    const alumnos = req.body;
    try {
        if (!Array.isArray(alumnos) || alumnos.length === 0) {
            return res.status(400).send({ error: ERRORES.ARCHIVO_INVALIDO });
        }
        for (const alumno of alumnos) {
            if (!alumno.lu || !alumno.apellido || !alumno.nombres) {
                return res.status(400).json({ error: `${ERRORES.ARCHIVO_INVALIDO}: faltan campos en uno o más registros.` });
            }
        }

        await cargarJSON(alumnos);
        return res.status(200).send({ mensaje: EXITOS.DATOS_CARGADOS_CORRECTAMENTE });
    } catch (err: any) {
        const mensaje = err?.message ?? String(err);
        if (mensaje === ERRORES.ARCHIVO_INVALIDO) {
            return res.status(404).json({ error: mensaje });
        }
        return res.status(500).json({ error: ERRORES.INTERNO });
    }
})

export default router;