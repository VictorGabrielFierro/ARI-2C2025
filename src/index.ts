import readline from 'readline';
import { generarTitulo } from './imprimir-titulo.js'; // ojo: .js al importar en ESM

// Crear interfaz de lectura por consola
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Preguntar al usuario por el LU
rl.question('Ingrese el LU del alumno (formato xxxx/yy): ', async (lu) => {
  rl.close(); // cerramos la interfaz de lectura

  if (!lu) {
    console.log('No se ingresó ningún LU.');
    return;
  }

  try {
    await generarTitulo(lu);
  } catch (err) {
    console.error('Error generando el título:', err);
  }
});