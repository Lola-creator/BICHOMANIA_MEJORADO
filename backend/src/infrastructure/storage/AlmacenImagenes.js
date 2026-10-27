const fs = require("fs");

class AlmacenImagenes {
  eliminar(ruta) {
    if (!ruta) return;
    fs.unlink(`.${ruta}`, (err) => {
      if (err) console.log("⚠ No se pudo borrar imagen:", ruta);
    });
  }
}

module.exports = AlmacenImagenes;