// Tipos e interfaces globales
export type Alumno = {
  lu: string;
  apellido: string;
  nombres: string;
  titulo: string;
  titulo_en_tramite: string;
  egreso: string;
}
export type ResultadoTitulo = {
  lu: string;
  archivo?: string | null;
  error?: string | null;
};
export type ResultadoRespuesta = {
  mensaje: string;
  archivo: string | null;
};