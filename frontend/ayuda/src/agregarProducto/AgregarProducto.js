import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Eliminar from "./EliminarProducto";
import Editar from "./EditarProducto";
import { supabase } from "../supabaseClient/supabaseClient";

import './AP.css';
export default function AgregarProducto() {
  const [categorias, setCategorias] = useState([]);
  const [competencias, setCompetencias] = useState([]);
  const [marcas, setMarcas] = useState([]);
  const [equipos, setEquipos] = useState([]);

  const [form, setForm] = useState({
    nombre: "",
    caracteristica: "",
    precio: "",
    id_categoria: "",
    id_competencia: "",
    id_marca: "",
    id_equipo: "",
    imagen: null,
  });

  useEffect(() => {
  const fetchLists = async () => {
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/listas`);
      const data = await res.json();

      setCategorias(data.categorias);
      setCompetencias(data.competencias);
      setMarcas(data.marcas);
      setEquipos(data.equipos);
    } catch (err) {
      console.error("Error cargando listas:", err);
    }
  };

  fetchLists();
}, []);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
  };

  const agregarProducto = async (e) => {
    e.preventDefault();
//changed
    if (!form.nombre || !form.precio || !form.id_categoria || !form.id_competencia || !form.id_marca || !form.id_equipo || !form.imagen) {
      alert("Falta llenar campos obligatorios");
      return;
    }

    //changed
    let imagenUrl = null;

        if (form.imagen) {
          const file = form.imagen;
          const fileName = `${Date.now()}-${file.name}`;

          const { data: uploadData, error: uploadError } = await supabase.storage
            .from("productos")
            .upload(fileName, file);

          if (uploadError) {
            console.error(uploadError);
            alert("Error al subir imagen a Supabase");
            return;
          }

          const { data: urlData } = supabase.storage
            .from("productos")
            .getPublicUrl(uploadData.path);

          imagenUrl = urlData.publicUrl;
        }

      
        const productoData = {
          nombre: form.nombre,
          caracteristica: form.caracteristica,
          precio: form.precio,
          id_categoria: form.id_categoria,
          id_competencia: form.id_competencia,
          id_marca: form.id_marca,
          id_equipo: form.id_equipo,
          imagen: imagenUrl, 
        };

    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/productos/agregar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      body: JSON.stringify(productoData),
      });

      const json = await res.json();

      if (!res.ok) {
        alert(json.error || "Error al registrar");
        return;
      }

      alert("Producto registrado correctamente");

      setForm({
        nombre: "",
        caracteristica: "",
        precio: "",
        id_categoria: "",
        id_competencia: "",
        id_marca: "",
        id_equipo: "",
        imagen: null,
      });
    } catch (err) {
      console.error(err);
      alert("Error al registrar producto");
    }
  };
  return (
    <div className = 'home' style={{ 
        backgroundImage: "url('/registro/ap.jpg')", 
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundSize: "cover",
        minHeight: "100vh",
        width: "100%"
        }}>
    <div className="content-AP">
      <h2>Agregar Producto</h2>

      <form
        onSubmit={agregarProducto}
        style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 500, border: "1px solid black", padding: 12 }}
      >
        <input name="nombre" placeholder="Nombre" value={form.nombre} onChange={handleChange} />
        <input name="caracteristica" placeholder="Característica" value={form.caracteristica} onChange={handleChange} />
        <input name="precio" type="number" step="0.01" placeholder="Precio" value={form.precio} onChange={handleChange} />

        <select name="id_categoria" value={form.id_categoria} onChange={handleChange}>
          <option value="">-- Seleccione categoría --</option>
          {categorias.map((c) => (
            <option key={c.id_categoria} value={c.id_categoria}>
              {c.nombre}
            </option>
          ))}
        </select>

        <select name="id_competencia" value={form.id_competencia} onChange={handleChange}>
          <option value="">-- Seleccione competencia --</option>
          {competencias.map((c) => (
            <option key={c.id_competencia} value={c.id_competencia}>
              {c.nombre}
            </option>
          ))}
        </select>

        <select name="id_marca" value={form.id_marca} onChange={handleChange}>
          <option value="">-- Seleccione marca --</option>
          {marcas.map((m) => (
            <option key={m.id_marca} value={m.id_marca}>
              {m.nombre}
            </option>
          ))}
        </select>

        <select name="id_equipo" value={form.id_equipo} onChange={handleChange}>
          <option value="">-- Seleccione equipo --</option>
          {equipos.map((e) => (
            <option key={e.id_equipo} value={e.id_equipo}>
              {e.nombre}
            </option>
          ))}
        </select>

        <input name="imagen" type="file" accept="image/*" onChange={handleChange} />
        <button type="submit">Guardar producto</button>
      </form>

        <Eliminar />
        {/*changed */}
        <Editar />
        {/*changed */}
    </div>
    </div>

  );
}
