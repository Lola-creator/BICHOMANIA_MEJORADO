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

    describe("cambiarPrecio", () => {
        test("actualiza el precio", () => {
            producto.cambiarPrecio(150);
            expect(producto.precio).toBe(150);
        });

        test("rechaza un precio negativo y conserva el anterior", () => {
            expect(() => producto.cambiarPrecio(-1)).toThrow(ErrorValidacion);
            expect(producto.precio).toBe(100);
        });
    });

    describe("aplicarDescuento", () => {
        test("reduce el precio según el porcentaje", () => {
            producto.aplicarDescuento(20);
            expect(producto.precio).toBe(80);
        });

        test.each([0, -10, 100, 150, "abc"])(
            "rechaza el descuento inválido: %p",
            (porcentaje) => {
                expect(() => producto.aplicarDescuento(porcentaje))
                    .toThrow(ErrorValidacion);
                expect(producto.precio).toBe(100);
            }
        );
    });

    describe("imagen", () => {
        test("un producto nuevo no tiene imagen", () => {
            expect(producto.tieneImagen()).toBe(false);
        });

        test("asignarImagen guarda la ruta", () => {
            producto.asignarImagen("/uploads/123.png");
            expect(producto.imagen).toBe("/uploads/123.png");
            expect(producto.tieneImagen()).toBe(true);
        });

        test("rechaza una ruta vacía", () => {
            expect(() => producto.asignarImagen("")).toThrow(ErrorValidacion);
        });
    });

    describe("perteneceACategoria", () => {
        test("devuelve true si coincide la categoría", () => {
            expect(producto.perteneceACategoria(2)).toBe(true);
        });

        test("devuelve false si no coincide", () => {
            expect(producto.perteneceACategoria(9)).toBe(false);
        });
    });
});