const exigirImplementacion = (nombreMetodo) => {
  throw new Error(`Método no implementado: ${nombreMetodo}`);
};

class RepositorioEncuesta {
  async guardar(encuesta) {
    exigirImplementacion("guardar");
  }

  async obtenerPorId(idEncuesta) {
    exigirImplementacion("obtenerPorId");
  }

  async eliminar(idEncuesta) {
    exigirImplementacion("eliminar");
  }

  async actualizarEstado(idEncuesta, idEstado) {
    exigirImplementacion("actualizarEstado");
  }

  async listarActivas() {
    exigirImplementacion("listarActivas");
  }

  async listarPorEmpleado(idEmpleado) {
    exigirImplementacion("listarPorEmpleado");
  }

  async listarDetalles(idEncuesta) {
    exigirImplementacion("listarDetalles");
  }

  async existeVoto(idCliente, idEncuesta) {
    exigirImplementacion("existeVoto");
  }

  // Devuelve true si registró el voto, false si el cliente ya había votado
  async registrarVoto(idCliente, idEncuesta, idDetalle) {
    exigirImplementacion("registrarVoto");
  }
}

module.exports = RepositorioEncuesta;
