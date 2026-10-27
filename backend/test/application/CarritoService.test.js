const CarritoService = require("../../src/application/CarritoService");
const ErrorPersistencia = require("../../src/application/ErrorPersistencia");
const RepositorioCarrito = require("../../src/domain/RepositorioCarrito");
const Carrito = require("../../src/domain/Carrito");
const ItemCarrito = require("../../src/domain/ItemCarrito");
const { ErrorValidacion, ErrorNoEncontrado } = require("../../src/domain/errores");

const crearRepositorioDoble = () => Object.getOwnPropertyNames(RepositorioCarrito.prototype)
    .filter((nombreMetodo) => nombreMetodo !== "constructor")
    .reduce((doble, nombreMetodo) => ({ ...doble, [nombreMetodo]: jest.fn() }), {});

describe("CarritoService", () => {
    const FECHA_ACTUAL = new Date("2026-10-27T12:00:00Z");
    let repositorio;
    let obtenerFechaActual;
    let servicio;
    let carritoActivo;

    beforeEach(() => {
        repositorio = crearRepositorioDoble();
        obtenerFechaActual = jest.fn(() => FECHA_ACTUAL);
        servicio = new CarritoService(repositorio, obtenerFechaActual);
        carritoActivo = new Carrito({ id: 8, idCliente: "5" });
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    test("usa la fecha del sistema cuando no se inyecta un reloj", async () => {
        const servicioConRelojReal = new CarritoService(repositorio);
        repositorio.buscarActivoPorCliente.mockResolvedValue(null);
        repositorio.crear.mockImplementation(async (carrito) => new Carrito({ id: 1, idCliente: carrito.idCliente }));
        repositorio.buscarItem.mockResolvedValue(null);

        await servicioConRelojReal.agregarProducto("5", 10, 1);

        expect(repositorio.crear.mock.calls[0][0].fechaCreacion).toBeInstanceOf(Date);
    });

    describe("obtenerCarrito", () => {
        test("devuelve el carrito activo con sus productos", async () => {
            repositorio.buscarActivoPorCliente.mockResolvedValue(carritoActivo);
            repositorio.listarProductos.mockResolvedValue([
                new ItemCarrito({ idProducto: 10, cantidad: 2, nombre: "Camiseta", precio: "25.50" })
            ]);

            const respuesta = await servicio.obtenerCarrito("5");

            expect(repositorio.buscarActivoPorCliente).toHaveBeenCalledWith("5");
            expect(repositorio.listarProductos).toHaveBeenCalledWith(8);
            expect(respuesta).toEqual({
                id_carrito: 8,
                productos: [{ id_producto: 10, cantidad: 2, nombre: "Camiseta", precio: "25.50" }]
            });
        });

        test("informa que no hay carrito creado sin consultar productos", async () => {
            repositorio.buscarActivoPorCliente.mockResolvedValue(null);

            const respuesta = await servicio.obtenerCarrito("5");

            expect(respuesta).toEqual({ mensaje: "No hay carrito creado" });
            expect(repositorio.listarProductos).not.toHaveBeenCalled();
        });

        test.each([undefined, null, ""])("rechaza el cliente ausente %p sin usar el repositorio", async (idCliente) => {
            await expect(servicio.obtenerCarrito(idCliente)).rejects.toThrow(new ErrorValidacion("Usuario no encontrado"));
            expect(repositorio.buscarActivoPorCliente).not.toHaveBeenCalled();
        });

        test("traduce el fallo al buscar el carrito a ErrorPersistencia", async () => {
            const fallo = new Error("Conexion perdida");
            repositorio.buscarActivoPorCliente.mockRejectedValue(fallo);

            const promesa = servicio.obtenerCarrito("5");

            await expect(promesa).rejects.toBeInstanceOf(ErrorPersistencia);
            await expect(promesa).rejects.toMatchObject({ message: "Error al buscar carrito", causa: fallo });
        });

        test("traduce el fallo al recuperar productos a ErrorPersistencia", async () => {
            repositorio.buscarActivoPorCliente.mockResolvedValue(carritoActivo);
            repositorio.listarProductos.mockRejectedValue(new Error("Timeout"));

            await expect(servicio.obtenerCarrito("5")).rejects.toThrow(new ErrorPersistencia("Error al recuperar productos"));
        });
    });

    describe("agregarProducto", () => {
        test("agrega un producto nuevo al carrito activo existente", async () => {
            repositorio.buscarActivoPorCliente.mockResolvedValue(carritoActivo);
            repositorio.buscarItem.mockResolvedValue(null);

            const respuesta = await servicio.agregarProducto("5", 10, 2);

            expect(repositorio.crear).not.toHaveBeenCalled();
            expect(repositorio.buscarItem).toHaveBeenCalledWith(8, 10);
            expect(repositorio.agregarItem).toHaveBeenCalledWith(8, expect.objectContaining({ idProducto: 10, cantidad: 2 }));
            expect(repositorio.actualizarCantidadItem).not.toHaveBeenCalled();
            expect(respuesta).toEqual({ mensaje: "Producto agregado al carrito", id_carrito: 8, id_producto: 10, cantidad: 2 });
        });

        test("crea el carrito con la fecha actual cuando el cliente no tiene uno activo", async () => {
            repositorio.buscarActivoPorCliente.mockResolvedValue(null);
            repositorio.crear.mockResolvedValue(new Carrito({ id: 15, idCliente: "5", fechaCreacion: FECHA_ACTUAL }));
            repositorio.buscarItem.mockResolvedValue(null);

            const respuesta = await servicio.agregarProducto("5", 10, 1);

            expect(obtenerFechaActual).toHaveBeenCalledTimes(1);
            expect(repositorio.crear).toHaveBeenCalledWith(expect.objectContaining({ id: null, idCliente: "5", fechaCreacion: FECHA_ACTUAL }));
            expect(repositorio.agregarItem).toHaveBeenCalledWith(15, expect.any(ItemCarrito));
            expect(respuesta.id_carrito).toBe(15);
        });

        test("suma la cantidad cuando el producto ya esta en el carrito", async () => {
            repositorio.buscarActivoPorCliente.mockResolvedValue(carritoActivo);
            repositorio.buscarItem.mockResolvedValue(new ItemCarrito({ idProducto: 10, cantidad: 3 }));

            const respuesta = await servicio.agregarProducto("5", 10, 2);

            expect(repositorio.actualizarCantidadItem).toHaveBeenCalledWith(8, expect.objectContaining({ idProducto: 10, cantidad: 5 }));
            expect(repositorio.agregarItem).not.toHaveBeenCalled();
            expect(respuesta).toEqual({ mensaje: "Cantidad actualizada", id_carrito: 8, nuevaCantidad: 5 });
        });

        test.each([
            [undefined, 10, 1],
            ["5", undefined, 1],
            ["5", 10, undefined],
            ["5", 10, 0]
        ])("rechaza datos faltantes (%p, %p, %p) sin usar el repositorio", async (idCliente, idProducto, cantidad) => {
            await expect(servicio.agregarProducto(idCliente, idProducto, cantidad)).rejects.toThrow(new ErrorValidacion("Faltan datos"));
            expect(repositorio.buscarActivoPorCliente).not.toHaveBeenCalled();
        });

        test("rechaza una cantidad invalida antes de crear el carrito", async () => {
            await expect(servicio.agregarProducto("5", 10, -2)).rejects.toThrow("La cantidad debe ser un número entero mayor que cero");
            expect(repositorio.buscarActivoPorCliente).not.toHaveBeenCalled();
            expect(repositorio.crear).not.toHaveBeenCalled();
        });

        test("rechaza un cliente invalido sin crear el carrito", async () => {
            repositorio.buscarActivoPorCliente.mockResolvedValue(null);

            await expect(servicio.agregarProducto("abc", 10, 1)).rejects.toThrow(ErrorValidacion);
            expect(repositorio.crear).not.toHaveBeenCalled();
        });

        test.each([
            ["buscarActivoPorCliente", "Error al buscar carrito"],
            ["crear", "Error al crear carrito"],
            ["buscarItem", "Error al verificar item"],
            ["agregarItem", "Error al agregar item"]
        ])("traduce el fallo de %s al mensaje %p", async (metodoQueFalla, mensajeEsperado) => {
            repositorio.buscarActivoPorCliente.mockResolvedValue(null);
            repositorio.crear.mockResolvedValue(new Carrito({ id: 15, idCliente: "5" }));
            repositorio.buscarItem.mockResolvedValue(null);
            repositorio[metodoQueFalla].mockRejectedValue(new Error("Fallo de base de datos"));

            await expect(servicio.agregarProducto("5", 10, 1)).rejects.toThrow(new ErrorPersistencia(mensajeEsperado));
        });

        test("traduce el fallo al actualizar el item existente", async () => {
            repositorio.buscarActivoPorCliente.mockResolvedValue(carritoActivo);
            repositorio.buscarItem.mockResolvedValue(new ItemCarrito({ idProducto: 10, cantidad: 1 }));
            repositorio.actualizarCantidadItem.mockRejectedValue(new Error("Bloqueo"));

            await expect(servicio.agregarProducto("5", 10, 1)).rejects.toThrow(new ErrorPersistencia("Error al actualizar item"));
        });
    });

    describe("actualizarCantidad", () => {
        test("actualiza la cantidad de un producto del carrito", async () => {
            repositorio.buscarActivoPorCliente.mockResolvedValue(carritoActivo);
            repositorio.buscarItem.mockResolvedValue(new ItemCarrito({ idProducto: 10, cantidad: 2 }));
            repositorio.actualizarCantidadItem.mockResolvedValue(1);

            const respuesta = await servicio.actualizarCantidad("5", 10, 4);

            expect(repositorio.buscarItem).toHaveBeenCalledWith(8, 10);
            expect(repositorio.actualizarCantidadItem).toHaveBeenCalledWith(8, expect.objectContaining({ idProducto: 10, cantidad: 4 }));
            expect(respuesta).toEqual({ mensaje: "Cantidad actualizada", id_carrito: 8, id_producto: 10, cantidad: 4 });
        });

        test("elimina el producto cuando la cantidad es cero", async () => {
            repositorio.buscarActivoPorCliente.mockResolvedValue(carritoActivo);
            repositorio.buscarItem.mockResolvedValue(new ItemCarrito({ idProducto: 10, cantidad: 1 }));
            repositorio.eliminarItem.mockResolvedValue(1);

            const respuesta = await servicio.actualizarCantidad("5", 10, 0);

            expect(repositorio.eliminarItem).toHaveBeenCalledWith(8, 10);
            expect(repositorio.actualizarCantidadItem).not.toHaveBeenCalled();
            expect(respuesta).toEqual({ mensaje: "Producto eliminado del carrito", id_carrito: 8, id_producto: 10 });
        });

        test.each([
            [undefined, 10, 1],
            ["5", undefined, 1],
            ["5", 10, undefined],
            ["5", 10, null]
        ])("rechaza datos faltantes (%p, %p, %p)", async (idCliente, idProducto, cantidad) => {
            await expect(servicio.actualizarCantidad(idCliente, idProducto, cantidad)).rejects.toThrow(new ErrorValidacion("Faltan datos"));
            expect(repositorio.buscarActivoPorCliente).not.toHaveBeenCalled();
        });

        test("rechaza una cantidad negativa antes de buscar el carrito", async () => {
            await expect(servicio.actualizarCantidad("5", 10, -1)).rejects.toThrow(new ErrorValidacion("La cantidad no puede ser negativa"));
            expect(repositorio.buscarActivoPorCliente).not.toHaveBeenCalled();
        });

        test("lanza ErrorNoEncontrado cuando el cliente no tiene carrito activo", async () => {
            repositorio.buscarActivoPorCliente.mockResolvedValue(null);

            await expect(servicio.actualizarCantidad("5", 10, 2)).rejects.toThrow(new ErrorNoEncontrado("El cliente no tiene carrito activo"));
            expect(repositorio.buscarItem).not.toHaveBeenCalled();
        });

        test("lanza ErrorNoEncontrado cuando el producto no esta en el carrito", async () => {
            repositorio.buscarActivoPorCliente.mockResolvedValue(carritoActivo);
            repositorio.buscarItem.mockResolvedValue(null);

            await expect(servicio.actualizarCantidad("5", 99, 2)).rejects.toThrow(new ErrorNoEncontrado("El producto no existe en el carrito"));
            expect(repositorio.actualizarCantidadItem).not.toHaveBeenCalled();
        });

        test("lanza ErrorNoEncontrado cuando la actualizacion no afecta filas", async () => {
            repositorio.buscarActivoPorCliente.mockResolvedValue(carritoActivo);
            repositorio.buscarItem.mockResolvedValue(new ItemCarrito({ idProducto: 10, cantidad: 2 }));
            repositorio.actualizarCantidadItem.mockResolvedValue(0);

            await expect(servicio.actualizarCantidad("5", 10, 3)).rejects.toThrow(ErrorNoEncontrado);
        });

        test.each([
            ["buscarActivoPorCliente", 2, "Error al buscar carrito"],
            ["buscarItem", 2, "Error al verificar item"],
            ["actualizarCantidadItem", 2, "Error al actualizar producto"],
            ["eliminarItem", 0, "Error al eliminar item"]
        ])("traduce el fallo de %s con cantidad %p al mensaje %p", async (metodoQueFalla, cantidad, mensajeEsperado) => {
            repositorio.buscarActivoPorCliente.mockResolvedValue(carritoActivo);
            repositorio.buscarItem.mockResolvedValue(new ItemCarrito({ idProducto: 10, cantidad: 1 }));
            repositorio[metodoQueFalla].mockRejectedValue(new Error("Fallo de base de datos"));

            await expect(servicio.actualizarCantidad("5", 10, cantidad)).rejects.toThrow(new ErrorPersistencia(mensajeEsperado));
        });
    });

    describe("eliminarProducto", () => {
        test("elimina el producto del carrito activo", async () => {
            repositorio.buscarActivoPorCliente.mockResolvedValue(carritoActivo);
            repositorio.eliminarItem.mockResolvedValue(1);

            const respuesta = await servicio.eliminarProducto("5", 10);

            expect(repositorio.eliminarItem).toHaveBeenCalledWith(8, 10);
            expect(respuesta).toEqual({ mensaje: "Producto eliminado del carrito", id_carrito: 8, id_producto: 10 });
        });

        test.each([[undefined, 10], ["5", undefined]])("rechaza datos faltantes (%p, %p)", async (idCliente, idProducto) => {
            await expect(servicio.eliminarProducto(idCliente, idProducto)).rejects.toThrow(new ErrorValidacion("Faltan datos"));
            expect(repositorio.buscarActivoPorCliente).not.toHaveBeenCalled();
        });

        test("lanza ErrorNoEncontrado cuando no hay carrito activo", async () => {
            repositorio.buscarActivoPorCliente.mockResolvedValue(null);

            await expect(servicio.eliminarProducto("5", 10)).rejects.toThrow(new ErrorNoEncontrado("No hay carrito activo"));
            expect(repositorio.eliminarItem).not.toHaveBeenCalled();
        });

        test("rechaza un identificador de producto invalido sin eliminar", async () => {
            repositorio.buscarActivoPorCliente.mockResolvedValue(carritoActivo);

            await expect(servicio.eliminarProducto("5", "abc")).rejects.toThrow(ErrorValidacion);
            expect(repositorio.eliminarItem).not.toHaveBeenCalled();
        });

        test("traduce el fallo al eliminar a ErrorPersistencia", async () => {
            repositorio.buscarActivoPorCliente.mockResolvedValue(carritoActivo);
            repositorio.eliminarItem.mockRejectedValue(new Error("Sin permisos"));

            await expect(servicio.eliminarProducto("5", 10)).rejects.toThrow(new ErrorPersistencia("Error al eliminar producto"));
        });
    });

    describe("vaciar", () => {
        test("vacia el carrito activo del cliente", async () => {
            repositorio.buscarActivoPorCliente.mockResolvedValue(carritoActivo);

            const respuesta = await servicio.vaciar("5");

            expect(repositorio.vaciar).toHaveBeenCalledWith(8);
            expect(respuesta).toEqual({ mensaje: "Carrito vaciado correctamente", id_carrito: 8 });
        });

        test("rechaza el cliente ausente", async () => {
            await expect(servicio.vaciar(undefined)).rejects.toThrow(new ErrorValidacion("Falta id_cliente"));
            expect(repositorio.buscarActivoPorCliente).not.toHaveBeenCalled();
        });

        test("lanza ErrorNoEncontrado cuando el cliente no tiene carrito activo", async () => {
            repositorio.buscarActivoPorCliente.mockResolvedValue(null);

            await expect(servicio.vaciar("5")).rejects.toThrow(new ErrorNoEncontrado("El cliente no tiene carrito activo"));
            expect(repositorio.vaciar).not.toHaveBeenCalled();
        });

        test("traduce el fallo al vaciar a ErrorPersistencia", async () => {
            repositorio.buscarActivoPorCliente.mockResolvedValue(carritoActivo);
            repositorio.vaciar.mockRejectedValue(new Error("Sin conexion"));

            await expect(servicio.vaciar("5")).rejects.toThrow(new ErrorPersistencia("Error al vaciar carrito"));
        });
    });

    describe("calcularTotal", () => {
        test("devuelve el total calculado por el repositorio", async () => {
            repositorio.calcularTotalPorCliente.mockResolvedValue("61.00");

            const respuesta = await servicio.calcularTotal("5");

            expect(repositorio.calcularTotalPorCliente).toHaveBeenCalledWith("5");
            expect(respuesta).toEqual({ total: "61.00" });
        });

        test("devuelve total null cuando el carrito no tiene productos", async () => {
            repositorio.calcularTotalPorCliente.mockResolvedValue(null);

            await expect(servicio.calcularTotal("5")).resolves.toEqual({ total: null });
        });

        test("traduce el fallo al calcular el total a ErrorPersistencia", async () => {
            repositorio.calcularTotalPorCliente.mockRejectedValue(new Error("Error SQL"));

            await expect(servicio.calcularTotal("5")).rejects.toThrow(new ErrorPersistencia("Error al calcular total"));
        });
    });
});
