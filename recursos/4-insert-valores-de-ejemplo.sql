-- Script de inserción de datos iniciales para el esquema 'aida' en PostgreSQL.

/* ==========================================================
   1) CARRERAS
   ========================================================== */
INSERT INTO aida.carreras ("CarreraId", "Nombre") VALUES
('LCC', 'Licenciatura en Ciencias de la Computación'),
('LCD', 'Licenciatura en Ciencias de Datos');


/* ==========================================================
   2) MATERIAS 
   ========================================================== */
INSERT INTO aida.materias ("MateriaId", "Nombre", "Descripcion") VALUES
('A1',  'Álgebra I', NULL),
('AN1',  'Análisis I', NULL),
('AN2',  'Análisis II', NULL),
('AA',  'Análisis Avanzado', NULL),
('P',  'Probabilidad', NULL),
('IP',  'Introducción a la Programación', NULL),
('AED1',  'Algoritmos y Estructuras de Datos I', NULL),
('AED2',  'Algoritmos y Estructuras de Datos II', NULL),
('AED3',  'Algoritmos y Estructuras de Datos III', NULL),
('TDA', 'Técnicas de Diseño de Algoritmos', NULL),
('LFAYC', 'Lenguajes Formales, Autómatas y Computabilidad', NULL),
('CC', 'Complejidad Computacional', NULL),
('SD', 'Sistemas Digitales', NULL),
('AOC', 'Arquitectura y Organización de Computadores', NULL),
('SO', 'Sistemas Operativos', NULL),
('PP', 'Paradigmas de Programación', NULL),
('IS', 'Ingeniería de Software', NULL),
('ALC', 'Algebra Lineal Computacional', NULL),
('EC', 'Estadística Computacional', NULL),
('RCCD', 'Redes de Comunicaciones y Cómputo Distribuido', NULL),
('PCP', 'Programación Concurrente y Paralela', NULL),
('ARI', 'Almacenamiento y Recuperación de la Información', NULL),
('ACD', 'Análisis y Ciencia de Datos', NULL),
('ECN', 'Electiva de Ciencias Naturales', NULL),
('IMC', 'Introducción al Modelado Continuo', NULL),
('IOO', 'Introducción a Investigación Operativa y Optimización', NULL),
('IECYD', 'Introducción a la Estadística y Ciencia de Datos', NULL),
('LD', 'Laboratorio de Datos', NULL);


/* ==========================================================
   3) CORRELATIVAS 
   ========================================================== */

INSERT INTO aida.correlativas VALUES
('AED1', 'IP'),    -- AED I ← Intro Prog
('AED2', 'AED1'),  -- AED II ← AED I
('AED3', 'AED2'),  -- AED III ← AED II
('TDA', 'AED2'),   -- Técnicas Diseño Algoritmos ← AED II
('LFAYC', 'AED1'), -- Lenguajes Formales ← AED I
('CC', 'LFAYC'),   -- Complejidad ← Lenguajes Formales
('SD', 'IP'),      -- Sistemas Digitales ← Intro Prog
('AOC', 'SD'),     -- Arquitectura ← Sistemas Digitales
('SO', 'AOC'),     -- Sistemas Operativos ← Arquitectura
('PP', 'AED1'),    -- Paradigmas de Programación ← AED I
('IS', 'PP'),      -- Ingeniería de Software ← Paradigmas de Programación

('ALC', 'A1'),     -- Álgebra Lineal Comp ← Álgebra I
('EC', 'AN1'),     -- Estadística Comp ← Análisis I
('ACD', 'LD'),     -- Análisis + Ciencia Datos ← Laboratorio Datos
('IMC', 'ALC'),    -- Modelado Continuo ← Álgebra Lineal Comp
('IOO', 'AED3'),   -- Inv Operativa ← AED III
('IECYD', 'P'),    -- Intro Estadística y Ciencia Datos ← Probabilidad

('AN2', 'AN1'),    -- Análisis II ← Análisis I
('AA', 'AN2'),     -- Análisis Avanzado ← Análisis II
('P', 'AA'),       -- Probabilidad ← Análisis Avanzado
('LD', 'ALC'),     -- Lab Datos ← Álgebra Lineal Comp
('ACD', 'IECYD')   -- Ciencia Datos ← Intro Estadística
;


