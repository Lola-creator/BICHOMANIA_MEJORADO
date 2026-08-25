import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import './carrito.css';
import { hover } from "@testing-library/user-event/dist/hover";
export default function Carrito() {
  const [items, setItems] = useState([]);
  const [idCarrito, setIdCarrito] = useState(null);

  const navigate = useNavigate();
  const id_cliente = localStorage.getItem("id_usuario");

  const cargarCarrito = () => {
    fetch(`${process.env.REACT_APP_API_URL}/carrito?id_cliente=${id_cliente}`)
      .then(res => res.json())
      .then(data => {
        if (data.mensaje) setItems([]); 
        else 
          {
            setItems(data.productos);
        setIdCarrito(data.id_carrito);
          }
      });
  };

  useEffect(() => {
    cargarCarrito();
  }, []);

  const actualizarCantidad = (id_producto, nuevaCantidad) => {
    fetch(`${process.env.REACT_APP_API_URL}/carrito/actualizar`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id_cliente,
        id_producto,
        cantidad: nuevaCantidad
      })
    })
      .then(res => res.json())
      .then(() => cargarCarrito());
  };

  const eliminarItem = (id_producto) => {
    fetch(`${process.env.REACT_APP_API_URL}/carrito/eliminar-item`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id_cliente, id_producto })
    })
      .then(res => res.json())
      .then(() => cargarCarrito());
  };

  return (
    <div style={{ padding: "30px" }}>
      <h1>Mi carrito</h1>

      {items.length === 0 && <p>Carrito vacío</p>}

      {items.map(item => (
        <div key={item.id_producto} style={{ border: "1px solid #ddd", padding: "10px", marginBottom: "10px" }}>
          <h3>{item.nombre}</h3>
          <p>Precio: S/. {item.precio}</p>
          <p>Cantidad: {item.cantidad}</p>

          <button onClick={() => actualizarCantidad(item.id_producto, item.cantidad + 1)} style ={{backgroundColor:"blue", color:"white"}}>+</button>
          <button onClick={() => actualizarCantidad(item.id_producto, item.cantidad - 1)}style ={{backgroundColor:"black", color:"white"}}>-</button>

          <button onClick={() => eliminarItem(item.id_producto)} style={{ marginLeft: "10px", 
            borderRadius:"5px", backgroundColor:"red", color: "white"}}>
            Eliminar
          </button>
        </div>
      ))}

       <button
  onClick={() => navigate("/pedidos", { state: { idCarrito } })}
  style={{ marginTop: "20px", borderRadius: "5px", backgroundColor:"green", color: "white", fontSize:"20px", hover: "red"}}
>
  Generar Pedido
</button>

    </div>
  );
}
