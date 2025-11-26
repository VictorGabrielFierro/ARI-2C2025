import { Router, Request, Response } from "express";
import { verificarTokenMiddleware } from "../auth.js";
import {
    obtenerMateriasInscribibles,
    obtenerCursadaMasReciente,
    obtenerInscripcionesAlumno
} from "../bd/consultas-inscripcion.js";

import {
    inscribirAlumno,
    desinscribirAlumno
} from "../bd/modificaciones-inscripcion.js";

const router = Router();

/* ========================
   📌 1. Obtener lista de materias
   ======================== */
router.get("/materias", verificarTokenMiddleware, async (req: Request, res: Response) => {
    try {
        const lu = req.user?.lu;
        const materias = await obtenerMateriasInscribibles(lu ?? '');
        return res.json(materias);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Error al obtener materias" });
    }
});

/* ============================================
   📌 2. Obtener la cursada más reciente de X materia
   ============================================ */
router.get("/cursadas/ultima/:materiaId", verificarTokenMiddleware, async (req: Request, res: Response) => {
    try {
        const materiaId = Number(req.params.materiaId);

        if (isNaN(materiaId)) {
            return res.status(400).json({ error: "ID de materia inválido" });
        }

        const cursada = await obtenerCursadaMasReciente(materiaId);

        if (!cursada) {
            return res.status(404).json({ error: "No hay cursadas para esta materia" });
        }

        return res.json(cursada);

    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Error al obtener la cursada" });
    }
});

/* =================================================
   📌 3. Obtener materias en las que está inscripto un alumno
   ================================================= */
router.get("/cursa", verificarTokenMiddleware, async (req: Request, res: Response) => {
    try {
        const lu = req.user?.lu;

        if (!lu) {
            return res.status(400).json({ error: "LU requerida" });
        }

        // Si es admin puede ver cualquier LU; si es usuario solo puede ver su propia LU
        const requester = (req as any).user;
        if (requester?.rol !== 'administrador' && requester?.lu !== lu) {
            return res.status(403).json({ error: 'Acceso denegado' });
        }

        const inscripciones = await obtenerInscripcionesAlumno(lu);
        return res.json(inscripciones);

    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Error al obtener inscripciones" });
    }
});

/* =======================
   📌 4. Inscribir alumno
   ======================= */
router.post("/cursa", verificarTokenMiddleware, async (req: Request, res: Response) => {
    try {
        const {materiaId, cuatrimestre } = req.body;
        const lu = req.user?.lu;

        if (!lu || !materiaId || !cuatrimestre) {
            return res.status(400).json({ error: "Datos incompletos" });
        }

        const requester = (req as any).user;
        // Allow admins or the owner (lu matches token)
        if (requester?.rol !== 'administrador' && requester?.lu !== lu) {
            return res.status(403).json({ error: 'Acceso denegado' });
        }

        await inscribirAlumno(lu, materiaId, cuatrimestre);
        return res.status(201).json({ mensaje: "Inscripción exitosa" });

    } catch (err: any) {
        console.error(err);

        if (err.message === "YA_INSCRIPTO") {
            return res.status(400).json({ error: "El alumno ya está inscripto" });
        }

        return res.status(500).json({ error: "Error al inscribir alumno" });
    }
});

/* ==========================
   📌 5. Desinscribir alumno
   ========================== */
router.delete("/cursa", verificarTokenMiddleware, async (req: Request, res: Response) => {
    try {
        const {materiaId, cuatrimestre } = req.body;
        const lu = req.user?.lu;

        if (!lu || !materiaId || !cuatrimestre) {
            return res.status(400).json({ error: "Datos incompletos" });
        }

        const requester = (req as any).user;
        // Allow admins or the owner (lu matches token)
        if (requester?.rol !== 'administrador' && requester?.lu !== lu) {
            return res.status(403).json({ error: 'Acceso denegado' });
        }

        await desinscribirAlumno(lu, materiaId, cuatrimestre);
        return res.json({ mensaje: "Desinscripción exitosa" });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Error al desinscribir alumno" });
    }
});

export default router;
