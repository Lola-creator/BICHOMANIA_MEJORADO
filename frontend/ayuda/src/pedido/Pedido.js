import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import Pago from "./MetodoPago";
import './pedido.css';


const id_cliente = localStorage.getItem("id_usuario");

export default function Direcciones() {
  const location = useLocation();
  const { idCarrito } = location.state || {};
  const [direcciones, setDirecciones] = useState([]);
  const [paises, setPaises] = useState([]);
  const [ciudades, setCiudades] = useState([]);

  const [mostrarAgregar, setMostrarAgregar] = useState(false);
  const [direccionSeleccionada, setDireccionSeleccionada] = useState(null);

  const [form, setForm] = useState({
    distrito: "",
    calle: "",
    referencia: "",
    codigo_postal: "",
    id_pais: "",
    id_ciudad: "",
    id_cliente: id_cliente
  });

  useEffect(() => {
    if (!id_cliente) return;
    cargarDirecciones();
  }, []);

  useEffect(() => {
    setForm(f => ({
      ...f,
      id_cliente: id_cliente
    }));
  }, []);

  const cargarDirecciones = async () => {
   const r = await fetch(`${process.env.REACT_APP_API_URL}/direccion?id_cliente=${id_cliente}`);
    const data = await r.json();
    setDirecciones(Array.isArray(data) ? data : []);
  };

  const cargarPaises = async () => {
    const res = await fetch(`${process.env.REACT_APP_API_URL}/paises`);
    const text = await res.text();

    console.log("RESPUESTA DEL SERVIDOR:", text);

    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error("NO ES JSON — El backend está devolviendo otra cosa");
      return;
    }

    setPaises(data);
  };

  const cargarCiudades = async (id_pais) => {
    const r = await fetch(`${process.env.REACT_APP_API_URL}/ciudades?id_pais=${id_pais}`);
    const data = await r.json();
    setCiudades(Array.isArray(data) ? data : []);
  };

  const cambiarValor = (e) => {
    const { name, value } = e.target;

    setForm({
      ...form,
      [name]: value
    });

    if (name === "id_pais") {
      cargarCiudades(value);
    }
  };

  const agregarDireccion = async (e) => {
    e.preventDefault();

    const r = await fetch(`${process.env.REACT_APP_API_URL}/direccionAgregar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        distrito: form.distrito,
        calle: form.calle,
        referencia: form.referencia,
        codigo_postal: form.codigo_postal,
        id_ciudad: form.id_ciudad,
        id_cliente: id_cliente
      })
    });

    const data = await r.json();
    if (data.error) {
      alert("Error: " + data.error);
    } else {
      alert(data.mensaje);
    }

    cargarDirecciones();
    setMostrarAgregar(false);

    setForm({
      distrito: "",
      calle: "",
      referencia: "",
      codigo_postal: "",
      id_pais: "",
      id_ciudad: "",
      id_cliente: id_cliente
    });
  };

  return (
    <div style={{ 
        backgroundImage: "url('/registro/sudafrica.jpg')", 
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundSize: "cover",
        minHeight: "100vh",
        width: "100%",
        overflow: "hidden"}}>
    <div className="dire-pago">
      <button
        onClick={() => {
          setMostrarAgregar(!mostrarAgregar);
          if (!mostrarAgregar) cargarPaises();
        }}
      >
        {mostrarAgregar ? "Cerrar formulario" : "Agregar dirección"}
      </button>

      <h3 style={{ marginTop: "20px", marginLeft: "30%"}}>Mis direcciones</h3>
      {direcciones.length === 0 ? (
        <p>No tienes direcciones registradas</p>
      ) : (
        <ul>
          {direcciones.map((d, i) => (
            <li key={i}>
              <label style={{ cursor: "pointer" }}>
                <input 
                  type="radio"
                  name="seleccionDireccion"
                  value={i}
                  checked={direccionSeleccionada === i}
                  onChange={() => setDireccionSeleccionada(i)}
                />{" "}
                <strong>{d.calle}</strong> - {d.distrito}, {d.ciudad} ({d.nombre})
              </label>
            </li>
          ))}
        </ul>
      )}

      {direccionSeleccionada !== null && (
        <p style={{ color: "green" }}>
          Dirección seleccionada: {direcciones[direccionSeleccionada].calle}
        </p>
      )}

      {mostrarAgregar && (
        <div className="formulario">
          <h3>Agregar nueva dirección</h3>

          <form onSubmit={agregarDireccion}>
            <input
              type="text"
              name="distrito"
              placeholder="Distrito"
              value={form.distrito}
              onChange={cambiarValor}
              required
            /><br/>

            <input
              type="text"
              name="calle"
              placeholder="Calle"
              value={form.calle}
              onChange={cambiarValor}
              required
            /><br/>

            <input
              type="text"
              name="referencia"
              placeholder="Referencia"
              value={form.referencia}
              onChange={cambiarValor}
              required
            /><br/>

            <input
              type="text"
              name="codigo_postal"
              placeholder="Código Postal"
              value={form.codigo_postal}
              onChange={cambiarValor}
              required
            /><br/>

            <select
              name="id_pais"
              value={form.id_pais}
              onChange={cambiarValor}
              required
            >
              <option value="">Seleccione un país</option>
              {paises.map((p) => (
                <option key={p.id_pais} value={p.id_pais}>
                  {p.nombre}
                </option>
              ))}
            </select><br/>

            <select
              name="id_ciudad"
              value={form.id_ciudad}
              onChange={cambiarValor}
              required
            >
              <option value="">Seleccione una ciudad</option>
              {ciudades.map((c) => (
                <option key={c.id_ciudad} value={c.id_ciudad}>
                  {c.nombre}
                </option>
              ))}
            </select><br/>

            <button type="submit">Guardar</button>
          </form>
        </div>
      )}
      {direccionSeleccionada !== null && (
  <>
    {console.log("Direccion seleccionada:", direcciones[direccionSeleccionada])}
    <Pago
      id_carrito={idCarrito}
      id_direccion={direcciones[direccionSeleccionada].id_direccion}
    />
  </>
)}
</div>
    </div>
  );
}