import { Router, Request, Response } from "express";
import fs from "fs";
import path from "path";
import { verificarTokenMiddleware, requireRole } from "../auth.js";

const router = Router();

// Ruta donde guardás los certificados HTML
const CERTIFICADOS_DIR = path.join(process.cwd(), "certificados"); 
// Asegurate que coincida con tu carpeta real

// ---------------------
// GET /certificados
// Lista todos los archivos existentes
// ---------------------
router.get("/certificados", verificarTokenMiddleware, requireRole('administrador'), async (_req: Request, res: Response) => {
    try {
        const archivos = fs.readdirSync(CERTIFICADOS_DIR);
        
        const lista = archivos
            .filter(a => a.endsWith(".html"))
            .map(a => {
                const partes = a.split("_");
                const lu = partes[1]?.replace(".html", "") ?? "desconocido";
                return { archivo: a, lu };
            });

        return res.json(lista);
    } catch (error) {
        console.error("Error listando certificados:", error);
        return res.status(500).json({ error: "Error al obtener certificados" });
    }
});

// ---------------------
// GET /certificados/:archivo
// Devuelve el archivo para descargar
// ---------------------
router.get("/certificados/descargar/:archivo", verificarTokenMiddleware, requireRole('administrador'), async (req: Request, res: Response) => {
    const archivo = req.params.archivo;
    if (!archivo){
        return res.status(400).json({error: "archivo es undefined"})
    }
    const ruta = path.join(CERTIFICADOS_DIR, archivo);

    if (!fs.existsSync(ruta)) {
        return res.status(404).json({ error: "Archivo no encontrado" });
    }

    return res.download(ruta);
});

export default router;
