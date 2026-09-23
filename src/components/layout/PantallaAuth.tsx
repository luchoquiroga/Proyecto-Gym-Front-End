import { Dumbbell, ShieldCheck } from 'lucide-react';
import { ES_PRODUCCION } from '../../api/config';

interface PantallaAuthProps {
  /** Debajo del logo: dice por qué puerta se está entrando. */
  subtitulo: string;
  children: React.ReactNode;
  /** Links al pie: la otra puerta, volver al login, etc. */
  pie?: React.ReactNode;
}

/**
 * La tarjeta de las pantallas sin sesión: login del staff, login del socio y
 * registro del socio. Son flujos distintos contra endpoints distintos, pero
 * tienen que verse como el mismo gimnasio.
 */
export const PantallaAuth = ({ subtitulo, children, pie }: PantallaAuthProps) => (
  <div className="min-h-screen bg-gym-black flex items-center justify-center p-4 relative overflow-hidden">
    <div className="absolute -top-32 -left-32 w-96 h-96 bg-gym-red-600/15 rounded-full blur-3xl pointer-events-none" />
    <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-gym-red-800/10 rounded-full blur-3xl pointer-events-none" />

    <div className="w-full max-w-md relative z-10 animate-slide-up">
      <div className="bg-gym-card/85 backdrop-blur-xl border border-gym-border rounded-3xl p-8 shadow-card-dark">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="relative mb-4 group">
            <div className="absolute -inset-1 bg-gradient-to-r from-gym-red-600 to-gym-red-900 rounded-2xl blur-sm opacity-70 group-hover:opacity-100 transition duration-300" />
            <div className="relative w-16 h-16 rounded-2xl bg-gym-dark border border-gym-border-light flex items-center justify-center shadow-red-glow">
              <Dumbbell className="w-9 h-9 text-gym-red-500 -rotate-45" />
            </div>
          </div>

          <h1 className="text-2xl md:text-3xl font-black tracking-wider text-gym-white uppercase">
            IRON<span className="text-gym-red-500">GYM</span>
          </h1>
          <p className="text-xs text-gym-muted mt-1 uppercase tracking-widest">{subtitulo}</p>
        </div>

        {children}

        <div className="mt-8 pt-6 border-t border-gym-border/50 flex flex-col items-center gap-2 text-xs text-gym-subtle">
          {pie}
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-gym-red-500" />
            <span>El token de sesión vive solo en memoria</span>
          </div>
          <span className="text-[10px] font-mono text-gym-muted">
            API:{' '}
            <strong className={ES_PRODUCCION ? 'text-gym-red-400' : 'text-emerald-400'}>
              {ES_PRODUCCION ? 'Producción' : 'Local'}
            </strong>
          </span>
        </div>
      </div>
    </div>
  </div>
);

/** Link del pie, con el mismo estilo en las tres pantallas. */
export const claseLinkAuth =
  'font-bold text-gym-muted hover:text-white underline underline-offset-4 decoration-gym-border hover:decoration-gym-red-500 transition-colors';
