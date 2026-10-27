const EncuestaRepository = require("../../src/infrastructure/persistence/EncuestaRepository");
const RepositorioEncuesta = require("../../src/domain/RepositorioEncuesta");
const Encuesta = require("../../src/domain/Encuesta");
const OpcionEncuesta = require("../../src/domain/OpcionEncuesta");

const normalizarSql = (sql) => sql.replace(/\s+/g, " ").trim();

describe("EncuestaRepository", () => {
    let conexion;
    let transaccion;
    let repositorio;

    const sqlDe = (doble, posicion = 0) => normalizarSql(doble.query.mock.calls[posicion][0]);
    const parametrosDe = (doble, posicion = 0) => doble.query.mock.calls[posicion][1];

    beforeEach(() => {
        transaccion = {
            query: jest.fn(),
            beginTransaction: jest.fn().mockResolvedValue(undefined),
            commit: jest.fn().mockResolvedValue(undefined),
            rollback: jest.fn().mockResolvedValue(undefined),
            release: jest.fn()
        };
        conexion = { query: jest.fn(), getConnection: jest.fn().mockResolvedValue(transaccion) };
        repositorio = new EncuestaRepository(conexion);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    const verificarTransaccionConfirmada = () => {
        expect(transaccion.beginTransaction).toHaveBeenCalledTimes(1);
        expect(transaccion.commit).toHaveBeenCalledTimes(1);
        expect(transaccion.rollback).not.toHaveBeenCalled();
        expect(transaccion.release).toHaveBeenCalledTimes(1);
    };

    const verificarTransaccionRevertida = () => {
        expect(transaccion.commit).not.toHaveBeenCalled();
        expect(transaccion.rollback).toHaveBeenCalledTimes(1);
        expect(transaccion.release).toHaveBeenCalledTimes(1);
    };

    test("implementa el contrato RepositorioEncuesta del dominio", () => {
        expect(repositorio).toBeInstanceOf(RepositorioEncuesta);
    });

    describe("guardar", () => {
        let encuestaNueva;

        beforeEach(() => {
            encuestaNueva = Encuesta.crear({
                fechaInicio: "2026-10-01",
                fechaFin: "2026-10-31",
                descripcion: "¿Cual es tu equipo favorito?",
                idEmpleado: 2,
                opciones: [new OpcionEncuesta({ equipo: "Real Madrid" }), new OpcionEncuesta({ liga: "LaLiga" })]
            });
        });

        test("inserta la encuesta y sus opciones en una transaccion y devuelve su identificador", async () => {
            transaccion.query.mockResolvedValueOnce([{ insertId: 20 }, undefined]).mockResolvedValueOnce([{}, undefined]);

            const idEncuesta = await repositorio.guardar(encuestaNueva);

            expect(idEncuesta).toBe(20);
            expect(sqlDe(transaccion, 0)).toBe(
                "INSERT INTO encuestas (fecha_inicio, fecha_fin, descripcion, id_empleado, id_estado) VALUES (?, ?, ?, ?, ?)"
            );
            expect(parametrosDe(transaccion, 0)).toEqual([
                "2026-10-01", "2026-10-31", "¿Cual es tu equipo favorito?", 2, Encuesta.ESTADOS.ACTIVA
            ]);
            expect(sqlDe(transaccion, 1)).toBe(
                "INSERT INTO detalles_encuestas (id_encuesta, opcion_equipo, opcion_liga, categoria) VALUES ?"
            );
            expect(parametrosDe(transaccion, 1)).toEqual([[[20, "Real Madrid", null, null], [20, null, "LaLiga", null]]]);
            verificarTransaccionConfirmada();
        });

        test("revierte la transaccion y propaga el error cuando falla la insercion de opciones", async () => {
            transaccion.query.mockResolvedValueOnce([{ insertId: 20 }, undefined]).mockRejectedValueOnce(new Error("Fallo SQL"));

            await expect(repositorio.guardar(encuestaNueva)).rejects.toThrow("Fallo SQL");

            verificarTransaccionRevertida();
        });

        test("propaga el error cuando no se puede abrir la conexion", async () => {
            conexion.getConnection.mockRejectedValue(new Error("Sin conexiones"));

            await expect(repositorio.guardar(encuestaNueva)).rejects.toThrow("Sin conexiones");
            expect(transaccion.beginTransaction).not.toHaveBeenCalled();
        });
    });

    describe("obtenerPorId", () => {
        const filaEncuesta = {
            id_encuesta: 3,
            fecha_inicio: "2026-10-01",
            fecha_fin: "2026-10-31",
            descripcion: "¿Cual es tu equipo favorito?",
            id_empleado: 2,
            id_estado: 1
        };

        test("consulta la encuesta y sus detalles y los mapea al agregado", async () => {
            conexion.query
                .mockResolvedValueOnce([[filaEncuesta], []])
                .mockResolvedValueOnce([[
                    { id_detalle: 11, opcion_equipo: "Real Madrid", opcion_liga: null, categoria: null, votos: 4 },
                    { id_detalle: 12, opcion_equipo: null, opcion_liga: "LaLiga", categoria: null, votos: null }
                ], []]);

            const encuesta = await repositorio.obtenerPorId(3);

            expect(sqlDe(conexion, 0)).toBe(
                "SELECT id_encuesta, fecha_inicio, fecha_fin, descripcion, id_empleado, id_estado FROM encuestas WHERE id_encuesta = ?"
            );
            expect(parametrosDe(conexion, 0)).toEqual([3]);
            expect(sqlDe(conexion, 1)).toBe(
                "SELECT id_detalle, opcion_equipo, opcion_liga, categoria, votos FROM detalles_encuestas WHERE id_encuesta = ?"
            );
            expect(parametrosDe(conexion, 1)).toEqual([3]);
            expect(encuesta).toBeInstanceOf(Encuesta);
            expect(encuesta.id).toBe(3);
            expect(encuesta.idEmpleado).toBe(2);
            expect(encuesta.estaActiva()).toBe(true);
            expect(encuesta.opciones).toHaveLength(2);
            expect(encuesta.opciones[0]).toBeInstanceOf(OpcionEncuesta);
            expect(encuesta.opciones[0].votos).toBe(4);
            expect(encuesta.opciones[1].votos).toBe(0);
        });

        test("devuelve null sin consultar los detalles cuando la encuesta no existe", async () => {
            conexion.query.mockResolvedValue([[], []]);

            await expect(repositorio.obtenerPorId(99)).resolves.toBeNull();
            expect(conexion.query).toHaveBeenCalledTimes(1);
        });

        test("propaga el error de la base de datos", async () => {
            conexion.query.mockRejectedValue(new Error("Conexion perdida"));

            await expect(repositorio.obtenerPorId(3)).rejects.toThrow("Conexion perdida");
        });
    });

    describe("eliminar", () => {
        test("elimina votos, detalles y encuesta en una transaccion y devuelve las filas afectadas", async () => {
            transaccion.query
                .mockResolvedValueOnce([{ affectedRows: 3 }, undefined])
                .mockResolvedValueOnce([{ affectedRows: 2 }, undefined])
                .mockResolvedValueOnce([{ affectedRows: 1 }, undefined]);

            const filasAfectadas = await repositorio.eliminar(3);

            expect(filasAfectadas).toBe(1);
            expect(sqlDe(transaccion, 0)).toBe("DELETE FROM votos_encuestas WHERE id_encuesta = ?");
            expect(sqlDe(transaccion, 1)).toBe("DELETE FROM detalles_encuestas WHERE id_encuesta = ?");
            expect(sqlDe(transaccion, 2)).toBe("DELETE FROM encuestas WHERE id_encuesta = ?");
            transaccion.query.mock.calls.forEach(([, parametros]) => expect(parametros).toEqual([3]));
            verificarTransaccionConfirmada();
        });

        test("revierte la transaccion y propaga el error cuando falla un borrado", async () => {
            transaccion.query.mockResolvedValueOnce([{ affectedRows: 0 }, undefined]).mockRejectedValueOnce(new Error("Fallo SQL"));

            await expect(repositorio.eliminar(3)).rejects.toThrow("Fallo SQL");

            expect(transaccion.query).toHaveBeenCalledTimes(2);
            verificarTransaccionRevertida();
        });
    });

    describe("actualizarEstado", () => {
        test("actualiza el estado de la encuesta y devuelve las filas afectadas", async () => {
            conexion.query.mockResolvedValue([{ affectedRows: 1 }, undefined]);

            const filasAfectadas = await repositorio.actualizarEstado(3, Encuesta.ESTADOS.CERRADA);

            expect(filasAfectadas).toBe(1);
            expect(sqlDe(conexion)).toBe("UPDATE encuestas SET id_estado = ? WHERE id_encuesta = ?");
            expect(parametrosDe(conexion)).toEqual([2, 3]);
        });

        test("propaga el error de la base de datos", async () => {
            conexion.query.mockRejectedValue(new Error("Conexion perdida"));

            await expect(repositorio.actualizarEstado(3, 2)).rejects.toThrow("Conexion perdida");
        });
    });

    describe("listarActivas", () => {
        test("consulta las encuestas en estado activo", async () => {
            const filas = [{ id_encuesta: 3 }];
            conexion.query.mockResolvedValue([filas, []]);

            await expect(repositorio.listarActivas()).resolves.toEqual(filas);
            expect(sqlDe(conexion)).toBe(
                "SELECT id_encuesta, fecha_inicio, fecha_fin, descripcion FROM encuestas WHERE id_estado = ?"
            );
            expect(parametrosDe(conexion)).toEqual([Encuesta.ESTADOS.ACTIVA]);
        });
    });

    describe("listarPorEmpleado", () => {
        test("consulta las encuestas del empleado con el nombre de su estado", async () => {
            const filas = [{ id_encuesta: 3, estado: "Activa" }];
            conexion.query.mockResolvedValue([filas, []]);

            await expect(repositorio.listarPorEmpleado(2)).resolves.toEqual(filas);
            expect(sqlDe(conexion)).toBe(
                "SELECT e.id_encuesta, e.fecha_inicio, e.fecha_fin, e.descripcion, s.nombre AS estado FROM encuestas e JOIN estados s ON e.id_estado = s.id_estado WHERE e.id_empleado = ?"
            );
            expect(parametrosDe(conexion)).toEqual([2]);
        });
    });

    describe("listarDetalles", () => {
        test("consulta los detalles de la encuesta", async () => {
            const filas = [{ id_detalle: 11, votos: 4 }];
            conexion.query.mockResolvedValue([filas, []]);

            await expect(repositorio.listarDetalles(3)).resolves.toEqual(filas);
            expect(sqlDe(conexion)).toBe("SELECT * FROM detalles_encuestas WHERE id_encuesta = ?");
            expect(parametrosDe(conexion)).toEqual([3]);
        });
    });

    describe("existeVoto", () => {
        test("devuelve true cuando el cliente ya voto en la encuesta", async () => {
            conexion.query.mockResolvedValue([[{ 1: 1 }], []]);

            await expect(repositorio.existeVoto("5", 3)).resolves.toBe(true);
            expect(sqlDe(conexion)).toBe(
                "SELECT 1 FROM votos_encuestas WHERE id_cliente = ? AND id_encuesta = ? LIMIT 1"
            );
            expect(parametrosDe(conexion)).toEqual(["5", 3]);
        });

        test("devuelve false cuando el cliente aun no voto", async () => {
            conexion.query.mockResolvedValue([[], []]);

            await expect(repositorio.existeVoto("5", 3)).resolves.toBe(false);
        });
    });

    describe("registrarVoto", () => {
        test("inserta el voto y suma uno a la opcion dentro de una transaccion", async () => {
            transaccion.query.mockResolvedValue([{ affectedRows: 1 }, undefined]);

            await expect(repositorio.registrarVoto("5", 3, 11)).resolves.toBe(true);

            expect(sqlDe(transaccion, 0)).toBe(
                "INSERT INTO votos_encuestas (fecha_voto, id_cliente, id_detalle, id_encuesta) VALUES (CURDATE(), ?, ?, ?)"
            );
            expect(parametrosDe(transaccion, 0)).toEqual(["5", 11, 3]);
            expect(sqlDe(transaccion, 1)).toBe(
                "UPDATE detalles_encuestas SET votos = votos + 1 WHERE id_detalle = ? AND id_encuesta = ?"
            );
            expect(parametrosDe(transaccion, 1)).toEqual([11, 3]);
            verificarTransaccionConfirmada();
        });

        test("devuelve false y revierte cuando el voto esta duplicado", async () => {
            const errorDuplicado = Object.assign(new Error("Duplicado"), { code: "ER_DUP_ENTRY" });
            transaccion.query.mockRejectedValue(errorDuplicado);

            await expect(repositorio.registrarVoto("5", 3, 11)).resolves.toBe(false);

            expect(transaccion.query).toHaveBeenCalledTimes(1);
            verificarTransaccionRevertida();
        });

        test("propaga cualquier otro error y revierte la transaccion", async () => {
            transaccion.query.mockResolvedValueOnce([{}, undefined]).mockRejectedValueOnce(new Error("Fallo SQL"));

            await expect(repositorio.registrarVoto("5", 3, 11)).rejects.toThrow("Fallo SQL");

            verificarTransaccionRevertida();
        });
    });
});
