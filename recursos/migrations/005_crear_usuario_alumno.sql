USE aida_db;
GO

CREATE LOGIN aida_alumno WITH PASSWORD = 'Alumno2025';
CREATE USER aida_alumno FOR LOGIN aida_alumno;
GRANT SELECT ON aida.alumnos TO aida_alumno;
GRANT SELECT ON aida.materias TO aida_alumno;
GRANT SELECT, INSERT ON aida.cursa TO aida_alumno;
GO