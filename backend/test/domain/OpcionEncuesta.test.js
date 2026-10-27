const OpcionEncuesta = require("../../src/domain/OpcionEncuesta");
const { ErrorValidacion } = require("../../src/domain/errores");

describe("OpcionEncuesta", () => {
    let opcion;

    beforeEach(() => {
        opcion = new OpcionEncuesta({ id: 4, equipo: "Real Madrid", liga: "LaLiga", categoria: "Camisetas", votos: 3 });
    });

    afterEach(() => {
        opcion = undefined;
    });

    describe("creacion", () => {
        test("crea la opcion con sus datos cuando son validos", () => {
            expect(opcion.id).toBe(4);
            expect(opcion.equipo).toBe("Real Madrid");
            expect(opcion.liga).toBe("LaLiga");
            expect(opcion.categoria).toBe("Camisetas");
            expect(opcion.votos).toBe(3);
        });

        test("asigna identificador nulo y cero votos por defecto", () => {
            const opcionNueva = new OpcionEncuesta({ equipo: "Barcelona" });

            expect(opcionNueva.id).toBeNull();
            expect(opcionNueva.votos).toBe(0);
        });

        test.each([
            ["equipo", { equipo: "Barcelona" }],
            ["liga", { liga: "Premier League" }],
            ["categoria", { categoria: "Accesorios" }]
        ])("acepta una opcion que solo tiene %s", (_campo, datos) => {
            expect(() => new OpcionEncuesta(datos)).not.toThrow();
        });

        test("elimina los espacios sobrantes de los textos", () => {
            const opcionConEspacios = new OpcionEncuesta({ equipo: "  Real Madrid  ", liga: " LaLiga " });

            expect(opcionConEspacios.equipo).toBe("Real Madrid");
            expect(opcionConEspacios.liga).toBe("LaLiga");
        });

        test.each(["", "   ", null, undefined])("convierte el texto vacio %p en null", (textoVacio) => {
            const opcionConVacio = new OpcionEncuesta({ equipo: "Real Madrid", liga: textoVacio });

            expect(opcionConVacio.liga).toBeNull();
        });

        test("acepta votos numericos en texto convirtiendolos a numero", () => {
            const opcionConVotosTexto = new OpcionEncuesta({ equipo: "Real Madrid", votos: "5" });

            expect(opcionConVotosTexto.votos).toBe(5);
        });
    });

    describe("invariantes", () => {
        test("rechaza una opcion sin equipo, liga ni categoria", () => {
            const crear = () => new OpcionEncuesta({});

            expect(crear).toThrow(ErrorValidacion);
            expect(crear).toThrow("Cada opción debe tener un equipo, una liga o una categoría");
        });

        test("rechaza una opcion cuyos textos son solo espacios", () => {
            const crear = () => new OpcionEncuesta({ equipo: " ", liga: "", categoria: null });

            expect(crear).toThrow(ErrorValidacion);
        });

        test("rechaza la creacion sin ningun dato", () => {
            expect(() => new OpcionEncuesta()).toThrow(ErrorValidacion);
        });

        test.each([-1, 1.5, "abc", NaN])("rechaza los votos invalidos %p", (votosInvalidos) => {
            const crear = () => new OpcionEncuesta({ equipo: "Real Madrid", votos: votosInvalidos });

            expect(crear).toThrow(ErrorValidacion);
            expect(crear).toThrow("Los votos de una opción deben ser un entero mayor o igual a 0");
        });

        test.each([0, "0"])("acepta cero votos como %p", (cero) => {
            expect(new OpcionEncuesta({ equipo: "Real Madrid", votos: cero }).votos).toBe(0);
        });

        test.each([0, -3, 1.5, "abc", ""])("rechaza el identificador invalido %p", (idInvalido) => {
            const crear = () => new OpcionEncuesta({ id: idInvalido, equipo: "Real Madrid" });

            expect(crear).toThrow(ErrorValidacion);
            expect(crear).toThrow("El identificador de opción no es válido");
        });

        test("acepta un identificador numerico en texto", () => {
            expect(new OpcionEncuesta({ id: "9", equipo: "Real Madrid" }).id).toBe("9");
        });
    });

    describe("etiqueta", () => {
        test("prioriza el equipo sobre la liga y la categoria", () => {
            expect(opcion.etiqueta()).toBe("Real Madrid");
        });

        test("usa la liga cuando no hay equipo", () => {
            const opcionSinEquipo = new OpcionEncuesta({ liga: "LaLiga", categoria: "Camisetas" });

            expect(opcionSinEquipo.etiqueta()).toBe("LaLiga");
        });

        test("usa la categoria cuando no hay equipo ni liga", () => {
            const opcionSoloCategoria = new OpcionEncuesta({ categoria: "Camisetas" });

            expect(opcionSoloCategoria.etiqueta()).toBe("Camisetas");
        });
    });
});
