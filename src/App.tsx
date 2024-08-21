import './App.css'
import { BrowserRouter, Link, Route, Routes } from 'react-router-dom';
import Chat from './pages/Chat';

function App() {

  return (
      <BrowserRouter>
        <nav>
          <ul>
            <li><Link to="/">Home</Link></li>
          </ul>
        </nav>
        <main>
          <Routes>
            <Route path="/" element={<Chat />} />
          </Routes>
        </main>
      </BrowserRouter>
    );
}

export default App
