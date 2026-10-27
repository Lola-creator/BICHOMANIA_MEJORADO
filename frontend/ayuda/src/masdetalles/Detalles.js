import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Resena from "./resenas/Resenas";


export default function ProductoDetalles() {
  const { id } = useParams();
  const [producto, setProducto] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${process.env.REACT_APP_API_URL}/producto/${id}`)
      .then(res => res.json())
      .then(data => setProducto(data))
      .catch(err => console.error(err));
  }, [id]);

  const agregarAlCarrito = async () => {
    const id_cliente = localStorage.getItem("id_usuario");

    if (!id_cliente) {
      navigate("/login-user");
      return;
    }

    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/producto/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_cliente,
          id_producto: producto.id_producto,
          cantidad: 1
        })
      });

      const data = await res.json();
      alert(data.mensaje);
    } catch (err) {
      console.error(err);
    }
  };

  if (!producto) return <p style={{ padding: "20px" }}>Cargando...</p>;

  return (
    <div style={{ padding: "30px" }}>

      <div style={{
        display: "flex",
        gap: "40px",
        alignItems: "flex-start",
        marginBottom: "50px"
      }}>

        <div>
          <img 
            src={`http://localhost:3001${producto.imagen}`}
            alt={producto.nombre_producto}
            style={{ width: "350px", borderRadius: "10px" }}
          />
        </div>

        <div style={{ flex: 1 }}>
          <h1>{producto.nombre_producto}</h1>

          <p><strong>Precio:</strong> S/. {producto.precio}</p>
          <p><strong>Descripción:</strong> {producto.caracteristica}</p>
          <p><strong>Categoría:</strong> {producto.categoria}</p>
          <p><strong>Competencia:</strong> {producto.competencia}</p>
          <p><strong>Marca:</strong> {producto.marca}</p>
          <p><strong>Equipo:</strong> {producto.equipo}</p>

          <button
            onClick={agregarAlCarrito}
            style={{
              marginTop: "20px",
              padding: "12px 20px",
              backgroundColor: "#2b7cff",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "16px"
            }}
          >
            Agregar al carrito
          </button>
        </div>
      </div>

    <Resena idProducto={id} />
      

    </div>
  );
}


