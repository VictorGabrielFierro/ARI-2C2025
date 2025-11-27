import bcrypt from 'bcrypt';
import { Pool } from 'pg';
import { Usuario } from "./tipos/index.js";
import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";

export const JWT_SECRET = "clave-ultra-secreta";

export async function verificarPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
}

export async function autenticarUsuario(pool: Pool, username: string, password: string): Promise<Usuario | null> {
    const queryText = 'SELECT * FROM aida.usuarios WHERE username = $1';
    const result = await pool.query(queryText, [username]);

    if (result.rows.length === 0) return null;

    const user = result.rows[0];
    
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

export function generarToken(usuario: string): string {
  return jwt.sign({ usuario }, JWT_SECRET, { expiresIn: "2h" });
}

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

export function verificarToken(token: string): boolean {
  try {
    jwt.verify(token, JWT_SECRET);
    return true;
  } catch {
    return false;
  }
}
export default JWT_SECRET;