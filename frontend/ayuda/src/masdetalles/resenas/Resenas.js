import { useState, useEffect, useCallback } from "react";
import StarRating from "./Estrellas";  

export default function Resenas({ idProducto }) {
  const [resenas, setResenas] = useState([]);
  const [nueva, setNueva] = useState({ calificacion: "", puntuacion: 0 });
  const [editandoId, setEditandoId] = useState(null);
  const id_cliente = localStorage.getItem("id_usuario");
  const API_URL = process.env.REACT_APP_API_URL;
  const cargarResenas = useCallback(() => {
    fetch(`${API_URL}/resenas/${idProducto}`)
      .then(res => res.json())
      .then(data => setResenas(data));
  }, [idProducto]);

  useEffect(() => {
    cargarResenas();
  }, [cargarResenas]);


  const crearResena = (e) => {
    e.preventDefault();

    fetch(`${API_URL}/resenas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        calificacion: nueva.calificacion,
        puntuacion: nueva.puntuacion,
        id_cliente,
        id_producto: idProducto
      })
    })
    .then(() => {
      setNueva({ calificacion: "", puntuacion: 0 });
      cargarResenas();
    });
  };


  const eliminarResena = (id_resena) => {
    fetch(`${API_URL}/resenas/${id_resena}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id_cliente })
    })
    .then(() => cargarResenas());
  };


  const guardarEdicion = (id_resena) => {
    fetch(`${API_URL}/resenas/${id_resena}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        calificacion: nueva.calificacion,
        puntuacion: nueva.puntuacion,
        id_cliente
      })
    })
    .then(() => {
      setEditandoId(null);
      setNueva({ calificacion: "", puntuacion: 0 });
      cargarResenas();
    });
  };


  return (
    <div style={{ marginTop: "40px", paddingTop: "20px", borderTop: "1px solid #ccc" }}>
      <h2>Reseñas</h2>

      <form onSubmit={editandoId ? (e) => { e.preventDefault(); guardarEdicion(editandoId); } : crearResena}>

        <input
          type="text"
          placeholder="Escribe tu comentario"
          value={nueva.calificacion}
          onChange={(e) => setNueva({ ...nueva, calificacion: e.target.value })}
          required
          style={{ width: "100%", padding: "8px", marginBottom: "10px" }}
        />

        <label>Puntuación:</label>
        <StarRating
          rating={nueva.puntuacion}
          setRating={(value) => setNueva({ ...nueva, puntuacion: value })}
        />

        <button type="submit" style={{ marginTop: "8px", backgroundColor:"green", fontSize:"20px", fontFamily:"italic", color:"white"}}>
          {editandoId ? "Guardar Cambios" : "Agregar reseña"}
        </button>
      </form>

      <div style={{ marginTop: "20px" }}>
        {resenas.length === 0 && <p>No hay reseñas aún.</p>}

        {resenas.map((r) => (
          <div
            key={r.id_resena}
            style={{
              border: "1px solid #ddd",
              padding: "10px",
              marginBottom: "10px",
              borderRadius: "5px"
            }}
          >
            <strong>{r.cliente_nombre}</strong>

            <div style={{ color: "gold", fontSize: "20px" }}>
              {"★".repeat(r.puntuacion)}
              {"☆".repeat(5 - r.puntuacion)}
            </div>

            <p>{r.calificacion}</p>
            <small>{r.fecha}</small>

            {String(r.id_cliente) === String(id_cliente) && (
              <div style={{ marginTop: "10px" }}>
                <button
                  onClick={() => {
                    setEditandoId(r.id_resena);
                    setNueva({
                      calificacion: r.calificacion,
                      puntuacion: r.puntuacion
                    });
                  }}
                  style={{ marginRight: "10px",backgroundColor:"blue", 
                    fontSize:"15px", fontFamily:"italic", color:"white" }}
                >
                  Editar
                </button>

                <button onClick={() => eliminarResena(r.id_resena)} style={{ marginRight: "10px",backgroundColor:"red", 
                    fontSize:"15px", fontFamily:"italic", color:"white" }} >
                  Eliminar
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
