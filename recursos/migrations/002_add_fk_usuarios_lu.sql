USE aida_db;
GO

-- Migración: Añadir foreign key nullable usuarios.lu -> aida.alumnos.lu
-- 1) Limpiar valores incompatibles: poner NULL si no existe la LU en aida.alumnos
UPDATE dbo.usuarios
SET lu = NULL
WHERE lu IS NOT NULL
  AND lu NOT IN (SELECT lu FROM aida.alumnos);
GO

-- 2) Añadir la constraint FK
ALTER TABLE dbo.usuarios
    ADD CONSTRAINT FK_usuarios_lu_alumnos_lu FOREIGN KEY (lu)
    REFERENCES aida.alumnos(lu);
GO

-- 3) Asegurar que solo exista un usuario por LU (índice único filtrado permite NULLs para administradores)
IF NOT EXISTS (
  SELECT * FROM sys.indexes WHERE name = N'UX_usuarios_lu_notnull' AND object_id = OBJECT_ID(N'dbo.usuarios')
)
BEGIN
  CREATE UNIQUE INDEX UX_usuarios_lu_notnull ON dbo.usuarios(lu) WHERE lu IS NOT NULL;
END
GO
