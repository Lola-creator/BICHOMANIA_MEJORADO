const EncuestaService = require("../../src/application/EncuestaService");
const ErrorPersistencia = require("../../src/application/ErrorPersistencia");
const RepositorioEncuesta = require("../../src/domain/RepositorioEncuesta");
const Encuesta = require("../../src/domain/Encuesta");
const OpcionEncuesta = require("../../src/domain/OpcionEncuesta");
const { ErrorValidacion, ErrorNoEncontrado } = require("../../src/domain/errores");

const crearRepositorioDoble = () => Object.getOwnPropertyNames(RepositorioEncuesta.prototype)
    .filter((nombreMetodo) => nombreMetodo !== "constructor")
    .reduce((doble, nombreMetodo) => ({ ...doble, [nombreMetodo]: jest.fn() }), {});

const crearEncuestaActiva = () => new Encuesta({
    id: 3,
    fechaInicio: "2026-10-01",
    fechaFin: "2026-10-31",
    descripcion: "¿Cual es tu equipo favorito?",
    idEmpleado: 2,
    opciones: [
        new OpcionEncuesta({ id: 11, equipo: "Real Madrid", votos: 4 }),
        new OpcionEncuesta({ id: 12, equipo: "Barcelona", votos: 2 })
    ]
});

describe("EncuestaService", () => {
    let repositorio;
    let servicio;
    let encuestaActiva;
    let errorBaseDeDatos;

    beforeEach(() => {
        repositorio = crearRepositorioDoble();
        servicio = new EncuestaService(repositorio);
        encuestaActiva = crearEncuestaActiva();
        errorBaseDeDatos = new Error("Conexion perdida");
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    describe("crearEncuesta", () => {
        let datosNuevos;

        beforeEach(() => {
            datosNuevos = {
                fecha_inicio: "2026-10-01",
                fecha_fin: "2026-10-31",
                descripcion: "¿Cual es tu equipo favorito?",
                id_empleado: 2,
                opciones: [
                    { opcion_equipo: "Real Madrid" },
                    { opcion_liga: "LaLiga", categoria: "Camisetas" }
                ]
            };
        });

        test("guarda una encuesta activa con sus opciones y confirma la creacion", async () => {
            repositorio.guardar.mockResolvedValue(20);

            const mensaje = await servicio.crearEncuesta(datosNuevos);

            expect(mensaje).toBe("Encuesta creada correctamente");
            expect(repositorio.guardar).toHaveBeenCalledTimes(1);
            const encuestaGuardada = repositorio.guardar.mock.calls[0][0];
            expect(encuestaGuardada).toBeInstanceOf(Encuesta);
            expect(encuestaGuardada.descripcion).toBe("¿Cual es tu equipo favorito?");
            expect(encuestaGuardada.idEmpleado).toBe(2);
            expect(encuestaGuardada.estaActiva()).toBe(true);
            expect(encuestaGuardada.opciones.map((opcion) => opcion.equipo)).toEqual(["Real Madrid", null]);
            expect(encuestaGuardada.opciones[1].liga).toBe("LaLiga");
            expect(encuestaGuardada.opciones[1].categoria).toBe("Camisetas");
        });

        test.each([
            ["sin datos", undefined],
            ["sin opciones", { ...{ fecha_inicio: "2026-10-01" } }]
        ])("rechaza la creacion %s", async (_caso, datos) => {
            await expect(servicio.crearEncuesta(datos)).rejects.toThrow("Faltan datos de la encuesta");
            expect(repositorio.guardar).not.toHaveBeenCalled();
        });

        test("rechaza la encuesta con menos de dos opciones sin guardarla", async () => {
            datosNuevos.opciones = [{ opcion_equipo: "Real Madrid" }];

            await expect(servicio.crearEncuesta(datosNuevos)).rejects.toThrow(ErrorValidacion);
            expect(repositorio.guardar).not.toHaveBeenCalled();
        });

        test("rechaza una opcion sin equipo, liga ni categoria", async () => {
            datosNuevos.opciones = [{ opcion_equipo: "Real Madrid" }, {}];

            await expect(servicio.crearEncuesta(datosNuevos)).rejects.toThrow(
                "Cada opción debe tener un equipo, una liga o una categoría"
            );
            expect(repositorio.guardar).not.toHaveBeenCalled();
        });

        test("rechaza fechas incoherentes sin guardar la encuesta", async () => {
            datosNuevos.fecha_inicio = "2026-11-01";

            await expect(servicio.crearEncuesta(datosNuevos)).rejects.toThrow(ErrorValidacion);
            expect(repositorio.guardar).not.toHaveBeenCalled();
        });

        test("convierte el fallo del repositorio en un error de persistencia", async () => {
            repositorio.guardar.mockRejectedValue(errorBaseDeDatos);

            const intento = servicio.crearEncuesta(datosNuevos);

            await expect(intento).rejects.toThrow(ErrorPersistencia);
            await expect(intento).rejects.toThrow("Error al crear encuesta");
            await expect(intento).rejects.toHaveProperty("causa", errorBaseDeDatos);
        });
    });

    describe("eliminarEncuesta", () => {
        test("elimina la encuesta y confirma el resultado", async () => {
            repositorio.eliminar.mockResolvedValue(1);

            const mensaje = await servicio.eliminarEncuesta("3");

            expect(mensaje).toBe("Encuesta eliminada");
            expect(repositorio.eliminar).toHaveBeenCalledWith("3");
        });

        test.each(["abc", 0, -2, null, undefined])("rechaza el identificador invalido %p", async (idInvalido) => {
            await expect(servicio.eliminarEncuesta(idInvalido)).rejects.toThrow(ErrorValidacion);
            expect(repositorio.eliminar).not.toHaveBeenCalled();
        });

        test("informa que la encuesta no existe cuando no se elimino ninguna fila", async () => {
            repositorio.eliminar.mockResolvedValue(0);

            await expect(servicio.eliminarEncuesta(3)).rejects.toThrow(ErrorNoEncontrado);
            await expect(servicio.eliminarEncuesta(3)).rejects.toThrow("Encuesta no encontrada");
        });

        test("convierte el fallo del repositorio en un error de persistencia", async () => {
            repositorio.eliminar.mockRejectedValue(errorBaseDeDatos);

            const intento = servicio.eliminarEncuesta(3);

            await expect(intento).rejects.toThrow(ErrorPersistencia);
            await expect(intento).rejects.toThrow("Error al eliminar encuesta");
        });
    });

    describe("cerrarEncuesta", () => {
        test("cierra la encuesta y persiste el nuevo estado", async () => {
            repositorio.obtenerPorId.mockResolvedValue(encuestaActiva);
            repositorio.actualizarEstado.mockResolvedValue(1);

            const mensaje = await servicio.cerrarEncuesta(3);

            expect(mensaje).toBe("Encuesta cerrada");
            expect(encuestaActiva.estaActiva()).toBe(false);
            expect(repositorio.actualizarEstado).toHaveBeenCalledWith(3, Encuesta.ESTADOS.CERRADA);
        });

        test("rechaza un identificador invalido sin consultar el repositorio", async () => {
            await expect(servicio.cerrarEncuesta("abc")).rejects.toThrow(ErrorValidacion);
            expect(repositorio.obtenerPorId).not.toHaveBeenCalled();
        });

        test("informa que la encuesta no existe y no actualiza el estado", async () => {
            repositorio.obtenerPorId.mockResolvedValue(null);

            await expect(servicio.cerrarEncuesta(3)).rejects.toThrow(ErrorNoEncontrado);
            expect(repositorio.actualizarEstado).not.toHaveBeenCalled();
        });

        test("convierte el fallo al obtener la encuesta en un error de persistencia", async () => {
            repositorio.obtenerPorId.mockRejectedValue(errorBaseDeDatos);

            await expect(servicio.cerrarEncuesta(3)).rejects.toThrow("Error al obtener la encuesta");
        });

        test("convierte el fallo al actualizar el estado en un error de persistencia", async () => {
            repositorio.obtenerPorId.mockResolvedValue(encuestaActiva);
            repositorio.actualizarEstado.mockRejectedValue(errorBaseDeDatos);

            const intento = servicio.cerrarEncuesta(3);

            await expect(intento).rejects.toThrow(ErrorPersistencia);
            await expect(intento).rejects.toThrow("Error al cerrar encuesta");
        });
    });

    describe("listarActivas", () => {
        test("devuelve las encuestas activas del repositorio", async () => {
            const filas = [{ id_encuesta: 3, descripcion: "Equipo favorito" }];
            repositorio.listarActivas.mockResolvedValue(filas);

            await expect(servicio.listarActivas()).resolves.toEqual(filas);
        });

        test("convierte el fallo del repositorio en un error de persistencia", async () => {
            repositorio.listarActivas.mockRejectedValue(errorBaseDeDatos);

            await expect(servicio.listarActivas()).rejects.toThrow("Error al obtener encuestas activas");
        });
    });

    describe("listarPorEmpleado", () => {
        test("devuelve las encuestas del empleado", async () => {
            const filas = [{ id_encuesta: 3, estado: "Activa" }];
            repositorio.listarPorEmpleado.mockResolvedValue(filas);

            await expect(servicio.listarPorEmpleado("2")).resolves.toEqual(filas);
            expect(repositorio.listarPorEmpleado).toHaveBeenCalledWith("2");
        });

        test.each([undefined, null, "", 0])("exige el id del empleado cuando llega %p", async (idFaltante) => {
            await expect(servicio.listarPorEmpleado(idFaltante)).rejects.toThrow("Falta el id_empleado");
            expect(repositorio.listarPorEmpleado).not.toHaveBeenCalled();
        });

        test("rechaza un identificador de empleado invalido", async () => {
            await expect(servicio.listarPorEmpleado("abc")).rejects.toThrow(
                "El identificador de empleado no es válido"
            );
        });

        test("convierte el fallo del repositorio en un error de persistencia", async () => {
            repositorio.listarPorEmpleado.mockRejectedValue(errorBaseDeDatos);

            await expect(servicio.listarPorEmpleado(2)).rejects.toThrow("Error al buscar encuestas");
        });
    });

    describe("obtenerDetalles", () => {
        test("devuelve los detalles de la encuesta", async () => {
            const detalles = [{ id_detalle: 11, opcion_equipo: "Real Madrid", votos: 4 }];
            repositorio.listarDetalles.mockResolvedValue(detalles);

            await expect(servicio.obtenerDetalles("3")).resolves.toEqual(detalles);
            expect(repositorio.listarDetalles).toHaveBeenCalledWith("3");
        });

        test("rechaza un identificador invalido", async () => {
            await expect(servicio.obtenerDetalles("abc")).rejects.toThrow(ErrorValidacion);
            expect(repositorio.listarDetalles).not.toHaveBeenCalled();
        });

        test("convierte el fallo del repositorio en un error de persistencia", async () => {
            repositorio.listarDetalles.mockRejectedValue(errorBaseDeDatos);

            await expect(servicio.obtenerDetalles(3)).rejects.toThrow(
                "Error al obtener los detalles de la encuesta"
            );
        });
    });

    describe("obtenerGanadora", () => {
        test("devuelve la opcion con mas votos", async () => {
            repositorio.obtenerPorId.mockResolvedValue(encuestaActiva);

            await expect(servicio.obtenerGanadora(3)).resolves.toEqual({ opcion: "Real Madrid", votos: 4 });
        });

        test("informa que la encuesta no existe", async () => {
            repositorio.obtenerPorId.mockResolvedValue(null);

            await expect(servicio.obtenerGanadora(3)).rejects.toThrow(ErrorNoEncontrado);
        });

        test("rechaza un identificador invalido", async () => {
            await expect(servicio.obtenerGanadora("abc")).rejects.toThrow(ErrorValidacion);
        });
    });

    describe("votar", () => {
        beforeEach(() => {
            repositorio.obtenerPorId.mockResolvedValue(encuestaActiva);
            repositorio.existeVoto.mockResolvedValue(false);
            repositorio.registrarVoto.mockResolvedValue(true);
        });

        test("registra el voto del cliente cuando cumple las reglas", async () => {
            const resultado = await servicio.votar("5", 3, 11);

            expect(resultado).toEqual({ msg: "Voto registrado" });
            expect(repositorio.existeVoto).toHaveBeenCalledWith("5", 3);
            expect(repositorio.registrarVoto).toHaveBeenCalledWith("5", 3, 11);
        });

        test.each([
            ["cliente", [undefined, 3, 11]],
            ["encuesta", ["5", null, 11]],
            ["opcion", ["5", 3, ""]]
        ])("exige el dato de %s para votar", async (_dato, argumentos) => {
            await expect(servicio.votar(...argumentos)).rejects.toThrow("Faltan datos para votar");
            expect(repositorio.registrarVoto).not.toHaveBeenCalled();
        });

        test("rechaza un identificador de cliente invalido", async () => {
            await expect(servicio.votar("abc", 3, 11)).rejects.toThrow("El identificador de cliente no es válido");
            expect(repositorio.obtenerPorId).not.toHaveBeenCalled();
        });

        test("informa que la encuesta no existe", async () => {
            repositorio.obtenerPorId.mockResolvedValue(null);

            await expect(servicio.votar("5", 3, 11)).rejects.toThrow(ErrorNoEncontrado);
            expect(repositorio.registrarVoto).not.toHaveBeenCalled();
        });

        test("rechaza votar en una encuesta cerrada sin consultar los votos previos", async () => {
            encuestaActiva.cerrar();

            await expect(servicio.votar("5", 3, 11)).rejects.toThrow("La encuesta está cerrada");
            expect(repositorio.existeVoto).not.toHaveBeenCalled();
            expect(repositorio.registrarVoto).not.toHaveBeenCalled();
        });

        test("rechaza una opcion que no pertenece a la encuesta", async () => {
            await expect(servicio.votar("5", 3, 99)).rejects.toThrow("La opción no pertenece a esta encuesta");
            expect(repositorio.registrarVoto).not.toHaveBeenCalled();
        });

        test("rechaza al cliente que ya voto en la encuesta", async () => {
            repositorio.existeVoto.mockResolvedValue(true);

            await expect(servicio.votar("5", 3, 11)).rejects.toThrow(ErrorValidacion);
            await expect(servicio.votar("5", 3, 11)).rejects.toThrow("Ya votaste en esta encuesta");
            expect(repositorio.registrarVoto).not.toHaveBeenCalled();
        });

        test("rechaza el voto duplicado detectado al registrarlo", async () => {
            repositorio.registrarVoto.mockResolvedValue(false);

            await expect(servicio.votar("5", 3, 11)).rejects.toThrow("Ya votaste en esta encuesta");
        });

        test("convierte el fallo al verificar el voto en un error de persistencia", async () => {
            repositorio.existeVoto.mockRejectedValue(errorBaseDeDatos);

            const intento = servicio.votar("5", 3, 11);

            await expect(intento).rejects.toThrow(ErrorPersistencia);
            await expect(intento).rejects.toThrow("Error al verificar el voto");
        });

        test("convierte el fallo al registrar el voto en un error de persistencia", async () => {
            repositorio.registrarVoto.mockRejectedValue(errorBaseDeDatos);

            await expect(servicio.votar("5", 3, 11)).rejects.toThrow("Error al registrar el voto");
        });
    });

    describe("yaVoto", () => {
        test.each([true, false])("indica si el cliente ya voto (%p)", async (respuesta) => {
            repositorio.existeVoto.mockResolvedValue(respuesta);

            await expect(servicio.yaVoto("5", "3")).resolves.toEqual({ yaVoto: respuesta });
            expect(repositorio.existeVoto).toHaveBeenCalledWith("5", "3");
        });

        test("rechaza un identificador de cliente invalido", async () => {
            await expect(servicio.yaVoto("abc", 3)).rejects.toThrow("El identificador de cliente no es válido");
            expect(repositorio.existeVoto).not.toHaveBeenCalled();
        });

        test("rechaza un identificador de encuesta invalido", async () => {
            await expect(servicio.yaVoto(5, "abc")).rejects.toThrow("El identificador de encuesta no es válido");
            expect(repositorio.existeVoto).not.toHaveBeenCalled();
        });

        test("convierte el fallo del repositorio en un error de persistencia", async () => {
            repositorio.existeVoto.mockRejectedValue(errorBaseDeDatos);

            await expect(servicio.yaVoto(5, 3)).rejects.toThrow("Error al verificar el voto");
        });
    });
});
