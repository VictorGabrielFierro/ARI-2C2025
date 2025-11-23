import fs from 'fs';
import fsPromises from 'fs/promises';
import path from 'path';
import { cargarCSV } from "./modos/modoCarga.js";
import { validarCSV, validarFecha, validarLU } from "./validaciones.js";
import { generarTituloPorFecha, generarTituloPorLU } from "./certificados.js"
import { carpetaDelArchivoActual } from "./utils.js"

const NOMBRE_ARCHIVO = 'generacion-certificados.csv';
// Busco carpera actual
const __dirname = carpetaDelArchivoActual();
// Defino la ruta a carpeta-base/entrada
const carpeta_entrada = path.join(__dirname, '..', 'carpeta-base', 'entrada');
// Defino la ruta a generacion-certificados
const generacion_certificados = path.join(carpeta_entrada, NOMBRE_ARCHIVO)

async function procesarLinea(linea: string, salida: string) {
    console.log('Procesando:', linea);
    // Saltar líneas vacías por si acaso
    if (!linea.trim()) return;

    // Separar y asegurar que siempre haya strings
    const [tipo = '', parametro = ''] = linea.split(',').map(s => s.trim());

    if (!tipo || !parametro) {
        console.error("Línea inválida:", linea);
        return;
    }

    try {
        switch (tipo) {
        case 'archivo':
            const ruta = await validarCSV(carpeta_entrada, parametro)
            if (ruta != null){
                cargarCSV(ruta);
            }
            break;
        case 'fecha':
            if (validarFecha(parametro)){
                generarTituloPorFecha(parametro, salida);
            }
            break;
        case 'lu':
            if (validarLU(parametro)){
                generarTituloPorLU(parametro, salida);
            }
            break;
        }
    } catch (err) {
        console.error(`Error procesando línea '${linea}':`, err);
    }
}

async function verificarOCrearCSV(): Promise<void> {
    const rutaArchivo = path.join(process.cwd(), 'carpeta-base', 'salida', 'generacion-certificados.csv');

    try {
        await fsPromises.access(rutaArchivo); // Verifica si existe
        console.log('Archivo generacion-certificados.csv encontrado.');
    } catch {
        // Si no existe, lo crea con el encabezado
        console.log('Archivo generacion-certificados.csv no encontrado. Creando nuevo...');
        await fsPromises.writeFile(rutaArchivo, 'tipo,parametro\n', 'utf-8');
        console.log(`Archivo creado en: ${rutaArchivo}`);
    }
}

async function iniciarModoPolar() {
    console.log('Iniciando modo POLAR...');

    // Verificar o crear el archivo antes de observarlo
    await verificarOCrearCSV();

    // Ruta del archivo a guardar
    const __dirname = carpetaDelArchivoActual()
    const salida = path.join(__dirname, '..', 'carpeta-base', 'salida');

    // Llevo un contador de las lineas procesadas
    let lineasProcesadas = 0;

    // fs.watch dispara un callback cada vez que algo cambia en el archivo
    fs.watch(generacion_certificados, (eventType, filename) => {
        if (filename && eventType === 'change') {
            fs.readFile(generacion_certificados, 'utf8', (err, data) => {
                if (err) {
                    console.error('Error leyendo el archivo:', err);
                    return;
                }
                const lineas = data.split(/\r?\n/).filter(l => l.trim() !== '');
                
                // Procesar solo las nuevas líneas, sin el encabezado
                const nuevasLineas = lineas.slice(1 + lineasProcesadas);
                nuevasLineas.forEach(linea => procesarLinea(linea, salida));

                // Actualizamos el contador
                lineasProcesadas += nuevasLineas.length;
            });
        }
    });

    console.log('Modo POLAR activo. Esperando nuevas líneas en el CSV...');
}

iniciarModoPolar();
