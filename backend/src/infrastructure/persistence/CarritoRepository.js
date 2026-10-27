const RepositorioCarrito = require("../../domain/RepositorioCarrito");
const Carrito = require("../../domain/Carrito");
const ItemCarrito = require("../../domain/ItemCarrito");

const ESTADO_CARRITO_ACTIVO = 6;

const formatearFecha = (fecha) => fecha.toISOString().slice(0, 10);

class CarritoRepository extends RepositorioCarrito {
    constructor(conexion) {
        super();
        this.conexion = conexion;
    }

    async buscarActivoPorCliente(idCliente) {
        const buscarCarrito = `
            SELECT id_carrito FROM carritos
            WHERE id_cliente = ? AND id_estado = ?
            LIMIT 1
        `;
        const [filas] = await this.conexion.query(buscarCarrito, [idCliente, ESTADO_CARRITO_ACTIVO]);
        if (filas.length === 0) {
            return null;
        }
        return new Carrito({ id: filas[0].id_carrito, idCliente });
    }

    async crear(carrito) {
        const crearCarrito = `
            INSERT INTO carritos (fecha_creacion, id_cliente, id_estado)
            VALUES (?, ?, ?)
        `;
        const [resultado] = await this.conexion.query(crearCarrito, [
            formatearFecha(carrito.fechaCreacion),
            carrito.idCliente,
            ESTADO_CARRITO_ACTIVO
        ]);
        return new Carrito({
            id: resultado.insertId,
            idCliente: carrito.idCliente,
            fechaCreacion: carrito.fechaCreacion
        });
    }

    async listarProductos(idCarrito) {
        const consultaProductos = `
            SELECT i.id_producto, i.cantidad, p.nombre, p.precio
            FROM items_carrito i
            JOIN productos p ON (i.id_producto = p.id_producto)
            WHERE i.id_carrito = ?
        `;
        const [filas] = await this.conexion.query(consultaProductos, [idCarrito]);
        return filas.map((fila) => new ItemCarrito({
            idProducto: fila.id_producto,
            cantidad: fila.cantidad,
            nombre: fila.nombre,
            precio: fila.precio
        }));
    }

    async buscarItem(idCarrito, idProducto) {
        const buscarItem = `
            SELECT cantidad FROM items_carrito
            WHERE id_carrito = ? AND id_producto = ?
        `;
        const [filas] = await this.conexion.query(buscarItem, [idCarrito, idProducto]);
        if (filas.length === 0) {
            return null;
        }
        return new ItemCarrito({ idProducto, cantidad: filas[0].cantidad });
    }

    async agregarItem(idCarrito, item) {
        const insertar = `
            INSERT INTO items_carrito (id_carrito, id_producto, cantidad)
            VALUES (?, ?, ?)
        `;
        await this.conexion.query(insertar, [idCarrito, item.idProducto, item.cantidad]);
    }

    async actualizarCantidadItem(idCarrito, item) {
        const actualizar = `
            UPDATE items_carrito
            SET cantidad = ?
            WHERE id_carrito = ? AND id_producto = ?
        `;
        const [resultado] = await this.conexion.query(actualizar, [item.cantidad, idCarrito, item.idProducto]);
        return resultado.affectedRows;
    }

    async eliminarItem(idCarrito, idProducto) {
        const eliminar = `
            DELETE FROM items_carrito
            WHERE id_carrito = ? AND id_producto = ?
        `;
        const [resultado] = await this.conexion.query(eliminar, [idCarrito, idProducto]);
        return resultado.affectedRows;
    }

    async vaciar(idCarrito) {
        const eliminarTodo = `
            DELETE FROM items_carrito
            WHERE id_carrito = ?
        `;
        await this.conexion.query(eliminarTodo, [idCarrito]);
    }

    async calcularTotalPorCliente(idCliente) {
        const calcularTotal = `
            SELECT SUM(i.cantidad * p.precio) AS total
            FROM items_carrito i
            JOIN productos p ON p.id_producto = i.id_producto
            JOIN carritos c ON c.id_carrito = i.id_carrito
            WHERE c.id_cliente = ? AND c.id_estado = ?
        `;
        const [filas] = await this.conexion.query(calcularTotal, [idCliente, ESTADO_CARRITO_ACTIVO]);
        return filas.length > 0 ? filas[0].total : null;
    }
}

module.exports = CarritoRepository;
