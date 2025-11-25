import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { getPool } from '../coneccion-bd.js';


const pool = await getPool(); // asegurarse que el pool esté conectado

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "clave-secreta";

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
    const result = await pool
      .request()
      .input("username", username)
      .query("SELECT * FROM usuarios WHERE username = @username");

    const user = result.recordset[0];
    if (!user) return res.status(401).json({ error: "Usuario no encontrado" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: "Contraseña incorrecta" });

    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, {
      expiresIn: "1h",
    });

    return res.json({ message: "Login exitoso", token });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: "Error al iniciar sesión" });
  }
});

export default router;
