import { useState } from "react";
import { useNavigate } from "react-router-dom";
import './login.css'
export default function Login({ tipo }) {
  const [datos, setDatos] = useState({ correo: "", password: "" });
  const navigate = useNavigate();
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const actualizar = (e) => {
    setDatos({ ...datos, [e.target.name]: e.target.value });
  };

  const enviarLogin = async (e) => {
    e.preventDefault();

    const url =
      tipo === "user"
        ? `${process.env.REACT_APP_API_URL}/login/user`
        : `${process.env.REACT_APP_API_URL}/login/employee`;

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datos),
      });

      console.log("Status:", res.status); 

      if (!res.ok) {
        const errText = await res.text();
        alert(errText || "Error en login");
        return;
      }

      const msg = await res.json();
      console.log("Respuesta JSON:", msg);

      if (tipo === "user") {
        localStorage.setItem("rol", msg.usuario.rol);
        localStorage.setItem("id_usuario", msg.usuario.id);
      } else {
        localStorage.setItem("rol", msg.empleado.rol);
        localStorage.setItem("id_empleado", msg.empleado.id);
      }

      window.dispatchEvent(new Event("storage"));

      if (tipo === "user") {
        navigate("/productos", { replace: true });
      } else {

        navigate("/encuestas", { replace: true });;
      }
    } catch (error) {
      console.error("ERROR FRONT:", error);
      alert("No se pudo conectar con el servidor");
    }
  };

  return (
    <div className = "content-login"  style={{ 
        backgroundImage: "url('/login/login1.jpg')", 
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundSize: "cover",
        minHeight: "100vh",
        width: "100%"
        }}>
      <div className = 'cuadro-login'>
        <h2 style ={{}}>Datos del {tipo === "user" ? "Cliente" : "Empleado"}</h2>
          <form onSubmit={enviarLogin}>
            <input
              type="text"
              name="correo"
              placeholder="*Email adress/ Name account"
              value={datos.correo}
              onChange={actualizar}
            />
            <div className="input-password-container">
            <input
              type={mostrarPassword ? "text" : "password"} // 👈 alterna entre text/password
              name="password"
              placeholder="Password"
              value={datos.password}
              onChange={actualizar}
            />
            <span
              onClick={() => setMostrarPassword(!mostrarPassword)}
              style={{
                position: "absolute",
                right: "10px",
                top: "50%",
                transform: "translateY(-50%)",
                cursor: "pointer",
                fontSize: "18px",
              }}
            >
              {mostrarPassword ? "🙈" : "👁️"}
            </span>
          </div>
            <button type="submit">Ingresar</button>
          </form>
          <div className="regi">
            {tipo === "user" && (
              <div>
                <span style={{ color: "darkblue", fontSize: "20px", fontFamily: "cursive", marginLeft:"86px" }}>
                  ¿Eres nuevo?
                </span>
                <button onClick={() => navigate("/registro")}>Registrate</button>
              </div>
            )}
          </div>
      </div>
    </div>
  );
}

