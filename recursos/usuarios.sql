USE aida_db;
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