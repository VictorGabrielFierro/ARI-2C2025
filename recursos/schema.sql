USE aida_db;
GO

-- Crear schema
CREATE SCHEMA aida AUTHORIZATION aida_owner;
GO

-- Crear tabla alumnos
CREATE TABLE aida.alumnos (
    lu NVARCHAR(50) PRIMARY KEY,
    apellido NVARCHAR(50) NOT NULL,
    nombres NVARCHAR(50) NOT NULL,
    titulo NVARCHAR(100) NULL,
    titulo_en_tramite DATE NULL,
    egreso DATE NULL
);
GO

-- Dar permisos mínimos al usuario de la app
GRANT SELECT, INSERT, UPDATE, DELETE ON aida.alumnos TO aida_admin;
GO