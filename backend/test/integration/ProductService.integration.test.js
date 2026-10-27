const ProductoService = require("../../src/application/ProductoService");
const ProductoRepository = require("../../src/infrastructure/persistence/ProductoRepository");
const ErrorPersistencia = require("../../src/application/ErrorPersistencia");
const { ErrorValidacion, ErrorNoEncontrado } = require("../../src/domain/errores");

const normalizarSql = (sql) => sql.replace(/\s+/g, " ").trim();

describe("ProductoService con ProductoRepository (integracion)", () => {
    let conexion;
    let almacenImagenes;
    let servicio;

    const sqlEjecutado = (n) => normalizarSql(conexion.query.mock.calls[n][0]);
    const parametrosEjecutados = (n) => conexion.query.mock.calls[n][1];
    const sentenciasEjecutadas = () => conexion.query.mock.calls.map(([sql]) => normalizarSql(sql));

    const filaProducto = (extra = {}) => ({
        id_producto: 7, nombre: "Polo", caracteristica: "XL", precio: "50.00",
        id_categoria: 2, id_competencia: 3, id_marca: 4, id_equipo: 9,
        imagen: "/uploads/vieja.png", ...extra,
    });

    const datosValidos = () => ({
        nombre: "  Camiseta Alianza ", caracteristica: "Talla M", precio: "100",
        idCategoria: 2, idCompetencia: 3, idMarca: 4, idEquipo: 9,
    });

    // Simula la base: responde segun el tipo de sentencia que reciba el repositorio.
    const simularBase = ({ producto = filaProducto(), insertId = 15 } = {}) => {
        conexion.query.mockImplementation(async (sql) => {
            const s = normalizarSql(sql);
            if (s.startsWith("INSERT INTO productos")) return [{ insertId }, undefined];
            if (s.startsWith("SELECT p.*")) return [producto ? [producto] : [], []];
            return [{ affectedRows: 1 }, undefined];
        });
    };

    beforeEach(() => {
        conexion = { query: jest.fn() };
        almacenImagenes = { eliminar: jest.fn() };
        servicio = new ProductoService(new ProductoRepository(conexion), almacenImagenes);
        jest.spyOn(console, "error").mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("agregar", () => {
        test("valida el producto, lo inserta con sus relaciones y devuelve el id generado", async () => {
            simularBase({ insertId: 15 });

            const respuesta = await servicio.agregar(datosValidos());

            expect(respuesta).toEqual({ message: "Producto agregado correctamente", id_producto: 15 });
            expect(conexion.query).toHaveBeenCalledTimes(3);
            expect(sqlEjecutado(0)).toMatch(/^INSERT INTO productos/);
            expect(parametrosEjecutados(0)).toEqual(["Camiseta Alianza", "Talla M", 100, 2, 3, null]);
            expect(sqlEjecutado(1)).toMatch(/^INSERT INTO marcas_productos/);
            expect(parametrosEjecutados(1)).toEqual([4, 15]);
            expect(sqlEjecutado(2)).toMatch(/^INSERT INTO equipos_productos/);
            expect(parametrosEjecutados(2)).toEqual([9, 15]);
        });

        test("con datos invalidos lanza ErrorValidacion y no consulta la base", async () => {
            simularBase();

            await expect(servicio.agregar({ ...datosValidos(), precio: 0 }))
                .rejects.toThrow(ErrorValidacion);

            expect(conexion.query).not.toHaveBeenCalled();
        });

        test("si la base falla lanza ErrorPersistencia", async () => {
            conexion.query.mockRejectedValue(new Error("Conexion perdida"));

            await expect(servicio.agregar(datosValidos()))
                .rejects.toThrow(ErrorPersistencia);
        });
    });

    describe("editar", () => {
        test("busca el producto, lo actualiza con imagen nueva y elimina la imagen anterior", async () => {
            simularBase();

            const respuesta = await servicio.editar(7, datosValidos(), "/uploads/nueva.png");

            expect(respuesta).toEqual({ message: "Producto actualizado correctamente" });
            expect(sqlEjecutado(0)).toMatch(/^SELECT p\.\*/);
            expect(sqlEjecutado(1)).toMatch(/^UPDATE productos/);
            expect(sqlEjecutado(2)).toMatch(/^DELETE FROM marcas_productos/);
            expect(sqlEjecutado(3)).toMatch(/^DELETE FROM equipos_productos/);
            expect(sqlEjecutado(4)).toMatch(/^INSERT INTO marcas_productos/);
            expect(sqlEjecutado(5)).toMatch(/^INSERT INTO equipos_productos/);
            expect(parametrosEjecutados(1)).toEqual([
                "Camiseta Alianza", "Talla M", 100, 2, 3, "/uploads/nueva.png", 7,
            ]);
            expect(almacenImagenes.eliminar).toHaveBeenCalledWith("/uploads/vieja.png");
        });

        test("sin imagen nueva conserva la imagen guardada y no elimina archivos", async () => {
            simularBase();

            await servicio.editar(7, datosValidos());

            expect(parametrosEjecutados(1)[5]).toBe("/uploads/vieja.png");
            expect(almacenImagenes.eliminar).not.toHaveBeenCalled();
        });

        test("si el producto no existe lanza ErrorNoEncontrado y solo consulta", async () => {
            simularBase({ producto: null });

            await expect(servicio.editar(99, datosValidos()))
                .rejects.toThrow(ErrorNoEncontrado);

            expect(conexion.query).toHaveBeenCalledTimes(1);
            expect(almacenImagenes.eliminar).not.toHaveBeenCalled();
        });

        test("con datos invalidos lanza ErrorValidacion sin actualizar", async () => {
            simularBase();

            await expect(servicio.editar(7, { ...datosValidos(), nombre: "" }, "/uploads/nueva.png"))
                .rejects.toThrow(ErrorValidacion);

            expect(conexion.query).toHaveBeenCalledTimes(1);
            expect(almacenImagenes.eliminar).not.toHaveBeenCalled();
        });

        test("si falla el UPDATE lanza ErrorPersistencia y conserva la imagen anterior", async () => {
            conexion.query
                .mockResolvedValueOnce([[filaProducto()], []])
                .mockRejectedValueOnce(new Error("Bloqueo"));

            await expect(servicio.editar(7, datosValidos(), "/uploads/nueva.png"))
                .rejects.toThrow(ErrorPersistencia);

            expect(almacenImagenes.eliminar).not.toHaveBeenCalled();
        });
    });

    describe("eliminar", () => {
        test("borra relaciones y producto, y despues elimina la imagen", async () => {
            simularBase();

            const respuesta = await servicio.eliminar(7);

            expect(respuesta).toEqual({ message: "Producto eliminado correctamente" });
            expect(sentenciasEjecutadas().slice(1)).toEqual([
                "DELETE FROM equipos_productos WHERE id_producto = ?",
                "DELETE FROM marcas_productos WHERE id_producto = ?",
                "DELETE FROM productos WHERE id_producto = ?",
            ]);
            expect(almacenImagenes.eliminar).toHaveBeenCalledWith("/uploads/vieja.png");
        });

        test("si el producto no existe lanza ErrorNoEncontrado sin borrar nada", async () => {
            simularBase({ producto: null });

            await expect(servicio.eliminar(99)).rejects.toThrow(ErrorNoEncontrado);

            expect(conexion.query).toHaveBeenCalledTimes(1);
            expect(almacenImagenes.eliminar).not.toHaveBeenCalled();
        });

        test("si falla el borrado lanza ErrorPersistencia y conserva la imagen", async () => {
            conexion.query
                .mockResolvedValueOnce([[filaProducto()], []])
                .mockRejectedValueOnce(new Error("Clave foranea"));

            await expect(servicio.eliminar(7)).rejects.toThrow(ErrorPersistencia);

            expect(almacenImagenes.eliminar).not.toHaveBeenCalled();
        });
    });

    describe("listar", () => {
        test("traduce los filtros del servicio a la consulta SQL y devuelve las filas", async () => {
            const filas = [{ id_producto: 1, nombre_producto: "Polo" }];
            conexion.query.mockResolvedValue([filas, []]);

            const resultado = await servicio.listar({ categoria: 2, nombre: "polo" });

            expect(resultado).toEqual(filas);
            expect(sqlEjecutado(0)).toContain("AND p.id_categoria = ?");
            expect(sqlEjecutado(0)).toContain("AND p.nombre LIKE ?");
            expect(parametrosEjecutados(0)).toEqual([2, "%polo%"]);
        });

        test("si la base falla lanza ErrorPersistencia", async () => {
            conexion.query.mockRejectedValue(new Error("Error SQL"));

            await expect(servicio.listar({})).rejects.toThrow(ErrorPersistencia);
        });
    });

    describe("obtenerDetalle", () => {
        test("devuelve la fila de detalle del producto", async () => {
            const detalle = { id_producto: 7, nombre_producto: "Polo", categoria: "Ropa" };
            conexion.query.mockResolvedValue([[detalle], []]);

            await expect(servicio.obtenerDetalle(7)).resolves.toEqual(detalle);
            expect(parametrosEjecutados(0)).toEqual([7]);
        });

        test("si no existe lanza ErrorNoEncontrado", async () => {
            conexion.query.mockResolvedValue([[], []]);

            await expect(servicio.obtenerDetalle(99)).rejects.toThrow(ErrorNoEncontrado);
        });
    });
});