-- Crear tabla de usuarios para autenticación
CREATE TABLE aida.usuarios (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(100),
    rol VARCHAR(50) DEFAULT 'usuario',
    lu VARCHAR(50) NULL,
    CONSTRAINT FK_usuarios_lu_alumnos_lu FOREIGN KEY (lu) REFERENCES aida.alumnos(lu)
);

CREATE UNIQUE INDEX UX_usuarios_lu_notnull ON aida.usuarios (lu)
WHERE lu IS NOT NULL;

-- Agregamos el usuario de prueba
INSERT INTO aida.usuarios
    (username, password_hash, email, rol, lu)
VALUES
    ('admin_test', '$2b$10$XK2ZxsfYffJyWmHocEVzsOboA04h4itNhBe4TvV.nKRlOg1st4bZy', 'user@gmail.com', 'administrador', NULL);