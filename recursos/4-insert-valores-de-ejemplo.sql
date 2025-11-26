USE aida_db;
GO

/* ==========================================================
   1) CARRERAS
   ========================================================== */
INSERT INTO aida.carreras (CarreraId, Nombre) VALUES
(1, N'Licenciatura en Ciencias de la Computación'),
(2, N'Licenciatura en Ciencias de Datos');
GO


/* ==========================================================
   2) MATERIAS 
   (IDs manuales para mantener consistencia)
   ========================================================== */
INSERT INTO aida.materias (MateriaId, Nombre) VALUES
(1,  N'Álgebra I'),
(2,  N'Análisis I'),
(3,  N'Análisis II'),
(4,  N'Análisis Avanzado'),
(5,  N'Probabilidad'),
(6,  N'Introducción a la Programación'),
(7,  N'Algoritmos y Estructuras de Datos I'),
(8,  N'Algoritmos y Estructuras de Datos II'),
(9,  N'Algoritmos y Estructuras de Datos III'),
(10, N'Técnicas de Diseño de Algoritmos'),
(11, N'Lenguajes Formales, Autómatas y Computabilidad'),
(12, N'Complejidad Computacional'),
(13, N'Sistemas Digitales'),
(14, N'Arquitectura y Organización de Computadores'),
(15, N'Sistemas Operativos'),
(16, N'Paradigmas de Programación'),
(17, N'Ingeniería de Software'),
(18, N'Algebra Lineal Computacional'),
(19, N'Estadística Computacional'),
(20, N'Redes de Comunicaciones y Cómputo Distribuido'),
(21, N'Programación Concurrente y Paralela'),
(22, N'Almacenamiento y Recuperación de la Información'),
(23, N'Análisis y Ciencia de Datos'),
(24, N'Electiva de Ciencias Naturales'),
(25, N'Introducción al Modelado Continuo'),
(26, N'Introducción a Investigación Operativa y Optimización'),
(27, N'Introducción a la Estadística y Ciencia de Datos'),
(28, N'Laboratorio de Datos');
GO


/* ==========================================================
   3) CORRELATIVAS 
   (Derivadas fielmente de los dos mapas de correlatividad)
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
GO


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
GO


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
GO


/* ==========================================================
   6) INSCRIPCIÓN A CARRERAS
   ========================================================== */
INSERT INTO aida.estudiante_de VALUES
('1/25',1), ('2/25',1), ('3/25',1), ('4/25',2), ('5/25',2),
('6/25',2), ('7/25',1), ('8/25',1), ('9/25',2), ('10/25',1);
GO


/* ==========================================================
   7) CURSADAS (2 por cada materia)
   ========================================================== */

DECLARE @fecha1 DATE = '2025-03-17';
DECLARE @fecha2 DATE = '2025-08-18';

INSERT INTO aida.cursadas (MateriaId, Cuatrimestre, Profesor)
SELECT MateriaId, @fecha1, 'Profesor A' FROM aida.materias;

INSERT INTO aida.cursadas (MateriaId, Cuatrimestre, Profesor)
SELECT MateriaId, @fecha2, 'Profesor B' FROM aida.materias;
GO


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
GO
