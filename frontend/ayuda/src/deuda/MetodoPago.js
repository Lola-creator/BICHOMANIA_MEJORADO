import { useState, useEffect } from "react";

export default function MetodoPago({ id_pedido, id_carrito, onPagoExitoso}) {
  const [deudaActual, setDeudaActual] = useState(0);
  const [monto, setMonto] = useState("");
  const [metodo, setMetodo] = useState("");
  const [tarjeta, setTarjeta] = useState({
    numero: "",
    nombre: "",
    correo: "",
    fecha: "",
    cvv: ""
  });
  const [errores, setErrores] = useState({});

  useEffect(() => {
    if (!id_carrito) return;
    cargarDeuda();
  }, [id_carrito]);

  const cargarDeuda = async () => {
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/deuda?id_carrito=${id_carrito}`);
      const data = await res.json();
      setDeudaActual(Number(data.deuda) || 0);
    } catch (err) {
      console.error("Error cargando deuda carrito:", err);
    }
  };

  const validar = () => {
    const val = Number(monto);
    let e = {};

    if (!val || val <= 0) e.monto = "Debe ingresar un monto válido";
    if (val > deudaActual) e.monto = "No puedes pagar más que la deuda actual";

    if (metodo === "tarjeta") {
      if ((tarjeta.numero || "").length !== 16) e.numero = "Tarjeta inválida";
      if ((tarjeta.nombre || "").length < 3) e.nombre = "Nombre inválido";
      if (!((tarjeta.correo || "").includes("@"))) e.correo = "Correo inválido";
      if (!/^[0-9]{2}\/[0-9]{2}$/.test(tarjeta.fecha)) e.fecha = "Formato MM/YY";
      if ((tarjeta.cvv || "").length !== 3) e.cvv = "CVV inválido";
    }

    setErrores(e);
    return Object.keys(e).length === 0;
  };

  const procesarPago = async () => {
    if (!validar()) return;

    try {
      const resPago = await fetch(`${process.env.REACT_APP_API_URL}/pagos/registrar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_pedido,
          metodo_pago: metodo,
          monto: Number(monto)
        })
      });

      const jsonPago = await resPago.json();
      if (!resPago.ok) return alert(jsonPago.error || "Error registrando pago");

      alert("Pago registrado correctamente");

      await cargarDeuda();
      setMonto("");

      if (onPagoExitoso) onPagoExitoso();

    } catch (err) {
      console.error("Error procesando pago:", err);
      alert("Error procesando pago");
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto space-y-4">
      <h2 className="text-xl font-bold">Ingrese monto</h2>
      <div className="p-4 border rounded-xl text-center">
        
      </div>

      <input
        className="p-2 border rounded w-full"
        placeholder="Ingrese monto a pagar"
        type="number"
        value={monto}
        onChange={(e) => setMonto(e.target.value)}
      />
      {errores.monto && <p className="text-red-500 text-sm">{errores.monto}</p>}

      <div className="space-y-2">
        <label>
          <input type="radio" name="mp" value="paypal" onChange={() => setMetodo("paypal")} />
          PayPal
        </label>
        <br />
        <label>
          <input type="radio" name="mp" value="tarjeta" onChange={() => setMetodo("tarjeta")} />
          Tarjeta
        </label>
      </div>

      {metodo === "tarjeta" && (
        <div className="grid gap-2 p-4 border rounded-xl">
          <input placeholder="Número de tarjeta" maxLength={16} value={tarjeta.numero}
                 onChange={(e) => setTarjeta({ ...tarjeta, numero: e.target.value })} />
          {errores.numero && <p className="text-red-500 text-sm">{errores.numero}</p>}

          <input placeholder="Nombre" value={tarjeta.nombre}
                 onChange={(e) => setTarjeta({ ...tarjeta, nombre: e.target.value })} />
          {errores.nombre && <p className="text-red-500 text-sm">{errores.nombre}</p>}

          <input placeholder="Correo" value={tarjeta.correo}
                 onChange={(e) => setTarjeta({ ...tarjeta, correo: e.target.value })} />
          {errores.correo && <p className="text-red-500 text-sm">{errores.correo}</p>}

          <input placeholder="MM/YY" maxLength={5} value={tarjeta.fecha}
                 onChange={(e) => setTarjeta({ ...tarjeta, fecha: e.target.value })} />
          {errores.fecha && <p className="text-red-500 text-sm">{errores.fecha}</p>}

          <input placeholder="CVV" maxLength={3} value={tarjeta.cvv}
                 onChange={(e) => setTarjeta({ ...tarjeta, cvv: e.target.value })} />
          {errores.cvv && <p className="text-red-500 text-sm">{errores.cvv}</p>}
        </div>
      )}

      <button className="p-3 bg-blue-600 text-white rounded-xl w-full" onClick={procesarPago}>
        Pagar
      </button>
    </div>
  );
}
