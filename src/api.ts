import express from "express";
import path from "path";
import { carpetaDelArchivoActual } from "./utils.js";
import alumnosRouter from "./routes/alumnos.js";
import usuariosRouter from "./routes/usuarios.js";
import metadataRouter from "./routes/metadata.js";
import crudGenerico from "./routes/crud-generico.js";
import inscripcionRouter from "./routes/inscripcion.js";
import certificadosRouter from "./routes/certificados.js";
import { verificarTokenMiddleware, requireRole } from "./auth.js"; // asegurate de la ruta



const app = express();
const PORT = 3000;
const __dirname = carpetaDelArchivoActual();

app.use(express.json());

// Ruta raíz redirige al login
app.get("/", (_req, res) => {
    // Servir la página de login principal desde el directorio de frontend
    res.sendFile(path.join(__dirname, "../frontend/pages/index.html"));
});

// Rutas de alumnos (tabla, cargar, eliminar, crear, editar alumnos)
app.use("/api/v0/alumnos", alumnosRouter);

// Rutas de usuarios (login, creación, etc.)
app.use("/api/v0/usuarios", usuariosRouter);
app.use("/api/v0/metadata", metadataRouter);
app.use("/api/v0/crud", crudGenerico);
app.use("/api/v0", inscripcionRouter);
app.use("/api/v0", certificadosRouter);

// --- Endpoint para validar token ---
app.get("/api/v0/usuarios/validar-token", verificarTokenMiddleware, (_req, res) => {
    res.json({ ok: true, mensaje: "Token válido" });
});

// Rutas protegidas para servir los menús según rol
app.get('/menuAdministrador.html', verificarTokenMiddleware, requireRole('administrador'), (_req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/pages/menuAdministrador.html'));
});

app.get('/menuUsuario.html', verificarTokenMiddleware, requireRole('usuario'), (_req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/pages/menuUsuario.html'));
});

// Archivos estáticos (el resto de páginas públicas)
app.use(express.static(path.join(__dirname, "../frontend/pages")));
app.use('/styles', express.static(path.join(__dirname, "../frontend/styles")));
app.use('/dist', express.static(path.join(__dirname, "../frontend/dist")));
app.use("/certificados", express.static(path.join(__dirname, "../certificados")));



app.listen(PORT, () => {
    console.log(`Servidor AIDA escuchando en http://localhost:${PORT}`);
});
