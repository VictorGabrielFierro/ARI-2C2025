USE aida_db;
GO

-- Dar permisos mínimos al usuario de la app
GRANT SELECT, INSERT, UPDATE, DELETE ON aida.alumnos TO aida_admin;
GO

-- Tabla de usuarios para autenticación
CREATE TABLE usuarios (
    id INT IDENTITY(1,1) PRIMARY KEY, -- se autoincrementa desde 1
    username NVARCHAR(100) UNIQUE NOT NULL,
    password_hash NVARCHAR(255) NOT NULL,
    nombre NVARCHAR(100),
    email NVARCHAR(100),
    rol NVARCHAR(50) DEFAULT 'usuario'
);
GO