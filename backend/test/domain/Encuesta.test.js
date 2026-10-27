const Encuesta = require("../../src/domain/Encuesta");
const OpcionEncuesta = require("../../src/domain/OpcionEncuesta");
const { ErrorValidacion } = require("../../src/domain/errores");

const crearOpcion = (id, equipo, votos = 0) => new OpcionEncuesta({ id, equipo, votos });

describe("Encuesta", () => {
    let datosEncuesta;
    let encuesta;

    beforeEach(() => {
        datosEncuesta = {
            id: 3,
            fechaInicio: "2026-10-01",
            fechaFin: "2026-10-31",
            descripcion: "¿Cual es tu equipo favorito?",
            idEmpleado: 2,
            opciones: [crearOpcion(11, "Real Madrid", 4), crearOpcion(12, "Barcelona", 2)]
        };
        encuesta = new Encuesta(datosEncuesta);
    });

    afterEach(() => {
        encuesta = undefined;
    });

    describe("creacion", () => {
        test("crea la encuesta con sus datos cuando son validos", () => {
            expect(encuesta.id).toBe(3);
            expect(encuesta.fechaInicio).toBe("2026-10-01");
            expect(encuesta.fechaFin).toBe("2026-10-31");
            expect(encuesta.descripcion).toBe("¿Cual es tu equipo favorito?");
            expect(encuesta.idEmpleado).toBe(2);
            expect(encuesta.opciones).toHaveLength(2);
        });

        test("nace activa y sin identificador cuando no se indican", () => {
            const { id, ...sinId } = datosEncuesta;

            const encuestaNueva = new Encuesta(sinId);

            expect(encuestaNueva.id).toBeNull();
            expect(encuestaNueva.idEstado).toBe(Encuesta.ESTADOS.ACTIVA);
            expect(encuestaNueva.estaActiva()).toBe(true);
        });

        test("elimina los espacios sobrantes de la descripcion", () => {
            const encuestaConEspacios = new Encuesta({ ...datosEncuesta, descripcion: "  Equipo favorito  " });

            expect(encuestaConEspacios.descripcion).toBe("Equipo favorito");
        });

        test("acepta una encuesta que empieza y termina el mismo dia", () => {
            const crear = () => new Encuesta({ ...datosEncuesta, fechaInicio: "2026-10-10", fechaFin: "2026-10-10" });

            expect(crear).not.toThrow();
        });

        test("acepta una encuesta sin opciones", () => {
            const encuestaSinOpciones = new Encuesta({ ...datosEncuesta, opciones: undefined });

            expect(encuestaSinOpciones.opciones).toEqual([]);
        });

        test("expone los estados y el minimo de opciones como constantes", () => {
            expect(Encuesta.ESTADOS).toEqual({ ACTIVA: 1, CERRADA: 2 });
            expect(Object.isFrozen(Encuesta.ESTADOS)).toBe(true);
            expect(Encuesta.MIN_OPCIONES).toBe(2);
        });
    });

    describe("invariantes", () => {
        test.each([0, -1, 1.5, "abc", null, undefined])("rechaza el empleado invalido %p", (idInvalido) => {
            const crear = () => new Encuesta({ ...datosEncuesta, idEmpleado: idInvalido });

            expect(crear).toThrow(ErrorValidacion);
            expect(crear).toThrow("El identificador de empleado no es válido");
        });

        test.each([0, -1, "abc"])("rechaza el identificador de encuesta invalido %p", (idInvalido) => {
            const crear = () => new Encuesta({ ...datosEncuesta, id: idInvalido });

            expect(crear).toThrow("El identificador de encuesta no es válido");
        });

        test.each([
            ["fecha de inicio", { fechaInicio: undefined }],
            ["fecha de fin", { fechaFin: "" }],
            ["descripcion nula", { descripcion: null }],
            ["descripcion vacia", { descripcion: "" }],
            ["descripcion con solo espacios", { descripcion: "   " }]
        ])("rechaza la encuesta sin %s", (_campo, cambio) => {
            const crear = () => new Encuesta({ ...datosEncuesta, ...cambio });

            expect(crear).toThrow(ErrorValidacion);
            expect(crear).toThrow("Faltan datos de la encuesta");
        });

        test.each([
            ["inicio", { fechaInicio: "no-es-fecha" }],
            ["fin", { fechaFin: "tampoco" }]
        ])("rechaza una fecha de %s que no es valida", (_campo, cambio) => {
            const crear = () => new Encuesta({ ...datosEncuesta, ...cambio });

            expect(crear).toThrow("Las fechas de la encuesta no son válidas");
        });

        test("rechaza una fecha de fin anterior a la de inicio", () => {
            const crear = () => new Encuesta({ ...datosEncuesta, fechaInicio: "2026-10-31", fechaFin: "2026-10-01" });

            expect(crear).toThrow(ErrorValidacion);
            expect(crear).toThrow("La fecha de fin no puede ser anterior a la fecha de inicio");
        });

        test("rechaza opciones que no son instancias de OpcionEncuesta", () => {
            const crear = () => new Encuesta({ ...datosEncuesta, opciones: [{ equipo: "Real Madrid" }] });

            expect(crear).toThrow(ErrorValidacion);
            expect(crear).toThrow("La opción de la encuesta no es válida");
        });

        test("rechaza la creacion sin ningun dato", () => {
            expect(() => new Encuesta()).toThrow(ErrorValidacion);
        });

        test("no permite modificar las opciones desde la copia expuesta", () => {
            encuesta.opciones.push(crearOpcion(99, "Intruso"));

            expect(encuesta.opciones).toHaveLength(2);
        });
    });

    describe("crear", () => {
        test("crea una encuesta activa con al menos dos opciones", () => {
            const encuestaNueva = Encuesta.crear({ ...datosEncuesta, idEstado: Encuesta.ESTADOS.CERRADA });

            expect(encuestaNueva).toBeInstanceOf(Encuesta);
            expect(encuestaNueva.estaActiva()).toBe(true);
            expect(encuestaNueva.opciones).toHaveLength(2);
        });

        test.each([
            ["sin opciones", []],
            ["con una sola opcion", [crearOpcion(1, "Real Madrid")]],
            ["con opciones nulas", null],
            ["con opciones que no son una lista", "Real Madrid"],
            ["sin indicar las opciones", undefined]
        ])("rechaza la encuesta %s", (_caso, opciones) => {
            const crear = () => Encuesta.crear({ ...datosEncuesta, opciones });

            expect(crear).toThrow(ErrorValidacion);
            expect(crear).toThrow("La encuesta debe tener al menos 2 opciones");
        });
    });

    describe("cerrar", () => {
        test("cambia el estado de la encuesta a cerrada", () => {
            encuesta.cerrar();

            expect(encuesta.idEstado).toBe(Encuesta.ESTADOS.CERRADA);
            expect(encuesta.estaActiva()).toBe(false);
        });

        test("es idempotente cuando la encuesta ya esta cerrada", () => {
            encuesta.cerrar();
            encuesta.cerrar();

            expect(encuesta.idEstado).toBe(Encuesta.ESTADOS.CERRADA);
        });
    });

    describe("validarVoto", () => {
        test("permite votar una opcion de una encuesta activa", () => {
            expect(() => encuesta.validarVoto(11)).not.toThrow();
        });

        test("reconoce la opcion aunque el identificador llegue como texto", () => {
            expect(() => encuesta.validarVoto("12")).not.toThrow();
        });

        test.each([0, -1, "abc", null, undefined])("rechaza el identificador de opcion invalido %p", (idInvalido) => {
            expect(() => encuesta.validarVoto(idInvalido)).toThrow("El identificador de opción no es válido");
        });

        test("rechaza votar en una encuesta cerrada", () => {
            encuesta.cerrar();

            expect(() => encuesta.validarVoto(11)).toThrow(ErrorValidacion);
            expect(() => encuesta.validarVoto(11)).toThrow("La encuesta está cerrada");
        });

        test("rechaza una opcion que no pertenece a la encuesta", () => {
            expect(() => encuesta.validarVoto(99)).toThrow(ErrorValidacion);
            expect(() => encuesta.validarVoto(99)).toThrow("La opción no pertenece a esta encuesta");
        });
    });

    describe("ganadora", () => {
        test("devuelve la opcion con mas votos", () => {
            expect(encuesta.ganadora()).toEqual({ opcion: "Real Madrid", votos: 4 });
        });

        test("devuelve la primera opcion cuando hay empate", () => {
            const empatada = new Encuesta({
                ...datosEncuesta,
                opciones: [crearOpcion(11, "Real Madrid", 3), crearOpcion(12, "Barcelona", 3)]
            });

            expect(empatada.ganadora()).toEqual({ opcion: "Real Madrid", votos: 3 });
        });

        test("devuelve la etiqueta de liga o categoria cuando la opcion no tiene equipo", () => {
            const conLiga = new Encuesta({
                ...datosEncuesta,
                opciones: [crearOpcion(11, "Real Madrid", 1), new OpcionEncuesta({ id: 12, liga: "LaLiga", votos: 5 })]
            });

            expect(conLiga.ganadora()).toEqual({ opcion: "LaLiga", votos: 5 });
        });

        test("devuelve sin opcion ni votos cuando la encuesta no tiene opciones", () => {
            const sinOpciones = new Encuesta({ ...datosEncuesta, opciones: [] });

            expect(sinOpciones.ganadora()).toEqual({ opcion: null, votos: 0 });
        });
    });
});
