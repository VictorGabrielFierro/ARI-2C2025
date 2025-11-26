-- Este script define los roles (usuarios) y otorga permisos
-- sobre las tablas creadas en el schema 'aida' de PostgreSQL.

-- NOTA: Este script asume que la base de datos ya existe y que
-- el schema 'aida' ya fue creado (por ejemplo, con el script anterior).

-- ====================================================================
-- 1. ROL: aida_admin (Usuario de la Aplicación con control total sobre los datos)
-- ====================================================================

-- Crea el rol si no existe.
DO
$do$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'aida_admin') THEN
        CREATE ROLE aida_admin WITH LOGIN PASSWORD 'Admin2025';
    END IF;
END
$do$;

-- Dar permisos DML (SELECT, INSERT, UPDATE, DELETE) al usuario aida_admin sobre todas las tablas del esquema 'aida'.
GRANT SELECT, INSERT, UPDATE, DELETE ON aida.alumnos TO aida_admin;
GRANT SELECT, INSERT, UPDATE, DELETE ON aida.cursa TO aida_admin;
GRANT SELECT, INSERT, UPDATE, DELETE ON aida.plan_de_estudios TO aida_admin;
GRANT SELECT, INSERT, UPDATE, DELETE ON aida.estudiante_de TO aida_admin;
GRANT SELECT, INSERT, UPDATE, DELETE ON aida.correlativas TO aida_admin;
GRANT SELECT, INSERT, UPDATE, DELETE ON aida.carreras TO aida_admin;
GRANT SELECT, INSERT, UPDATE, DELETE ON aida.cursadas TO aida_admin;
GRANT SELECT, INSERT, UPDATE, DELETE ON aida.materias TO aida_admin;
-- También necesita permisos sobre la tabla de usuarios:
GRANT SELECT, INSERT, UPDATE, DELETE ON aida.usuarios TO aida_admin;


-- ====================================================================
-- 2. ROL: aida_alumno (Usuario con permisos limitados a lo que un alumno haría)
-- ====================================================================

-- Crea el rol si no existe.
DO
$do$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'aida_alumno') THEN
        CREATE ROLE aida_alumno WITH LOGIN PASSWORD 'Alumno2025';
    END IF;
END
$do$;

-- Permisos DML para las acciones de un alumno
GRANT SELECT, INSERT, UPDATE, DELETE ON aida.cursa TO aida_alumno;
GRANT SELECT, INSERT, UPDATE, DELETE ON aida.estudiante_de TO aida_alumno;

-- Permisos de solo lectura (SELECT) para consultar información
GRANT SELECT ON aida.cursadas TO aida_alumno;
GRANT SELECT ON aida.materias TO aida_alumno;
GRANT SELECT ON aida.plan_de_estudios TO aida_alumno;
GRANT SELECT ON aida.correlativas TO aida_alumno;


-- ====================================================================
-- 3. ROL: aida_login (Usuario con permisos para manejar la autenticación)
-- ====================================================================

-- Crea el rol si no existe.
DO
$do$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'aida_login') THEN
        CREATE ROLE aida_login WITH LOGIN PASSWORD 'Login2025';
    END IF;
END
$do$;

-- Dar permisos para manejar la tabla de usuarios (login, registro, actualización de perfil).
-- NOTA: Se cambió de 'dbo.usuarios' a 'aida.usuarios'.
GRANT SELECT, INSERT, UPDATE, DELETE ON aida.usuarios TO aida_login;