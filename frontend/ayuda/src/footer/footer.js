import { useState } from "react";
import './footer.css';

function Footer() {
    const [email, setEmail] = useState("");
    const handleConfirm = () => {
    // Redirige al cliente de correo con el destinatario fijo
    window.location.href = `mailto:paolo.avalos@ucsp.edu.pe?subject=Suscripción&body=El usuario ingresó: ${email}`;
  };
  return (
    <footer className="footer">
        <span style={{color: 'white', fontFamily:  "Brush Script MT", fontSize:"30px"}}>Inspirame con todo lo ultimo</span>
        <div className = 'Email'>
            <input type='text' placeholder='*E-mail' value={email} 
                onChange={(e) => setEmail(e.target.value)} />
             <button onClick={handleConfirm}>Confirmar</button>
        </div>
        <div className ="cuadro">
            <div className ="cuadroFila"> 
                <span style={{color: 'white', marginLeft:'40px'}}>Servicios al cliente</span>
                <ul>
                    <li><a className="dorado" href="#">Contacto</a></li>
                    <li><a className="dorado" href="#">Entrega y retorno</a></li>
                    <li><a className="dorado" href="#">FQA</a></li>
                </ul>
            </div>
            <div className ="cuadroFila"> 
                <span style={{color: 'white', marginLeft:'40px'}} >Nuestro Equipo</span>
                <ul>
                    <li><a className="dorado" href="#">Rodrigo Ccallo</a></li>
                    <li><a className="dorado" href="#">Fernanda Cruz</a></li>
                    <li><a className="dorado" href="#">Paolo Avalos</a></li>
                    <li><a className="dorado" href="#">Sabrina Flores</a></li>
                </ul>
            </div>
            <div className ="cuadroFila"> 
                <span style={{color: 'white', marginLeft:'40px'}}>Terminos legales</span>
                <ul>
                    <li><a className="dorado" href="#">Politicas</a></li>
                    <li><a className="dorado" href="#">No vendas tu informacion</a></li>
                </ul>
            </div>
        </div>
        <div className = "abajo">
                <div className="Sigue">
                    <span className="gray">Síguenos en: </span>
                    <a className="dorado" href="#">Instagram</a>
                    <a className="dorado" href="#">Twitter</a>
                    <a className="dorado" href="#">YouTube</a>
                </div>
                <div className="Tienda">
                    <span> LA TIENDA DEL BICHO</span>
                </div>
                <div className = 'Pais'>
                    <span className="gray">País / Región:</span>
                    <span className="blue">Perú (Spanish)</span>
                </div>
            </div>
    </footer>
  );
}

export default Footer;
