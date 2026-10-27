const ItemCarrito = require("../../src/domain/ItemCarrito");
const { ErrorValidacion } = require("../../src/domain/errores");

describe("ItemCarrito", () => {
    let item;

    beforeEach(() => {
        item = new ItemCarrito({ idProducto: 10, cantidad: 2, nombre: "Camiseta", precio: "25.50" });
    });

    afterEach(() => {
        item = undefined;
    });

    describe("creacion", () => {
        test("crea el item con sus datos cuando son validos", () => {
            expect(item.idProducto).toBe(10);
            expect(item.cantidad).toBe(2);
            expect(item.nombre).toBe("Camiseta");
            expect(item.precio).toBe("25.50");
        });

        test("acepta un identificador de producto numerico en texto", () => {
            const itemConIdTexto = new ItemCarrito({ idProducto: "7", cantidad: 1 });

            expect(itemConIdTexto.idProducto).toBe("7");
        });

        test("acepta la cantidad minima de uno", () => {
            const itemMinimo = new ItemCarrito({ idProducto: 1, cantidad: 1 });

            expect(itemMinimo.cantidad).toBe(1);
        });

        test.each([0, -1, 1.5, "2", null, undefined, NaN])(
            "rechaza la cantidad invalida %p",
            (cantidadInvalida) => {
                const crear = () => new ItemCarrito({ idProducto: 1, cantidad: cantidadInvalida });

                expect(crear).toThrow(ErrorValidacion);
                expect(crear).toThrow("La cantidad debe ser un número entero mayor que cero");
            }
        );

        test.each([0, -3, 2.5, "abc", "", " 4", "0", null, undefined, {}])(
            "rechaza el identificador de producto invalido %p",
            (idInvalido) => {
                const crear = () => new ItemCarrito({ idProducto: idInvalido, cantidad: 1 });

                expect(crear).toThrow(ErrorValidacion);
                expect(crear).toThrow("El identificador de producto no es válido");
            }
        );
    });

    describe("correspondeAProducto", () => {
        test("reconoce el mismo producto aunque el identificador venga como texto", () => {
            expect(item.correspondeAProducto("10")).toBe(true);
        });

        test("no reconoce un producto distinto", () => {
            expect(item.correspondeAProducto(11)).toBe(false);
        });
    });

    describe("aumentarCantidad", () => {
        test("suma la cantidad adicional a la cantidad actual", () => {
            item.aumentarCantidad(3);

            expect(item.cantidad).toBe(5);
        });

        test("rechaza aumentar con una cantidad no positiva y conserva la cantidad", () => {
            expect(() => item.aumentarCantidad(0)).toThrow(ErrorValidacion);
            expect(item.cantidad).toBe(2);
        });
    });

    describe("cambiarCantidad", () => {
        test("reemplaza la cantidad por la nueva cantidad", () => {
            item.cambiarCantidad(8);

            expect(item.cantidad).toBe(8);
        });

        test("rechaza una cantidad decimal y conserva la cantidad", () => {
            expect(() => item.cambiarCantidad(1.2)).toThrow(ErrorValidacion);
            expect(item.cantidad).toBe(2);
        });
    });

    describe("calcularSubtotal", () => {
        test("multiplica el precio en texto por la cantidad", () => {
            expect(item.calcularSubtotal()).toBe(51);
        });

        test("redondea el subtotal a dos decimales", () => {
            const itemConDecimales = new ItemCarrito({ idProducto: 2, cantidad: 3, precio: 19.9 });

            expect(itemConDecimales.calcularSubtotal()).toBe(59.7);
        });

        test("devuelve cero cuando el precio es cero", () => {
            const itemGratis = new ItemCarrito({ idProducto: 3, cantidad: 4, precio: 0 });

            expect(itemGratis.calcularSubtotal()).toBe(0);
        });

        test.each([undefined, null, "", "abc", -1])(
            "rechaza calcular el subtotal con el precio invalido %p",
            (precioInvalido) => {
                const itemSinPrecio = new ItemCarrito({ idProducto: 4, cantidad: 1, precio: precioInvalido });

                expect(() => itemSinPrecio.calcularSubtotal()).toThrow("El precio del producto no es válido");
            }
        );
    });
});
