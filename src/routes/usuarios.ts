import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { getLoginPool } from '../bd/conecciones-bd.js';
import sql from 'mssql';
import { autenticarUsuario } from '../auth.js';
import JWT_SECRET from "../auth.js";


const pool = await getLoginPool(); // asegurarse que el pool esté conectado
const router = Router();


router.post("/register", async (req, res) => {
    const { username, password, email, rol, lu } = req.body;
    try {
        // Validar rol y LU en backend por seguridad
        const allowedRoles = ["usuario", "administrador"];
        if (!allowedRoles.includes(rol)) {
            return res.status(400).json({ error: "Rol inválido" });
        }
        if (rol === "administrador" && lu) {
            return res.status(400).json({ error: "Los administradores no pueden tener LU" });
        }

        // Pre-check: si se envía LU (no null), asegurar que no hay ya un usuario con esa LU
        const luParam = rol === "administrador" ? null : lu;
        /*if (luParam) {
            const existingLu = await pool.request()
                .input("lu", sql.NVarChar(50), luParam)
                .query("SELECT 1 AS existsFlag FROM dbo.usuarios WHERE lu = @lu");
            if (existingLu.recordset.length > 0) {
                return res.status(400).json({ error: "Ya existe un usuario con esa LU" });
            }
        } */

        const hashedPassword = await bcrypt.hash(password, 10);

        await pool
            .request()
            .input("username", username)
            .input("password_hash", hashedPassword)
            .input("email", email)
            .input("rol", rol)
            .input("lu", sql.NVarChar(50), luParam)
            .query("INSERT INTO usuarios (username, password_hash, email, rol, lu) VALUES (@username, @password_hash, @email, @rol, @lu)");
        return res.status(201).json({ message: "Usuario creado con éxito" });
    } catch (err: any) {
        console.error(err);
        // SQL Server: 547 = FK constraint check violation
        // 2627 / 2601 = unique constraint / primary key violation
        const sqlErrNumber = err?.number;
        const fullErrMessage = err?.message || '';

        if (sqlErrNumber === 547) {
            // Foreign key violation -> no existe el alumno con esa LU
            return res.status(400).json({ error: "No existe un alumno con esa LU" });
        }
        if (sqlErrNumber === 2627 || sqlErrNumber === 2601) {
            // Duplicados: la excepción de SQL Server incluye el valor duplicado.
            // Extraer el valor entre paréntesis y comprobar en la BD si corresponde a username o a lu.
            const dupMatch = fullErrMessage.match(/The duplicate key value is \(([^)]+)\)/i) || fullErrMessage.match(/duplicate key value \(([^)]+)\)/i) || fullErrMessage.match(/\(([^)]+)\)$/);
            const dupVal = dupMatch ? dupMatch[1].trim() : null;

            try {
                if (dupVal) {
                    // Comprobar username
                    const checkUser = await pool.request()
                        .input('usernameCheck', sql.NVarChar(100), dupVal)
                        .query('SELECT 1 AS found FROM dbo.usuarios WHERE username = @usernameCheck');
                    if (checkUser.recordset.length > 0) {
                        return res.status(400).json({ error: 'Ya existe un usuario con ese username' });
                    }

                    // Comprobar LU
                    const checkLu = await pool.request()
                        .input('luCheck', sql.NVarChar(50), dupVal)
                        .query('SELECT 1 AS found FROM dbo.usuarios WHERE lu = @luCheck');
                    if (checkLu.recordset.length > 0) {
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
        const pool = await getLoginPool();
        const user = await autenticarUsuario(pool, username, password);
        if (!user) return res.status(401).json({ error: "Usuario o contraseña incorrectos" });

        // Include LU in token payload for non-admin users to avoid extra DB lookups
        const payload: any = { id: user.id, username: user.username, rol: user.rol, nombre: (user as any).nombre };
        if (user.rol !== 'administrador' && (user as any).lu) {
            payload.lu = (user as any).lu;
        }
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });

        // Setear cookie para que el navegador la incluya automáticamente en solicitudes
        // No la hacemos HttpOnly porque el frontend también la usa para redirección UX (localStorage se sigue usando)
        res.cookie("token", token, { sameSite: 'lax', path: '/' });

        return res.json({ message: "Login exitoso", token });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Error al iniciar sesión" });
    }
});

export default router;

process.env.JWT_SECRET