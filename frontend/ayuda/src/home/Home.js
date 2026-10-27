import React, { useState } from "react";
import './home.css';
import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className = 'home' style={{ 
        backgroundImage: "url('/inicio/real-madrid.png')", 
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundSize: "cover",
        minHeight: "100vh",
        width: "100%"
        }}>
        <div className = 'content'>
            <h1>BICHOMANIA</h1>
            <div className = 'opcion'>
              <button onClick={() => navigate("/login-user")}>Cliente</button>
              <button onClick={() => navigate("/login-employee")}>Empleado</button>
            </div>
            </div>
    </div>
  );
}
