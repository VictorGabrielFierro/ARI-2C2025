-- Script de inserción de datos iniciales para el esquema 'aida' en PostgreSQL.

/* ==========================================================
   1) CARRERAS
   ========================================================== */
INSERT INTO aida.carreras ("CarreraId", "Nombre") VALUES
(1, 'Licenciatura en Ciencias de la Computación'),
(2, 'Licenciatura en Ciencias de Datos');


/* ==========================================================
   2) MATERIAS 
   (IDs manuales para mantener consistencia)
   ========================================================== */
INSERT INTO aida.materias ("MateriaId", "Nombre", "Descripcion") VALUES
(1,  'Álgebra I', NULL),
(2,  'Análisis I', NULL),
(3,  'Análisis II', NULL),
(4,  'Análisis Avanzado', NULL),
(5,  'Probabilidad', NULL),
(6,  'Introducción a la Programación', NULL),
(7,  'Algoritmos y Estructuras de Datos I', NULL),
(8,  'Algoritmos y Estructuras de Datos II', NULL),
(9,  'Algoritmos y Estructuras de Datos III', NULL),
(10, 'Técnicas de Diseño de Algoritmos', NULL),
(11, 'Lenguajes Formales, Autómatas y Computabilidad', NULL),
(12, 'Complejidad Computacional', NULL),
(13, 'Sistemas Digitales', NULL),
(14, 'Arquitectura y Organización de Computadores', NULL),
(15, 'Sistemas Operativos', NULL),
(16, 'Paradigmas de Programación', NULL),
(17, 'Ingeniería de Software', NULL),
(18, 'Algebra Lineal Computacional', NULL),
(19, 'Estadística Computacional', NULL),
(20, 'Redes de Comunicaciones y Cómputo Distribuido', NULL),
(21, 'Programación Concurrente y Paralela', NULL),
(22, 'Almacenamiento y Recuperación de la Información', NULL),
(23, 'Análisis y Ciencia de Datos', NULL),
(24, 'Electiva de Ciencias Naturales', NULL),
(25, 'Introducción al Modelado Continuo', NULL),
(26, 'Introducción a Investigación Operativa y Optimización', NULL),
(27, 'Introducción a la Estadística y Ciencia de Datos', NULL),
(28, 'Laboratorio de Datos', NULL);


/* ==========================================================
   3) CORRELATIVAS 
   ========================================================== */

INSERT INTO aida.correlativas VALUES
(7, 6),   -- AED I ← Intro Prog
(8, 7),   -- AED II ← AED I
(9, 8),   -- AED III ← AED II
(10, 8),  -- Técnicas Diseño Algoritmos ← AED II
(11, 7),  -- Lenguajes Formales ← AED I
(12, 11), -- Complejidad ← Lenguajes Formales
(13, 6),  -- Sistemas Digitales ← Intro Prog
(14, 13), -- Arquitectura ← Sistemas Digitales
(15, 14), -- Sistemas Operativos ← Arquitectura
(16, 7),  -- Paradigmas de Programación ← AED I
(17, 16), -- Ingeniería de Software ← Paradigmas de Programación

(18, 1),  -- Álgebra Lineal Comp ← Álgebra I
(19, 2),  -- Estadística Comp ← Análisis I
(23, 28), -- Análisis + Ciencia Datos ← Laboratorio Datos
(25, 18), -- Modelado Continuo ← Álgebra Lineal Comp
(26, 9),  -- Inv Operativa ← AED III
(27, 5),  -- Intro Estadística y Ciencia Datos ← Probabilidad

(3, 2),   -- Análisis II ← Análisis I
(4, 3),   -- Análisis Avanzado ← Análisis II
(5, 4),   -- Probabilidad ← Análisis Avanzado
(28, 18), -- Lab Datos ← Álgebra Lineal Comp
(23, 27)  -- Ciencia Datos ← Intro Estadística
;


/* ==========================================================
   4) PLAN DE ESTUDIOS
   ========================================================== */

-- LIC. COMPUTACIÓN (Carrera 1)
INSERT INTO aida.plan_de_estudios VALUES
(1, 1),(1,2),(1,6),(1,7),(1,8),(1,10),(1,11),(1,12),
(1,13),(1,14),(1,15),(1,16),(1,17),(1,18),(1,19),
(1,20),(1,21),(1,22);

