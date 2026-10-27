import React, { useState, useEffect } from "react";
import './modificar.css';
const API = process.env.REACT_APP_API_URL;

export default function GestionListas() {
  const [tipo, setTipo] = useState("");
  const [items, setItems] = useState([]);
  const [nuevo, setNuevo] = useState("");
  const [pais, setPais] = useState("");
  const [loading, setLoading] = useState(false);


  const endpoints = {
    categoria: {
      get: "/categorias",
      post: "/categorias",
      delete: "/categorias/"
    },
    equipo: {
      get: "/equipos",
      post: "/equipos",
      delete: "/equipos/"
    },
    marca: {
      get: "/marcas",
      post: "/marcas",
      delete: "/marcas/"
    },
    competencia: {
      get: "/competencias",
      post: "/competencias",
      delete: "/competencias/"
    }
  };


  const cargarDatos = async () => {
    if (!tipo) return;
    setLoading(true);

    try {
      const res = await fetch(API + endpoints[tipo].get);
      const data = await res.json();
      setItems(data);
    } catch (err) {
      console.error(err);
      alert("Error cargando datos.");
    }

    setLoading(false);
  };

  useEffect(() => {
    cargarDatos();
  }, [tipo]);



  const agregar = async () => {
    if (!nuevo.trim()) {
      alert("Ingresa un nombre");
      return;
    }

    try {
      let body = { nombre: nuevo };

      if (tipo === "equipo" || tipo === "marca") {
        if (!pais.trim()) return alert("Debes ingresar el país.");
        body.pais = pais;
      }

      await fetch(API + endpoints[tipo].post, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      alert("Agregado correctamente");
      setNuevo("");
      setPais("");
      cargarDatos();
    } catch (err) {
      console.error(err);
      alert("Error al agregar.");
    }
  };


  const eliminar = async (id) => {
    if (!window.confirm("¿Seguro que deseas eliminar?")) return;

    try {
      await fetch(API + endpoints[tipo].delete + id, {
        method: "DELETE"
      });

      alert("Eliminado correctamente");
      cargarDatos();
    } catch (err) {
      console.error(err);
      alert("Error al eliminar.");
    }
  };



  const getItemId = (item) => {
    switch (tipo) {
      case "categoria":
        return item.id_categoria;
      case "equipo":
        return item.id_equipo;
      case "marca":
        return item.id_marca;
      case "competencia":
        return item.id_competencia;
      default:
        return item.id;
    }
  };


  return (
    <div className = 'home' style={{ 
        backgroundImage: "url('/registro/maracana.jpg')", 
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundSize: "cover",
        minHeight: "100vh",
        width: "100%"
        }}>

      <div className="cuadro-gestion">
        <h2>Gestión de Listas</h2>
        <div className="cuadro-opcion">
        <button onClick={() => setTipo("categoria")}>Categorías</button>
        <button onClick={() => setTipo("equipo")}>Equipos</button>
        <button onClick={() => setTipo("marca")}>Marcas</button>
        <button onClick={() => setTipo("competencia")}>Competencias</button>
        </div>
      </div>
      <div className="cuadro-ad">
      {tipo && <h3>Administrando: <strong>{tipo.toUpperCase()}</strong></h3>}

      {tipo && (
        <div style={{ marginBottom: 20 }}>
          <input
            type="text"
            placeholder="Nuevo nombre"
            value={nuevo}
            onChange={(e) => setNuevo(e.target.value)}
          />

          {(tipo === "equipo" || tipo === "marca") && (
            <input
              type="text"
              placeholder="País"
              value={pais}
              onChange={(e) => setPais(e.target.value)}
              style={{ marginLeft: 10 }}
            />
          )}

          <button onClick={agregar} style={{ marginLeft: 10 }}>
            Agregar
          </button>
        </div>
      )}
      </div>
      <div className="lista"> 
      {loading ? (
        <p>Cargando...</p>
      ) : (
        <ul>
          {items.map((item) => {
            const id = getItemId(item);

            return (
              <li key={id} style={{ marginBottom: 10 }}>
                <strong>{item.nombre}</strong>

                {item.pais && <span> — {item.pais}</span>}

                <button
                  onClick={() => eliminar(id)}
                  style={{ marginLeft: 15 }}
                >
                  Eliminar
                </button>
              </li>
            );
          })}
        </ul>
      )}
      </div>
    </div>
  );
}