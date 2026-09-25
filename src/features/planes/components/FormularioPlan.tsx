import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Info, Loader2 } from 'lucide-react';
import { Modal } from '../../../components/ui/Modal';
import { CampoTexto } from '../../../components/ui/CampoTexto';
import { aplicarErroresDelServidor } from '../../../lib/erroresFormulario';
import { useActualizarPlan, useCrearPlan } from '../hooks';
import { planSchema, type PlanFormulario } from '../schemas';
import type { Plan } from '../types';

/** Todos viajan al backend con el mismo nombre (`PlanRequest`). */
const CAMPOS = ['nombre', 'precio', 'duracion'] as const;

interface FormularioPlanProps {
  /** Sin plan es un alta; con plan, la edición de ese plan. */
  plan?: Plan;
  onCerrar: () => void;
}

/**
 * Alta y edición de un plan. Solo ADMIN.
 *
 * Editar no toca los pagos ya registrados: cada pago guardó su importe y su
 * vencimiento al cobrarse. El precio nuevo rige desde el próximo cobro, y es el
 * mínimo que el backend acepta.
 */
export const FormularioPlan = ({ plan, onCerrar }: FormularioPlanProps) => {
  const [mensajeServidor, setMensajeServidor] = useState<string | null>(null);
  const crear = useCrearPlan();
  const actualizar = useActualizarPlan();
  const guardando = crear.isPending || actualizar.isPending;

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<PlanFormulario>({
    resolver: zodResolver(planSchema),
    defaultValues: plan
      ? { nombre: plan.nombre, precio: plan.precio, duracion: plan.duracion }
      : { nombre: '' },
  });

  const guardar = handleSubmit(async (datos) => {
    setMensajeServidor(null);
    try {
      if (plan) await actualizar.mutateAsync({ id: plan.id, datos });
      else await crear.mutateAsync(datos);
      onCerrar();
    } catch (error) {
      setMensajeServidor(aplicarErroresDelServidor(error, setError, CAMPOS));
    }
  });

  return (
    <Modal
      onCerrar={onCerrar}
      bloqueado={guardando}
      titulo={plan ? 'Editar plan' : 'Nuevo plan'}
      descripcion="El precio es el mínimo del cobro y la duración define hasta cuándo queda al día el socio."
    >
      <form onSubmit={guardar} className="space-y-5" noValidate>
        {mensajeServidor && (
          <div className="p-4 rounded-xl bg-gym-red-900/20 border border-gym-red-600/40 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-gym-red-500 shrink-0 mt-0.5" />
            <p className="text-sm text-gym-red-400 leading-snug">{mensajeServidor}</p>
          </div>
        )}

        {plan && (
          <div className="p-4 rounded-xl bg-gym-dark border border-gym-border flex items-start gap-3">
            <Info className="w-5 h-5 text-gym-muted shrink-0 mt-0.5" />
            <p className="text-sm text-gym-muted leading-snug">
              Los pagos ya cobrados <strong className="text-white">no cambian</strong>: conservan su
              importe y su vencimiento. El precio y la duración nuevos valen desde el próximo cobro.
              El nombre sí cambia en todos lados, también en los pagos anteriores.
            </p>
          </div>
        )}

        <CampoTexto
          etiqueta="Nombre"
          autoFocus
          autoComplete="off"
          disabled={guardando}
          error={errors.nombre?.message}
          {...register('nombre')}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <CampoTexto
            etiqueta="Precio"
            type="number"
            inputMode="decimal"
            min={0}
            step="any"
            disabled={guardando}
            error={errors.precio?.message}
            {...register('precio', { valueAsNumber: true })}
          />
          <CampoTexto
            etiqueta="Duración (días)"
            type="number"
            inputMode="numeric"
            min={1}
            step={1}
            disabled={guardando}
            error={errors.duracion?.message}
            ayuda="Mensual: 30. Un pase diario: 1."
            {...register('duracion', { valueAsNumber: true })}
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onCerrar}
            disabled={guardando}
            className="px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-gym-dark hover:bg-gym-hover text-gym-muted hover:text-white border border-gym-border transition-colors disabled:opacity-40"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={guardando}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-gym-red-600 hover:bg-gym-red-500 text-white shadow-red-glow transition-colors disabled:opacity-50"
          >
            {guardando && <Loader2 className="w-4 h-4 animate-spin" />}
            {plan ? 'Guardar cambios' : 'Crear plan'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
