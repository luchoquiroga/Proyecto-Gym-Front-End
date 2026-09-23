import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Modal } from '../../../components/ui/Modal';
import { CampoTexto } from '../../../components/ui/CampoTexto';
import { CampoSelect } from '../../../components/ui/CampoSelect';
import { aplicarErroresDelServidor } from '../../../lib/erroresFormulario';
import { useCrearCuenta } from '../hooks';
import { cuentaSchema, type CuentaFormulario } from '../schemas';

/** Los que viajan al backend (`UsuarioRequest`). `repetirContrasena` es solo del front. */
const CAMPOS = ['nombre', 'contrasena', 'rol'] as const;

/**
 * Alta de una cuenta de staff. Solo ADMIN.
 *
 * El nombre repetido vuelve como 400 con el mensaje del backend. Si la cuenta
 * con ese nombre está dada de baja, el mensaje dice que hay que reactivarla: el
 * nombre sigue ocupado, así que no se puede crear otra igual. Las dadas de baja
 * están al final del listado, con el botón para reactivarlas.
 */
export const FormularioCuenta = ({ onCerrar }: { onCerrar: () => void }) => {
  const [mensajeServidor, setMensajeServidor] = useState<string | null>(null);
  const crear = useCrearCuenta();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<CuentaFormulario>({
    resolver: zodResolver(cuentaSchema),
    defaultValues: { nombre: '', contrasena: '', repetirContrasena: '' },
  });

  const guardar = handleSubmit(async ({ nombre, rol, contrasena }) => {
    setMensajeServidor(null);
    try {
      await crear.mutateAsync({ nombre, rol, contrasena });
      onCerrar();
    } catch (error) {
      setMensajeServidor(aplicarErroresDelServidor(error, setError, CAMPOS));
    }
  });

  return (
    <Modal
      onCerrar={onCerrar}
      bloqueado={crear.isPending}
      titulo="Nueva cuenta de staff"
      descripcion="El nombre de usuario es con lo que va a ingresar. No se puede cambiar después."
    >
      <form onSubmit={guardar} className="space-y-5" noValidate>
        {mensajeServidor && (
          <div className="p-4 rounded-xl bg-gym-red-900/20 border border-gym-red-600/40 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-gym-red-500 shrink-0 mt-0.5" />
            <p className="text-sm text-gym-red-400 leading-snug">{mensajeServidor}</p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <CampoTexto
            etiqueta="Nombre de usuario"
            autoFocus
            autoComplete="off"
            disabled={crear.isPending}
            error={errors.nombre?.message}
            {...register('nombre')}
          />
          <CampoSelect
            etiqueta="Rol"
            defaultValue=""
            disabled={crear.isPending}
            error={errors.rol?.message}
            {...register('rol')}
          >
            <option value="" disabled>
              Elegí un rol…
            </option>
            <option value="GERENCIA">Gerencia — mostrador</option>
            <option value="ADMIN">Admin — todo, incluida la plata</option>
          </CampoSelect>
        </div>

        <CampoTexto
          etiqueta="Contraseña"
          type="password"
          autoComplete="new-password"
          disabled={crear.isPending}
          error={errors.contrasena?.message}
          ayuda="Al menos 8 caracteres. Después, la persona la cambia desde su menú."
          {...register('contrasena')}
        />
        <CampoTexto
          etiqueta="Repetí la contraseña"
          type="password"
          autoComplete="new-password"
          disabled={crear.isPending}
          error={errors.repetirContrasena?.message}
          {...register('repetirContrasena')}
        />

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onCerrar}
            disabled={crear.isPending}
            className="px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-gym-dark hover:bg-gym-hover text-gym-muted hover:text-white border border-gym-border transition-colors disabled:opacity-40"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={crear.isPending}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-gym-red-600 hover:bg-gym-red-500 text-white shadow-red-glow transition-colors disabled:opacity-50"
          >
            {crear.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            Crear cuenta
          </button>
        </div>
      </form>
    </Modal>
  );
};
