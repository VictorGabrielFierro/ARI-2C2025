-- Crear tabla de usuarios para autenticación
CREATE TABLE aida.usuarios (
    id SERIAL PRIMARY KEY, -- PostgreSQL usa SERIAL para autoincremento (equiv. a IDENTITY)
    username VARCHAR(100) UNIQUE NOT NULL, -- NVARCHAR -> VARCHAR, y agregamos la restricción UNIQUE
    password_hash VARCHAR(255) NOT NULL, -- Para almacenar hashes seguros
    email VARCHAR(100),
    rol VARCHAR(50) DEFAULT 'usuario',
    lu VARCHAR(50) NULL,
    CONSTRAINT FK_usuarios_lu_alumnos_lu FOREIGN KEY (lu) REFERENCES aida.alumnos(lu)
);

-- Crear índice único parcial para LU (solo cuando no es NULL).
-- Esto permite que el campo 'lu' esté asociado a un solo usuario,
-- pero permite múltiples usuarios sin 'lu' (lu IS NULL).
CREATE UNIQUE INDEX UX_usuarios_lu_notnull ON aida.usuarios (lu)
WHERE lu IS NOT NULL;

-- Agregamos el usuario de prueba
INSERT INTO aida.usuarios
    (username, password_hash, email, rol, lu)
VALUES
    -- El hash proporcionado es '$2b$10$XK2ZxsfYffJyWmHocEVzsOboA04h4itNhBe4TvV.nKRlOg1st4bZy'
    ('admin_test', '$2b$10$XK2ZxsfYffJyWmHocEVzsOboA04h4itNhBe4TvV.nKRlOg1st4bZy', 'user@gmail.com', 'administrador', NULL);