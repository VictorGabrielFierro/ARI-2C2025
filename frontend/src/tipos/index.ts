// Tipos e interfaces globales
export type Alumno = {
    lu: string;
    apellido: string;
    nombres: string;
    titulo?: string | null;
    titulo_en_tramite?: string | null;
    egreso?: string | null;
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