const { ErrorValidacion } = require("./errores");

class Producto {
    constructor({ id = null, nombre, caracteristica = null, precio,
                  idCategoria = null, idCompetencia = null,
                  idMarca = null, idEquipo = null, imagen = null }) {
        if (!nombre || !String(nombre).trim()) {
            throw new ErrorValidacion("El nombre del producto es obligatorio");
        }
        if (precio === undefined || precio === null || isNaN(precio) || Number(precio) <= 0) {
            throw new ErrorValidacion("El precio debe ser un número mayor a 0");
        }

        this.id = id;
        this.nombre = String(nombre).trim();
        this.caracteristica = caracteristica;
        this.precio = Number(precio);
        this.idCategoria = idCategoria;
        this.idCompetencia = idCompetencia;
        this.idMarca = idMarca;
        this.idEquipo = idEquipo;
        this.imagen = imagen;
    }
}

module.exports = Producto;