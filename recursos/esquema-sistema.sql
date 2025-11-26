USE aida_db;
GO

-- Crear schema
CREATE SCHEMA aida AUTHORIZATION aida_owner;
GO

-- Crear tabla materias
CREATE TABLE aida.materias (
    MateriaId INT PRIMARY KEY,
    Nombre NVARCHAR(100) NOT NULL,
    Descripcion NVARCHAR(500) NULL,
);
GO

-- Crear tabla de cursadas
CREATE TABLE aida.cursadas (
    MateriaId INT NOT NULL,
    Cuatrimestre DATE NOT NULL,
    Profesor NVARCHAR(50) NULL,

    PRIMARY KEY (MateriaId, Cuatrimestre),

    FOREIGN KEY (MateriaId)
        REFERENCES aida.materias(MateriaId)
        ON DELETE CASCADE
);
GO

-- Crear tabla de las carreras
CREATE TABLE aida.carreras (
    CarreraId INT PRIMARY KEY,
    Nombre NVARCHAR(50) NOT NULL,
);
GO

-- Crear tabla de correlativas
CREATE TABLE aida.correlativas (
    MateriaId INT NOT NULL,
    MateriaCorrelativaId INT NOT NULL,

    PRIMARY KEY (MateriaId, MateriaCorrelativaId),
    FOREIGN KEY (MateriaId) REFERENCES aida.materias(MateriaId),
    FOREIGN KEY (MateriaCorrelativaId) REFERENCES aida.materias(MateriaId)
);
GO

-- Crear tabla de plan de estudios
CREATE TABLE aida.plan_de_estudios (
    CarreraId INT NOT NULL,
    MateriaId INT NOT NULL,

    PRIMARY KEY (CarreraId, MateriaId),
    FOREIGN KEY (CarreraId) REFERENCES aida.carreras(CarreraId),
    FOREIGN KEY (MateriaId) REFERENCES aida.materias(MateriaId)
);
GO

-- Crear tabla de inscripciones a carreras
CREATE TABLE aida.estudiante_de (
    lu NVARCHAR(50) NOT NULL,
    CarreraId INT NOT NULL,

    PRIMARY KEY (lu, CarreraId),
    FOREIGN KEY (lu) REFERENCES aida.alumnos(lu),
    FOREIGN KEY (CarreraId) REFERENCES aida.carreras(CarreraId)
);
GO

-- Crear tabla de que cursa cada alumno
CREATE TABLE aida.cursa (
    lu NVARCHAR(50) NOT NULL,
    MateriaId INT NOT NULL,
    Cuatrimestre DATE NOT NULL,
    FechaInscripcion DATE NOT NULL,
    NotaFinal INT NULL,

    PRIMARY KEY (lu, MateriaId, Cuatrimestre),
    FOREIGN KEY (lu) REFERENCES aida.alumnos(lu),
    FOREIGN KEY (MateriaId, Cuatrimestre) REFERENCES aida.cursadas(MateriaId, Cuatrimestre)
);
GO

-- Dar permisos mínimos al usuario de la app
GRANT SELECT, INSERT, UPDATE, DELETE ON aida.cursa TO aida_admin;
GO

GRANT SELECT, INSERT, UPDATE, DELETE ON aida.plan_de_estudios TO aida_admin;
GO

GRANT SELECT, INSERT, UPDATE, DELETE ON aida.estudiante_de TO aida_admin;
GO

GRANT SELECT, INSERT, UPDATE, DELETE ON aida.correlativas TO aida_admin;
GO

GRANT SELECT, INSERT, UPDATE, DELETE ON aida.carreras TO aida_admin;
GO

GRANT SELECT, INSERT, UPDATE, DELETE ON aida.cursadas TO aida_admin;
GO

GRANT SELECT, INSERT, UPDATE, DELETE ON aida.materias TO aida_admin;
GO