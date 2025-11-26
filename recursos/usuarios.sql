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

-- Agregamos el usuario de prueba
INSERT INTO [aida_db].[dbo].[usuarios] 
    ([username], [password_hash], [nombre], [email], [rol])
VALUES 
    ('admin_test', '$2b$10$XK2ZxsfYffJyWmHocEVzsOboA04h4itNhBe4TvV.nKRlOg1st4bZy', 'user', 'user@gmail.com', 'usuario');

-- Dar permisos de lectura a login
GRANT SELECT, INSERT, UPDATE, DELETE ON dbo.usuarios TO aida_login;
GO
