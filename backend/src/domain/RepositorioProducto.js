const exigirImplementacion = (nombreMetodo) => {
    throw new Error(`Método no implementado: ${nombreMetodo}`);
};

class RepositorioProducto {
    async crear(producto) {                
        exigirImplementacion("crear");
    
    
    
    }


    async actualizar(producto) {
        exigirImplementacion("actualizar");
    }

    async buscarPorId(idProducto) {        
        exigirImplementacion("buscarPorId");
    }

    async eliminar(idProducto) {
        exigirImplementacion("eliminar");
    }

    async listar(filtros) {                
        exigirImplementacion("listar");
    }

    async buscarDetalle(idProducto) {      
        exigirImplementacion("buscarDetalle");
    }
}

module.exports = RepositorioProducto;