/* ==========================================================
   4) PLAN DE ESTUDIOS
   ========================================================== */

-- LIC. COMPUTACIÓN (LCC)
INSERT INTO aida.plan_de_estudios VALUES
('LCC', 'A1'),('LCC','AN1'),('LCC','IP'),('LCC','AED1'),('LCC','AED2'),('LCC','TDA'),('LCC','LFAYC'),('LCC','CC'),
('LCC','SD'),('LCC','AOC'),('LCC','SO'),('LCC','PP'),('LCC','IS'),('LCC','ALC'),('LCC','EC'),
('LCC','RCCD'),('LCC','PCP'),('LCC','ARI');

-- LIC. DATOS (LCD)
INSERT INTO aida.plan_de_estudios VALUES
('LCD','A1'),('LCD','AN1'),('LCD','AN2'),('LCD','AA'),('LCD','P'),('LCD','ALC'),('LCD','ECN'),('LCD','IMC'),('LCD','IOO'),
('LCD','IECYD'),('LCD','LD'),('LCD','AED3'),('LCD','ACD');


/* ==========================================================
   5) ALUMNOS (10)
   (No modificada)
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
('1/25','LCC'), ('2/25','LCC'), ('3/25','LCC'), ('4/25','LCD'), ('5/25','LCD'),
('6/25','LCD'), ('7/25','LCC'), ('8/25','LCC'), ('9/25','LCD'), ('10/25','LCC');


/* ==========================================================
   7) CURSADAS (2 por cada materia)
   ========================================================== */

-- Cuatrimestre 1
INSERT INTO aida.cursadas ("MateriaId","Año", "Cuatrimestre", "Profesor")
SELECT "MateriaId", 2025, 1, 'Profesor A' FROM aida.materias;

-- Cuatrimestre 2 
INSERT INTO aida.cursadas ("MateriaId","Año", "Cuatrimestre", "Profesor")
SELECT "MateriaId", 2025, 2, 'Profesor B' FROM aida.materias;


/* ==========================================================
   8) CURSA (Inscripciones a materias con notas)
   ========================================================== */
-- Formato de INSERT: (lu, "MateriaId", "Año", "Cuatrimestre", "FechaInscripcion", "NotaFinal")
INSERT INTO aida.cursa VALUES
('1/25','AED1', 2025, 2, '2025-08-01', 8),
('1/25','IP',   2025, 1, '2025-03-01', 7),
('2/25','IP',   2025, 1, '2025-03-03', 9),
('2/25','AED1', 2025, 2, '2025-08-11', NULL),
('3/25','A1',   2025, 1, '2025-03-05', 10),
('4/25','A1',   2025, 1, '2025-03-05', 10),
('4/25','ALC',  2025, 2, '2025-08-08', 9),
('5/25','P',    2025, 1, '2025-03-09', 5),
('5/25','IECYD',2025, 2, '2025-08-03', NULL),
('6/25','LD',   2025, 1, '2025-03-10', 8),
('9/25','IMC',  2025, 2, '2025-08-02', NULL),
('10/25','A1',  2025, 2, '2025-08-01', 10),
('10/25','AN1', 2025, 2, '2025-08-01', 10),
('10/25','IP',  2025, 2, '2025-08-01', 10),
('10/25','AED1',2025, 2, '2025-08-01', 10),
('10/25','AED2',2025, 2, '2025-08-01', 10),
('10/25','TDA', 2025, 2, '2025-08-01', 10),
('10/25','LFAYC',2025, 2, '2025-08-01', 10),
('10/25','CC',  2025, 2, '2025-08-01', 9),
('10/25','SD',  2025, 2, '2025-08-01', 9),
('10/25','AOC', 2025, 2, '2025-08-01', 9),
('10/25','SO',  2025, 2, '2025-08-01', 9),
('10/25','PP',  2025, 2, '2025-08-01', 9),
('10/25','IS',  2025, 2, '2025-08-01', 9),
('10/25','ALC', 2025, 2, '2025-08-01', 9),
('10/25','EC',  2025, 2, '2025-08-01', 9),
('10/25','RCCD',2025, 2, '2025-08-01', 8),
('10/25','PCP', 2025, 2, '2025-08-01', 8),
('10/25','ARI', 2025, 2, '2025-08-01', NULL);