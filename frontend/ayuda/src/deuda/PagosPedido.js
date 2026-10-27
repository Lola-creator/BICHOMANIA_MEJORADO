import { useState, useEffect } from "react";

export default function PagosPedido({ id_pedido }) {
  const [pagos, setPagos] = useState([]);

  useEffect(() => {
    if (!id_pedido) return;
    cargarPagos();
  }, [id_pedido]);

  const cargarPagos = async () => {
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/pagos/${id_pedido}`);
      const data = await res.json();
      setPagos(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error cargando pagos:", err);
    }
  };

  if (pagos.length === 0) return null;

  return (
    <div style={{ marginTop: "10px", padding: "10px", borderTop: "1px solid #ccc" }}>
      <strong>Pagos realizados:</strong>
      <ul>
        {pagos.map(p => (
          <li key={p.id_pago}>
            {p.fecha_pago} - {p.metodo_pago} - S/. {p.monto}
          </li>
        ))}
      </ul>
    </div>
  );
}
