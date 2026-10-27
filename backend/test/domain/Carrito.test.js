const Carrito = require("../../src/domain/Carrito");
const ItemCarrito = require("../../src/domain/ItemCarrito");
const { ErrorValidacion, ErrorNoEncontrado } = require("../../src/domain/errores");

describe("Carrito", () => {
    let carrito;

    beforeEach(() => {
        carrito = new Carrito({
            id: 1,
            idCliente: "5",
            items: [
                new ItemCarrito({ idProducto: 10, cantidad: 2, precio: "25.50" }),
                new ItemCarrito({ idProducto: 20, cantidad: 1, precio: "10.00" })
            ]
        });
    });

    afterEach(() => {
        carrito = undefined;
    });

    describe("creacion", () => {
        test("crea el carrito con su identificador, cliente e items", () => {
            expect(carrito.id).toBe(1);
            expect(carrito.idCliente).toBe("5");
            expect(carrito.items).toHaveLength(2);
        });

        test("crea un carrito nuevo sin identificador, sin items y con fecha de creacion", () => {
            const fecha = new Date("2026-10-27T10:00:00Z");

            const carritoNuevo = new Carrito({ idCliente: 3, fechaCreacion: fecha });

            expect(carritoNuevo.id).toBeNull();
            expect(carritoNuevo.fechaCreacion).toBe(fecha);
            expect(carritoNuevo.estaVacio()).toBe(true);
        });

        test.each([0, -1, "abc", null, undefined])("rechaza el identificador de cliente invalido %p", (idInvalido) => {
            expect(() => new Carrito({ idCliente: idInvalido })).toThrow("El identificador de cliente no es válido");
        });

        test.each([0, -2, 1.5, "x"])("rechaza el identificador de carrito invalido %p", (idInvalido) => {
            expect(() => new Carrito({ id: idInvalido, idCliente: 1 })).toThrow("El identificador de carrito no es válido");
        });

        test("rechaza items que no son ItemCarrito", () => {
            const crear = () => new Carrito({ idCliente: 1, items: [{ idProducto: 1, cantidad: 1 }] });

            expect(crear).toThrow(ErrorValidacion);
            expect(crear).toThrow("El item del carrito no es válido");
        });

        test("rechaza items repetidos del mismo producto", () => {
            const crear = () => new Carrito({
                idCliente: 1,
                items: [
                    new ItemCarrito({ idProducto: 1, cantidad: 1 }),
                    new ItemCarrito({ idProducto: "1", cantidad: 2 })
                ]
            });

            expect(crear).toThrow("El producto ya está en el carrito");
        });
    });

    describe("buscarItem", () => {
        test("devuelve el item del producto solicitado", () => {
            expect(carrito.buscarItem("20").cantidad).toBe(1);
        });

        test("devuelve null cuando el producto no esta en el carrito", () => {
            expect(carrito.buscarItem(99)).toBeNull();
        });
    });

    describe("agregarItem", () => {
        test("agrega un producto nuevo al carrito", () => {
            const resultado = carrito.agregarItem(new ItemCarrito({ idProducto: 30, cantidad: 4 }));

            expect(resultado.esNuevo).toBe(true);
            expect(resultado.item.cantidad).toBe(4);
            expect(carrito.items).toHaveLength(3);
        });

        test("suma la cantidad cuando el producto ya esta en el carrito", () => {
            const resultado = carrito.agregarItem(new ItemCarrito({ idProducto: "10", cantidad: 3 }));

            expect(resultado.esNuevo).toBe(false);
            expect(resultado.item.cantidad).toBe(5);
            expect(carrito.items).toHaveLength(2);
        });

        test("rechaza agregar algo que no es un ItemCarrito", () => {
            expect(() => carrito.agregarItem({ idProducto: 30, cantidad: 1 })).toThrow(ErrorValidacion);
        });
    });

    describe("cambiarCantidadProducto", () => {
        test("cambia la cantidad de un producto existente", () => {
            const resultado = carrito.cambiarCantidadProducto(10, 7);

            expect(resultado).toEqual({ eliminado: false, item: carrito.buscarItem(10) });
            expect(carrito.buscarItem(10).cantidad).toBe(7);
        });

        test("elimina el producto cuando la nueva cantidad es cero", () => {
            const resultado = carrito.cambiarCantidadProducto(10, 0);

            expect(resultado).toEqual({ eliminado: true, item: null });
            expect(carrito.buscarItem(10)).toBeNull();
        });

        test("considera eliminado un producto ausente cuando la nueva cantidad es cero", () => {
            const resultado = carrito.cambiarCantidadProducto(99, 0);

            expect(resultado.eliminado).toBe(true);
            expect(carrito.items).toHaveLength(2);
        });

        test("rechaza una cantidad negativa", () => {
            expect(() => carrito.cambiarCantidadProducto(10, -1)).toThrow("La cantidad no puede ser negativa");
        });

        test("rechaza una cantidad decimal", () => {
            expect(() => carrito.cambiarCantidadProducto(10, 2.5)).toThrow("La cantidad debe ser un número entero");
        });

        test("rechaza un identificador de producto invalido", () => {
            expect(() => carrito.cambiarCantidadProducto("abc", 1)).toThrow("El identificador de producto no es válido");
        });

        test("lanza ErrorNoEncontrado cuando el producto no esta en el carrito", () => {
            const cambiar = () => carrito.cambiarCantidadProducto(99, 3);

            expect(cambiar).toThrow(ErrorNoEncontrado);
            expect(cambiar).toThrow("El producto no existe en el carrito");
        });
    });

    describe("eliminarProducto", () => {
        test("elimina el producto y devuelve true", () => {
            expect(carrito.eliminarProducto("20")).toBe(true);
            expect(carrito.items).toHaveLength(1);
        });

        test("devuelve false cuando el producto no esta en el carrito", () => {
            expect(carrito.eliminarProducto(99)).toBe(false);
            expect(carrito.items).toHaveLength(2);
        });

        test("rechaza un identificador de producto invalido", () => {
            expect(() => carrito.eliminarProducto(0)).toThrow(ErrorValidacion);
        });
    });

    describe("vaciar", () => {
        test("elimina todos los items del carrito", () => {
            carrito.vaciar();

            expect(carrito.estaVacio()).toBe(true);
        });
    });

    describe("calcularTotal", () => {
        test("suma los subtotales de todos los items", () => {
            expect(carrito.calcularTotal()).toBe(61);
        });

        test("devuelve cero cuando el carrito esta vacio", () => {
            carrito.vaciar();

            expect(carrito.calcularTotal()).toBe(0);
        });

        test("redondea el total a dos decimales", () => {
            const carritoConDecimales = new Carrito({
                idCliente: 1,
                items: [
                    new ItemCarrito({ idProducto: 1, cantidad: 1, precio: 0.1 }),
                    new ItemCarrito({ idProducto: 2, cantidad: 1, precio: 0.2 })
                ]
            });

            expect(carritoConDecimales.calcularTotal()).toBe(0.3);
        });
    });

    describe("items", () => {
        test("expone una copia que no altera el carrito al modificarse", () => {
            carrito.items.push(new ItemCarrito({ idProducto: 50, cantidad: 1 }));

            expect(carrito.items).toHaveLength(2);
        });
    });
});
