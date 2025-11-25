import express from "express";
import path from "path";
import { carpetaDelArchivoActual } from "./utils.js";
import alumnosRouter from "./routes/alumnos.js";

const app = express();
const PORT = 3000;
const __dirname = carpetaDelArchivoActual();

app.use(express.json());

// Archivos estáticos
app.use(express.static(path.join(__dirname, "../frontend")));
app.use("/certificados", express.static(path.join(__dirname, "../certificados")));

// Rutas principales
app.get("/", (_req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

// Prefijo común para todas las rutas de alumnos
app.use("/api/v0", alumnosRouter);

app.listen(PORT, () => {
    console.log(`Servidor AIDA escuchando en http://localhost:${PORT}`);
});
