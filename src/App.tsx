import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthInitializer } from './auth/AuthInitializer';
import { RutaProtegida } from './auth/RutaProtegida';
import { rutaInicial } from './auth/rutas';
import { useSesion } from './auth/sesion';
import { StaffLayout } from './components/layout/StaffLayout';
import { Login } from './pages/Login';
import { AccesoRestringido } from './pages/AccesoRestringido';
import { DashboardPage } from './features/dashboard/pages/DashboardPage';
import { SociosPage } from './features/socios/pages/SociosPage';
import { PlanesPage } from './features/planes/pages/PlanesPage';
import { PagosPage } from './features/pagos/pages/PagosPage';
import { PortalSocioPage } from './features/portal-socio/pages/PortalSocioPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      // Un 401 lo resuelve el interceptor con el refresh; reintentar de más solo
      // retrasa el mensaje de error cuando el backend está caído de verdad.
      retry: 1,
    },
  },
});

const RedireccionRaiz = () => {
  const { principal, cargandoSesion } = useSesion();

  if (cargandoSesion) return null;
  if (!principal) return <Navigate to="/login" replace />;

  return <Navigate to={rutaInicial(principal)} replace />;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthInitializer>
          <Routes>
            <Route path="/" element={<RedireccionRaiz />} />
            <Route path="/login" element={<Login />} />
            <Route path="/acceso-restringido" element={<AccesoRestringido />} />

            {/* Staff: mostrador (GERENCIA) y administración (ADMIN).
                Las pantallas de plata llevan además el corte por rol, porque el
                backend le responde 403 a GERENCIA en todas las lecturas de pagos. */}
            <Route
              element={
                <RutaProtegida portal="staff">
                  <StaffLayout />
                </RutaProtegida>
              }
            >
              <Route path="/staff/socios" element={<SociosPage />} />
              <Route path="/staff/planes" element={<PlanesPage />} />
              <Route
                path="/staff/dashboard"
                element={
                  <RutaProtegida portal="staff" roles={['ADMIN']}>
                    <DashboardPage />
                  </RutaProtegida>
                }
              />
              <Route
                path="/staff/pagos"
                element={
                  <RutaProtegida portal="staff" roles={['ADMIN']}>
                    <PagosPage />
                  </RutaProtegida>
                }
              />
            </Route>

            {/* Portal del socio. Todavía no hay login propio de socio (ticket W10):
                la pantalla existe y lee datos reales, pero no se puede alcanzar. */}
            <Route
              path="/socio/resumen"
              element={
                <RutaProtegida portal="socio">
                  <PortalSocioPage />
                </RutaProtegida>
              }
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthInitializer>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
