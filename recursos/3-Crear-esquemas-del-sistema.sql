CREATE SCHEMA IF NOT EXISTS aida AUTHORIZATION aida_owner;

-- Crear tabla alumnos
CREATE TABLE aida.alumnos (
    lu VARCHAR(50) PRIMARY KEY,
    apellido VARCHAR(50) NOT NULL,
    nombres VARCHAR(50) NOT NULL,
    titulo VARCHAR(100) NULL,
    titulo_en_tramite DATE NULL,
    egreso DATE NULL
);

-- Crear tabla materias
CREATE TABLE aida.materias (
    "MateriaId" VARCHAR(5) PRIMARY KEY,
    "Nombre" VARCHAR(100) NOT NULL,
    "Descripcion" VARCHAR(500) NULL
);

-- Crear tabla de cursadas
CREATE TABLE aida.cursadas (
    "MateriaId" VARCHAR(5) NOT NULL,
    "Año" INTEGER NOT NULL,
    "Cuatrimestre" INTEGER NOT NULL,
    "Profesor" VARCHAR(50) NULL,

    PRIMARY KEY ("MateriaId", "Año", "Cuatrimestre"),

    FOREIGN KEY ("MateriaId")
        REFERENCES aida.materias("MateriaId")
        ON DELETE CASCADE,
    
    -- Restringe Cuatrimestre entre 1 y 2 y año mayor que 1821 (año de creacion de la uba)
    CHECK ("Cuatrimestre" >= 1 AND "Cuatrimestre" <= 2 AND "Año" >= 1821)
);

-- Crear tabla de las carreras
CREATE TABLE aida.carreras (
    "CarreraId" VARCHAR(5) PRIMARY KEY,
    "Nombre" VARCHAR(50) NOT NULL
);

-- Crear tabla de correlativas
CREATE TABLE aida.correlativas (
    "MateriaId" VARCHAR(5) NOT NULL,
    "MateriaCorrelativaId" VARCHAR(5) NOT NULL,

    PRIMARY KEY ("MateriaId", "MateriaCorrelativaId"),
    FOREIGN KEY ("MateriaId") REFERENCES aida.materias("MateriaId"),
    FOREIGN KEY ("MateriaCorrelativaId") REFERENCES aida.materias("MateriaId")
);

-- Crear tabla de plan de estudios
CREATE TABLE aida.plan_de_estudios (
    "CarreraId" VARCHAR(5) NOT NULL,
    "MateriaId" VARCHAR(5) NOT NULL,

    PRIMARY KEY ("CarreraId", "MateriaId"),
    FOREIGN KEY ("CarreraId") REFERENCES aida.carreras("CarreraId"),
    FOREIGN KEY ("MateriaId") REFERENCES aida.materias("MateriaId")
);

-- Crear tabla de inscripciones a carreras
CREATE TABLE aida.estudiante_de (
    lu VARCHAR(50) NOT NULL,
    "CarreraId" VARCHAR(5) NOT NULL,

    PRIMARY KEY (lu, "CarreraId"),
    FOREIGN KEY (lu) REFERENCES aida.alumnos(lu),
    FOREIGN KEY ("CarreraId") REFERENCES aida.carreras("CarreraId")
);

-- Crear tabla de que cursa cada alumno
CREATE TABLE aida.cursa (
    lu VARCHAR(50) NOT NULL,
    "MateriaId" VARCHAR(5) NOT NULL,
    "Año" INTEGER NOT NULL,
    "Cuatrimestre" INTEGER NOT NULL, 
    "FechaInscripcion" DATE NOT NULL,
    "NotaFinal" INTEGER NULL,

    PRIMARY KEY (lu, "MateriaId", "Año", "Cuatrimestre"),
    FOREIGN KEY (lu) REFERENCES aida.alumnos(lu),
    FOREIGN KEY ("MateriaId","Año","Cuatrimestre") REFERENCES aida.cursadas("MateriaId", "Año", "Cuatrimestre")
);