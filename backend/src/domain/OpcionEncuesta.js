const { ErrorValidacion } = require("./errores");
const { validarIdentificador } = require("./validaciones");

const textoLimpio = (valor) =>
  valor === undefined || valor === null || String(valor).trim() === ""
    ? null
    : String(valor).trim();

class OpcionEncuesta {
  constructor({
    id = null,
    equipo = null,
    liga = null,
    categoria = null,
    votos = 0,
  } = {}) {
    if (id !== null) {
      validarIdentificador(id, "opción");
    }
    this.id = id;
    this.equipo = textoLimpio(equipo);
    this.liga = textoLimpio(liga);
    this.categoria = textoLimpio(categoria);

    // INVARIANTE: una opción debe tener al menos equipo, liga o categoría
    if (!this.equipo && !this.liga && !this.categoria) {
      throw new ErrorValidacion(
        "Cada opción debe tener un equipo, una liga o una categoría",
      );
    }

    const numeroVotos = Number(votos);
    if (!Number.isInteger(numeroVotos) || numeroVotos < 0) {
      throw new ErrorValidacion(
        "Los votos de una opción deben ser un entero mayor o igual a 0",
      );
    }
    this.votos = numeroVotos;
  }

  etiqueta() {
    return this.equipo || this.liga || this.categoria;
  }
}

module.exports = OpcionEncuesta;
