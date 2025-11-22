-- Crear la base de datos
CREATE DATABASE aida_db;
GO

-- Cambiar el contexto a la base de datos recién creada
USE aida_db;
GO

-- Crear el usuario dueño de la base de datos
CREATE LOGIN aida_owner WITH PASSWORD = 'Owner2025';
CREATE USER aida_owner FOR LOGIN aida_owner;
ALTER ROLE db_owner ADD MEMBER aida_owner;
GO

-- Crear el usuario que va a usar la aplicación
CREATE LOGIN aida_admin WITH PASSWORD = 'Admin2025';
CREATE USER aida_admin FOR LOGIN aida_admin;
GO