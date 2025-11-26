USE aida_db;
GO

-- Migración: Añadir índice único para username si no existe
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
