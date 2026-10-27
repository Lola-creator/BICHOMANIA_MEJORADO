const ProductoRepository = require("../../src/infrastructure/persistence/ProductoRepository");
const RepositorioProducto = require("../../src/domain/RepositorioProducto");
const Producto = require("../../src/domain/Producto");
const ErrorPersistencia = require("../../src/application/ErrorPersistencia");

const normalizarSql = (sql) => sql.replace(/\s+/g, " ").trim();

describe("ProductoRepository", () => {
    let conexion;
    let repositorio;

    const sqlEjecutado = (n = 0) => normalizarSql(conexion.query.mock.calls[n][0]);
    const parametrosEjecutados = (n = 0) => conexion.query.mock.calls[n][1];

    const crearProducto = (extra = {}) =>
        new Producto({
            id: 7,
            nombre: "Camiseta Alianza",
            caracteristica: "Talla M",
            precio: 100,
            idCategoria: 2,
            idCompetencia: 3,
            imagen: "/uploads/a.png",
            ...extra,
        });

    beforeEach(() => {
        conexion = { query: jest.fn() };
        repositorio = new ProductoRepository(conexion);
        jest.spyOn(console, "error").mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test("implementa el contrato RepositorioProducto del dominio", () => {
        expect(repositorio).toBeInstanceOf(RepositorioProducto);
    });

    describe("crear", () => {
        test("inserta el producto y devuelve su identificador", async () => {
            conexion.query.mockResolvedValue([{ insertId: 15 }, undefined]);

            const id = await repositorio.crear(crearProducto());

            expect(id).toBe(15);
            expect(conexion.query).toHaveBeenCalledTimes(1);
            expect(sqlEjecutado()).toBe(
                "INSERT INTO productos(nombre, caracteristica, precio, id_categoria, id_competencia, imagen) " +
                "VALUES (?, ?, ?, ?, ?, ?)"
            );
            expect(parametrosEjecutados()).toEqual([
                "Camiseta Alianza", "Talla M", 100, 2, 3, "/uploads/a.png",
            ]);
        });

        test("guarda las relaciones de marca y equipo con el id generado", async () => {
            conexion.query.mockResolvedValue([{ insertId: 15 }, undefined]);

            await repositorio.crear(crearProducto({ idMarca: 4, idEquipo: 9 }));

            expect(conexion.query).toHaveBeenCalledTimes(3);
            expect(sqlEjecutado(1)).toBe(
                "INSERT INTO marcas_productos(id_marca, id_producto) VALUES (?, ?)"
            );
            expect(parametrosEjecutados(1)).toEqual([4, 15]);
            expect(sqlEjecutado(2)).toBe(
                "INSERT INTO equipos_productos(id_equipo, id_producto) VALUES (?, ?)"
            );
            expect(parametrosEjecutados(2)).toEqual([9, 15]);
        });

        test("guarda solo la marca cuando no hay equipo", async () => {
            conexion.query.mockResolvedValue([{ insertId: 15 }, undefined]);

            await repositorio.crear(crearProducto({ idMarca: 4 }));

            expect(conexion.query).toHaveBeenCalledTimes(2);
            expect(sqlEjecutado(1)).toMatch(/marcas_productos/);
        });

        test("no inserta relaciones si no hay marca ni equipo", async () => {
            conexion.query.mockResolvedValue([{ insertId: 15 }, undefined]);

            await repositorio.crear(crearProducto());

            expect(conexion.query).toHaveBeenCalledTimes(1);
        });

        test("lanza ErrorPersistencia si la base de datos falla", async () => {
            conexion.query.mockRejectedValue(new Error("Duplicado"));

            const promesa = repositorio.crear(crearProducto());

            await expect(promesa).rejects.toThrow(ErrorPersistencia);
            await expect(promesa).rejects.toThrow("Error al insertar el producto");
        });

        test("lanza ErrorPersistencia si falla al guardar las relaciones", async () => {
            conexion.query
                .mockResolvedValueOnce([{ insertId: 15 }, undefined])
                .mockRejectedValueOnce(new Error("Clave foranea"));

            await expect(repositorio.crear(crearProducto({ idMarca: 4 })))
                .rejects.toThrow(ErrorPersistencia);
        });
    });

    describe("actualizar", () => {
        test("actualiza el producto usando su id en el WHERE", async () => {
            conexion.query.mockResolvedValue([{ affectedRows: 1 }, undefined]);

            await repositorio.actualizar(crearProducto());

            expect(sqlEjecutado(0)).toBe(
                "UPDATE productos SET nombre = ?, caracteristica = ?, precio = ?, " +
                "id_categoria = ?, id_competencia = ?, imagen = ? WHERE id_producto = ?"
            );
            expect(parametrosEjecutados(0)).toEqual([
                "Camiseta Alianza", "Talla M", 100, 2, 3, "/uploads/a.png", 7,
            ]);
        });

        test("borra las relaciones anteriores y guarda las nuevas", async () => {
            conexion.query.mockResolvedValue([{ affectedRows: 1 }, undefined]);

            await repositorio.actualizar(crearProducto({ idMarca: 4, idEquipo: 9 }));

            expect(conexion.query).toHaveBeenCalledTimes(5);
            expect(sqlEjecutado(1)).toBe("DELETE FROM marcas_productos WHERE id_producto = ?");
            expect(parametrosEjecutados(1)).toEqual([7]);
            expect(sqlEjecutado(2)).toBe("DELETE FROM equipos_productos WHERE id_producto = ?");
            expect(parametrosEjecutados(2)).toEqual([7]);
            expect(sqlEjecutado(3)).toMatch(/INSERT INTO marcas_productos/);
            expect(parametrosEjecutados(3)).toEqual([4, 7]);
            expect(sqlEjecutado(4)).toMatch(/INSERT INTO equipos_productos/);
            expect(parametrosEjecutados(4)).toEqual([9, 7]);
        });

        test("sin marca ni equipo solo borra las relaciones", async () => {
            conexion.query.mockResolvedValue([{ affectedRows: 1 }, undefined]);

            await repositorio.actualizar(crearProducto());

            expect(conexion.query).toHaveBeenCalledTimes(3);
        });

        test("lanza ErrorPersistencia si la base de datos falla", async () => {
            conexion.query.mockRejectedValue(new Error("Bloqueo"));

            const promesa = repositorio.actualizar(crearProducto());

            await expect(promesa).rejects.toThrow(ErrorPersistencia);
            await expect(promesa).rejects.toThrow("Error al editar producto");
        });
    });

    describe("buscarPorId", () => {
        test("consulta el producto con sus relaciones por id", async () => {
            conexion.query.mockResolvedValue([[], []]);

            await repositorio.buscarPorId(7);

            expect(sqlEjecutado()).toBe(
                "SELECT p.*, mp.id_marca, ep.id_equipo FROM productos p " +
                "LEFT JOIN marcas_productos mp ON p.id_producto = mp.id_producto " +
                "LEFT JOIN equipos_productos ep ON p.id_producto = ep.id_producto " +
                "WHERE p.id_producto = ? LIMIT 1"
            );
            expect(parametrosEjecutados()).toEqual([7]);
        });

        test("devuelve null cuando el producto no existe", async () => {
            conexion.query.mockResolvedValue([[], []]);

            await expect(repositorio.buscarPorId(99)).resolves.toBeNull();
        });

        test("mapea la fila a una entidad Producto", async () => {
            conexion.query.mockResolvedValue([[{
                id_producto: 7, nombre: "Polo", caracteristica: "XL", precio: "50.50",
                id_categoria: 2, id_competencia: 3, id_marca: 4, id_equipo: 9,
                imagen: "/uploads/p.png",
            }], []]);

            const producto = await repositorio.buscarPorId(7);

            expect(producto).toBeInstanceOf(Producto);
            expect(producto).toMatchObject({
                id: 7, nombre: "Polo", caracteristica: "XL", precio: 50.5,
                idCategoria: 2, idCompetencia: 3, idMarca: 4, idEquipo: 9,
                imagen: "/uploads/p.png",
            });
        });

        test("lanza ErrorPersistencia si la base de datos falla", async () => {
            conexion.query.mockRejectedValue(new Error("Timeout"));

            const promesa = repositorio.buscarPorId(7);

            await expect(promesa).rejects.toThrow(ErrorPersistencia);
            await expect(promesa).rejects.toThrow("Error al obtener producto");
        });
    });

    describe("eliminar", () => {
        test("borra primero las relaciones y al final el producto", async () => {
            conexion.query.mockResolvedValue([{ affectedRows: 1 }, undefined]);

            await repositorio.eliminar(7);

            expect(conexion.query).toHaveBeenCalledTimes(3);
            expect(sqlEjecutado(0)).toBe("DELETE FROM equipos_productos WHERE id_producto = ?");
            expect(sqlEjecutado(1)).toBe("DELETE FROM marcas_productos WHERE id_producto = ?");
            expect(sqlEjecutado(2)).toBe("DELETE FROM productos WHERE id_producto = ?");
            [0, 1, 2].forEach((n) => expect(parametrosEjecutados(n)).toEqual([7]));
        });

        test("lanza ErrorPersistencia si la base de datos falla", async () => {
            conexion.query.mockRejectedValue(new Error("Sin permisos"));

            const promesa = repositorio.eliminar(7);

            await expect(promesa).rejects.toThrow(ErrorPersistencia);
            await expect(promesa).rejects.toThrow("Error al eliminar producto");
        });

        test("no borra el producto si fallan las relaciones", async () => {
            conexion.query.mockRejectedValueOnce(new Error("Clave foranea"));

            await expect(repositorio.eliminar(7)).rejects.toThrow(ErrorPersistencia);
            expect(conexion.query).toHaveBeenCalledTimes(1);
        });
    });

    describe("listar", () => {
        test("sin filtros ejecuta el detalle sin parametros y devuelve las filas", async () => {
            const filas = [{ id_producto: 1 }, { id_producto: 2 }];
            conexion.query.mockResolvedValue([filas, []]);

            const resultado = await repositorio.listar();

            expect(resultado).toEqual(filas);
            expect(sqlEjecutado()).toMatch(/^SELECT DISTINCT p\.id_producto, p\.nombre AS nombre_producto/);
            expect(sqlEjecutado()).toMatch(/WHERE 1 = 1$/);
            expect(parametrosEjecutados()).toEqual([]);
        });

        test.each([
            ["categoria", 2, "AND p.id_categoria = ?", 2],
            ["competencia", 3, "AND p.id_competencia = ?", 3],
            ["marca", 4, "AND mp.id_marca = ?", 4],
            ["equipo", 9, "AND ep.id_equipo = ?", 9],
            ["nombre", "polo", "AND p.nombre LIKE ?", "%polo%"],
        ])("aplica el filtro %s", async (campo, valor, clausula, parametro) => {
            conexion.query.mockResolvedValue([[], []]);

            await repositorio.listar({ [campo]: valor });

            expect(sqlEjecutado()).toContain(clausula);
            expect(parametrosEjecutados()).toEqual([parametro]);
        });

        test("combina varios filtros conservando el orden de los parametros", async () => {
            conexion.query.mockResolvedValue([[], []]);

            await repositorio.listar({ categoria: 2, competencia: 3, marca: 4, equipo: 9, nombre: "polo" });

            expect(parametrosEjecutados()).toEqual([2, 3, 4, 9, "%polo%"]);
        });

        test("ignora los filtros vacios", async () => {
            conexion.query.mockResolvedValue([[], []]);

            await repositorio.listar({ categoria: "", nombre: undefined, marca: null });

            expect(sqlEjecutado()).toMatch(/WHERE 1 = 1$/);
            expect(parametrosEjecutados()).toEqual([]);
        });

        test("lanza ErrorPersistencia si la base de datos falla", async () => {
            conexion.query.mockRejectedValue(new Error("Error SQL"));

            const promesa = repositorio.listar({ categoria: 2 });

            await expect(promesa).rejects.toThrow(ErrorPersistencia);
            await expect(promesa).rejects.toThrow("Error al filtrar productos");
        });
    });

    describe("buscarDetalle", () => {
        test("consulta el detalle del producto por id", async () => {
            conexion.query.mockResolvedValue([[], []]);

            await repositorio.buscarDetalle(7);

            expect(sqlEjecutado()).toMatch(/^SELECT DISTINCT p\.id_producto/);
            expect(sqlEjecutado()).toMatch(/WHERE p\.id_producto = \? LIMIT 1$/);
            expect(parametrosEjecutados()).toEqual([7]);
        });

        test("devuelve la primera fila del detalle", async () => {
            const fila = { id_producto: 7, nombre_producto: "Polo", categoria: "Ropa" };
            conexion.query.mockResolvedValue([[fila], []]);

            await expect(repositorio.buscarDetalle(7)).resolves.toEqual(fila);
        });

        test("devuelve null cuando el producto no existe", async () => {
            conexion.query.mockResolvedValue([[], []]);

            await expect(repositorio.buscarDetalle(99)).resolves.toBeNull();
        });

        test("lanza ErrorPersistencia si la base de datos falla", async () => {
            conexion.query.mockRejectedValue(new Error("Conexion perdida"));

            const promesa = repositorio.buscarDetalle(7);

            await expect(promesa).rejects.toThrow(ErrorPersistencia);
            await expect(promesa).rejects.toThrow("Error al obtener producto");
        });
    });
});