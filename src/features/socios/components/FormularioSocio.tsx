import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Modal } from '../../../components/ui/Modal';
import { CampoTexto } from '../../../components/ui/CampoTexto';
import { aplicarErroresDelServidor } from '../../../lib/erroresFormulario';
import { FORMULARIO_VACIO, socioSchema, type SocioFormulario } from '../schemas';
import { useActualizarSocio, useCrearSocio } from '../hooks';
import type { Socio, SocioAltaResponse, SocioRequest } from '../types';

const CAMPOS = ['nombre', 'apellido', 'telefono', 'documento'] as const;

interface FormularioSocioProps {
  onCerrar: () => void;
  /** null = alta. Con socio = edición. */
  socio: Socio | null;
  /** Solo en el alta: trae el código de activación, que se ve una sola vez. */
  onSocioCreado: (alta: SocioAltaResponse) => void;
}

const valoresIniciales = (socio: Socio | null): SocioFormulario =>
  socio
    ? {
        nombre: socio.nombre,
        apellido: socio.apellido,
        telefono: socio.telefono ?? '',
        documento: socio.documento,
      }
    : FORMULARIO_VACIO;

/**
 * Alta y edición de un socio. ADMIN y GERENCIA.
 *
 * No ofrece email ni contraseña a propósito: el email es la identidad de login
 * del socio en el portal y cambiárselo desde el mostrador le sacaría el acceso
 * sin que se entere. El backend directamente los ignora en el PUT.
 *
 * Tampoco ofrece el estado: un socio se activa pagando, y MOROSO lo calcula el
 * vencimiento. Ninguno de los dos se fija a mano.
 */
export const FormularioSocio = ({ onCerrar, socio, onSocioCreado }: FormularioSocioProps) => {
  const esEdicion = socio !== null;
  const [mensajeServidor, setMensajeServidor] = useState<string | null>(null);

  const crear = useCrearSocio();
  const actualizar = useActualizarSocio();
  const guardando = crear.isPending || actualizar.isPending;

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<SocioFormulario>({
    resolver: zodResolver(socioSchema),
    defaultValues: valoresIniciales(socio),
  });

  const guardar = handleSubmit(async (valores) => {
    setMensajeServidor(null);

    const datos: SocioRequest = {
      nombre: valores.nombre.trim(),
      apellido: valores.apellido.trim(),
      documento: valores.documento.trim(),
      // Vacío es "no tiene teléfono", no la cadena "".
      telefono: valores.telefono.trim() || undefined,
    };

    try {
      if (socio) {
        await actualizar.mutateAsync({ id: socio.id, datos });
        onCerrar();
      } else {
        const alta = await crear.mutateAsync(datos);
        onSocioCreado(alta);
      }
    } catch (error) {
      // El 400 de validación se pinta campo por campo; el 409 de documento
      // duplicado se muestra arriba, con el mensaje del backend tal cual —es el
      // caso de "esta persona ya está cargada", que el mostrador necesita leer.
      setMensajeServidor(aplicarErroresDelServidor(error, setError, CAMPOS));
    }
  });

  return (
    <Modal
      onCerrar={onCerrar}
      bloqueado={guardando}
      titulo={esEdicion ? 'Editar socio' : 'Registrar socio'}
      descripcion={
        esEdicion
          ? 'Datos de contacto y documento. El email y la contraseña los maneja el propio socio.'
          : 'El socio nace inactivo hasta su primer pago.'
      }
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
            etiqueta="Nombre"
            autoFocus
            autoComplete="off"
            disabled={guardando}
            error={errors.nombre?.message}
            {...register('nombre')}
          />
          <CampoTexto
            etiqueta="Apellido"
            autoComplete="off"
            disabled={guardando}
            error={errors.apellido?.message}
            {...register('apellido')}
          />
        </div>

        <CampoTexto
          etiqueta="Documento"
          autoComplete="off"
          disabled={guardando}
          error={errors.documento?.message}
          ayuda="Se puede escribir con o sin puntos: el sistema lo guarda normalizado. Es lo que distingue a dos socios que se llaman igual."
          {...register('documento')}
        />

        <CampoTexto
          etiqueta="Teléfono"
          autoComplete="off"
          inputMode="tel"
          disabled={guardando}
          error={errors.telefono?.message}
          ayuda="Opcional."
          {...register('telefono')}
        />

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
            {esEdicion ? 'Guardar cambios' : 'Registrar socio'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
