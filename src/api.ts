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

app.use(express.json());

// Ruta raíz redirige al login
app.get("/", (_req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/pages/index.html"));
});

app.use("/api/v0/alumnos", alumnosRouter);
app.use("/api/v0/usuarios", usuariosRouter);
app.use("/api/v0/metadata", metadataRouter);
app.use("/api/v0/crud", crudGenerico);
app.use("/api/v0", inscripcionRouter);
app.use("/api/v0", certificadosRouter);

app.get('/menuAdministrador.html', verificarTokenMiddleware, requireRole('administrador'), (_req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/pages/menuAdministrador.html'));
});

app.get('/menuUsuario.html', verificarTokenMiddleware, requireRole('usuario'), (_req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/pages/menuUsuario.html'));
});

app.use(express.static(path.join(__dirname, "../frontend/pages")));
app.use('/styles', express.static(path.join(__dirname, "../frontend/styles")));
app.use('/dist', express.static(path.join(__dirname, "../frontend/dist")));
app.use("/certificados", express.static(path.join(__dirname, "../certificados")));


app.listen(PORT, () => {
    console.log(`Servidor AIDA escuchando en http://localhost:${PORT}`);
});
