import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Productos from "./pages/Productos";
import Registro from "./registro/Registro";
import Home from "./home/Home";
import Login from "./login/Login";
import Header from "./header/Header";
import Profile from "./perfil_usuario/Perfil";
import Encuesta from "./encuesta/Encuesta";
import Carrito from "./carrito/Carrito";
import Pedido from "./pedido/Pedido";
import Resena from "./masdetalles/resenas/Resenas";
import AgregarProducto from "./agregarProducto/AgregarProducto";
import Deuda from "./deuda/Deuda";
import EliminarProducto from "./agregarProducto/EliminarProducto";
import ProductoDetalles from "./masdetalles/Detalles";
import ResponderEncuestas from "./responder-las-encuestas/responder-encuestas";
import RequireAuth from "./RequireAuth";
import ModificarItem from "./modificar-categorias/modificar-categorias";
import Footer from './footer/footer';
function App() {
  return (
    <Router>
      <Header /> 
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login-user" element={<Login tipo="user" />} />
          <Route path="/login-employee" element={<Login tipo="employee" />} />
          <Route path="/registro" element={<Registro />} />
          <Route path="/productos" element={<Productos />} />
          <Route path="/profile" element={ <RequireAuth> <Profile /> </RequireAuth>} /> 
          <Route path="/encuestas" element={<Encuesta/>} /> 
          <Route path="/responder-encuestas" element={<ResponderEncuestas />} />
          <Route path="/pedidos" element={<Pedido/>} /> 
          <Route path="/resenas/:id" element={<Resena/>} />
          <Route path="/deudas" element={<Deuda/>} />
          <Route path="/productos/agregar" element={<AgregarProducto />} />
          <Route path="/productos/eliminar/:id" element={<EliminarProducto />} />
          <Route path="/producto/:id" element={<ProductoDetalles />} />
          <Route path="/carrito" element={ <RequireAuth><Carrito/></RequireAuth>} /> 
            <Route path="/modificar_item" element={<ModificarItem/>} />
        </Routes>
      <Footer />
    </Router>
  );
}

export default App;
