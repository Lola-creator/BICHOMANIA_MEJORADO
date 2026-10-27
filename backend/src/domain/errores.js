class ErrorValidacion extends Error {
    constructor(mensaje) {
        super(mensaje);
        this.name = "ErrorValidacion";
    }
}

class ErrorNoEncontrado extends Error {
    constructor(mensaje) {
        super(mensaje);
        this.name = "ErrorNoEncontrado";
    }
}

module.exports = { ErrorValidacion, ErrorNoEncontrado };
