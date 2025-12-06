import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { getLoginPool } from '../bd/conecciones-bd.js';
import { Pool, QueryResult } from 'pg'; 
import { autenticarUsuario } from '../auth.js';
import JWT_SECRET from "../auth.js";

const pool: Pool = await getLoginPool(); 
const router = Router();


router.post("/register", async (req, res) => {
    const { username, password, email, rol, lu } = req.body;
    const luParam = rol === "administrador" ? null : lu;
    try {
        // Validar rol y LU en backend por seguridad
        const allowedRoles = ["usuario", "administrador"];
        if (!allowedRoles.includes(rol)) {
            return res.status(400).json({ error: "Rol inválido" });
        }
        if (rol === "administrador" && lu) {
            return res.status(400).json({ error: "Los administradores no pueden tener LU" });
        }

        const luParam = rol === "administrador" ? null : lu;

        const hashedPassword = await bcrypt.hash(password, 10);
        
        const insertQuery = `
            INSERT INTO aida.usuarios (username, password_hash, email, rol, lu) 
            VALUES ($1, $2, $3, $4, $5)
        `;

        await pool.query(insertQuery, [username, hashedPassword, email, rol, luParam]);

        return res.status(201).json({ message: "Usuario creado con éxito" });

    } catch (err: any) {
        console.error("Error de registro:", err);
        
        const pgErrCode = err?.code;
        if (pgErrCode === '23503') {
            return res.status(400).json({ error: "No existe un alumno con esa LU" });
        }
        
        if (pgErrCode === '23505') {
            try {
                const checkUser: QueryResult = await pool.query(
                    `SELECT 1 AS found FROM aida.usuarios WHERE username = $1`, [username]
                );
                if (checkUser.rows.length > 0) {
                    return res.status(400).json({ error: 'Ya existe un usuario con ese username' });
                }

                // Comprobar LU
                if (luParam) {
                    const checkLu: QueryResult = await pool.query(
                        `SELECT 1 AS found FROM aida.usuarios WHERE lu = $1`, [luParam]
                    );
                    if (checkLu.rows.length > 0) {
                        return res.status(400).json({ error: 'Ya existe un usuario con esa LU' });
                    }
                }

            } catch (innerErr) {
                console.error('Error comprobando valor duplicado en BD:', innerErr);
            }

            return res.status(400).json({ error: 'Clave duplicada' });
        }

        return res.status(500).json({ error: "Error al registrar usuario" });
    }
});


router.post("/login", async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await autenticarUsuario(pool, username, password);
        if (!user) return res.status(401).json({ error: "Usuario o contraseña incorrectos" });

        const payload: any = { id: user.id, username: user.username, rol: user.rol, nombre: (user as any).nombre };
        if (user.rol !== 'administrador' && (user as any).lu) {
            payload.lu = (user as any).lu;
        }
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });

        // Setear cookie para que el navegador la incluya automáticamente en solicitudes
        res.cookie("token", token, { sameSite: 'lax', path: '/' });

        return res.json({ message: "Login exitoso", token});

    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Error al iniciar sesión" });
    }
});

router.post("/logout", (_, res) => {
    // Borrar cookie
    res.clearCookie("token", { path: "/" });

    return res.json({ message: "Logout exitoso" });
});


export default router;