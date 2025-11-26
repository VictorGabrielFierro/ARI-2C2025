USE aida_db;
GO

-- Migración: Añadir columna 'lu' a tabla usuarios (nullable)
ALTER TABLE dbo.usuarios
    ADD lu NVARCHAR(50) NULL;
GO
