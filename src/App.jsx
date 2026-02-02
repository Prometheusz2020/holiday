import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { AuthProvider } from './context/AuthContext';
import Employees from './pages/Employees';
import Calendar from './pages/Calendar';
import Masters from './pages/Masters';
import TimeSheet from './pages/TimeSheet';
import Login from './pages/Login';
import PrivateRoute from './components/PrivateRoute';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Ponto from './pages/Ponto';
import RegisterEstablishment from './pages/RegisterEstablishment';
import TimeSheetPrint from './pages/TimeSheetPrint';
import './index.css';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<RegisterEstablishment />} />
            <Route path="/ponto" element={<PrivateRoute><Ponto /></PrivateRoute>} />
            <Route path="/" element={<PrivateRoute><Layout><Dashboard /></Layout></PrivateRoute>} />
            <Route path="/employees" element={<PrivateRoute><Layout><Employees /></Layout></PrivateRoute>} />
            <Route path="/calendar" element={<PrivateRoute><Layout><Calendar /></Layout></PrivateRoute>} />
            <Route path="/timesheet" element={<PrivateRoute><Layout><TimeSheet /></Layout></PrivateRoute>} />
            <Route path="/timesheet/print" element={<PrivateRoute><TimeSheetPrint /></PrivateRoute>} />
            <Route path="/masters" element={<PrivateRoute><Layout><Masters /></Layout></PrivateRoute>} />
          </Routes>
        </AppProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
