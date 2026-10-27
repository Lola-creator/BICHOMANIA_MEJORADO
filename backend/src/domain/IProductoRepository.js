class IProductoRepository {
  async guardar(producto)        { throw new Error("No implementado"); } 
  async actualizar(producto)     { throw new Error("No implementado"); }
  async obtenerPorId(id)         { throw new Error("No implementado"); } 
  async eliminar(id)             { throw new Error("No implementado"); }
  async buscar(filtros)          { throw new Error("No implementado"); } 
  async obtenerDetalle(id)       { throw new Error("No implementado"); } 
}
module.exports = IProductoRepository;
