// Tipos e interfaces globales
export type Alumno = {
  lu: string;
  apellido: string;
  nombres: string;
  titulo?: string | null;
  titulo_en_tramite?: string | null;
  egreso?: string | null;
}
export type CamposAlumno = {
  lu?: string | null;
  apellido?: string | null;
  nombres?: string | null;
  titulo?: string | null;
  titulo_en_tramite?: string | null;
  egreso?: string | null;
};

export type ReglasValidacion = {
  lu?: boolean;               // true = opcional, false = obligatorio
  apellido?: boolean;
  nombres?: boolean;
  titulo?: boolean;
  titulo_en_tramite?: boolean;
  egreso?: boolean;
};
export type ResultadoTitulo = {
  lu: string;
  archivo?: string | null;
  error?: string | null;
};
export type ResultadoRespuesta = {
  mensaje: string;
  archivo: string | null;
};