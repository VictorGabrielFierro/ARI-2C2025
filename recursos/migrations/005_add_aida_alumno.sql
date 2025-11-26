-- Crear el usuario que va a a hacer alumno
CREATE LOGIN aida_alumno WITH PASSWORD = 'Alumno2025';
CREATE USER aida_alumno FOR LOGIN aida_alumno;
GO

-- Dar permisos mínimos 
GRANT SELECT, INSERT, UPDATE, DELETE ON aida.cursa TO aida_alumno;
GO

GRANT SELECT ON aida.cursadas TO aida_alumno;
GO


GRANT SELECT, INSERT, UPDATE, DELETE ON aida.estudiante_de TO aida_alumno;
GO

GRANT SELECT ON aida.materias TO aida_alumno
GO