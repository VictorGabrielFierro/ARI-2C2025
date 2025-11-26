import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { getLoginPool } from '../bd/conecciones-bd.js';
// 1. ⬇️ Reemplazamos la importación de 'mssql' por 'pg' (aunque el pool ya está tipado)
import { Pool, QueryResult } from 'pg'; 
import { autenticarUsuario } from '../auth.js';
import JWT_SECRET from "../auth.js"; // Asume que esto exporta la clave secreta


// 2. ⬇️ Tipamos el pool como pg.Pool
const pool: Pool = await getLoginPool(); 
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

        const luParam = rol === "administrador" ? null : lu;
        
        // El pre-check está comentado, pero si lo descomentas, usa la sintaxis PG:
        /*
        if (luParam) {
            const existingLu: QueryResult = await pool.query(
                `SELECT 1 AS existsFlag FROM public.usuarios WHERE lu = $1`, 
                [luParam]
            );
            if (existingLu.rows.length > 0) {
                return res.status(400).json({ error: "Ya existe un usuario con esa LU" });
            }
        }
        */

        const hashedPassword = await bcrypt.hash(password, 10);
        
        // 3. ⬇️ Ejecución directa de la query con parámetros posicionales ($1, $2, ...)
        const insertQuery = `
            INSERT INTO usuarios (username, password_hash, email, rol, lu) 
            VALUES ($1, $2, $3, $4, $5)
        `;

        await pool.query(insertQuery, [username, hashedPassword, email, rol, luParam]);

        return res.status(201).json({ message: "Usuario creado con éxito" });

    } catch (err: any) {
        console.error("Error de registro:", err);
        
        // 4. ⬇️ Manejo de errores de PostgreSQL (propiedad 'code')
        const pgErrCode = err?.code;

        // 5. ⬇️ Reemplazo de códigos de error de SQL Server:
        // '23503' = Foreign Key Violation (Similar a SQL Server 547)
        if (pgErrCode === '23503') {
            return res.status(400).json({ error: "No existe un alumno con esa LU" });
        }
        
        // '23505' = Unique/Primary Key Violation (Similar a SQL Server 2627 / 2601)
        if (pgErrCode === '23505') {
            
            // 6. ⬇️ El manejo de duplicados es más simple en PG si el error indica la columna
            // Sin embargo, si queremos replicar la lógica de MSSQL (que intenta identificar
            // qué columna falló comparando el valor duplicado), debemos usar las consultas PG.
            
            const detail: string = err.detail || ''; // PostgreSQL incluye detalles del error

            try {
                // 7. ⬇️ Comprobación en la BD usando la sintaxis PG
                // Asumimos que el detail de PG dice algo como: Key (username)=(X) already exists.
                
                // Comprobar username (usando el valor que generó la colisión)
                // Esto requiere que el error de PG contenga el valor o que lo extraigamos, 
                // pero lo más robusto es comprobar con el valor que el usuario intentó insertar.
                const checkUser: QueryResult = await pool.query(
                    `SELECT 1 AS found FROM usuarios WHERE username = $1`, [username]
                );
                if (checkUser.rows.length > 0) {
                    return res.status(400).json({ error: 'Ya existe un usuario con ese username' });
                }

                // Comprobar LU
                if (luParam) {
                    const checkLu: QueryResult = await pool.query(
                        `SELECT 1 AS found FROM usuarios WHERE lu = $1`, [luParam]
                    );
                    if (checkLu.rows.length > 0) {
                        return res.status(400).json({ error: 'Ya existe un usuario con esa LU' });
                    }
                }

            } catch (innerErr) {
                console.error('Error comprobando valor duplicado en BD:', innerErr);
            }

            // Si llegamos aquí, fue un duplicado, pero no pudimos identificarlo fácilmente
            return res.status(400).json({ error: 'Clave duplicada' });
        }

        return res.status(500).json({ error: "Error al registrar usuario" });
    }
});

// La ruta /login solo usa autenticarUsuario y no hace queries directas, 
// por lo que solo requiere el pool de pg.

router.post("/login", async (req, res) => {
    const { username, password } = req.body;
    try {
        // getLoginPool ya está llamado arriba, no es necesario re-llamar, 
        // pero lo mantenemos para consistencia si el archivo se ejecuta por separado.
        // const pool = await getLoginPool(); 

        const user = await autenticarUsuario(pool, username, password);
        if (!user) return res.status(401).json({ error: "Usuario o contraseña incorrectos" });

        // Include LU in token payload for non-admin users to avoid extra DB lookups
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

export default router;

// Nota: process.env.JWT_SECRET no debería estar aquí, se asume que es una reliquia
// del archivo original o una importación incorrecta.
// process.env.JWT_SECRET