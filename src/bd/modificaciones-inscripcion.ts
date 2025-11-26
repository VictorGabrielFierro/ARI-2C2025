import sql from "mssql";
import { getAlumnoPool } from "./conecciones-bd.js";

/* =======================
   📌 Inscribir alumno
   ======================= */
export async function inscribirAlumno(lu: string, materiaId: number, cuatrimestre: number) {
    const pool = await getAlumnoPool();

    // Verificar si ya existe la inscripción
    const checkQuery = `
        SELECT 1 
        FROM aida.cursa
        WHERE lu = @lu AND MateriaId = @materiaId AND Cuatrimestre = @cuatrimestre;
    `;

    const check = await pool.request()
        .input("lu", sql.VarChar, lu)
        .input("materiaId", sql.Int, materiaId)
        .input("cuatrimestre", sql.Date, cuatrimestre)
        .query(checkQuery);

    if (check.recordset.length > 0) {
        throw new Error("YA_INSCRIPTO");
    }

    // Insertar inscripción
    const insertQuery = `
        INSERT INTO aida.cursa (lu, MateriaId, Cuatrimestre, FechaInscripcion)
        VALUES (@lu, @materiaId, @cuatrimestre, GETDATE());
`   ;

    await pool.request()
        .input("lu", sql.VarChar, lu)
        .input("materiaId", sql.Int, materiaId)
        .input("cuatrimestre", sql.Date, cuatrimestre)
        .query(insertQuery);
}

/* ==========================
   📌 Desinscribir alumno
   ========================== */
export async function desinscribirAlumno(lu: string, materiaId: number, cuatrimestre: number) {
    const pool = await getAlumnoPool();

    const deleteQuery = `
        DELETE FROM aida.cursa
        WHERE lu = @lu AND MateriaId = @materiaId AND Cuatrimestre = @cuatrimestre;
    `;

    await pool.request()
        .input("lu", sql.VarChar, lu)
        .input("materiaId", sql.Int, materiaId)
        .input("cuatrimestre", sql.Date, cuatrimestre)
        .query(deleteQuery);
}
