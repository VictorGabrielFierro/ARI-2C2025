import bcrypt from 'bcrypt';
import { Pool } from 'pg'; // ⬅️ Reemplazamos ConnectionPool de 'mssql' por Pool de 'pg'
import { Usuario } from "./tipos/index.js";
import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";

// ⚠️ Asegúrate de extender la interfaz Request de Express para incluir 'req.user'
// En un archivo de declaración de tipos (por ejemplo, src/types/express.d.ts)
// declare global { namespace Express { interface Request { user?: Usuario } } }

export const JWT_SECRET = "clave-ultra-secreta";

// --- Funciones de Hash y Verificación (No requieren cambios) ---
export async function verificarPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
}

// --- Función de Autenticación con 'pg.Pool' ---
export async function autenticarUsuario(pool: Pool, username: string, password: string): Promise<Usuario | null> {
    // 1. Usamos pool.query() para ejecutar la consulta directamente.
    // 2. Usamos $1 para el parámetro posicional, en lugar de @username.
    // 3. Pasamos los valores de los parámetros en el segundo argumento como un array: [username].
    const queryText = 'SELECT * FROM usuarios WHERE username = $1';
    const result = await pool.query(queryText, [username]);

    // En 'pg', los registros vienen en el array 'rows'.
    if (result.rows.length === 0) return null;

    // 4. Los registros son objetos directamente en el array 'rows'.
    const user = result.rows[0];
    
    // Verificación de contraseña (sin cambios)
    const match = await verificarPassword(password, user.password_hash);
    if (!match) return null;

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      rol: user.rol,
      lu: user.lu || null,
      nombre: user.nombre ?? null
    };
}

// --- Generar Token (No requiere cambios) ---
export function generarToken(usuario: string): string {
  return jwt.sign({ usuario }, JWT_SECRET, { expiresIn: "2h" });
}

// --- Middlewares y Verificación de Token (No requieren cambios) ---

export function verificarTokenMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers["authorization"];
  let token = authHeader && authHeader.split(" ")[1];

  // Si no viene en Authorization, comprobar si llegó en una cookie llamada 'token'
  if (!token && req.headers && req.headers.cookie) {
    const cookieStr = req.headers.cookie as string;
    const cookies = cookieStr.split(";").map(c => c.trim());
    for (const c of cookies) {
      if (c.startsWith("token=")) {
        token = decodeURIComponent(c.substring("token=".length));
        break;
      }
    }
  }

  if (!token) {
    return res.status(401).json({ error: "No token" });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as any;
    // Adjuntar la información de usuario decodificada a la solicitud
    req.user = {
      id: payload.id,
      username: payload.username,
      rol: payload.rol,
      lu: payload.lu ?? null,
    };
    return next();
  } catch (err) {
    return res.status(403).json({ error: "Token inválido" });
  }
}

// Middleware factory para exigir roles (No requiere cambios)
export function requireRole(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    if (!user || !user.rol) {
      return res.status(401).json({ error: 'No autenticado' });
    }
    if (!allowedRoles.includes(user.rol)) {
      return res.status(403).json({ error: 'Acceso denegado' });
    }
    return next();
  };
}


// Función simple para validar token y devolver boolean (No requiere cambios)
export function verificarToken(token: string): boolean {
  try {
    jwt.verify(token, JWT_SECRET);
    return true;
  } catch {
    return false;
  }
}
export default JWT_SECRET;