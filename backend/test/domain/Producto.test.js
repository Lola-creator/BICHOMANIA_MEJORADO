const Producto = require("../../src/domain/Producto");
const { ErrorValidacion } = require("../../src/domain/errores");

describe("Entidad Producto", () => {
    let producto;

    beforeEach(() => {
        producto = new Producto({
            id: 1,
            nombre: "Camiseta Alianza",
            caracteristica: "Talla M",
            precio: 100,
            idCategoria: 2,
        });
    });

    afterEach(() => {
        producto = null;
    });

    describe("creación", () => {
        test("crea el producto con datos válidos", () => {
            expect(producto.nombre).toBe("Camiseta Alianza");
            expect(producto.precio).toBe(100);
            expect(producto.imagen).toBeNull();
        });

        test("recorta los espacios del nombre", () => {
            const p = new Producto({ nombre: "  Polo  ", precio: 50 });
            expect(p.nombre).toBe("Polo");
        });

        test("convierte el precio a número", () => {
            const p = new Producto({ nombre: "Polo", precio: "99.5" });
            expect(p.precio).toBe(99.5);
        });

        test("rechaza un nombre vacío", () => {
            expect(() => new Producto({ nombre: "   ", precio: 10 }))
                .toThrow(ErrorValidacion);
        });



        test.each([0, -5, "abc", null, undefined, ""])(
            "rechaza el precio inválido: %p",
            (precio) => {
                expect(() => new Producto({ nombre: "Polo", precio }))
                    .toThrow(ErrorValidacion);
            }
        );
    });

    describe("cambiarNombre", () => {
        test("actualiza el nombre", () => {
            producto.cambiarNombre("Camiseta Sporting Cristal");
            expect(producto.nombre).toBe("Camiseta Sporting Cristal");
        });

        test("rechaza un nombre vacío y conserva el anterior", () => {
            expect(() => producto.cambiarNombre("")).toThrow(ErrorValidacion);
            expect(producto.nombre).toBe("Camiseta Alianza");
        });
    });


});
