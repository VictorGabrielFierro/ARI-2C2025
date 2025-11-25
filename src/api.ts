import express from "express";
import path from "path";
import { carpetaDelArchivoActual } from "./utils.js";
import alumnosRouter from "./routes/alumnos.js";
import usuariosRouter from "./routes/usuarios.js";
import { verificarTokenMiddleware } from "./auth.js"; // asegurate de la ruta


const app = express();
const PORT = 3000;
const __dirname = carpetaDelArchivoActual();

app.use(express.json());

// Archivos estáticos
app.use(express.static(path.join(__dirname, "../frontend")));
app.use("/certificados", express.static(path.join(__dirname, "../certificados")));

// Ruta raíz redirige al login
app.get("/", (_req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/pages/login.html"));
});

// Rutas de alumnos (tabla, cargar, eliminar, crear, editar alumnos)
app.use("/api/v0/alumnos", alumnosRouter);

// Rutas de usuarios (login, creación, etc.)
app.use("/api/v0/usuarios", usuariosRouter);

// --- Endpoint para validar token ---
app.get("/api/v0/usuarios/validar-token", verificarTokenMiddleware, (_req, res) => {
    res.json({ ok: true, mensaje: "Token válido" });
});



app.listen(PORT, () => {
    console.log(`Servidor AIDA escuchando en http://localhost:${PORT}`);
});
