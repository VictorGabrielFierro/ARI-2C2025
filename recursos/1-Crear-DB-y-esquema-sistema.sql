
-- 1. CREACIÓN DE LA BASE DE DATOS (Generalmente se hace fuera del script,
--    pero si se necesita aquí, se usa la sintaxis IF NOT EXISTS)
-- NOTA: Si ya estás conectado a una DB, este comando fallará.
-- CREATE DATABASE aida_db;

-- 2. CREACIÓN DE ROL Y SCHEMA
-- En PostgreSQL, los usuarios son "roles" que pueden ser dueños de objetos.

-- Crea el rol (usuario) si no existe.
DO
$do$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'aida_owner') THEN
        CREATE ROLE aida_owner WITH LOGIN PASSWORD 'Owner2025';
    END IF;
END
$do$;

CREATE DATABASE aida_db OWNER aida_owner;

-- Crea el schema (similar a los namespaces) y asigna el dueño
CREATE SCHEMA IF NOT EXISTS aida AUTHORIZATION aida_owner;

-- 3. AJUSTES DE TIPOS DE DATOS
-- PostgreSQL no usa NVARCHAR; se utiliza VARCHAR o TEXT.
-- En PostgreSQL, las cadenas de caracteres se definen con VARCHAR o TEXT.

-- Crear tabla alumnos
CREATE TABLE aida.alumnos (
    lu VARCHAR(50) PRIMARY KEY, -- NVARCHAR(50) -> VARCHAR(50)
    apellido VARCHAR(50) NOT NULL,
    nombres VARCHAR(50) NOT NULL,
    titulo VARCHAR(100) NULL,
    titulo_en_tramite DATE NULL,
    egreso DATE NULL
);

-- Crear tabla materias
CREATE TABLE aida.materias (
    "MateriaId" INTEGER PRIMARY KEY, -- INT -> INTEGER
    "Nombre" VARCHAR(100) NOT NULL,
    "Descripcion" VARCHAR(500) NULL
    -- NOTA: Se eliminó la coma final innecesaria del script original.
);

-- Crear tabla de cursadas
CREATE TABLE aida.cursadas (
    "MateriaId" INTEGER NOT NULL,
    "Cuatrimestre" DATE NOT NULL,
    "Profesor" VARCHAR(50) NULL,

    PRIMARY KEY ("MateriaId", "Cuatrimestre"),

    FOREIGN KEY ("MateriaId")
        REFERENCES aida.materias("MateriaId")
        ON DELETE CASCADE
);

-- Crear tabla de las carreras
CREATE TABLE aida.carreras (
    "CarreraId" INTEGER PRIMARY KEY,
    "Nombre" VARCHAR(50) NOT NULL
);

-- Crear tabla de correlativas
CREATE TABLE aida.correlativas (
    "MateriaId" INTEGER NOT NULL,
    "MateriaCorrelativaId" INTEGER NOT NULL,

    PRIMARY KEY ("MateriaId", "MateriaCorrelativaId"),
    FOREIGN KEY ("MateriaId") REFERENCES aida.materias("MateriaId"),
    FOREIGN KEY ("MateriaCorrelativaId") REFERENCES aida.materias("MateriaId")
);

-- Crear tabla de plan de estudios
CREATE TABLE aida.plan_de_estudios (
    "CarreraId" INTEGER NOT NULL,
    "MateriaId" INTEGER NOT NULL,

    PRIMARY KEY ("CarreraId", "MateriaId"),
    FOREIGN KEY ("CarreraId") REFERENCES aida.carreras("CarreraId"),
    FOREIGN KEY ("MateriaId") REFERENCES aida.materias("MateriaId")
);

-- Crear tabla de inscripciones a carreras
CREATE TABLE aida.estudiante_de (
    lu VARCHAR(50) NOT NULL,
    "CarreraId" INTEGER NOT NULL,

    PRIMARY KEY (lu, "CarreraId"),
    FOREIGN KEY (lu) REFERENCES aida.alumnos(lu),
    FOREIGN KEY ("CarreraId") REFERENCES aida.carreras("CarreraId")
);

-- Crear tabla de que cursa cada alumno
CREATE TABLE aida.cursa (
    lu VARCHAR(50) NOT NULL,
    "MateriaId" INTEGER NOT NULL,
    "Cuatrimestre" DATE NOT NULL,
    "FechaInscripcion" DATE NOT NULL,
    "NotaFinal" INTEGER NULL,

    PRIMARY KEY (lu, "MateriaId", "Cuatrimestre"),
    FOREIGN KEY (lu) REFERENCES aida.alumnos(lu),
    FOREIGN KEY ("MateriaId", "Cuatrimestre") REFERENCES aida.cursadas("MateriaId", "Cuatrimestre")
);