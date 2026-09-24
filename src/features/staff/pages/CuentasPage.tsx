import { useState } from 'react';
import { UserCog, UserPlus } from 'lucide-react';
import { EncabezadoPagina } from '../../../components/ui/EncabezadoPagina';
import { Paginador } from '../../../components/ui/Paginador';
import { Cargando, ErrorDeCarga, SinDatos } from '../../../components/estado/Estados';
import { useStaff } from '../../../auth/sesion';
import { useOrden } from '../../../lib/useOrden';
import { ORDENABLES_CUENTAS, type ColumnaCuenta } from '../api';
import { useCuentas } from '../hooks';
import { ConfirmarCambioActivo } from '../components/ConfirmarCambioActivo';
import { FormularioCuenta } from '../components/FormularioCuenta';
import { ResetearContrasena } from '../components/ResetearContrasena';
import { TablaCuentas } from '../components/TablaCuentas';
import type { CuentaStaff } from '../types';

/**
 * Cuentas de staff (W7). Solo ADMIN.
 *
 * Nada se borra: la baja deja la fila, y como el nombre de login sigue ocupado,
 * equivocarse de persona se arregla reactivando, no creando otra igual. Por eso
 * las dadas de baja se listan (al final) con su botón para reactivarlas.
 */
export const CuentasPage = () => {
  const [pagina, setPagina] = useState(0);
  const [creando, setCreando] = useState(false);
  const [cuentaACambiar, setCuentaACambiar] = useState<CuentaStaff | null>(null);
  const [cuentaAResetear, setCuentaAResetear] = useState<CuentaStaff | null>(null);

  const staff = useStaff();
  // Activas primero (`activo` desc), y las dadas de baja juntas al final, donde se reactivan.
  const orden = useOrden(ORDENABLES_CUENTAS, { columna: 'estado', direccion: 'desc' });
  const ordenarPor = (columna: ColumnaCuenta) => {
    orden.alternar(columna);
    setPagina(0);
  };

  const { data, isLoading, isError, error, refetch } = useCuentas(pagina, orden.sort);

  return (
    <div className="space-y-6">
      <EncabezadoPagina
        titulo="Staff"
        descripcion="Cuentas del personal: alta, baja, reactivación y reset de contraseña."
        icono={UserCog}
      >
        <button
          onClick={() => setCreando(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-gym-red-600 hover:bg-gym-red-500 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-red-glow transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          Nueva cuenta
        </button>
      </EncabezadoPagina>

      <div className="bg-gym-card border border-gym-border rounded-2xl overflow-hidden shadow-card-dark">
        {isLoading ? (
          <Cargando texto="Trayendo cuentas..." />
        ) : isError ? (
          <ErrorDeCarga error={error} onReintentar={() => refetch()} />
        ) : !data || data.contenido.length === 0 ? (
          <SinDatos titulo="No hay cuentas de staff" />
        ) : (
          <>
            <TablaCuentas
              cuentas={data.contenido}
              idPropio={staff?.id ?? null}
              onCambiarActivo={setCuentaACambiar}
              onResetearContrasena={setCuentaAResetear}
              direccionDe={orden.direccionDe}
              onOrdenar={ordenarPor}
            />
            <Paginador
              pagina={data.pagina}
              totalPaginas={data.totalPaginas}
              totalElementos={data.totalElementos}
              onCambiar={setPagina}
            />
          </>
        )}
      </div>

      {creando && <FormularioCuenta onCerrar={() => setCreando(false)} />}
      {cuentaACambiar && (
        <ConfirmarCambioActivo cuenta={cuentaACambiar} onCerrar={() => setCuentaACambiar(null)} />
      )}
      {cuentaAResetear && (
        <ResetearContrasena cuenta={cuentaAResetear} onCerrar={() => setCuentaAResetear(null)} />
      )}
    </div>
  );
};
