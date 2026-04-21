import { Link } from 'react-router-dom'

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <p className="footer-logo">CarMeet <span>ESP</span></p>
        <p className="footer-texto">La comunidad de coches en España</p>
        <nav className="footer-nav">
          <Link to="/">Inicio</Link>
          <Link to="/eventos">Eventos</Link>
          <Link to="/mapa">Mapa</Link>
          <Link to="/login">Entrar</Link>
        </nav>
        <p className="footer-copy">© 2025 CarMeet ESP — Proyecto TFG DAW</p>
      </div>
    </footer>
  )
}

export default Footer