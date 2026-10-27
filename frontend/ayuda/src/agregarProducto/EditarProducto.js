import { useState, useEffect } from "react";

export default function EditarProducto() {
  const [categorias, setCategorias] = useState([]);
  const [competencias, setCompetencias] = useState([]);
  const [equipos, setEquipos] = useState([]);
  const [marcas, setMarcas] = useState([]);

  const [productos, setProductos] = useState([]);
  const [productoEditado, setProductoEditado] = useState(null); 

  const [filtros, setFiltros] = useState({
    nombre: "",
    categoria: "",
    competencia: "",
    equipo: "",
    marca: ""
  });

  const [productoEditando, setProductoEditando] = useState(null);

  useEffect(() => {
    fetch("http://localhost:3001/listas")
      .then(res => res.json())
      .then(data => {
        setCategorias(data.categorias);
        setCompetencias(data.competencias);
        setEquipos(data.equipos);
        setMarcas(data.marcas);
      });
  }, []);

  const buscarProductos = () => {
    const params = new URLSearchParams(filtros).toString();

    fetch(`http://localhost:3001/productos?${params}`)
      .then(res => res.json())
      .then(data => setProductos(data));
  };

  const seleccionarParaEditar = (prod) => {

 
  const cat = categorias.find(c => c.nombre === prod.categoria);
  const comp = competencias.find(c => c.nombre === prod.competencia);
  const mar = marcas.find(m => m.nombre === prod.marca);
  const equi = equipos.find(e => e.nombre === prod.equipo);

  setProductoEditando({
    id_producto: prod.id_producto,
    nombre: prod.nombre_producto,
    precio: prod.precio,
    caracteristica: prod.caracteristica,

    id_categoria: cat ? cat.id_categoria : "",
    id_competencia: comp ? comp.id_competencia : "",
    id_marca: mar ? mar.id_marca : "",
    id_equipo: equi ? equi.id_equipo : "",

    imagen: prod.imagen,

    categoria: prod.categoria,
    competencia: prod.competencia,
    marca: prod.marca,
    equipo: prod.equipo,
  });

  setProductoEditado(null);
};

  const guardarCambios = (e) => {
  e.preventDefault();

  const formData = new FormData();

  if (productoEditando.nombre && productoEditando.nombre.trim() !== "") {
    formData.append("nombre", productoEditando.nombre);
  }

  if (productoEditando.caracteristica && productoEditando.caracteristica.trim() !== "") {
    formData.append("caracteristica", productoEditando.caracteristica);
  }

  if (productoEditando.precio && productoEditando.precio !== "") {
    formData.append("precio", productoEditando.precio);
  }

  if (productoEditando.id_categoria) {
    formData.append("id_categoria", productoEditando.id_categoria);
  }

  if (productoEditando.id_competencia) {
    formData.append("id_competencia", productoEditando.id_competencia);
  }

  if (productoEditando.id_marca) {
    formData.append("id_marca", productoEditando.id_marca);
  }

  if (productoEditando.id_equipo) {
    formData.append("id_equipo", productoEditando.id_equipo);
  }

  if (productoEditando.nuevaImagen) {
    formData.append("imagen", productoEditando.nuevaImagen);
  }

  fetch(`http://localhost:3001/productos/editar/${productoEditando.id_producto}`, {
    method: "PUT",
    body: formData
  })
    .then(res => res.json())
    .then(data => {
  alert("Producto actualizado correctamente");


  setProductoEditado(data);


  setProductoEditando(prev => ({
    ...prev,
    nombre: data.nombre_producto,
    precio: data.precio,
    caracteristica: data.caracteristica,
    id_categoria: data.id_categoria,
    id_competencia: data.id_competencia,
    id_marca: data.id_marca,
    id_equipo: data.id_equipo,
    imagen: data.imagen,
    categoria: data.categoria,        
    competencia: data.competencia,
    marca: data.marca,
    equipo: data.equipo
  }));
})

    .catch(err => console.error(err));
};


  return (
    <div style={{ padding: "30px" }}>
      <h1>Editar Producto</h1>



      {!productoEditando && (
        <>

          <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
            <input
              placeholder="Buscar por nombre"
              value={filtros.nombre}
              onChange={(e) => setFiltros({ ...filtros, nombre: e.target.value })}
            />

            <select onChange={(e) => setFiltros({ ...filtros, categoria: e.target.value })}>
              <option value="">Categoría</option>
              {categorias.map(c => (
                <option key={c.id_categoria} value={c.id_categoria}>{c.nombre}</option>
              ))}
            </select>

            <select onChange={(e) => setFiltros({ ...filtros, competencia: e.target.value })}>
              <option value="">Competencia</option>
              {competencias.map(x => (
                <option key={x.id_competencia} value={x.id_competencia}>{x.nombre}</option>
              ))}
            </select>

            <select onChange={(e) => setFiltros({ ...filtros, equipo: e.target.value })}>
              <option value="">Equipo</option>
              {equipos.map(e => (
                <option key={e.id_equipo} value={e.id_equipo}>{e.nombre}</option>
              ))}
            </select>

            <select onChange={(e) => setFiltros({ ...filtros, marca: e.target.value })}>
              <option value="">Marca</option>
              {marcas.map(m => (
                <option key={m.id_marca} value={m.id_marca}>{m.nombre}</option>
              ))}
            </select>

            <button onClick={buscarProductos}>Buscar</button>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "20px" }}>
            {productos.map(p => (
              <div
                key={p.id_producto}
                style={{
                  width: "200px",
                  padding: "10px",
                  border: "1px solid #ddd",
                  borderRadius: "10px"
                }}
              >
                <img
                  src={p.imagen ? `http://localhost:3001${p.imagen}` : ""}
                  style={{ width: "100%", height: "150px", objectFit: "cover" }}
                />

                <h3>{p.nombre_producto}</h3>
                <p>S/. {p.precio}</p>

                <button
                  onClick={() => seleccionarParaEditar(p)}
                  style={{ width: "100%", padding: "8px", background: "blue", color: "white" }}
                >
                  EDITAR
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {productoEditando && (
        <div
          style={{
            marginTop: "40px",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "40px"
          }}
        >

          <div
            style={{
              border: "1px solid #ccc",
              borderRadius: "10px",
              padding: "20px"
            }}
          >
            <h2>Detalles actuales</h2>

            <p><strong>Nombre:</strong> {productoEditando.nombre}</p>
            <p><strong>Precio:</strong> S/. {productoEditando.precio}</p>
            <p><strong>Categoría:</strong> {
                categorias.find(c => c.id_categoria === productoEditando.id_categoria)?.nombre
            }</p>
            <p><strong>Competencia:</strong> {
                competencias.find(x => x.id_competencia === productoEditando.id_competencia)?.nombre
            }</p>
            <p><strong>Equipo:</strong> {
                equipos.find(e => e.id_equipo === productoEditando.id_equipo)?.nombre
            }</p>
            <p><strong>Marca:</strong> {
                marcas.find(m => m.id_marca === productoEditando.id_marca)?.nombre
            }</p>
            <p><strong>Características:</strong> {productoEditando.caracteristica}</p>

            <img
              src={productoEditando.imagen ? `http://localhost:3001${productoEditando.imagen}` : ""}
              style={{ width: "100%", marginTop: "10px", borderRadius: "10px" }}
            />
          </div>


          <form
            onSubmit={guardarCambios}
            style={{
              display: "grid",
              gap: "10px",
              border: "1px solid #ccc",
              borderRadius: "10px",
              padding: "20px"
            }}
          >
            <h2>Editar producto</h2>

            <input
              name="nombre"
              value={productoEditando.nombre}
              onChange={e =>
                setProductoEditando({ ...productoEditando, nombre: e.target.value })
              }
              placeholder="Nombre"
            />


            <textarea
              name="caracteristica"
              value={productoEditando.caracteristica}
              onChange={e =>
                setProductoEditando({ ...productoEditando, caracteristica: e.target.value })
              }
              placeholder="Características"
            />

            <input
              name="precio"
              value={productoEditando.precio}
              onChange={e =>
                setProductoEditando({ ...productoEditando, precio: e.target.value })
              }
              placeholder="Precio"
            />

            <select
              value={productoEditando.id_categoria}
              onChange={e =>
                setProductoEditando({ ...productoEditando, id_categoria: e.target.value })
              }
            >
              <option value="">Categoría</option>
              {categorias.map(c => (
                <option key={c.id_categoria} value={c.id_categoria}>{c.nombre}</option>
              ))}
            </select>

            <select
              value={productoEditando.id_competencia}
              onChange={e =>
                setProductoEditando({ ...productoEditando, id_competencia: e.target.value })
              }
            >
              <option value="">Competencia</option>
              {competencias.map(x => (
                <option key={x.id_competencia} value={x.id_competencia}>{x.nombre}</option>
              ))}
            </select>

            <select
              value={productoEditando.id_equipo}
              onChange={e =>
                setProductoEditando({ ...productoEditando, id_equipo: e.target.value })
              }
            >
              <option value="">Equipo</option>
              {equipos.map(e => (
                <option key={e.id_equipo} value={e.id_equipo}>{e.nombre}</option>
              ))}
            </select>

            <select
              value={productoEditando.id_marca}
              onChange={e =>
                setProductoEditando({ ...productoEditando, id_marca: e.target.value })
              }
            >
              <option value="">Marca</option>
              {marcas.map(m => (
                <option key={m.id_marca} value={m.id_marca}>{m.nombre}</option>
              ))}
            </select>
            <input 
                type="file"
                name="imagen"
                onChange={e =>
                  setProductoEditando({
                    ...productoEditando,
                    nuevaImagen: e.target.files[0]
                  })
                }
              />

            <button style={{ padding: "10px", background: "green", color: "white" }}>
              Guardar cambios
            </button>

            <button
              type="button"
              style={{ padding: "10px", background: "gray", color: "white" }}
              onClick={() => setProductoEditando(null)}
            >
              Cancelar
            </button>
          </form>
        </div>
      )}


      {productoEditado && (
        <div
          style={{
            marginTop: "50px",
            padding: "20px",
            border: "2px solid green",
            borderRadius: "10px",
            background: "#e8ffe8"
          }}
        >
          <h2>Producto actualizado</h2>

          <p><strong>Nombre:</strong> {productoEditado.nombre_producto}</p>
          <p><strong>Precio:</strong> S/. {productoEditado.precio}</p>
          <p><strong>Categoría:</strong> {
                categorias.find(c => c.id_categoria === productoEditado.id_categoria)?.nombre
            }</p>
            <p><strong>Competencia:</strong> {
                competencias.find(x => x.id_competencia === productoEditado.id_competencia)?.nombre
            }</p>
            <p><strong>Equipo:</strong> {
                equipos.find(e => e.id_equipo === productoEditado.id_equipo)?.nombre
            }</p>
            <p><strong>Marca:</strong> {
                marcas.find(m => m.id_marca === productoEditado.id_marca)?.nombre
            }</p>
          <p><strong>Características:</strong> {productoEditado.caracteristica}</p>

          <img
            src={productoEditado.imagen ? `http://localhost:3001${productoEditado.imagen}` : ""}
            style={{ width: "200px", marginTop: "10px", borderRadius: "10px" }}
          />
        </div>
      )}
    </div>
  );

}
