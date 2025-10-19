import { NavLink, Route, Routes } from "react-router-dom";
import AdminView from "./pages/AdminView";
import PracticeView from "./pages/PracticeView";
import "./App.css";

function App() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>Écoute et Parle</h1>
        <nav>
          <NavLink to="/" end>
            Pratique
          </NavLink>
          <NavLink to="/admin">Admin</NavLink>
        </nav>
      </header>
      <main className="app-main">
        <Routes>
          <Route path="/" element={<PracticeView />} />
          <Route path="/admin" element={<AdminView />} />
        </Routes>
      </main>
      <footer className="app-footer">
        <span>Local learning tool — données stockées en CSV sur votre machine.</span>
      </footer>
    </div>
  );
}

export default App;
