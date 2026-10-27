const { ErrorValidacion } = require("./errores");

class Producto {
  constructor({
    id = null,
    nombre,
    caracteristica = "",
    precio,
    idCategoria,
    idCompetencia,
    idMarca = null,
    idEquipo = null,
    imagen = null,
  }) {
    if (typeof nombre !== "string" || nombre.trim() === "") {
      throw new ErrorValidacion("El nombre del producto no puede estar vacío.");
    }
    const precioNumerico = Number(precio);
    if (precio === null || precio === undefined || precio === "" ||
        Number.isNaN(precioNumerico) || precioNumerico <= 0) {
      throw new ErrorValidacion("El precio del producto debe ser positivo.");
    }
    if (!idCategoria) throw new ErrorValidacion("La categoría es obligatoria.");
    if (!idCompetencia) throw new ErrorValidacion("La competencia es obligatoria.");

    this.id = id;
    this.nombre = nombre.trim();
    this.caracteristica = caracteristica;
    this.precio = precioNumerico;
    this.idCategoria = idCategoria;
    this.idCompetencia = idCompetencia;
    this.idMarca = idMarca || null;     // "" del formulario pasa a null
    this.idEquipo = idEquipo || null;
    this.imagen = imagen;
  }

  cambiarPrecio(nuevoPrecio) {
    const n = Number(nuevoPrecio);
    if (Number.isNaN(n) || n <= 0) {
      throw new ErrorValidacion("El precio del producto debe ser positivo.");
    }
    this.precio = n;
  }

  reemplazarImagen(nuevaRuta) {
    this.imagen = nuevaRuta;
  }
}

module.exports = Producto;