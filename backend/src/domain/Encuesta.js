const OpcionEncuesta = require("./OpcionEncuesta");
const { ErrorValidacion } = require("./errores");
const { validarIdentificador } = require("./validaciones");

const ESTADOS = Object.freeze({ ACTIVA: 1, CERRADA: 2 });
const MIN_OPCIONES = 2;

const estaVacio = (texto) =>
  texto === undefined || texto === null || String(texto).trim() === "";

class Encuesta {
  #opciones = [];

  constructor({
    id = null,
    fechaInicio,
    fechaFin,
    descripcion,
    idEmpleado,
    idEstado = ESTADOS.ACTIVA,
    opciones = [],
  } = {}) {
    if (id !== null) {
      validarIdentificador(id, "encuesta");
    }
    validarIdentificador(idEmpleado, "empleado");

    // INVARIANTES
    if (!fechaInicio || !fechaFin || estaVacio(descripcion)) {
      throw new ErrorValidacion("Faltan datos de la encuesta");
    }
    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);
    if (Number.isNaN(inicio.getTime()) || Number.isNaN(fin.getTime())) {
      throw new ErrorValidacion("Las fechas de la encuesta no son válidas");
    }
    if (fin < inicio) {
      throw new ErrorValidacion(
        "La fecha de fin no puede ser anterior a la fecha de inicio",
      );
    }

    this.id = id;
    this.fechaInicio = fechaInicio;
    this.fechaFin = fechaFin;
    this.descripcion = String(descripcion).trim();
    this.idEmpleado = idEmpleado;
    this.idEstado = idEstado;
    opciones.forEach((opcion) => this.#incorporarOpcion(opcion));
  }

  // Fábrica para encuestas NUEVAS: siempre nacen activas y con opciones suficientes
  static crear({ fechaInicio, fechaFin, descripcion, idEmpleado, opciones }) {
    if (!Array.isArray(opciones) || opciones.length < MIN_OPCIONES) {
      throw new ErrorValidacion(
        `La encuesta debe tener al menos ${MIN_OPCIONES} opciones`,
      );
    }
    return new Encuesta({
      fechaInicio,
      fechaFin,
      descripcion,
      idEmpleado,
      idEstado: ESTADOS.ACTIVA,
      opciones,
    });
  }

  get opciones() {
    return [...this.#opciones];
  }

  estaActiva() {
    return this.idEstado === ESTADOS.ACTIVA;
  }

  cerrar() {
    this.idEstado = ESTADOS.CERRADA; // idempotente
  }

  // Regla de negocio: solo se vota en encuestas activas y en opciones propias
  validarVoto(idDetalle) {
    validarIdentificador(idDetalle, "opción");
    if (!this.estaActiva()) {
      throw new ErrorValidacion("La encuesta está cerrada");
    }
    const pertenece = this.#opciones.some(
      (opcion) => String(opcion.id) === String(idDetalle),
    );
    if (!pertenece) {
      throw new ErrorValidacion("La opción no pertenece a esta encuesta");
    }
  }

  // Opción con más votos (en empate gana la primera)
  ganadora() {
    if (this.#opciones.length === 0) {
      return { opcion: null, votos: 0 };
    }
    const mejor = this.#opciones.reduce((a, b) => (b.votos > a.votos ? b : a));
    return { opcion: mejor.etiqueta(), votos: mejor.votos };
  }

  #incorporarOpcion(opcion) {
    if (!(opcion instanceof OpcionEncuesta)) {
      throw new ErrorValidacion("La opción de la encuesta no es válida");
    }
    this.#opciones.push(opcion);
  }
}

Encuesta.ESTADOS = ESTADOS;
Encuesta.MIN_OPCIONES = MIN_OPCIONES;

module.exports = Encuesta;
