import { KeyRound, RotateCcw, UserMinus } from 'lucide-react';
import type { CuentaStaff } from '../types';

const COLUMNAS = ['Usuario', 'Rol', 'Estado', ''];

interface TablaCuentasProps {
  cuentas: CuentaStaff[];
  /** Id de la cuenta logueada. Los ids de `usuarios` no se mezclan con los de socios: acá comparar es seguro. */
  idPropio: number | null;
  onCambiarActivo: (cuenta: CuentaStaff) => void;
  onResetearContrasena: (cuenta: CuentaStaff) => void;
}

const claseAccion =
  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-gym-muted transition-colors';

export const TablaCuentas = ({
  cuentas,
  idPropio,
  onCambiarActivo,
  onResetearContrasena,
}: TablaCuentasProps) => (
  <div className="overflow-x-auto">
    <table className="w-full text-left text-sm">
      <thead>
        <tr className="border-b border-gym-border text-xs uppercase tracking-wider text-gym-muted bg-gym-dark/50">
          {COLUMNAS.map((columna, i) => (
            <th key={columna || i} className="py-4 px-6 font-semibold whitespace-nowrap">
              {columna}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-gym-border/50">
        {cuentas.map((cuenta) => {
          const esPropia = cuenta.id === idPropio;
          return (
            <tr
              key={cuenta.id}
              className={`transition-colors ${cuenta.activo ? 'hover:bg-gym-dark/40' : 'bg-gym-dark/60'}`}
            >
              <td className={`py-4 px-6 font-bold whitespace-nowrap ${cuenta.activo ? 'text-white' : 'text-gym-muted'}`}>
                {cuenta.nombre}
                {esPropia && <span className="ml-2 text-[11px] font-normal text-gym-subtle">(vos)</span>}
              </td>
              <td className="py-4 px-6">
                <span className="inline-block px-2 py-0.5 rounded text-[10px] font-extrabold bg-gym-red-900/40 text-gym-red-400 border border-gym-red-800/50">
                  {cuenta.rol}
                </span>
              </td>
              <td className="py-4 px-6 whitespace-nowrap">
                {cuenta.activo ? (
                  <span className="text-xs font-bold text-emerald-400">Activa</span>
                ) : (
                  <span className="text-xs font-bold text-zinc-400">Dada de baja</span>
                )}
              </td>
              <td className="py-4 px-6">
                {/* Sobre la propia cuenta el backend rechaza la baja y el reset:
                    no se ofrecen. Para la propia está "Cambiar contraseña" del menú. */}
                {!esPropia && (
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => onResetearContrasena(cuenta)}
                      title="Para cuando se olvidó la clave"
                      className={`${claseAccion} hover:text-white hover:bg-gym-hover`}
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      Resetear clave
                    </button>
                    {cuenta.activo ? (
                      <button
                        onClick={() => onCambiarActivo(cuenta)}
                        title="Deja de poder ingresar (no se borra nada)"
                        className={`${claseAccion} hover:text-gym-red-400 hover:bg-gym-red-600/10`}
                      >
                        <UserMinus className="w-3.5 h-3.5" />
                        Dar de baja
                      </button>
                    ) : (
                      <button
                        onClick={() => onCambiarActivo(cuenta)}
                        title="Vuelve a poder ingresar con su misma contraseña"
                        className={`${claseAccion} hover:text-emerald-400 hover:bg-emerald-600/10`}
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Reactivar
                      </button>
                    )}
                  </div>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
);
