import { useState } from 'react';
import { Pencil, Search, UserMinus, UserPlus, Users } from 'lucide-react';
import { EncabezadoPagina } from '../../../components/ui/EncabezadoPagina';
import { Paginador } from '../../../components/ui/Paginador';
import { Cargando, ErrorDeCarga, SinDatos } from '../../../components/estado/Estados';
import { useDebounce } from '../../../lib/useDebounce';
import { formatearFecha } from '../../../lib/formato';
import { EstadoSocioBadge } from '../components/EstadoSocioBadge';
import { FormularioSocio } from '../components/FormularioSocio';
import { AvisoCodigoActivacion } from '../components/AvisoCodigoActivacion';
import { ConfirmarBaja } from '../components/ConfirmarBaja';
import { useBuscarSocios, useSocios } from '../hooks';
import type { Socio, SocioAltaResponse } from '../types';

const COLUMNAS = ['Documento', 'Socio', 'Teléfono', 'Estado', 'Vence', 'Plan vigente', 'Acciones'];

export const SociosPage = () => {
  const [pagina, setPagina] = useState(0);
  const [termino, setTermino] = useState('');
  const busqueda = useDebounce(termino);
  const buscando = busqueda.trim().length > 0;

  const [formularioAbierto, setFormularioAbierto] = useState(false);
  const [socioEnEdicion, setSocioEnEdicion] = useState<Socio | null>(null);
  const [altaReciente, setAltaReciente] = useState<SocioAltaResponse | null>(null);
  const [socioABajar, setSocioABajar] = useState<Socio | null>(null);

  // La búsqueda le pega al endpoint del backend. Filtrar en memoria filtraría
  // solo la página actual y parecería que busca entre todos los socios.
  const listado = useSocios(pagina);
  const resultados = useBuscarSocios(busqueda);

  const consulta = buscando ? resultados : listado;
  const socios: Socio[] | undefined = buscando ? resultados.data : listado.data?.contenido;

  const abrirAlta = () => {
    setSocioEnEdicion(null);
    setFormularioAbierto(true);
  };

  const abrirEdicion = (socio: Socio) => {
    setSocioEnEdicion(socio);
    setFormularioAbierto(true);
  };

  return (
    <div className="space-y-6">
      <EncabezadoPagina
        titulo="Socios"
        descripcion="Padrón del gimnasio: alta, contacto y estado de la membresía."
        icono={Users}
      >
        <button
          onClick={abrirAlta}
          className="flex items-center gap-2 px-4 py-2.5 bg-gym-red-600 hover:bg-gym-red-500 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-red-glow transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          Registrar socio
        </button>
      </EncabezadoPagina>

      <div className="relative max-w-md">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gym-subtle">
          <Search className="w-5 h-5" />
        </div>
        <input
          type="search"
          value={termino}
          onChange={(e) => {
            setTermino(e.target.value);
            setPagina(0);
          }}
          placeholder="Buscar por nombre..."
          className="w-full pl-11 pr-4 py-3 bg-gym-card border border-gym-border rounded-xl text-white placeholder-gym-subtle text-sm focus:outline-none focus:border-gym-red-500 focus:ring-1 focus:ring-gym-red-500 transition-colors"
        />
      </div>

      <div className="bg-gym-card border border-gym-border rounded-2xl overflow-hidden shadow-card-dark">
        {consulta.isLoading ? (
          <Cargando texto="Trayendo socios..." />
        ) : consulta.isError ? (
          <ErrorDeCarga error={consulta.error} onReintentar={() => consulta.refetch()} />
        ) : !socios || socios.length === 0 ? (
          <SinDatos
            titulo={
              buscando ? 'Ningún socio coincide con la búsqueda' : 'Todavía no hay socios cargados'
            }
            detalle={buscando ? `Se buscó "${busqueda}" por nombre.` : undefined}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gym-border text-xs uppercase tracking-wider text-gym-muted bg-gym-dark/50">
                    {COLUMNAS.map((columna) => (
                      <th key={columna} className="py-4 px-6 font-semibold whitespace-nowrap">
                        {columna}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gym-border/50">
                  {socios.map((socio) => (
                    <tr key={socio.id} className="hover:bg-gym-dark/40 transition-colors">
                      {/* El documento distingue a dos socios que se llaman igual: va primero. */}
                      <td className="py-4 px-6 font-mono text-xs text-gym-muted whitespace-nowrap">
                        {socio.documento}
                      </td>
                      <td className="py-4 px-6 font-bold text-white whitespace-nowrap">
                        {socio.nombre} {socio.apellido}
                        {socio.email && (
                          <span className="block text-[11px] font-normal text-gym-subtle">
                            {socio.email}
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-gym-muted whitespace-nowrap">
                        {socio.telefono || '—'}
                      </td>
                      <td className="py-4 px-6">
                        <EstadoSocioBadge estado={socio.estado} />
                      </td>
                      <td className="py-4 px-6 text-gym-muted whitespace-nowrap">
                        {formatearFecha(socio.fechaVencimiento)}
                      </td>
                      <td className="py-4 px-6 text-gym-muted whitespace-nowrap">
                        {socio.planVigente?.nombre ?? '—'}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => abrirEdicion(socio)}
                            title="Editar datos"
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-gym-muted hover:text-white hover:bg-gym-hover transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            Editar
                          </button>

                          {/* Dar de baja a quien ya está inactivo no hace nada. */}
                          {socio.estado !== 'INACTIVO' && (
                            <button
                              onClick={() => setSocioABajar(socio)}
                              title="Dar de baja (no borra nada)"
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-gym-muted hover:text-gym-red-400 hover:bg-gym-red-600/10 transition-colors"
                            >
                              <UserMinus className="w-3.5 h-3.5" />
                              Dar de baja
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {buscando ? (
              <p className="px-6 py-4 border-t border-gym-border bg-gym-dark/40 text-xs text-gym-muted">
                <span className="font-bold text-white">{socios.length}</span>{' '}
                {socios.length === 1 ? 'coincidencia' : 'coincidencias'} — la búsqueda del backend
                devuelve la lista completa, sin paginar.
              </p>
            ) : (
              listado.data && (
                <Paginador
                  pagina={listado.data.pagina}
                  totalPaginas={listado.data.totalPaginas}
                  totalElementos={listado.data.totalElementos}
                  onCambiar={setPagina}
                />
              )
            )}
          </>
        )}
      </div>

      {/* Los diálogos se montan cuando hacen falta: así el formulario nace con
          los datos del socio que se va a editar, sin reiniciarse con un efecto. */}
      {formularioAbierto && (
        <FormularioSocio
          socio={socioEnEdicion}
          onCerrar={() => setFormularioAbierto(false)}
          onSocioCreado={(alta) => {
            // El formulario se cierra y aparece el código de activación, que no
            // se puede volver a consultar nunca más.
            setFormularioAbierto(false);
            setAltaReciente(alta);
          }}
        />
      )}

      {altaReciente && (
        <AvisoCodigoActivacion alta={altaReciente} onCerrar={() => setAltaReciente(null)} />
      )}

      {socioABajar && <ConfirmarBaja socio={socioABajar} onCerrar={() => setSocioABajar(null)} />}
    </div>
  );
};
