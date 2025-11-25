import fsPromises from 'fs/promises';
import path from 'path';
import { cargarCSV } from "./bd/modificaciones-alumnos.js";
import { validarCSV, validarFecha, validarLU } from "./validaciones.js";
import { generarTituloPorFecha, generarTituloPorLU } from "./certificados.js"
import { carpetaDelArchivoActual } from "./utils.js"
import { ERRORES } from "./constantes/errores.js";
import { EXITOS } from "./constantes/exitos.js";
import chokidar from 'chokidar';


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
            try {
                const ruta = await validarCSV(carpeta_entrada, parametro)
                await cargarCSV(ruta);
                console.log(EXITOS.DATOS_CARGADOS_CORRECTAMENTE);
            } catch(err:any){
                const mensaje = err?.message ?? String(err);
                if (mensaje === ERRORES.ARCHIVO_INVALIDO) {
                    console.log(ERRORES.ARCHIVO_INVALIDO)
                } else if (mensaje === ERRORES.INTERNO){
                    console.log(ERRORES.INTERNO)
                } else {
                    console.log(ERRORES.FALLA_AL_CARGAR_DATOS)
                } 
            }
            break;
        case 'fecha':
            if (validarFecha(parametro)){
                try {
                    const titulos = await generarTituloPorFecha(parametro, salida);
                    for (const titulo of titulos) {
                        if (titulo.error == null){
                            console.log(`${EXITOS.CERTIFICADO_GENERADO_CORRECTAMENTE} LU: ${titulo.lu} Archivo: ${titulo.archivo}`)
                        } else {
                            console.log(`${ERRORES.CERTIFICADO_NO_GENERADO} LU: ${titulo.lu}. Descripcion de error: ${titulo.error}`)
                        }
                    }
                } catch (err:any) {
                    const mensaje = err?.message ?? String(err);
                    if (mensaje === ERRORES.SIN_ALUMNOS_EGRESADOS_EN_FECHA_PROPORCIONADO) {
                        console.log(`${ERRORES.CERTIFICADO_NO_GENERADO} Fecha: ${parametro}. Descripcion de error: ${mensaje}`)
                    } else {
                        console.log(ERRORES.INTERNO)
                    }
                }
            } else {
                console.log(ERRORES.FECHA_INVALIDA)
            }
            break;
        case 'lu':
            if (validarLU(parametro)){
                try {
                    const titulo = await generarTituloPorLU(parametro, salida);
                    console.log(`${EXITOS.CERTIFICADO_GENERADO_CORRECTAMENTE} LU: ${titulo.lu} Archivo: ${titulo.archivo}`)
                } catch (err:any) {
                    const mensaje = err?.message ?? String(err);
                    if (mensaje === ERRORES.ALUMNO_NO_ENCONTRADO) {
                        console.log(`${ERRORES.CERTIFICADO_NO_GENERADO} LU: ${parametro}. Descripcion de error: ${mensaje}`)
                    } else {
                        console.log(ERRORES.INTERNO)
                    }
                }
            } else {
                console.log(ERRORES.LU_INVALIDA)
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

    await verificarOCrearCSV();

    const salida = '/carpeta-base/salida';
    let lineasProcesadas = 0;

    const watcher = chokidar.watch(generacion_certificados, {
        persistent: true,
        usePolling: true,        // fuerza la detección en tiempo real
        interval: 500,           // medio segundo
        awaitWriteFinish: {
            stabilityThreshold: 500, // espera medio segundo a que el archivo deje de escribirse
            pollInterval: 100
        }
    });

    watcher.on('change', async () => {
        try {
            const data = await fsPromises.readFile(generacion_certificados, 'utf8');
            const lineas = data.split(/\r?\n/).filter(l => l.trim() !== '');
            const nuevasLineas = lineas.slice(1 + lineasProcesadas);

            for (const linea of nuevasLineas) {
                try {
                    await procesarLinea(linea, salida);
                } catch (err) {
                    console.error('Error procesando línea:', linea, err);
                }
            }

            lineasProcesadas += nuevasLineas.length;
        } catch (err) {
            console.error('Error leyendo el archivo:', err);
        }
    });

    console.log('Modo POLAR activo. Esperando nuevas líneas en el CSV...');
}

iniciarModoPolar();
