import { useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Modal } from '../../../components/ui/Modal';
import { CampoTexto } from '../../../components/ui/CampoTexto';
import { CampoSelect } from '../../../components/ui/CampoSelect';
import { Cargando, ErrorDeCarga, SinDatos } from '../../../components/estado/Estados';
import { aplicarErroresDelServidor } from '../../../lib/erroresFormulario';
import { formatearFecha, formatearPesos } from '../../../lib/formato';
import { hoyIso } from '../../../lib/fechas';
import { usePlanes } from '../../planes/hooks';
import type { Plan } from '../../planes/types';
import { EstadoSocioBadge } from '../../socios/components/EstadoSocioBadge';
import type { Socio } from '../../socios/types';
import { useRegistrarPago } from '../hooks';
import { crearCobroSchema, preverCobro, type CobroFormulario } from '../schemas';
import type { PagoResponse } from '../types';
import { AvisoPrevisionCobro } from './AvisoPrevisionCobro';

/** Los nombres son los del DTO (`PagoRequest`): así el 400 del backend cae en su campo. */
const CAMPOS = ['planId', 'montoAbonado', 'fechaPago'] as const;

const FECHA_ISO = /^\d{4}-\d{2}-\d{2}$/;

interface FormularioCobroProps {
  socio: Socio;
  onCerrar: () => void;
  onCobrado: (pago: PagoResponse) => void;
}

/**
 * Cobrar desde el listado de socios. ADMIN y GERENCIA.
 *
 * Vive acá y no en la pantalla de pagos porque GERENCIA cobra pero no puede
 * leer ningún pago: si el cobro estuviera en esa pantalla, el mostrador no
 * podría usarlo.
 */
export const FormularioCobro = ({ socio, onCerrar, onCobrado }: FormularioCobroProps) => {
  const planes = usePlanes();
  const registrar = useRegistrarPago();

  return (
    <Modal
      onCerrar={onCerrar}
      bloqueado={registrar.isPending}
      titulo="Cobrar"
      descripcion={`${socio.nombre} ${socio.apellido} — documento ${socio.documento}`}
    >
      {planes.isLoading ? (
        <Cargando texto="Trayendo planes..." />
      ) : planes.isError ? (
        <ErrorDeCarga error={planes.error} onReintentar={() => planes.refetch()} />
      ) : !planes.data || planes.data.length === 0 ? (
        <SinDatos
          titulo="No hay planes cargados"
          detalle="Sin un plan no se puede cobrar. Los planes los carga un administrador."
        />
      ) : (
        <CamposCobro
          socio={socio}
          planes={planes.data}
          registrar={registrar}
          onCerrar={onCerrar}
          onCobrado={onCobrado}
        />
      )}
    </Modal>
  );
};

interface CamposCobroProps extends FormularioCobroProps {
  planes: Plan[];
  registrar: ReturnType<typeof useRegistrarPago>;
}

/** Se monta recién con los planes a mano, porque el esquema y los valores iniciales dependen de ellos. */
const CamposCobro = ({ socio, planes, registrar, onCerrar, onCobrado }: CamposCobroProps) => {
  const [mensajeServidor, setMensajeServidor] = useState<string | null>(null);
  const hoy = hoyIso();
  const schema = useMemo(() => crearCobroSchema(planes), [planes]);

  // Por defecto, renovar el plan que ya tiene. Si nunca pagó, que lo elija.
  const planInicial = planes.find((p) => p.id === socio.planVigente?.id);

  const {
    register,
    handleSubmit,
    setError,
    setValue,
    control,
    formState: { errors },
  } = useForm<CobroFormulario>({
    resolver: zodResolver(schema),
    defaultValues: {
      planId: planInicial?.id,
      montoAbonado: planInicial?.precio,
      fechaPago: hoy,
    },
  });

  const [planId, fechaPago] = useWatch({ control, name: ['planId', 'fechaPago'] });
  const planElegido = planes.find((p) => p.id === planId);
  const prevision =
    planElegido && FECHA_ISO.test(fechaPago ?? '')
      ? preverCobro(fechaPago, planElegido, socio.fechaVencimiento, hoy)
      : null;

  const guardando = registrar.isPending;

  const cobrar = handleSubmit(async (valores) => {
    setMensajeServidor(null);
    try {
      const pago = await registrar.mutateAsync({ clienteId: socio.id, ...valores });
      onCobrado(pago);
    } catch (error) {
      // El 400 de "monto menor al precio" no trae `errores`: viene solo con
      // `mensaje` y va arriba, tal cual lo escribió el backend.
      setMensajeServidor(aplicarErroresDelServidor(error, setError, CAMPOS));
    }
  });

  return (
    <form onSubmit={cobrar} className="space-y-5" noValidate>
      {mensajeServidor && (
        <div className="p-4 rounded-xl bg-gym-red-900/20 border border-gym-red-600/40 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-gym-red-500 shrink-0 mt-0.5" />
          <p className="text-sm text-gym-red-400 leading-snug">{mensajeServidor}</p>
        </div>
      )}

      <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-gym-dark/60 border border-gym-border text-xs text-gym-muted">
        <span>Situación actual</span>
        <span className="flex items-center gap-3">
          <EstadoSocioBadge estado={socio.estado} />
          <span>vence {formatearFecha(socio.fechaVencimiento)}</span>
        </span>
      </div>

      <CampoSelect
        etiqueta="Plan"
        autoFocus
        disabled={guardando}
        error={errors.planId?.message}
        {...register('planId', {
          valueAsNumber: true,
          // Al cambiar de plan, el importe pasa a ser su precio: es lo que se
          // cobra casi siempre y evita el 400 por pago parcial.
          onChange: (evento: React.ChangeEvent<HTMLSelectElement>) => {
            const plan = planes.find((p) => p.id === Number(evento.target.value));
            if (plan) setValue('montoAbonado', plan.precio, { shouldValidate: true });
          },
        })}
      >
        <option value="">Elegí un plan…</option>
        {planes.map((plan) => (
          <option key={plan.id} value={plan.id}>
            {plan.nombre} — {formatearPesos(plan.precio)} · {plan.duracion} días
          </option>
        ))}
      </CampoSelect>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <CampoTexto
          etiqueta="Importe"
          type="number"
          inputMode="decimal"
          min={0}
          step="any"
          disabled={guardando}
          error={errors.montoAbonado?.message}
          ayuda="No hay pago parcial: no puede ser menor al precio del plan."
          {...register('montoAbonado', { valueAsNumber: true })}
        />
        <CampoTexto
          etiqueta="Fecha de pago"
          type="date"
          disabled={guardando}
          error={errors.fechaPago?.message}
          ayuda="Hoy, salvo que se esté cargando un cobro atrasado."
          {...register('fechaPago')}
        />
      </div>

      {prevision && <AvisoPrevisionCobro prevision={prevision} />}

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
          Registrar pago
        </button>
      </div>
    </form>
  );
};
