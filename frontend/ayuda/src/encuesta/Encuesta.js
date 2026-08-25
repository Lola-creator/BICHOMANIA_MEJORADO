import React, { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import './encuesta.css'
export default function Encuestas() {
  const [encuestas, setEncuestas] = useState([]);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [form, setForm] = useState({
    fecha_inicio: "",
    fecha_fin: "",
    descripcion: "",
    opciones: [{ opcion_equipo: "", opcion_liga: "", categoria: "" }],
  });

  const id_empleado = localStorage.getItem("id_empleado");

  useEffect(() => {
    if (id_empleado) cargarEncuestas();
  }, [id_empleado]);


  const exportarExcelData = (json, nombre) => {
    if (!json || json.length === 0) {
      alert("No hay datos para exportar");
      return;
    }

    try {
      const worksheet = XLSX.utils.json_to_sheet(json);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, nombre);
      XLSX.writeFile(workbook, `${nombre}.xlsx`);
    } catch (err) {
      console.error("Error exportando Excel:", err);
      alert("Error al exportar");
    }
  };


  const cargarEncuestas = async () => {
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/encuestas?id_empleado=${id_empleado}`);
      const data = await res.json();
      setEncuestas(data);
    } catch (err) {
      console.error("Error al cargar encuestas:", err);
    }
  };


  const obtenerClientes = async () => {
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/clientes`);
      const data = await res.json();
      exportarExcelData(data, "clientes");
    } catch (err) {
      console.error("Error al obtener clientes:", err);
    }
  };


  const obtenerActivas = async () => {
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/encuestas-activas`);
      const data = await res.json();
      exportarExcelData(data, "encuestas_activas");
    } catch (err) {
      console.error("Error al obtener encuestas activas:", err);
    }
  };


  const actualizarForm = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const actualizarOpcion = (index, campo, valor) => {
    setForm((f) => {
      const nuevas = [...f.opciones];
      nuevas[index] = { ...nuevas[index], [campo]: valor };
      return { ...f, opciones: nuevas };
    });
  };

  const agregarOpcion = () => {
    setForm((f) => ({
      ...f,
      opciones: [
        ...f.opciones,
        { opcion_equipo: "", opcion_liga: "", categoria: "" },
      ],
    }));
  };


  const crearEncuesta = async (e) => {
    e.preventDefault();

    const opcionesValidas = form.opciones.filter(
      (o) =>
        o.opcion_equipo.trim() ||
        o.opcion_liga.trim() ||
        o.categoria.trim()
    );

    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/crear_encuesta`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, opciones: opcionesValidas, id_empleado }),
      });

      const msg = await res.text();
      alert(msg);

      setMostrarForm(false);

      setForm({
        fecha_inicio: "",
        fecha_fin: "",
        descripcion: "",
        opciones: [{ opcion_equipo: "", opcion_liga: "", categoria: "" }],
      });

      cargarEncuestas();
    } catch (err) {
      console.error("Error al crear encuesta:", err);
    }
  };


  const eliminarEncuesta = async (id) => {
    if (!window.confirm("¿Seguro deseas eliminar esta encuesta?")) return;

    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/eliminar_encuesta/${id}`, {
        method: "DELETE"
      });
      const msg = await res.text();
      alert(msg);
      cargarEncuestas();
    } catch (err) {
      console.error("Error al eliminar encuesta:", err);
    }
  };


  const cerrarEncuesta = async (id) => {
    if (!window.confirm("¿Seguro deseas cerrar esta encuesta?")) return;

    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/cerrar_encuesta/${id}`,
        { method: "PUT" }
      );
      const msg = await res.text();
      alert(msg);
      cargarEncuestas();
    } catch (err) {
      console.error("Error al cerrar encuesta:", err);
    }
  };

  const verGanadora = async (id_encuesta) => {
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/encuesta_ganadora/${id_encuesta}`);
      const data = await res.json();

      if (!data || !data.opcion) {
        return alert("No hay votos para esta encuesta");
      }

      alert(`Ganadora: ${data.opcion} — Votos: ${data.votos}`);
    } catch (err) {
      console.error("Error al obtener ganadora:", err);
    }
  };

  return (
    <div className = 'home-encuesta' style={{ 
        backgroundImage: "url('/registro/bernabeu.jpg')", 
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundSize: "cover",
        minHeight: "100vh",
        width: "100%",
        overflow:"hidden"
        }}>

      <div className = "Encu">
        <h2>Mis Encuestas</h2>
        <div className = "Encu-opcion">
          <button onClick={() => setMostrarForm((s) => !s)}>
            {mostrarForm ? "Cancelar" : "Crear Encuesta"}
          </button>

          <button onClick={cargarEncuestas}>
            Mostrar mis encuestas
          </button>

          <button onClick={obtenerClientes}>
            Mostrar clientes (exporta)
          </button>

          <button onClick={obtenerActivas}>
            Encuestas activas (exporta)
          </button>
        </div>
      </div>
      <div className="campo-encuesta"> 
      {mostrarForm && (
        <form
          onSubmit={crearEncuesta}
          style={{
            border: "1px solid #ccc",
            padding: 12,
            marginBottom: 20,
          }}
        >
          <h3>Crear nueva encuesta</h3>

          <label>
            Inicio:{" "}
            <input
              type="date"
              name="fecha_inicio"
              value={form.fecha_inicio}
              onChange={actualizarForm}
            />
          </label>
          <br />

          <label>
            Fin:{" "}
            <input
              type="date"
              name="fecha_fin"
              value={form.fecha_fin}
              onChange={actualizarForm}
            />
          </label>
          <br />

          <label>
            Descripción:{" "}
            <input
              type="text"
              name="descripcion"
              value={form.descripcion}
              onChange={actualizarForm}
            />
          </label>

          <h4>Opciones</h4>

          {form.opciones.map((op, i) => (
            <div key={i} style={{ marginBottom: 8 }}>
              <input
                placeholder="Equipo"
                value={op.opcion_equipo}
                onChange={(e) =>
                  actualizarOpcion(i, "opcion_equipo", e.target.value)
                }
              />

              <input
                placeholder="Liga"
                value={op.opcion_liga}
                onChange={(e) =>
                  actualizarOpcion(i, "opcion_liga", e.target.value)
                }
                style={{ marginLeft: 6 }}
              />

              <input
                placeholder="Categoría"
                value={op.categoria}
                onChange={(e) =>
                  actualizarOpcion(i, "categoria", e.target.value)
                }
                style={{ marginLeft: 6 }}
              />
            </div>
          ))}

          <button type="button" onClick={agregarOpcion}>
            + Agregar opción
          </button>

          <br />

          <button type="submit" style={{ marginTop: 10 }}>
            Guardar Encuesta
          </button>
        </form>
      )}
      </div>
        {encuestas.length > 0 ? (
          <div className="body"> 
          <table
            border="1"
            cellPadding="6"
            style={{ borderCollapse: "collapse", width: "100%" }}
          >
            <thead>
              <tr>
                <th>ID</th>
                <th>Inicio</th>
                <th>Fin</th>
                <th>Descripción</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {encuestas.map((fila) => (
                <tr key={fila.id_encuesta}>
                  <td>{fila.id_encuesta}</td>
                  <td>{fila.fecha_inicio}</td>
                  <td>{fila.fecha_fin}</td>
                  <td>{fila.descripcion}</td>
                  <td>{fila.estado}</td>

                  <td>
                    <button
                      onClick={() => eliminarEncuesta(fila.id_encuesta)}
                      style={{ marginRight: 8 }}
                    >
                      Eliminar
                    </button>

                    {fila.estado === "Activa" && (
                      <button
                        onClick={() => cerrarEncuesta(fila.id_encuesta)}
                        style={{ marginRight: 8 }}
                      >
                        Cerrar
                      </button>
                    )}

                    {fila.estado === "Cerrada" && (
                      <button
                        onClick={() =>
                          verGanadora(fila.id_encuesta)
                        }
                        style={{
                          background: "#4CAF50",
                          color: "white",
                          padding: "4px 8px",
                        }}
                      >
                        Ver ganadora
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
      ) : (
        <p>No hay encuestas para mostrar.</p>
      )}
    </div>
  );
}