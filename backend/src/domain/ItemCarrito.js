const { ErrorValidacion } = require("./errores");
const { validarIdentificador, validarCantidadPositiva, redondearMonto } = require("./validaciones");

const esPrecioValido = (precio) => {
    if (precio === null || precio === undefined || precio === "") {
        return false;
    }
    const precioNumerico = Number(precio);
    return Number.isFinite(precioNumerico) && precioNumerico >= 0;
};

class ItemCarrito {
    constructor({ idProducto, cantidad, nombre, precio }) {
        validarIdentificador(idProducto, "producto");
        validarCantidadPositiva(cantidad);
        this.idProducto = idProducto;
        this.cantidad = cantidad;
        this.nombre = nombre;
        this.precio = precio;
    }

    correspondeAProducto(idProducto) {
        return String(this.idProducto) === String(idProducto);
    }

    aumentarCantidad(cantidadAdicional) {
        validarCantidadPositiva(cantidadAdicional);
        this.cantidad += cantidadAdicional;
    }

    cambiarCantidad(nuevaCantidad) {
        validarCantidadPositiva(nuevaCantidad);
        this.cantidad = nuevaCantidad;
    }

    calcularSubtotal() {
        if (!esPrecioValido(this.precio)) {
            throw new ErrorValidacion("El precio del producto no es válido");
        }
        return redondearMonto(Number(this.precio) * this.cantidad);
    }
}

module.exports = ItemCarrito;
