import { useEffect, useState } from "react";

export default function ResponderEncuestas() {
    const [encuestas, setEncuestas] = useState([]);
    const [seleccionada, setSeleccionada] = useState(null);
    const [detalles, setDetalles] = useState([]);

    const idCliente = localStorage.getItem("id_usuario");

    useEffect(() => {
        cargarEncuestas();
    }, []);


    const cargarEncuestas = async () => {
        const res = await fetch(`${process.env.REACT_APP_API_URL}/encuestas-activas`);
        const encuestasActivas = await res.json();

        const filtradas = [];

        for (const e of encuestasActivas) {
            const resp = await fetch(`${process.env.REACT_APP_API_URL}/ya-voto/${idCliente}/${e.id_encuesta}`);
            const data = await resp.json();

            if (!data.yaVoto) {
                filtradas.push(e);
            }
        }

        setEncuestas(filtradas);
    };


    const seleccionarEncuesta = async (encuesta) => {
        setSeleccionada(encuesta);

        const res = await fetch(`${process.env.REACT_APP_API_URL}/detalles-encuesta/${encuesta.id_encuesta}`);

        const data = await res.json();
        setDetalles(data);
    };


    const votar = async (detalle) => {
        await fetch(`${process.env.REACT_APP_API_URL}/votar`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                idCliente,
                idEncuesta: seleccionada.id_encuesta,
                idDetalle: detalle.id_detalle
            })
        });

        setEncuestas(encuestas.filter(e => e.id_encuesta !== seleccionada.id_encuesta));

        setSeleccionada(null);

        alert("¡Voto registrado!");
    };

    return (
        <div style={{ padding: "20px" }}>
            <h2>Encuestas Disponibles</h2>

            {encuestas.length === 0 && seleccionada === null && (
                <p>No tienes encuestas disponibles para responder.</p>
            )}

            {seleccionada === null ? (
                <ul>
                    {encuestas.map(e => (
                        <li
                            key={e.id_encuesta}
                            style={{
                                marginBottom: "10px",
                                cursor: "pointer",
                                padding: "10px",
                                border: "1px solid #ccc",
                                borderRadius: "6px"
                            }}
                            onClick={() => seleccionarEncuesta(e)}
                        >
                            <strong>{e.descripcion}</strong>
                            <br />
                            <small>{e.fecha_inicio} → {e.fecha_fin}</small>
                        </li>
                    ))}
                </ul>
            ) : (
                <div>
                    <h3>{seleccionada.descripcion}</h3>

                    <button onClick={() => setSeleccionada(null)}>
                        Volver
                    </button>

                    <ul>
                        {detalles.map(d => (
                            <li
                                key={d.id_detalle}
                                style={{
                                    padding: "12px",
                                    marginTop: "10px",
                                    border: "1px solid #aaa",
                                    borderRadius: "6px",
                                    cursor: "pointer"
                                }}
                                onClick={() => votar(d)}
                            >
                                <strong>{d.opcion_equipo}</strong> – {d.opcion_liga}
                                <br />
                                <small>{d.categoria}</small>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
