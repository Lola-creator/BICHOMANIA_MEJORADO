const Carrito = require("../domain/Carrito");
const ItemCarrito = require("../domain/ItemCarrito");
const { ErrorValidacion, ErrorNoEncontrado } = require("../domain/errores");
const { validarCantidadNoNegativa } = require("../domain/validaciones");
const ErrorPersistencia = require("./ErrorPersistencia");

const aProductoRespuesta = (item) => ({
    id_producto: item.idProducto,
    cantidad: item.cantidad,
    nombre: item.nombre,
    precio: item.precio
});

class CarritoService {
    constructor(repositorio, obtenerFechaActual = () => new Date()) {
        this.repositorio = repositorio;
        this.obtenerFechaActual = obtenerFechaActual;
    }

    async obtenerCarrito(idCliente) {
        if (!idCliente) {
            throw new ErrorValidacion("Usuario no encontrado");
        }
        const carrito = await this.#buscarCarritoActivo(idCliente);
        if (!carrito) {
            return { mensaje: "No hay carrito creado" };
        }
        const items = await this.#ejecutar(
            () => this.repositorio.listarProductos(carrito.id),
            "Error al recuperar productos"
        );
        items.forEach((item) => carrito.incorporarItem(item));
        return { id_carrito: carrito.id, productos: carrito.items.map(aProductoRespuesta) };
    }

    async agregarProducto(idCliente, idProducto, cantidad) {
        if (!idCliente || !idProducto || !cantidad) {
            throw new ErrorValidacion("Faltan datos");
        }
        const itemSolicitado = new ItemCarrito({ idProducto, cantidad });
        const carrito = await this.#obtenerOCrearCarrito(idCliente);
        await this.#cargarItem(carrito, idProducto);
        const { item, esNuevo } = carrito.agregarItem(itemSolicitado);

        if (esNuevo) {
            await this.#ejecutar(() => this.repositorio.agregarItem(carrito.id, item), "Error al agregar item");
            return {
                mensaje: "Producto agregado al carrito",
                id_carrito: carrito.id,
                id_producto: item.idProducto,
                cantidad: item.cantidad
            };
        }

        await this.#ejecutar(() => this.repositorio.actualizarCantidadItem(carrito.id, item), "Error al actualizar item");
        return { mensaje: "Cantidad actualizada", id_carrito: carrito.id, nuevaCantidad: item.cantidad };
    }

    async actualizarCantidad(idCliente, idProducto, cantidad) {
        if (!idCliente || !idProducto || cantidad == null) {
            throw new ErrorValidacion("Faltan datos");
        }
        validarCantidadNoNegativa(cantidad);
        const carrito = await this.#obtenerCarritoActivoObligatorio(idCliente, "El cliente no tiene carrito activo");
        await this.#cargarItem(carrito, idProducto);
        const { eliminado, item } = carrito.cambiarCantidadProducto(idProducto, cantidad);

        if (eliminado) {
            await this.#ejecutar(() => this.repositorio.eliminarItem(carrito.id, idProducto), "Error al eliminar item");
            return { mensaje: "Producto eliminado del carrito", id_carrito: carrito.id, id_producto: idProducto };
        }

        const filasAfectadas = await this.#ejecutar(
            () => this.repositorio.actualizarCantidadItem(carrito.id, item),
            "Error al actualizar producto"
        );
        if (filasAfectadas === 0) {
            throw new ErrorNoEncontrado("El producto no existe en el carrito");
        }
        return { mensaje: "Cantidad actualizada", id_carrito: carrito.id, id_producto: idProducto, cantidad: item.cantidad };
    }

    async eliminarProducto(idCliente, idProducto) {
        if (!idCliente || !idProducto) {
            throw new ErrorValidacion("Faltan datos");
        }
        const carrito = await this.#obtenerCarritoActivoObligatorio(idCliente, "No hay carrito activo");
        carrito.eliminarProducto(idProducto);
        await this.#ejecutar(() => this.repositorio.eliminarItem(carrito.id, idProducto), "Error al eliminar producto");
        return { mensaje: "Producto eliminado del carrito", id_carrito: carrito.id, id_producto: idProducto };
    }

    async vaciar(idCliente) {
        if (!idCliente) {
            throw new ErrorValidacion("Falta id_cliente");
        }
        const carrito = await this.#obtenerCarritoActivoObligatorio(idCliente, "El cliente no tiene carrito activo");
        carrito.vaciar();
        await this.#ejecutar(() => this.repositorio.vaciar(carrito.id), "Error al vaciar carrito");
        return { mensaje: "Carrito vaciado correctamente", id_carrito: carrito.id };
    }

    async calcularTotal(idCliente) {
        const total = await this.#ejecutar(
            () => this.repositorio.calcularTotalPorCliente(idCliente),
            "Error al calcular total"
        );
        return { total };
    }

    async #ejecutar(operacion, mensajeError) {
        try {
            return await operacion();
        } catch (error) {
            throw new ErrorPersistencia(mensajeError, error);
        }
    }

    #buscarCarritoActivo(idCliente) {
        return this.#ejecutar(() => this.repositorio.buscarActivoPorCliente(idCliente), "Error al buscar carrito");
    }

    async #obtenerCarritoActivoObligatorio(idCliente, mensajeNoEncontrado) {
        const carrito = await this.#buscarCarritoActivo(idCliente);
        if (!carrito) {
            throw new ErrorNoEncontrado(mensajeNoEncontrado);
        }
        return carrito;
    }

    async #obtenerOCrearCarrito(idCliente) {
        const carritoExistente = await this.#buscarCarritoActivo(idCliente);
        if (carritoExistente) {
            return carritoExistente;
        }
        const carritoNuevo = new Carrito({ idCliente, fechaCreacion: this.obtenerFechaActual() });
        return this.#ejecutar(() => this.repositorio.crear(carritoNuevo), "Error al crear carrito");
    }

    async #cargarItem(carrito, idProducto) {
        const itemExistente = await this.#ejecutar(
            () => this.repositorio.buscarItem(carrito.id, idProducto),
            "Error al verificar item"
        );
        if (itemExistente) {
            carrito.incorporarItem(itemExistente);
        }
    }
}

module.exports = CarritoService;
