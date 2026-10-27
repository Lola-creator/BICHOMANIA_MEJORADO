const RepositorioProducto = require("../../domain/RepositorioProducto");
const Producto = require("../../domain/Producto");
const ErrorPersistencia = require("../../application/ErrorPersistencia");

class ProductoRepository extends RepositorioProducto {
  constructor(dbp) {
    super();
    this.dbp = dbp;
  }

  async crear(producto) {
    try {
      const [r] = await this.dbp.query(
        `INSERT INTO productos(nombre, caracteristica, precio, id_categoria, id_competencia, imagen)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [producto.nombre, producto.caracteristica, producto.precio,
         producto.idCategoria, producto.idCompetencia, producto.imagen]
      );
      const id = r.insertId;
      await this._guardarRelaciones(id, producto);
      return id;
    } catch (e) {
      console.error(e);
      throw new ErrorPersistencia("Error al insertar el producto");
    }
  }

  async actualizar(producto) {
    try {
      await this.dbp.query(
        `UPDATE productos
         SET nombre = ?, caracteristica = ?, precio = ?,
             id_categoria = ?, id_competencia = ?, imagen = ?
         WHERE id_producto = ?`,
        [producto.nombre, producto.caracteristica, producto.precio,
         producto.idCategoria, producto.idCompetencia, producto.imagen, producto.id]
      );
      await this.dbp.query("DELETE FROM marcas_productos WHERE id_producto = ?", [producto.id]);
      await this.dbp.query("DELETE FROM equipos_productos WHERE id_producto = ?", [producto.id]);
      await this._guardarRelaciones(producto.id, producto);
    } catch (e) {
      console.error(e);
      throw new ErrorPersistencia("Error al editar producto");
    }
  }

  async buscarPorId(idProducto) {
    try {
      const [rows] = await this.dbp.query(
        `SELECT p.*, mp.id_marca, ep.id_equipo
         FROM productos p
         LEFT JOIN marcas_productos mp ON p.id_producto = mp.id_producto
         LEFT JOIN equipos_productos ep ON p.id_producto = ep.id_producto
         WHERE p.id_producto = ? LIMIT 1`,
        [idProducto]
      );
      if (rows.length === 0) return null;
      const r = rows[0];
      return new Producto({
        id: r.id_producto, nombre: r.nombre, caracteristica: r.caracteristica,
        precio: r.precio, idCategoria: r.id_categoria, idCompetencia: r.id_competencia,
        idMarca: r.id_marca, idEquipo: r.id_equipo, imagen: r.imagen,
      });
    } catch (e) {
      console.error(e);
      throw new ErrorPersistencia("Error al obtener producto");
    }
  }

  async eliminar(idProducto) {
    try {
      await this.dbp.query("DELETE FROM equipos_productos WHERE id_producto = ?", [idProducto]);
      await this.dbp.query("DELETE FROM marcas_productos WHERE id_producto = ?", [idProducto]);
      await this.dbp.query("DELETE FROM productos WHERE id_producto = ?", [idProducto]);
    } catch (e) {
      console.error(e);
      throw new ErrorPersistencia("Error al eliminar producto");
    }
  }

  async listar({ categoria, marca, equipo, competencia, nombre } = {}) {
    let query = `${this._selectDetalle()} WHERE 1 = 1`;
    const params = [];
    if (categoria)   { query += " AND p.id_categoria = ?";   params.push(categoria); }
    if (competencia) { query += " AND p.id_competencia = ?"; params.push(competencia); }
    if (marca)       { query += " AND mp.id_marca = ?";      params.push(marca); }
    if (equipo)      { query += " AND ep.id_equipo = ?";     params.push(equipo); }
    if (nombre)      { query += " AND p.nombre LIKE ?";      params.push(`%${nombre}%`); }
    try {
      const [rows] = await this.dbp.query(query, params);
      return rows;
    } catch (e) {
      console.error(e);
      throw new ErrorPersistencia("Error al filtrar productos");
    }
  }

  async buscarDetalle(idProducto) {
    try {
      const [rows] = await this.dbp.query(
        `${this._selectDetalle()} WHERE p.id_producto = ? LIMIT 1`, [idProducto]
      );
      return rows[0] || null;
    } catch (e) {
      console.error(e);
      throw new ErrorPersistencia("Error al obtener producto");
    }
  }

  async _guardarRelaciones(idProducto, producto) {
    if (producto.idMarca) {
      await this.dbp.query(
        "INSERT INTO marcas_productos(id_marca, id_producto) VALUES (?, ?)",
        [producto.idMarca, idProducto]);
    }
    if (producto.idEquipo) {
      await this.dbp.query(
        "INSERT INTO equipos_productos(id_equipo, id_producto) VALUES (?, ?)",
        [producto.idEquipo, idProducto]);
    }
  }

  _selectDetalle() {
    return `
      SELECT DISTINCT
        p.id_producto, p.nombre AS nombre_producto, p.precio, p.caracteristica, p.imagen,
        c.nombre AS categoria, cmp.nombre AS competencia, m.nombre AS marca, e.nombre AS equipo
      FROM productos p
      LEFT JOIN categoria c ON p.id_categoria = c.id_categoria
      LEFT JOIN competencias cmp ON p.id_competencia = cmp.id_competencia
      LEFT JOIN marcas_productos mp ON p.id_producto = mp.id_producto
      LEFT JOIN marcas m ON mp.id_marca = m.id_marca
      LEFT JOIN equipos_productos ep ON p.id_producto = ep.id_producto
      LEFT JOIN equipos e ON ep.id_equipo = e.id_equipo`;
  }
}

module.exports = ProductoRepository;