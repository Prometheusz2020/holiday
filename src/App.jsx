import { BrowserRouter } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { AuthProvider } from './context/AuthContext';
import AppRouter from './routes/AppRouter';
import './index.css';

function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <BrowserRouter>
          <AppRouter />
        </BrowserRouter>
      </AppProvider>
    </AuthProvider>
  );
}

export default App;
