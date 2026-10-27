const Producto = require("../domain/RepositorioProducto");
const { ErrorNoEncontrado } = require("../domain/errores");

class ProductoService {

  constructor(repositorio, almacenImagenes) {
    this.repositorio = repositorio;

    
    this.almacenImagenes = almacenImagenes;
  }

  async agregar(datos) {
    const producto = new Producto(datos);               
    const idProducto = await this.repositorio.crear(producto);
    return { message: "Producto agregado correctamente", id_producto: idProducto };
  }

  async editar(idProducto, datos, rutaImagenNueva) {
    const actual = await this.repositorio.buscarPorId(idProducto);
    if (!actual) throw new ErrorNoEncontrado("Producto no encontrado");

    const imagenAnterior = actual.imagen;
    const actualizado = new Producto({
      ...datos,
      id: actual.id,
      imagen: rutaImagenNueva || imagenAnterior,
    });
    await this.repositorio.actualizar(actualizado);

    if (rutaImagenNueva) this.almacenImagenes.eliminar(imagenAnterior);
    return { message: "Producto actualizado correctamente" };
  }

  async eliminar(idProducto) {
    const producto = await this.repositorio.buscarPorId(idProducto);
    if (!producto) throw new ErrorNoEncontrado("Producto no encontrado");

    await this.repositorio.eliminar(idProducto);
    this.almacenImagenes.eliminar(producto.imagen);
    return { message: "Producto eliminado correctamente" };
  }

  listar(filtros) {
    return this.repositorio.listar(filtros);
  }

  async obtenerDetalle(idProducto) {
    const detalle = await this.repositorio.buscarDetalle(idProducto);
    if (!detalle) throw new ErrorNoEncontrado("Producto no encontrado");
    return detalle;
  }
}

module.exports = ProductoService;