-- LIC. DATOS (Carrera 2)
INSERT INTO aida.plan_de_estudios VALUES
(2,1),(2,2),(2,3),(2,4),(2,5),(2,18),(2,24),(2,25),(2,26),
(2,27),(2,28),(2,9),(2,23);


/* ==========================================================
   5) ALUMNOS (10)
   ========================================================== */
INSERT INTO aida.alumnos (lu, apellido, nombres, titulo, titulo_en_tramite, egreso) VALUES
('1/25','Pérez','Juan',NULL,NULL,NULL),
('2/25','Gómez','Lucía',NULL,NULL,NULL),
('3/25','López','Martín','Bachiller',NULL,'2022-12-01'),
('4/25','Sosa','Ana',NULL,NULL,NULL),
('5/25','Díaz','Carlos',NULL,NULL,NULL),
('6/25','Torres','María','Bachiller',NULL,NULL),
('7/25','Rivas','Jorge',NULL,NULL,'2023-06-10'),
('8/25','Castro','Elena',NULL,'2024-01-15',NULL),
('9/25','Flores','Diego',NULL,NULL,NULL),
('10/25','Acosta','Valeria',NULL,NULL,NULL);


/* ==========================================================
   6) INSCRIPCIÓN A CARRERAS
   ========================================================== */
INSERT INTO aida.estudiante_de VALUES
('1/25',1), ('2/25',1), ('3/25',1), ('4/25',2), ('5/25',2),
('6/25',2), ('7/25',1), ('8/25',1), ('9/25',2), ('10/25',1);


/* ==========================================================
   7) CURSADAS (2 por cada materia)
   -- Reemplazo de variables por fechas hardcodeadas y uso de comillas dobles en IDs de columna
   ========================================================== */

-- Cuatrimestre 1 (Fecha: 2025-03-17)
INSERT INTO aida.cursadas ("MateriaId", "Cuatrimestre", "Profesor")
SELECT "MateriaId", '2025-03-17'::date, 'Profesor A' FROM aida.materias;

-- Cuatrimestre 2 (Fecha: 2025-08-18)
INSERT INTO aida.cursadas ("MateriaId", "Cuatrimestre", "Profesor")
SELECT "MateriaId", '2025-08-18'::date, 'Profesor B' FROM aida.materias;


/* ==========================================================
   8) CURSA (Inscripciones a materias con notas)
   ========================================================== */
INSERT INTO aida.cursa VALUES
('1/25',7,'2025-08-18','2025-08-01',8),
('1/25',6,'2025-03-17','2025-03-01',7),
('2/25',6,'2025-03-17','2025-03-03',9),
('2/25',7,'2025-08-18','2025-08-11',NULL),
('3/25',1,'2025-03-17','2025-03-05',10),
('4/25',1,'2025-03-17','2025-03-05',10),
('4/25',18,'2025-08-18','2025-08-08',9),
('5/25',5,'2025-03-17','2025-03-09',5),
('5/25',27,'2025-08-18','2025-08-03',NULL),
('6/25',28,'2025-03-17','2025-03-10',8),
('9/25',25,'2025-08-18','2025-08-02',NULL),
('10/25',1,'2025-08-18','2025-08-01',10),
('10/25',2,'2025-08-18','2025-08-01',10),
('10/25',6,'2025-08-18','2025-08-01',10),
('10/25',7,'2025-08-18','2025-08-01',10),
('10/25',8,'2025-08-18','2025-08-01',10),
('10/25',10,'2025-08-18','2025-08-01',10),
('10/25',11,'2025-08-18','2025-08-01',10),
('10/25',12,'2025-08-18','2025-08-01',9),
('10/25',13,'2025-08-18','2025-08-01',9),
('10/25',14,'2025-08-18','2025-08-01',9),
('10/25',15,'2025-08-18','2025-08-01',9),
('10/25',16,'2025-08-18','2025-08-01',9),
('10/25',17,'2025-08-18','2025-08-01',9),
('10/25',18,'2025-08-18','2025-08-01',9),
('10/25',19,'2025-08-18','2025-08-01',9),
('10/25',20,'2025-08-18','2025-08-01',8),
('10/25',21,'2025-08-18','2025-08-01',8),
('10/25',22,'2025-08-18','2025-08-01',NULL);