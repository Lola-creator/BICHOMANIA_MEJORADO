const ItemCarrito = require("./ItemCarrito");
const { ErrorValidacion, ErrorNoEncontrado } = require("./errores");
const { validarIdentificador, validarCantidadNoNegativa, redondearMonto } = require("./validaciones");

class Carrito {
    #items = [];

    constructor({ id = null, idCliente, fechaCreacion = null, items = [] }) {
        if (id !== null) {
            validarIdentificador(id, "carrito");
        }
        validarIdentificador(idCliente, "cliente");
        this.id = id;
        this.idCliente = idCliente;
        this.fechaCreacion = fechaCreacion;
        items.forEach((item) => this.incorporarItem(item));
    }

    get items() {
        return [...this.#items];
    }

    incorporarItem(item) {
        this.#validarEsItem(item);
        if (this.buscarItem(item.idProducto)) {
            throw new ErrorValidacion("El producto ya está en el carrito");
        }
        this.#items.push(item);
    }

    buscarItem(idProducto) {
        return this.#items.find((item) => item.correspondeAProducto(idProducto)) || null;
    }

    agregarItem(itemSolicitado) {
        this.#validarEsItem(itemSolicitado);
        const itemExistente = this.buscarItem(itemSolicitado.idProducto);
        if (itemExistente) {
            itemExistente.aumentarCantidad(itemSolicitado.cantidad);
            return { item: itemExistente, esNuevo: false };
        }
        this.#items.push(itemSolicitado);
        return { item: itemSolicitado, esNuevo: true };
    }

    cambiarCantidadProducto(idProducto, nuevaCantidad) {
        validarIdentificador(idProducto, "producto");
        validarCantidadNoNegativa(nuevaCantidad);
        if (nuevaCantidad === 0) {
            this.eliminarProducto(idProducto);
            return { eliminado: true, item: null };
        }
        const item = this.buscarItem(idProducto);
        if (!item) {
            throw new ErrorNoEncontrado("El producto no existe en el carrito");
        }
        item.cambiarCantidad(nuevaCantidad);
        return { eliminado: false, item };
    }

    eliminarProducto(idProducto) {
        validarIdentificador(idProducto, "producto");
        const cantidadDeItemsAnterior = this.#items.length;
        this.#items = this.#items.filter((item) => !item.correspondeAProducto(idProducto));
        return this.#items.length < cantidadDeItemsAnterior;
    }

    vaciar() {
        this.#items = [];
    }

    estaVacio() {
        return this.#items.length === 0;
    }

    calcularTotal() {
        const total = this.#items.reduce((acumulado, item) => acumulado + item.calcularSubtotal(), 0);
        return redondearMonto(total);
    }

    #validarEsItem(item) {
        if (!(item instanceof ItemCarrito)) {
            throw new ErrorValidacion("El item del carrito no es válido");
        }
    }
}

module.exports = Carrito;
