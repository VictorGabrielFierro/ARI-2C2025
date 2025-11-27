DO
$do$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'aida_admin') THEN
        CREATE ROLE aida_admin WITH LOGIN PASSWORD 'Admin2025';
    END IF;
END
$do$;

GRANT USAGE ON SCHEMA aida TO aida_admin;

GRANT SELECT, INSERT, UPDATE, DELETE ON aida.alumnos TO aida_admin;
GRANT SELECT, INSERT, UPDATE, DELETE ON aida.cursa TO aida_admin;
GRANT SELECT, INSERT, UPDATE, DELETE ON aida.plan_de_estudios TO aida_admin;
GRANT SELECT, INSERT, UPDATE, DELETE ON aida.estudiante_de TO aida_admin;
GRANT SELECT, INSERT, UPDATE, DELETE ON aida.correlativas TO aida_admin;
GRANT SELECT, INSERT, UPDATE, DELETE ON aida.carreras TO aida_admin;
GRANT SELECT, INSERT, UPDATE, DELETE ON aida.cursadas TO aida_admin;
GRANT SELECT, INSERT, UPDATE, DELETE ON aida.materias TO aida_admin;
GRANT SELECT, INSERT, UPDATE, DELETE ON aida.usuarios TO aida_admin;


DO
$do$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'aida_alumno') THEN
        CREATE ROLE aida_alumno WITH LOGIN PASSWORD 'Alumno2025';
    END IF;
END
$do$;

GRANT USAGE ON SCHEMA aida TO aida.alumno;

GRANT SELECT, INSERT, UPDATE, DELETE ON aida.cursa TO aida_alumno;
GRANT SELECT, INSERT, UPDATE, DELETE ON aida.estudiante_de TO aida_alumno;
GRANT SELECT ON aida.cursadas TO aida_alumno;
GRANT SELECT ON aida.materias TO aida_alumno;
GRANT SELECT ON aida.plan_de_estudios TO aida_alumno;
GRANT SELECT ON aida.correlativas TO aida_alumno;


DO
$do$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'aida_login') THEN
        CREATE ROLE aida_login WITH LOGIN PASSWORD 'Login2025';
    END IF;
END
$do$;

GRANT USAGE ON SCHEMA aida TO aida_login;

GRANT SELECT, INSERT, UPDATE, DELETE ON aida.usuarios TO aida_login;