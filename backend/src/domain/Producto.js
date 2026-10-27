const { ErrorValidacion } = require("./errores");

const validarNombre = (nombre) => {
    if (!nombre || !String(nombre).trim()) {
        throw new ErrorValidacion("El nombre del producto es obligatorio");
    }
    return String(nombre).trim();
};

const validarPrecio = (precio) => {
    if (precio === undefined || precio === null || precio === "" ||
        isNaN(precio) || Number(precio) <= 0) {
        throw new ErrorValidacion("El precio debe ser un número mayor a 0");
    }
    return Number(precio);
};

class Producto {
    constructor({ id = null, nombre, caracteristica = null, precio,
                  idCategoria = null, idCompetencia = null,
                  idMarca = null, idEquipo = null, imagen = null }) {
        this.id = id;
        this.nombre = validarNombre(nombre);
        this.caracteristica = caracteristica;
        this.precio = validarPrecio(precio);
        this.idCategoria = idCategoria;
        this.idCompetencia = idCompetencia;
        this.idMarca = idMarca;
        this.idEquipo = idEquipo;
        this.imagen = imagen;
    }

    cambiarNombre(nuevoNombre) {
        this.nombre = validarNombre(nuevoNombre);
    }

    cambiarPrecio(nuevoPrecio) {
        this.precio = validarPrecio(nuevoPrecio);
    }

    aplicarDescuento(porcentaje) {
        const p = Number(porcentaje);
        if (isNaN(p) || p <= 0 || p >= 100) {
            throw new ErrorValidacion("El descuento debe estar entre 0 y 100");
        }
        this.precio = Number((this.precio * (1 - p / 100)).toFixed(2));
    }

    asignarImagen(ruta) {
        if (!ruta || !String(ruta).trim()) {
            throw new ErrorValidacion("La ruta de la imagen es obligatoria");
        }
        this.imagen = ruta;
    }

    tieneImagen() {
        return Boolean(this.imagen);
    }

    perteneceACategoria(idCategoria) {
        return this.idCategoria === idCategoria;


        
    }
}

module.exports = Producto;