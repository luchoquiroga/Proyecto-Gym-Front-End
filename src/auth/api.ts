import axios from 'axios';
import { BASE_URL } from '../api/config';
import { PORTALES } from './portales';
import { useSesion } from './sesion';
import { normalizarError } from '../lib/errores';
import type {
  CredencialesSocio,
  CredencialesStaff,
  LoginSocioResponse,
  LoginStaffResponse,
  Principal,
  TipoPortal,
} from './types';

export interface SesionIniciada {
  principal: Principal;
  accessToken: string;
}

/**
 * Las llamadas de auth usan axios "pelado", no la instancia con interceptores:
 * son las que establecen la sesión, así que no tienen que reintentarse contra
 * sí mismas si devuelven 401.
 */
const sinInterceptor = axios.create({ baseURL: BASE_URL, withCredentials: true });

export async function loginStaff(credenciales: CredencialesStaff): Promise<SesionIniciada> {
  try {
    const { data } = await sinInterceptor.post<LoginStaffResponse>(
      PORTALES.staff.login,
      credenciales,
    );
    return {
      accessToken: data.accessToken,
      principal: {
        tipo: 'staff',
        id: data.usuario.id,
        nombre: data.usuario.nombre,
        rol: data.usuario.rol,
      },
    };
  } catch (error) {
    throw normalizarError(error);
  }
}

export async function loginSocio(credenciales: CredencialesSocio): Promise<SesionIniciada> {
  try {
    const { data } = await sinInterceptor.post<LoginSocioResponse>(
      PORTALES.socio.login,
      credenciales,
    );
    return {
      accessToken: data.accessToken,
      principal: {
        tipo: 'socio',
        id: data.cliente.id,
        nombre: data.cliente.nombre,
        apellido: data.cliente.apellido,
      },
    };
  } catch (error) {
    throw normalizarError(error);
  }
}

/**
 * Silent refresh del portal indicado. Manda la cookie HttpOnly y no lleva
 * Authorization: el access token viejo puede estar vencido, es indistinto.
 *
 * Ojo: `/refresh` ROTA el refresh token, así que dos refresh en paralelo con la
 * misma cookie hacen fallar al segundo. Por eso el interceptor tiene cola.
 */
export async function refrescarSesion(portal: TipoPortal): Promise<SesionIniciada> {
  const { data } = await sinInterceptor.post(PORTALES[portal].refresh, {});

  if (portal === 'staff') {
    const respuesta = data as LoginStaffResponse;
    return {
      accessToken: respuesta.accessToken,
      principal: {
        tipo: 'staff',
        id: respuesta.usuario.id,
        nombre: respuesta.usuario.nombre,
        rol: respuesta.usuario.rol,
      },
    };
  }

  const respuesta = data as LoginSocioResponse;
  return {
    accessToken: respuesta.accessToken,
    principal: {
      tipo: 'socio',
      id: respuesta.cliente.id,
      nombre: respuesta.cliente.nombre,
      apellido: respuesta.cliente.apellido,
    },
  };
}

/** Cierra la sesión del lado del backend (invalida la cookie). */
export async function logout(portal: TipoPortal): Promise<void> {
  const token = useSesion.getState().accessToken;
  try {
    await sinInterceptor.post(
      PORTALES[portal].logout,
      {},
      token ? { headers: { Authorization: `Bearer ${token}` } } : undefined,
    );
  } catch {
    // Si el token ya venció, la cookie igual se invalida del lado del server o
    // ya no sirve. No tiene sentido bloquear el logout del usuario por esto.
  }
}
