const CarritoRepository = require("../../src/infrastructure/persistence/CarritoRepository");
const RepositorioCarrito = require("../../src/domain/RepositorioCarrito");
const Carrito = require("../../src/domain/Carrito");
const ItemCarrito = require("../../src/domain/ItemCarrito");

const normalizarSql = (sql) => sql.replace(/\s+/g, " ").trim();

describe("CarritoRepository", () => {
    let conexion;
    let repositorio;

    const obtenerSqlEjecutado = () => normalizarSql(conexion.query.mock.calls[0][0]);
    const obtenerParametrosEjecutados = () => conexion.query.mock.calls[0][1];

    beforeEach(() => {
        conexion = { query: jest.fn() };
        repositorio = new CarritoRepository(conexion);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test("implementa el contrato RepositorioCarrito del dominio", () => {
        expect(repositorio).toBeInstanceOf(RepositorioCarrito);
    });

    describe("buscarActivoPorCliente", () => {
        test("consulta el carrito activo del cliente y lo mapea al agregado", async () => {
            conexion.query.mockResolvedValue([[{ id_carrito: 8 }], []]);

            const carrito = await repositorio.buscarActivoPorCliente("5");

            expect(obtenerSqlEjecutado()).toBe(
                "SELECT id_carrito FROM carritos WHERE id_cliente = ? AND id_estado = ? LIMIT 1"
            );
            expect(obtenerParametrosEjecutados()).toEqual(["5", 6]);
            expect(carrito).toBeInstanceOf(Carrito);
            expect(carrito.id).toBe(8);
            expect(carrito.idCliente).toBe("5");
        });

        test("devuelve null cuando el cliente no tiene carrito activo", async () => {
            conexion.query.mockResolvedValue([[], []]);

            await expect(repositorio.buscarActivoPorCliente(5)).resolves.toBeNull();
        });

        test("propaga el error de la base de datos", async () => {
            conexion.query.mockRejectedValue(new Error("Conexion perdida"));

            await expect(repositorio.buscarActivoPorCliente(5)).rejects.toThrow("Conexion perdida");
        });
    });

    describe("crear", () => {
        test("inserta el carrito activo con la fecha en formato AAAA-MM-DD y devuelve su identificador", async () => {
            conexion.query.mockResolvedValue([{ insertId: 15, affectedRows: 1 }, undefined]);
            const carritoNuevo = new Carrito({ idCliente: "5", fechaCreacion: new Date("2026-10-27T15:30:00Z") });

            const carritoCreado = await repositorio.crear(carritoNuevo);

            expect(obtenerSqlEjecutado()).toBe(
                "INSERT INTO carritos (fecha_creacion, id_cliente, id_estado) VALUES (?, ?, ?)"
            );
            expect(obtenerParametrosEjecutados()).toEqual(["2026-10-27", "5", 6]);
            expect(carritoCreado.id).toBe(15);
            expect(carritoCreado.idCliente).toBe("5");
            expect(carritoCreado.fechaCreacion).toBe(carritoNuevo.fechaCreacion);
        });

        test("propaga el error de la base de datos", async () => {
            conexion.query.mockRejectedValue(new Error("Duplicado"));
            const carritoNuevo = new Carrito({ idCliente: 5, fechaCreacion: new Date() });

            await expect(repositorio.crear(carritoNuevo)).rejects.toThrow("Duplicado");
        });
    });

    describe("listarProductos", () => {
        test("consulta los productos del carrito con nombre y precio y los mapea a items", async () => {
            conexion.query.mockResolvedValue([[
                { id_producto: 10, cantidad: 2, nombre: "Camiseta", precio: "25.50" },
                { id_producto: 20, cantidad: 1, nombre: "Gorra", precio: "10.00" }
            ], []]);

            const items = await repositorio.listarProductos(8);

            expect(obtenerSqlEjecutado()).toBe(
                "SELECT i.id_producto, i.cantidad, p.nombre, p.precio FROM items_carrito i " +
                "JOIN productos p ON (i.id_producto = p.id_producto) WHERE i.id_carrito = ?"
            );
            expect(obtenerParametrosEjecutados()).toEqual([8]);
            expect(items).toHaveLength(2);
            expect(items[0]).toBeInstanceOf(ItemCarrito);
            expect(items[0]).toMatchObject({ idProducto: 10, cantidad: 2, nombre: "Camiseta", precio: "25.50" });
        });

        test("devuelve una lista vacia cuando el carrito no tiene productos", async () => {
            conexion.query.mockResolvedValue([[], []]);

            await expect(repositorio.listarProductos(8)).resolves.toEqual([]);
        });

        test("propaga el error de la base de datos", async () => {
            conexion.query.mockRejectedValue(new Error("Tabla inexistente"));

            await expect(repositorio.listarProductos(8)).rejects.toThrow("Tabla inexistente");
        });
    });

    describe("buscarItem", () => {
        test("consulta la cantidad del producto en el carrito y la mapea a un item", async () => {
            conexion.query.mockResolvedValue([[{ cantidad: 3 }], []]);

            const item = await repositorio.buscarItem(8, 10);

            expect(obtenerSqlEjecutado()).toBe(
                "SELECT cantidad FROM items_carrito WHERE id_carrito = ? AND id_producto = ?"
            );
            expect(obtenerParametrosEjecutados()).toEqual([8, 10]);
            expect(item).toBeInstanceOf(ItemCarrito);
            expect(item).toMatchObject({ idProducto: 10, cantidad: 3 });
        });

        test("devuelve null cuando el producto no esta en el carrito", async () => {
            conexion.query.mockResolvedValue([[], []]);

            await expect(repositorio.buscarItem(8, 10)).resolves.toBeNull();
        });

        test("propaga el error de la base de datos", async () => {
            conexion.query.mockRejectedValue(new Error("Timeout"));

            await expect(repositorio.buscarItem(8, 10)).rejects.toThrow("Timeout");
        });
    });

    describe("agregarItem", () => {
        test("inserta el item con su carrito, producto y cantidad", async () => {
            conexion.query.mockResolvedValue([{ affectedRows: 1 }, undefined]);

            await repositorio.agregarItem(8, new ItemCarrito({ idProducto: 10, cantidad: 2 }));

            expect(obtenerSqlEjecutado()).toBe(
                "INSERT INTO items_carrito (id_carrito, id_producto, cantidad) VALUES (?, ?, ?)"
            );
            expect(obtenerParametrosEjecutados()).toEqual([8, 10, 2]);
        });

        test("propaga el error de la base de datos", async () => {
            conexion.query.mockRejectedValue(new Error("Clave foranea"));

            await expect(repositorio.agregarItem(8, new ItemCarrito({ idProducto: 10, cantidad: 2 })))
                .rejects.toThrow("Clave foranea");
        });
    });

    describe("actualizarCantidadItem", () => {
        test("actualiza la cantidad del item y devuelve las filas afectadas", async () => {
            conexion.query.mockResolvedValue([{ affectedRows: 1 }, undefined]);

            const filasAfectadas = await repositorio.actualizarCantidadItem(8, new ItemCarrito({ idProducto: 10, cantidad: 5 }));

            expect(obtenerSqlEjecutado()).toBe(
                "UPDATE items_carrito SET cantidad = ? WHERE id_carrito = ? AND id_producto = ?"
            );
            expect(obtenerParametrosEjecutados()).toEqual([5, 8, 10]);
            expect(filasAfectadas).toBe(1);
        });

        test("propaga el error de la base de datos", async () => {
            conexion.query.mockRejectedValue(new Error("Bloqueo"));

            await expect(repositorio.actualizarCantidadItem(8, new ItemCarrito({ idProducto: 10, cantidad: 5 })))
                .rejects.toThrow("Bloqueo");
        });
    });

    describe("eliminarItem", () => {
        test("elimina el producto del carrito y devuelve las filas afectadas", async () => {
            conexion.query.mockResolvedValue([{ affectedRows: 0 }, undefined]);

            const filasAfectadas = await repositorio.eliminarItem(8, "10");

            expect(obtenerSqlEjecutado()).toBe(
                "DELETE FROM items_carrito WHERE id_carrito = ? AND id_producto = ?"
            );
            expect(obtenerParametrosEjecutados()).toEqual([8, "10"]);
            expect(filasAfectadas).toBe(0);
        });

        test("propaga el error de la base de datos", async () => {
            conexion.query.mockRejectedValue(new Error("Sin permisos"));

            await expect(repositorio.eliminarItem(8, 10)).rejects.toThrow("Sin permisos");
        });
    });

    describe("vaciar", () => {
        test("elimina todos los items del carrito", async () => {
            conexion.query.mockResolvedValue([{ affectedRows: 3 }, undefined]);

            await repositorio.vaciar(8);

            expect(obtenerSqlEjecutado()).toBe("DELETE FROM items_carrito WHERE id_carrito = ?");
            expect(obtenerParametrosEjecutados()).toEqual([8]);
            expect(conexion.query).toHaveBeenCalledTimes(1);
        });

        test("propaga el error de la base de datos", async () => {
            conexion.query.mockRejectedValue(new Error("Sin conexion"));

            await expect(repositorio.vaciar(8)).rejects.toThrow("Sin conexion");
        });
    });

    describe("calcularTotalPorCliente", () => {
        test("suma cantidad por precio de los items del carrito activo del cliente", async () => {
            conexion.query.mockResolvedValue([[{ total: "61.00" }], []]);

            const total = await repositorio.calcularTotalPorCliente("5");

            expect(obtenerSqlEjecutado()).toBe(
                "SELECT SUM(i.cantidad * p.precio) AS total FROM items_carrito i " +
                "JOIN productos p ON p.id_producto = i.id_producto " +
                "JOIN carritos c ON c.id_carrito = i.id_carrito " +
                "WHERE c.id_cliente = ? AND c.id_estado = ?"
            );
            expect(obtenerParametrosEjecutados()).toEqual(["5", 6]);
            expect(total).toBe("61.00");
        });

        test("devuelve null cuando el cliente no tiene items", async () => {
            conexion.query.mockResolvedValue([[{ total: null }], []]);

            await expect(repositorio.calcularTotalPorCliente(5)).resolves.toBeNull();
        });

        test("devuelve null cuando la consulta no devuelve filas", async () => {
            conexion.query.mockResolvedValue([[], []]);

            await expect(repositorio.calcularTotalPorCliente(5)).resolves.toBeNull();
        });

        test("propaga el error de la base de datos", async () => {
            conexion.query.mockRejectedValue(new Error("Error SQL"));

            await expect(repositorio.calcularTotalPorCliente(5)).rejects.toThrow("Error SQL");
        });
    });
});
