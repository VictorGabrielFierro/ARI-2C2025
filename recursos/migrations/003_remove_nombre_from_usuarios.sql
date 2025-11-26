USE aida_db;
GO

-- Migración: Eliminar la columna 'nombre' de dbo.usuarios si existe
IF EXISTS (
    SELECT * FROM sys.columns
    WHERE Name = N'nombre' AND Object_ID = Object_ID(N'dbo.usuarios')
)
BEGIN
    ALTER TABLE dbo.usuarios DROP COLUMN nombre;
END
GO
