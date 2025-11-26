import { Router } from "express";
import { verificarTokenMiddleware, requireRole } from "../auth.js";
import { obtenerMetadataTabla } from "../bd/metadata.js";

const router = Router();

router.get("/:tabla", verificarTokenMiddleware, requireRole('administrador'), async (req, res) => {
    const tabla = req.params.tabla;

    if (!tabla) {
        return res.status(400).json({ error: "Falta el nombre de la tabla" });
    }
    
    try {
        const metadata = await obtenerMetadataTabla(tabla);
        return res.json(metadata);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Error al obtener metadata de la tabla" });
    }
});

export default router;
