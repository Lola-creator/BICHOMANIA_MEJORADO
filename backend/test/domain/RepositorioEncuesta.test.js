const RepositorioEncuesta = require("../../src/domain/RepositorioEncuesta");

describe("RepositorioEncuesta", () => {
    let repositorio;

    beforeEach(() => {
        repositorio = new RepositorioEncuesta();
    });

    afterEach(() => {
        repositorio = undefined;
    });

    test.each([
        "guardar",
        "obtenerPorId",
        "eliminar",
        "actualizarEstado",
        "listarActivas",
        "listarPorEmpleado",
        "listarDetalles",
        "existeVoto",
        "registrarVoto"
    ])("el contrato exige implementar %s", async (nombreMetodo) => {
        await expect(repositorio[nombreMetodo]()).rejects.toThrow(`Método no implementado: ${nombreMetodo}`);
    });
});
