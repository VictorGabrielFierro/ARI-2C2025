-- Cambiar el contexto a la base de datos recién creada
USE aida_db;
GO

-- Crear el usuario que va a usar la aplicación
CREATE LOGIN aida_admin WITH PASSWORD = 'Admin2025';
CREATE USER aida_admin FOR LOGIN aida_admin;
GO

-- Dar permisos mínimos al usuario de la app
GRANT SELECT, INSERT, UPDATE, DELETE ON aida.alumnos TO aida_admin;
GRANT SELECT, INSERT, UPDATE, DELETE ON aida.cursa TO aida_admin;
GRANT SELECT, INSERT, UPDATE, DELETE ON aida.plan_de_estudios TO aida_admin;
GRANT SELECT, INSERT, UPDATE, DELETE ON aida.estudiante_de TO aida_admin;
GRANT SELECT, INSERT, UPDATE, DELETE ON aida.correlativas TO aida_admin;
GRANT SELECT, INSERT, UPDATE, DELETE ON aida.carreras TO aida_admin;
GRANT SELECT, INSERT, UPDATE, DELETE ON aida.cursadas TO aida_admin;
GRANT SELECT, INSERT, UPDATE, DELETE ON aida.materias TO aida_admin;

-- Crear el usuario que va a a hacer alumno
CREATE LOGIN aida_alumno WITH PASSWORD = 'Alumno2025';
CREATE USER aida_alumno FOR LOGIN aida_alumno;
GO

GRANT SELECT, INSERT, UPDATE, DELETE ON aida.cursa TO aida_alumno;
GRANT SELECT ON aida.cursadas TO aida_alumno;
GRANT SELECT, INSERT, UPDATE, DELETE ON aida.estudiante_de TO aida_alumno;
GRANT SELECT ON aida.materias TO aida_alumno;
GRANT SELECT ON aida.plan_de_estudios to aida_alumno;
GRANT SELECT ON aida.correlativas TO aida_alumno;
GO

-- Crear el usuario que va a a hacer login
CREATE LOGIN aida_login WITH PASSWORD = 'Login2025';
CREATE USER aida_login FOR LOGIN aida_login;
GO

-- Dar permisos de lectura a login
GRANT SELECT, INSERT, UPDATE, DELETE ON dbo.usuarios TO aida_login;
GO

