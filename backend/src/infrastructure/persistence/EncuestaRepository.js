const RepositorioEncuesta = require("../../domain/RepositorioEncuesta");
const Encuesta = require("../../domain/Encuesta");
const OpcionEncuesta = require("../../domain/OpcionEncuesta");

class EncuestaRepository extends RepositorioEncuesta {
  constructor(conexion) {
    super();
    this.conexion = conexion;
  }

  async guardar(encuesta) {
    return this.#enTransaccion(async (transaccion) => {
      const insertarEncuesta = `
                INSERT INTO encuestas (fecha_inicio, fecha_fin, descripcion, id_empleado, id_estado)
                VALUES (?, ?, ?, ?, ?)
            `;
      const [resultado] = await transaccion.query(insertarEncuesta, [
        encuesta.fechaInicio,
        encuesta.fechaFin,
        encuesta.descripcion,
        encuesta.idEmpleado,
        encuesta.idEstado,
      ]);
      const idEncuesta = resultado.insertId;

      const insertarDetalles = `
                INSERT INTO detalles_encuestas (id_encuesta, opcion_equipo, opcion_liga, categoria)
                VALUES ?
            `;
      const valores = encuesta.opciones.map((opcion) => [
        idEncuesta,
        opcion.equipo,
        opcion.liga,
        opcion.categoria,
      ]);
      await transaccion.query(insertarDetalles, [valores]);
      return idEncuesta;
    });
  }

  async obtenerPorId(idEncuesta) {
    const buscarEncuesta = `
            SELECT id_encuesta, fecha_inicio, fecha_fin, descripcion, id_empleado, id_estado
            FROM encuestas
            WHERE id_encuesta = ?
        `;
    const [encuestas] = await this.conexion.query(buscarEncuesta, [idEncuesta]);
    if (encuestas.length === 0) {
      return null;
    }

    const buscarDetalles = `
            SELECT id_detalle, opcion_equipo, opcion_liga, categoria, votos
            FROM detalles_encuestas
            WHERE id_encuesta = ?
        `;
    const [detalles] = await this.conexion.query(buscarDetalles, [idEncuesta]);

    const fila = encuestas[0];
    return new Encuesta({
      id: fila.id_encuesta,
      fechaInicio: fila.fecha_inicio,
      fechaFin: fila.fecha_fin,
      descripcion: fila.descripcion,
      idEmpleado: fila.id_empleado,
      idEstado: fila.id_estado,
      opciones: detalles.map(
        (detalle) =>
          new OpcionEncuesta({
            id: detalle.id_detalle,
            equipo: detalle.opcion_equipo,
            liga: detalle.opcion_liga,
            categoria: detalle.categoria,
            votos: detalle.votos || 0,
          }),
      ),
    });
  }

  async eliminar(idEncuesta) {
    return this.#enTransaccion(async (transaccion) => {
      await transaccion.query(
        "DELETE FROM votos_encuestas WHERE id_encuesta = ?",
        [idEncuesta],
      );
      await transaccion.query(
        "DELETE FROM detalles_encuestas WHERE id_encuesta = ?",
        [idEncuesta],
      );
      const [resultado] = await transaccion.query(
        "DELETE FROM encuestas WHERE id_encuesta = ?",
        [idEncuesta],
      );
      return resultado.affectedRows;
    });
  }

  async actualizarEstado(idEncuesta, idEstado) {
    const actualizar = `
            UPDATE encuestas
            SET id_estado = ?
            WHERE id_encuesta = ?
        `;
    const [resultado] = await this.conexion.query(actualizar, [
      idEstado,
      idEncuesta,
    ]);
    return resultado.affectedRows;
  }

  async listarActivas() {
    const consulta = `
            SELECT id_encuesta, fecha_inicio, fecha_fin, descripcion
            FROM encuestas
            WHERE id_estado = ?
        `;
    const [filas] = await this.conexion.query(consulta, [
      Encuesta.ESTADOS.ACTIVA,
    ]);
    return filas;
  }

  async listarPorEmpleado(idEmpleado) {
    const consulta = `
            SELECT e.id_encuesta, e.fecha_inicio, e.fecha_fin, e.descripcion, s.nombre AS estado
            FROM encuestas e
            JOIN estados s ON e.id_estado = s.id_estado
            WHERE e.id_empleado = ?
        `;
    const [filas] = await this.conexion.query(consulta, [idEmpleado]);
    return filas;
  }

  async listarDetalles(idEncuesta) {
    const consulta = `
            SELECT * FROM detalles_encuestas
            WHERE id_encuesta = ?
        `;
    const [filas] = await this.conexion.query(consulta, [idEncuesta]);
    return filas;
  }

  async existeVoto(idCliente, idEncuesta) {
    const consulta = `
            SELECT 1 FROM votos_encuestas
            WHERE id_cliente = ? AND id_encuesta = ?
            LIMIT 1
        `;
    const [filas] = await this.conexion.query(consulta, [
      idCliente,
      idEncuesta,
    ]);
    return filas.length > 0;
  }

  async registrarVoto(idCliente, idEncuesta, idDetalle) {
    try {
      await this.#enTransaccion(async (transaccion) => {
        const insertarVoto = `
                    INSERT INTO votos_encuestas (fecha_voto, id_cliente, id_detalle, id_encuesta)
                    VALUES (CURDATE(), ?, ?, ?)
                `;
        await transaccion.query(insertarVoto, [
          idCliente,
          idDetalle,
          idEncuesta,
        ]);

        const sumarVoto = `
                    UPDATE detalles_encuestas
                    SET votos = votos + 1
                    WHERE id_detalle = ? AND id_encuesta = ?
                `;
        await transaccion.query(sumarVoto, [idDetalle, idEncuesta]);
      });
      return true;
    } catch (error) {
      if (error.code === "ER_DUP_ENTRY") {
        return false;
      }
      throw error;
    }
  }

  async #enTransaccion(trabajo) {
    const transaccion = await this.conexion.getConnection();
    try {
      await transaccion.beginTransaction();
      const resultado = await trabajo(transaccion);
      await transaccion.commit();
      return resultado;
    } catch (error) {
      await transaccion.rollback();
      throw error;
    } finally {
      transaccion.release();
    }
  }
}

module.exports = EncuestaRepository;
