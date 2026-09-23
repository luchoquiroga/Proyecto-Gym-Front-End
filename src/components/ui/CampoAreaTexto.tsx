import { useId } from 'react';

interface CampoAreaTextoProps extends React.ComponentPropsWithRef<'textarea'> {
  etiqueta: string;
  /** Mensaje de error: el de zod o el que devolvió el backend para este campo. */
  error?: string;
  ayuda?: string;
}

/** El hermano de `CampoTexto` para textos largos (un motivo, una observación). */
export const CampoAreaTexto = ({ etiqueta, error, ayuda, id, ...props }: CampoAreaTextoProps) => {
  const idGenerado = useId();
  const idCampo = id ?? idGenerado;
  const idError = `${idCampo}-error`;

  return (
    <div>
      <label
        htmlFor={idCampo}
        className="block text-xs font-semibold uppercase tracking-wider text-gym-muted mb-2"
      >
        {etiqueta}
      </label>

      <textarea
        id={idCampo}
        rows={3}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? idError : undefined}
        className={`w-full px-4 py-3 bg-gym-dark border rounded-xl text-gym-white placeholder-gym-subtle text-sm resize-y focus:outline-none focus:ring-1 transition-colors disabled:opacity-50 ${
          error
            ? 'border-gym-red-600 focus:border-gym-red-500 focus:ring-gym-red-500'
            : 'border-gym-border focus:border-gym-red-500 focus:ring-gym-red-500'
        }`}
        {...props}
      />

      {error ? (
        <p id={idError} className="mt-1.5 text-xs text-gym-red-400 leading-snug">
          {error}
        </p>
      ) : (
        ayuda && <p className="mt-1.5 text-xs text-gym-subtle leading-snug">{ayuda}</p>
      )}
    </div>
  );
};
