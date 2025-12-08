// Metadata de las tablas
// La idea es tenerlo definido unicamente acá y que frente a modificaciones, solo se tenga que modificar acá
const metadatos_tablas = [
    {
        table: 'aida.alumnos',
        pk: [ { pk: 'lu' } ],
        columns: [
            { name: 'lu', type: 'character varying', pretty_name: 'Libreta Universitaria', nullable: false },
            { name: 'apellido', type: 'character varying', pretty_name: 'Apellido', nullable: false },
            { name: 'nombres', type: 'character varying', pretty_name: 'Nombre', nullable: false },
            { name: 'titulo', type: 'character varying', pretty_name: 'Título', nullable: true },
            { name: 'titulo_en_tramite', type: 'date', pretty_name: 'Fecha de trámite del título', nullable: true },
            { name: 'egreso', type: 'date', pretty_name: 'Fecha de egreso', nullable: true }
        ],
        pretty_name: 'Alumnos'
    },
    {
        table: 'aida.materias',
        pk: [ { pk: 'MateriaId' } ],
        columns: [
            { name: 'MateriaId', type: 'character varying', pretty_name: 'Identificador de la materia', nullable: false },
            { name: 'Nombre', type: 'character varying', pretty_name: 'Nombre de la materia', nullable: false },
            { name: 'Descripcion', type: 'character varying', pretty_name: 'Descripción de la materia', nullable: true }
        ],
        pretty_name: 'Materias'
    },
    {
        table: 'aida.carreras',
        pk: [ { pk: 'CarreraId' } ],
        columns: [
            { name: 'CarreraId', type: 'character varying', pretty_name: 'Identificador de la carrera', nullable: false },
            { name: 'Nombre', type: 'character varying', pretty_name: 'Nombre de la carrera', nullable: false }
        ],
        pretty_name: 'Carreras'
    },
    {
        table: 'aida.correlativas',
        pk: [ { pk: 'MateriaId' }, { pk: 'MateriaCorrelativaId' } ],
        columns: [
            { name: 'MateriaId', type: 'character varying', pretty_name: 'Identificador de materia', nullable: false, 
                references: {
                table: 'aida.materias',
                column: 'MateriaId',
                display_column: 'Nombre',
                pretty_name: 'Nombre de la materia'
                } 
            },
            { name: 'MateriaCorrelativaId', type: 'character varying', pretty_name: 'Identificador de la materia correlativa', nullable: false, 
                references: {
                table: 'aida.materias',
                column: 'MateriaId',
                display_column: 'Nombre',
                pretty_name: 'Nombre de la materia correlativa'
                } 
            }
        ],
        pretty_name: 'Correlatividades'
    },
    {
        table: 'aida.cursadas',
        pk: [ { pk: 'MateriaId' }, { pk: 'Año' }, { pk: 'Cuatrimestre' } ],
        columns: [
            { name: 'MateriaId', type: 'character varying', pretty_name: 'Identificador de materia', nullable: false, 
                references: {
                table: 'aida.materias',
                column: 'MateriaId',
                display_column: 'Nombre',
                pretty_name: 'Nombre de la materia'
                } 
            },
            { name: 'Año', type: 'integer', pretty_name: 'Año', nullable: false },
            { name: 'Cuatrimestre', type: 'integer', pretty_name: 'Cuatrimestre', nullable: false },
            { name: 'Profesor', type: 'character varying', pretty_name: 'Profesor de la cursada', nullable: true }
        ],
        pretty_name: 'Cursadas de las materias'
    },
    {
        table: 'aida.cursa',
        pk: [ { pk: 'lu' }, { pk: 'MateriaId' }, { pk: 'Año' }, { pk: 'Cuatrimestre' } ],
        columns: [
            { name: 'lu', type: 'character varying', pretty_name: 'Libreta Universitaria', nullable: false, 
                references: {
                table: 'aida.alumnos',
                column: 'lu',
                display_column: 'apellido',
                pretty_name: 'Apellido del alumno'
                }
            },
            { name: 'MateriaId', type: 'character varying', pretty_name: 'Identificador de materia', nullable: false, 
                references: {
                table: 'aida.materias',
                column: 'MateriaId',
                display_column: 'Nombre',
                pretty_name: 'Nombre de la materia que cursó'
                }
            },
            { name: 'Año', type: 'integer', pretty_name: 'Año', nullable: false },
            { name: 'Cuatrimestre', type: 'integer', pretty_name: 'Cuatrimestre', nullable: false },
            { name: 'FechaInscripcion', type: 'date', pretty_name: 'Fecha de inscripción', nullable: false },
            { name: 'NotaFinal', type: 'integer', pretty_name: 'Nota final de la cursada', nullable: true }
        ],
        pretty_name: 'Cursadas de los estudiantes'
    },
    {
        table: 'aida.estudiante_de',
        pk: [ { pk: 'lu' }, { pk: 'CarreraId' } ],
        columns: [
            { name: 'lu', type: 'character varying', pretty_name: 'Libreta Universitaria', nullable: false,
                references: {
                table: 'aida.alumnos',
                column: 'lu',
                display_column: 'apellido',
                pretty_name: 'Apellido del estudiante'
                }
            },
            { name: 'CarreraId', type: 'character varying', pretty_name: 'Identificador de la carrera', nullable: false,
                references: {
                table: 'aida.carreras',
                column: 'CarreraId',
                display_column: 'Nombre',
                pretty_name: 'Nombre de la carrera'
                }
            }
        ],
        pretty_name: 'Carreras de estudiantes'
    },
    {
        table: 'aida.plan_de_estudios',
        pk: [ { pk: 'CarreraId' }, { pk: 'MateriaId' } ],
        columns: [
            { name: 'CarreraId', type: 'character varying', pretty_name: 'Identificador de la carrera', nullable: false,
                references: {
                table: 'aida.carreras',
                column: 'CarreraId',
                display_column: 'Nombre',
                pretty_name: 'Nombre de la carrera'
                }
            },
            { name: 'MateriaId', type: 'character varying', pretty_name: 'Identificador de materia', nullable: false,
                references: {
                table: 'aida.materias',
                column: 'MateriaId',
                display_column: 'Nombre',
                pretty_name: 'Nombre de la materia'
                }
            }
        ],
        pretty_name: 'Planes de estudio'
    }
]

export async function obtenerMetadataTabla(nombreTabla: string) {
    return metadatos_tablas.find(t => t.table === nombreTabla)
}