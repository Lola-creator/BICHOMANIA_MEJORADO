const exigirImplementacion = (nombreMetodo) => {
    throw new Error(`Método no implementado: ${nombreMetodo}`);
};

class RepositorioCarrito {
    async buscarActivoPorCliente(idCliente) {
        exigirImplementacion("buscarActivoPorCliente");
    }

    async crear(carrito) {
        exigirImplementacion("crear");
    }

    async listarProductos(idCarrito) {
        exigirImplementacion("listarProductos");
    }

    async buscarItem(idCarrito, idProducto) {
        exigirImplementacion("buscarItem");
    }

    async agregarItem(idCarrito, item) {
        exigirImplementacion("agregarItem");
    }

    async actualizarCantidadItem(idCarrito, item) {
        exigirImplementacion("actualizarCantidadItem");
    }

    async eliminarItem(idCarrito, idProducto) {
        exigirImplementacion("eliminarItem");
    }

    async vaciar(idCarrito) {
        exigirImplementacion("vaciar");
    }

    async calcularTotalPorCliente(idCliente) {
        exigirImplementacion("calcularTotalPorCliente");
    }
}

module.exports = RepositorioCarrito;
