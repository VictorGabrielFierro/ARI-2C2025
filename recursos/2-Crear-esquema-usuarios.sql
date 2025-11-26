USE aida_db;
GO

-- Tabla de usuarios para autenticación
CREATE TABLE usuarios (
    id INT IDENTITY(1,1) PRIMARY KEY, -- se autoincrementa desde 1
    username NVARCHAR(100) NOT NULL,
    password_hash NVARCHAR(255) NOT NULL,
    email NVARCHAR(100),
    rol NVARCHAR(50) DEFAULT 'usuario',
     lu NVARCHAR(50) NULL,
     CONSTRAINT FK_usuarios_lu_alumnos_lu FOREIGN KEY (lu) REFERENCES aida.alumnos(lu)
 );
GO

-- Asegurar índice único para LU (solo cuando no es NULL)
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = N'UX_usuarios_lu_notnull' AND object_id = OBJECT_ID(N'dbo.usuarios'))
BEGIN
    CREATE UNIQUE INDEX UX_usuarios_lu_notnull ON dbo.usuarios(lu) WHERE lu IS NOT NULL;
END
GO

-- Crear índice único para username si no existe (garantiza unicidad en BD)
IF NOT EXISTS (
    SELECT 1 FROM sys.indexes i
    JOIN sys.index_columns ic ON ic.object_id = i.object_id AND ic.index_id = i.index_id
    JOIN sys.columns c ON c.object_id = ic.object_id AND c.column_id = ic.column_id
    WHERE i.is_unique = 1 AND OBJECT_NAME(i.object_id) = 'usuarios' AND c.name = 'username'
)
BEGIN
    CREATE UNIQUE INDEX UX_usuarios_username ON dbo.usuarios(username);
END
GO

-- Agregamos el usuario de prueba
INSERT INTO [aida_db].[dbo].[usuarios] 
    ([username], [password_hash], [email], [rol], [lu])
VALUES 
    ('admin_test', '$2b$10$XK2ZxsfYffJyWmHocEVzsOboA04h4itNhBe4TvV.nKRlOg1st4bZy', 'user@gmail.com', 'administrador', NULL);