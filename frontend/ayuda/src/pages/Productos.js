import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient/supabaseClient";
import './producto.css'
export default function Productos() {
  const [categorias, setCategorias] = useState([]);
  const [competencias, setCompetencias] = useState([]);
  const [equipos, setEquipos] = useState([]);
  const [marcas, setMarcas] = useState([]);

  const [productos, setProductos] = useState([]);

  const [filtros, setFiltros] = useState({
    categoria: "",
    competencia: "",
    equipo: "",
    marca: "",
    nombre: "" 
  });

  const navigate = useNavigate();
  const agregarAlCarrito = async (id_producto) => {
  const id_cliente = localStorage.getItem("id_usuario");

  if (!id_cliente) {
    navigate("/login-user");
    return;
  }

  try {
    const res = await fetch(`${process.env.REACT_APP_API_URL}/carrito/agregar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id_cliente,
        id_producto,
        cantidad: 1
      })
    });

    const data = await res.json();
    alert(data.mensaje);
  } catch (error) {
    console.error("Error:", error);
  }
};


  useEffect(() => {
    console.log("API URL:", process.env.REACT_APP_API_URL);
    fetch(`${process.env.REACT_APP_API_URL}/listas`)
      .then(res => res.json())
      .then(data => {
        setCategorias(data.categorias);
        setCompetencias(data.competencias);
        setEquipos(data.equipos);
        setMarcas(data.marcas);
      });
  }, []);

  const buscarProductos = () => {
    const query = new URLSearchParams(filtros).toString();

    fetch(`${process.env.REACT_APP_API_URL}/productos?${query}`)
      .then(res => res.json())
      .then(data => setProductos(data));
  };
  function obtenerUrlImagen(path) {
  if (!path) return "/fallback-image.png";

  const { data } = supabase.storage
    .from("productos") // nombre de tu bucket
    .getPublicUrl(path);

  return data.publicUrl;
}
  return (
    <div className="campo-Productos">
      <h1>Productos</h1>
      <div className = "opcion-producto">
        <select onChange={(e) => setFiltros({...filtros, categoria: e.target.value})}>
          <option value="">Categoría</option>
          {categorias.map(c => (
            <option key={c.id_categoria} value={c.id_categoria}>{c.nombre}</option>
          ))}
        </select>

        <select onChange={(e) => setFiltros({...filtros, competencia: e.target.value})}>
          <option value="">Competencia</option>
          {competencias.map(x => (
            <option key={x.id_competencia} value={x.id_competencia}>{x.nombre}</option>
          ))}
        </select>

        <select onChange={(e) => setFiltros({...filtros, equipo: e.target.value})}>
          <option value="">Equipo</option>
          {equipos.map(e => (
            <option key={e.id_equipo} value={e.id_equipo}>{e.nombre}</option>
          ))}
        </select>

        <select onChange={(e) => setFiltros({...filtros, marca: e.target.value})}>
          <option value="">Marca</option>
          {marcas.map(m => (
            <option key={m.id_marca} value={m.id_marca}>{m.nombre}</option>
          ))}
        </select>

        <input
          placeholder="Buscar por nombre..."
          value={filtros.nombre}
          onChange={(e) => {
            setFiltros({ ...filtros, nombre: e.target.value });
            buscarProductos(); 
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") buscarProductos(); 
          }}
        />

        <button onClick={buscarProductos}>Buscar</button>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "30px", marginTop:"30px", justifyContent:"center" }}>
        {productos.map(p => (
          <div key={p.id_producto} 
            style={{
              width: "200px",
              padding: "10px",
              border: "1px solid #ddd",
              borderRadius: "10px"
            }}>
            <img src={obtenerUrlImagen(p.imagen)} alt="" style={{ width: "100%", height: "150px", objectFit: "cover" }} />
            <h3>{p.nombre_producto}</h3>
            <p>Precio: S/. {p.precio}</p>
            <p>Categoría: {p.categoria}</p>
            <p>Competencia: {p.competencia}</p>

            <button onClick={() => navigate(`/producto/${p.id_producto}`)} style={{ marginLeft: "18px", marginTop: "10px", width: "80%", padding: "8px", backgroundColor: "yellow", color: "black",  }}>
              Más detalles
            </button>

            <div className="btn-prod">
            <button
              onClick={() => agregarAlCarrito(p.id_producto)}
            >
              Agregar al carrito
            </button>
            </div>
            

          </div>
        ))}
      </div>
    </div>
  );
}
