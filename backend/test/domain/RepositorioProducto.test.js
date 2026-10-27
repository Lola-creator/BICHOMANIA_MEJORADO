const RepositorioProducto = require("../../src/domain/RepositorioProducto");

describe("RepositorioProducto", () => {
    let repositorio;

    beforeEach(() => {
        repositorio = new RepositorioProducto();
    });

    afterEach(() => {
        repositorio = undefined;
    });

    test.each([
        "crear",
        "actualizar",
        "buscarPorId",
        "eliminar",
        "listar",
        "buscarDetalle"
    ])("el contrato exige implementar %s", async (nombreMetodo) => {
        await expect(repositorio[nombreMetodo]()).rejects.toThrow(`Método no implementado: ${nombreMetodo}`);
    });





    test("una subclase puede implementar un método sin afectar a los demás", async () => {
        class RepositorioParcial extends RepositorioProducto {
            async buscarPorId(id) {
                return { id };
            }
        }
        const parcial = new RepositorioParcial();

        await expect(parcial.buscarPorId(5)).resolves.toEqual({ id: 5 });
        await expect(parcial.eliminar(5)).rejects.toThrow("Método no implementado: eliminar");
    });
});