import express from "express";
import path from "path";
import { carpetaDelArchivoActual } from "./utils.js";
import alumnosRouter from "./routes/alumnos.js";
import usuariosRouter from "./routes/usuarios.js";
import metadataRouter from "./routes/metadata.js";
import crudGenerico from "./routes/crud-generico.js";
import inscripcionRouter from "./routes/inscripcion.js";
import certificadosRouter from "./routes/certificados.js";
import { verificarTokenMiddleware, requireRole } from "./auth.js";



const app = express();
const PORT = 3000;
const __dirname = carpetaDelArchivoActual();
const middlewaresExpress = [
    {
        ruta: "/",
        router: express.json()

    },
    {
        ruta: "/api/v0/alumnos",
        router: alumnosRouter
    },
    {
        ruta: "/api/v0/usuarios",
        router: usuariosRouter
    },
    {
        ruta: "/api/v0/metadata",
        router: metadataRouter
    },
    {
        ruta: "/api/v0/crud",
        router: crudGenerico
    },
    {
        ruta: "/api/v0",
        router: inscripcionRouter
    },
    {
        ruta: "/api/v0",
        router: certificadosRouter
    },
    {
        ruta: "/",
        router: express.static(path.join(__dirname, "../frontend/pages"))
    },
    {
        ruta: "/styles",
        router: express.static(path.join(__dirname, "../frontend/styles"))
    },
    {
        ruta: "/dist",
        router: express.static(path.join(__dirname, "../frontend/dist"))
    },
    {
        ruta: "/certificados",
        router: express.static(path.join(__dirname, "../certificados"))
    }
]

middlewaresExpress.forEach(mid => app.use(mid.ruta, mid.router))

// Ruta raíz redirige al login
app.get("/", (_req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/pages/index.html"));
});

app.get('/menuAdministrador.html', verificarTokenMiddleware, requireRole('administrador'), (_req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/pages/menuAdministrador.html'));
});

app.get('/menuUsuario.html', verificarTokenMiddleware, requireRole('usuario'), (_req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/pages/menuUsuario.html'));
});

app.listen(PORT, () => {
    console.log(`Servidor AIDA escuchando en http://localhost:${PORT}`);
});
