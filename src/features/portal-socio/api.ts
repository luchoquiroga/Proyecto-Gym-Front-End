import api from '../../api/axios';
import type { MensajeResponse, RegistroSocioRequest } from './types';

/**
 * Canjea el código de activación por una cuenta del portal. El código es de un
 * solo uso: después de esto el backend lo borra.
 *
 * Los rechazos son todos 400 con `mensaje` (código inválido o ya usado, cuenta
 * ya registrada, email de otro socio), no 409: se muestran tal cual.
 */
export const registrarCuentaSocio = (datos: RegistroSocioRequest) =>
  api.post<MensajeResponse>('/api/v1/clientes/registro', datos).then((r) => r.data);
