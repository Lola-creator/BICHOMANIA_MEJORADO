const ProductoService = require("../../src/application/ProductoService");
const ErrorPersistencia = require("../../src/application/ErrorPersistencia");
const RepositorioProducto = require("../../src/domain/RepositorioProducto");
const Producto = require("../../src/domain/Producto");
const { ErrorValidacion, ErrorNoEncontrado } = require("../../src/domain/errores");

const crearRepositorioDoble = () => Object.getOwnPropertyNames(RepositorioProducto.prototype)
    .filter((nombreMetodo) => nombreMetodo !== "constructor")
    .reduce((doble, nombreMetodo) => ({ ...doble, [nombreMetodo]: jest.fn() }), {});

describe("ProductoService", () => {
    let repositorio;
    let almacenImagenes;
    let servicio;
    let productoExistente;

    const datosValidos = () => ({
        nombre: "Camiseta Alianza",
        caracteristica: "Talla M",
        precio: "100",
        idCategoria: 2,
        idCompetencia: 3,
        idMarca: 4,
        idEquipo: 9,
    });

    beforeEach(() => {
        repositorio = crearRepositorioDoble();
        almacenImagenes = { eliminar: jest.fn() };
        servicio = new ProductoService(repositorio, almacenImagenes);
        productoExistente = new Producto({
            id: 7,
            nombre: "Polo",
            precio: 50,
            imagen: "/uploads/vieja.png",
        });
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    describe("agregar", () => {
        test("crea el producto en el repositorio y devuelve su identificador", async () => {
            repositorio.crear.mockResolvedValue(15);

            const respuesta = await servicio.agregar(datosValidos());

            expect(repositorio.crear).toHaveBeenCalledTimes(1);
            expect(respuesta).toEqual({
                message: "Producto agregado correctamente",
                id_producto: 15,
            });
        });

        test("entrega al repositorio una entidad Producto con los datos normalizados", async () => {
            repositorio.crear.mockResolvedValue(15);

            await servicio.agregar({ ...datosValidos(), nombre: "  Camiseta Alianza  " });

            const producto = repositorio.crear.mock.calls[0][0];
            expect(producto).toBeInstanceOf(Producto);
            expect(producto).toMatchObject({
                nombre: "Camiseta Alianza",
                caracteristica: "Talla M",
                precio: 100,
                idCategoria: 2,
                idCompetencia: 3,
                idMarca: 4,
                idEquipo: 9,
            });
        });

        test.each([
            ["nombre vacio", { nombre: "   " }],
            ["precio cero", { precio: 0 }],
            ["precio no numerico", { precio: "abc" }],
        ])("rechaza datos invalidos (%s) sin llamar al repositorio", async (_caso, cambio) => {
            await expect(servicio.agregar({ ...datosValidos(), ...cambio }))
                .rejects.toThrow(ErrorValidacion);

            expect(repositorio.crear).not.toHaveBeenCalled();
        });

        test("propaga el error de persistencia del repositorio", async () => {
            repositorio.crear.mockRejectedValue(new ErrorPersistencia("Error al insertar el producto"));

            await expect(servicio.agregar(datosValidos()))
                .rejects.toThrow(ErrorPersistencia);
        });
    });

    describe("editar", () => {
        test("lanza ErrorNoEncontrado si el producto no existe", async () => {
            repositorio.buscarPorId.mockResolvedValue(null);

            await expect(servicio.editar(99, datosValidos()))
                .rejects.toThrow(ErrorNoEncontrado);

            expect(repositorio.buscarPorId).toHaveBeenCalledWith(99);
            expect(repositorio.actualizar).not.toHaveBeenCalled();
            expect(almacenImagenes.eliminar).not.toHaveBeenCalled();
        });

        test("actualiza el producto conservando su id", async () => {
            repositorio.buscarPorId.mockResolvedValue(productoExistente);

            const respuesta = await servicio.editar(7, datosValidos());

            const actualizado = repositorio.actualizar.mock.calls[0][0];
            expect(actualizado).toBeInstanceOf(Producto);
            expect(actualizado).toMatchObject({ id: 7, nombre: "Camiseta Alianza", precio: 100 });
            expect(respuesta).toEqual({ message: "Producto actualizado correctamente" });
        });

        test("con imagen nueva guarda la nueva y elimina la anterior", async () => {
            repositorio.buscarPorId.mockResolvedValue(productoExistente);

            await servicio.editar(7, datosValidos(), "/uploads/nueva.png");

            expect(repositorio.actualizar.mock.calls[0][0].imagen).toBe("/uploads/nueva.png");
            expect(almacenImagenes.eliminar).toHaveBeenCalledTimes(1);
            expect(almacenImagenes.eliminar).toHaveBeenCalledWith("/uploads/vieja.png");
        });

        test("sin imagen nueva conserva la anterior y no elimina ningun archivo", async () => {
            repositorio.buscarPorId.mockResolvedValue(productoExistente);

            await servicio.editar(7, datosValidos());

            expect(repositorio.actualizar.mock.calls[0][0].imagen).toBe("/uploads/vieja.png");
            expect(almacenImagenes.eliminar).not.toHaveBeenCalled();
        });

        test("rechaza datos invalidos sin actualizar ni borrar la imagen", async () => {
            repositorio.buscarPorId.mockResolvedValue(productoExistente);

            await expect(servicio.editar(7, { ...datosValidos(), precio: -1 }, "/uploads/nueva.png"))
                .rejects.toThrow(ErrorValidacion);

            expect(repositorio.actualizar).not.toHaveBeenCalled();
            expect(almacenImagenes.eliminar).not.toHaveBeenCalled();
        });

        test("no borra la imagen anterior si falla la actualizacion", async () => {
            repositorio.buscarPorId.mockResolvedValue(productoExistente);
            repositorio.actualizar.mockRejectedValue(new ErrorPersistencia("Error al editar producto"));

            await expect(servicio.editar(7, datosValidos(), "/uploads/nueva.png"))
                .rejects.toThrow(ErrorPersistencia);

            expect(almacenImagenes.eliminar).not.toHaveBeenCalled();
        });
    });

    describe("eliminar", () => {
        test("lanza ErrorNoEncontrado si el producto no existe", async () => {
            repositorio.buscarPorId.mockResolvedValue(null);

            await expect(servicio.eliminar(99)).rejects.toThrow(ErrorNoEncontrado);

            expect(repositorio.eliminar).not.toHaveBeenCalled();
            expect(almacenImagenes.eliminar).not.toHaveBeenCalled();
        });

        test("elimina el producto y su imagen", async () => {
            repositorio.buscarPorId.mockResolvedValue(productoExistente);
            repositorio.eliminar.mockResolvedValue();

            const respuesta = await servicio.eliminar(7);

            expect(repositorio.eliminar).toHaveBeenCalledWith(7);
            expect(almacenImagenes.eliminar).toHaveBeenCalledWith("/uploads/vieja.png");
            expect(respuesta).toEqual({ message: "Producto eliminado correctamente" });
        });

        test("elimina primero el registro y despues la imagen", async () => {
            const orden = [];
            repositorio.buscarPorId.mockResolvedValue(productoExistente);
            repositorio.eliminar.mockImplementation(async () => { orden.push("registro"); });
            almacenImagenes.eliminar.mockImplementation(() => { orden.push("imagen"); });

            await servicio.eliminar(7);

            expect(orden).toEqual(["registro", "imagen"]);
        });

        test("no borra la imagen si falla la eliminacion del registro", async () => {
            repositorio.buscarPorId.mockResolvedValue(productoExistente);
            repositorio.eliminar.mockRejectedValue(new ErrorPersistencia("Error al eliminar producto"));

            await expect(servicio.eliminar(7)).rejects.toThrow(ErrorPersistencia);

            expect(almacenImagenes.eliminar).not.toHaveBeenCalled();
        });

        test("delega en el almacen aunque el producto no tenga imagen", async () => {
            repositorio.buscarPorId.mockResolvedValue(new Producto({ id: 8, nombre: "Gorra", precio: 20 }));

            await servicio.eliminar(8);

            expect(almacenImagenes.eliminar).toHaveBeenCalledWith(null);
        });
    });

    describe("listar", () => {
        test("delega en el repositorio con los filtros y devuelve su resultado", async () => {
            const filas = [{ id_producto: 1 }, { id_producto: 2 }];
            const filtros = { categoria: 2, nombre: "polo" };
            repositorio.listar.mockResolvedValue(filas);

            const resultado = await servicio.listar(filtros);

            expect(repositorio.listar).toHaveBeenCalledWith(filtros);
            expect(resultado).toBe(filas);
        });

        test("propaga el error de persistencia", async () => {
            repositorio.listar.mockRejectedValue(new ErrorPersistencia("Error al filtrar productos"));

            await expect(servicio.listar({})).rejects.toThrow(ErrorPersistencia);
        });
    });

    describe("obtenerDetalle", () => {
        test("devuelve el detalle del producto", async () => {
            const detalle = { id_producto: 7, nombre_producto: "Polo", categoria: "Ropa" };
            repositorio.buscarDetalle.mockResolvedValue(detalle);

            await expect(servicio.obtenerDetalle(7)).resolves.toBe(detalle);
            expect(repositorio.buscarDetalle).toHaveBeenCalledWith(7);
        });

        test("lanza ErrorNoEncontrado si el producto no existe", async () => {
            repositorio.buscarDetalle.mockResolvedValue(null);

            await expect(servicio.obtenerDetalle(99)).rejects.toThrow(ErrorNoEncontrado);
        });
    });
});