// Metadata de las tablas
// La idea es tenerlo definido unicamente acá y que frente a modificaciones, solo se tenga que modificar acá
const metadatos_tablas = [
    {
        table: 'aida.alumnos',
        pk: [ { pk: 'lu' } ],
        columns: [
            { name: 'lu', type: 'character varying', pretty_name: 'Libreta Universitaria', identity: false },
            { name: 'apellido', type: 'character varying', pretty_name: 'Apellido', identity: false },
            { name: 'nombres', type: 'character varying', pretty_name: 'Nombre', identity: false },
            { name: 'titulo', type: 'character varying', pretty_name: 'Título', identity: false },
            { name: 'titulo_en_tramite', type: 'date', pretty_name: 'Fecha de trámite del título', identity: false },
            { name: 'egreso', type: 'date', pretty_name: 'Fecha de egreso', identity: false }
        ],
    },
    {
        table: 'aida.materias',
        pk: [ { pk: 'MateriaId' } ],
        columns: [
            { name: 'MateriaId', type: 'integer', pretty_name: 'Identificador de la materia', identity: false },
            { name: 'Nombre', type: 'character varying', pretty_name: 'Nombre de la materia', identity: false },
            { name: 'Descripcion', type: 'character varying', pretty_name: 'Descripción de la materia', identity: false }
        ]
    },
    {
        table: 'aida.carreras',
        pk: [ { pk: 'CarreraId' } ],
        columns: [
            { name: 'CarreraId', type: 'integer', pretty_name: 'Identificador de la carrera', identity: false },
            { name: 'Nombre', type: 'character varying', pretty_name: 'Nombre de la carrera', identity: false }
        ]
    },
    {
        table: 'aida.correlativas',
        pk: [ { pk: 'MateriaId' }, { pk: 'MateriaCorrelativaId' } ],
        columns: [
            { name: 'MateriaId', type: 'integer', pretty_name: 'Identificador de materia', identity: false, 
                references: {
                table: 'aida.materias',
                column: 'MateriaId',
                display_column: 'Nombre',
                pretty_name: 'Nombre de la materia'
                } 
            },
            { name: 'MateriaCorrelativaId', type: 'integer', pretty_name: 'Identificador de la materia correlativa', identity: false, 
                references: {
                table: 'aida.materias',
                column: 'MateriaId',
                display_column: 'Nombre',
                pretty_name: 'Nombre de la materia correlativa'
                } 
            }
        ]
    },
    {
        table: 'aida.cursadas',
        pk: [ { pk: 'MateriaId' }, { pk: 'Cuatrimestre' } ],
        columns: [
            { name: 'MateriaId', type: 'integer', pretty_name: 'Identificador de materia', identity: false, 
                references: {
                table: 'aida.materias',
                column: 'MateriaId',
                display_column: 'Nombre',
                pretty_name: 'Nombre de la materia'
                } 
            },
            { name: 'Cuatrimestre', type: 'date', pretty_name: 'Fecha de inicio del cuatrimestre', identity: false },
            { name: 'Profesor', type: 'character varying', pretty_name: 'Profesor de la cursada', identity: false }
        ]
    },
    {
        table: 'aida.cursa',
        pk: [ { pk: 'lu' }, { pk: 'MateriaId' }, { pk: 'Cuatrimestre' } ],
        columns: [
            { name: 'lu', type: 'character varying', pretty_name: 'Libreta Universitaria', identity: false, 
                references: {
                table: 'aida.alumnos',
                column: 'lu',
                display_column: 'apellido',
                pretty_name: 'Apellido del alumno'
                }
            },
            { name: 'MateriaId', type: 'integer', pretty_name: 'Identificador de materia', identity: false, 
                references: {
                table: 'aida.materias',
                column: 'MateriaId',
                display_column: 'Nombre',
                pretty_name: 'Nombre de la materia que cursó'
                }
            },
            { name: 'Cuatrimestre', type: 'date', pretty_name: 'Fecha de inicio del cuatrimestre', identity: false },
            { name: 'FechaInscripcion', type: 'date', pretty_name: 'Fecha de inscripción', identity: false },
            { name: 'NotaFinal', type: 'integer', pretty_name: 'Nota final de la cursada', identity: false }
        ]
    },
    {
        table: 'aida.estudiante_de',
        pk: [ { pk: 'lu' }, { pk: 'CarreraId' } ],
        columns: [
            { name: 'lu', type: 'character varying', pretty_name: 'Libreta Universitaria', identity: false,
                references: {
                table: 'aida.alumnos',
                column: 'lu',
                display_column: 'apellido',
                pretty_name: 'Apellido del estudiante'
                }
            },
            { name: 'CarreraId', type: 'integer', pretty_name: 'Identificador de la carrera', identity: false,
                references: {
                table: 'aida.carreras',
                column: 'CarreraId',
                display_column: 'Nombre',
                pretty_name: 'Nombre de la carrera'
                }
            }
        ]
    },
    {
        table: 'aida.plan_de_estudios',
        pk: [ { pk: 'CarreraId' }, { pk: 'MateriaId' } ],
        columns: [
            { name: 'CarreraId', type: 'integer', pretty_name: 'Identificador de la carrera', identity: false,
                references: {
                table: 'aida.carreras',
                column: 'CarreraId',
                display_column: 'Nombre',
                pretty_name: 'Nombre de la carrera'
                }
            },
            { name: 'MateriaId', type: 'integer', pretty_name: 'Identificador de materia', identity: false,
                references: {
                table: 'aida.materias',
                column: 'MateriaId',
                display_column: 'Nombre',
                pretty_name: 'Nombre de la materia'
                }
            }
        ]
    }
]

export async function obtenerMetadataTabla(nombreTabla: string) {
    return metadatos_tablas.find(t => t.table === nombreTabla)
}