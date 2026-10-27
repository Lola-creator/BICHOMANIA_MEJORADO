class ErrorPersistencia extends Error {
    constructor(mensaje, causa) {
        super(mensaje);
        this.name = "ErrorPersistencia";
        this.causa = causa;
    }
}

module.exports = ErrorPersistencia;
