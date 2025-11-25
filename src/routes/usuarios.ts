import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { getLoginPool } from '../bd/conecciones-bd.js';
import { autenticarUsuario } from '../auth.js';
import JWT_SECRET from "../auth.js";


const pool = await getLoginPool(); // asegurarse que el pool esté conectado
const router = Router();


router.post("/register", async (req, res) => {
    const { username, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        await pool
            .request()
            .input("username", username)
            .input("password", hashedPassword)
            .query("INSERT INTO usuarios (username, password) VALUES (@username, @password)");
        res.status(201).json({ message: "Usuario creado con éxito" });
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ error: "Error al registrar usuario" });
    }
});

router.post("/login", async (req, res) => {
    const { username, password } = req.body;
    try {
        const pool = await getLoginPool();
        const user = await autenticarUsuario(pool, username, password);
        if (!user) return res.status(401).json({ error: "Usuario o contraseña incorrectos" });

        const token = jwt.sign(
            { id: user.id, username: user.username, rol: user.rol },
            JWT_SECRET,
            { expiresIn: "1h" }
        );

        return res.json({ message: "Login exitoso", token });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Error al iniciar sesión" });
    }
});

export default router;

process.env.JWT_SECRET