const RepositorioCarrito = require("../../src/domain/RepositorioCarrito");

describe("RepositorioCarrito", () => {
    let repositorio;

    beforeEach(() => {
        repositorio = new RepositorioCarrito();
    });

    afterEach(() => {
        repositorio = undefined;
    });

    test.each([
        "buscarActivoPorCliente",
        "crear",
        "listarProductos",
        "buscarItem",
        "agregarItem",
        "actualizarCantidadItem",
        "eliminarItem",
        "vaciar",
        "calcularTotalPorCliente"
    ])("el contrato exige implementar %s", async (nombreMetodo) => {
        await expect(repositorio[nombreMetodo]()).rejects.toThrow(`Método no implementado: ${nombreMetodo}`);
    });
});
