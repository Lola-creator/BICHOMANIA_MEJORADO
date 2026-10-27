const Encuesta = require("../domain/Encuesta");
const OpcionEncuesta = require("../domain/OpcionEncuesta");
const { ErrorValidacion, ErrorNoEncontrado } = require("../domain/errores");
const { validarIdentificador } = require("../domain/validaciones");
const ErrorPersistencia = require("./ErrorPersistencia");

class EncuestaService {
  constructor(repositorio) {
    this.repositorio = repositorio;
  }

  async crearEncuesta({
    fecha_inicio,
    fecha_fin,
    descripcion,
    opciones,
    id_empleado,
  } = {}) {
    if (!Array.isArray(opciones)) {
      throw new ErrorValidacion("Faltan datos de la encuesta");
    }
    const encuesta = Encuesta.crear({
      fechaInicio: fecha_inicio,
      fechaFin: fecha_fin,
      descripcion,
      idEmpleado: id_empleado,
      opciones: opciones.map(
        (opcion) =>
          new OpcionEncuesta({
            equipo: opcion.opcion_equipo,
            liga: opcion.opcion_liga,
            categoria: opcion.categoria,
          }),
      ),
    });
    await this.#ejecutar(
      () => this.repositorio.guardar(encuesta),
      "Error al crear encuesta",
    );
    return "Encuesta creada correctamente";
  }

  async eliminarEncuesta(idEncuesta) {
    validarIdentificador(idEncuesta, "encuesta");
    const filasAfectadas = await this.#ejecutar(
      () => this.repositorio.eliminar(idEncuesta),
      "Error al eliminar encuesta",
    );
    if (filasAfectadas === 0) {
      throw new ErrorNoEncontrado("Encuesta no encontrada");
    }
    return "Encuesta eliminada";
  }

  async cerrarEncuesta(idEncuesta) {
    const encuesta = await this.#obtenerEncuestaObligatoria(idEncuesta);
    encuesta.cerrar();
    await this.#ejecutar(
      () => this.repositorio.actualizarEstado(encuesta.id, encuesta.idEstado),
      "Error al cerrar encuesta",
    );
    return "Encuesta cerrada";
  }

  async listarActivas() {
    return this.#ejecutar(
      () => this.repositorio.listarActivas(),
      "Error al obtener encuestas activas",
    );
  }

  async listarPorEmpleado(idEmpleado) {
    if (!idEmpleado) {
      throw new ErrorValidacion("Falta el id_empleado");
    }
    validarIdentificador(idEmpleado, "empleado");
    return this.#ejecutar(
      () => this.repositorio.listarPorEmpleado(idEmpleado),
      "Error al buscar encuestas",
    );
  }

  async obtenerDetalles(idEncuesta) {
    validarIdentificador(idEncuesta, "encuesta");
    return this.#ejecutar(
      () => this.repositorio.listarDetalles(idEncuesta),
      "Error al obtener los detalles de la encuesta",
    );
  }

  async obtenerGanadora(idEncuesta) {
    const encuesta = await this.#obtenerEncuestaObligatoria(idEncuesta);
    return encuesta.ganadora();
  }

  async votar(idCliente, idEncuesta, idDetalle) {
    if (!idCliente || !idEncuesta || !idDetalle) {
      throw new ErrorValidacion("Faltan datos para votar");
    }
    validarIdentificador(idCliente, "cliente");
    const encuesta = await this.#obtenerEncuestaObligatoria(idEncuesta);
    encuesta.validarVoto(idDetalle);

    const yaVoto = await this.#ejecutar(
      () => this.repositorio.existeVoto(idCliente, idEncuesta),
      "Error al verificar el voto",
    );
    if (yaVoto) {
      throw new ErrorValidacion("Ya votaste en esta encuesta");
    }

    const registrado = await this.#ejecutar(
      () => this.repositorio.registrarVoto(idCliente, idEncuesta, idDetalle),
      "Error al registrar el voto",
    );
    if (!registrado) {
      throw new ErrorValidacion("Ya votaste en esta encuesta");
    }
    return { msg: "Voto registrado" };
  }

  async yaVoto(idCliente, idEncuesta) {
    validarIdentificador(idCliente, "cliente");
    validarIdentificador(idEncuesta, "encuesta");
    const yaVoto = await this.#ejecutar(
      () => this.repositorio.existeVoto(idCliente, idEncuesta),
      "Error al verificar el voto",
    );
    return { yaVoto };
  }

  async #ejecutar(operacion, mensajeError) {
    try {
      return await operacion();
    } catch (error) {
      throw new ErrorPersistencia(mensajeError, error);
    }
  }

  async #obtenerEncuestaObligatoria(idEncuesta) {
    validarIdentificador(idEncuesta, "encuesta");
    const encuesta = await this.#ejecutar(
      () => this.repositorio.obtenerPorId(idEncuesta),
      "Error al obtener la encuesta",
    );
    if (!encuesta) {
      throw new ErrorNoEncontrado("Encuesta no encontrada");
    }
    return encuesta;
  }
}

module.exports = EncuestaService;
