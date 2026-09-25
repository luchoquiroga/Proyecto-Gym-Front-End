import axios from 'axios';
import { BASE_URL, TIMEOUT_MS } from '../api/config';
import { PORTALES } from './portales';
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
const sinInterceptor = axios.create({ baseURL: BASE_URL, withCredentials: true, timeout: TIMEOUT_MS });

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

/**
 * Revoca el refresh token del portal y borra su cookie. Es lo único que cierra
 * la sesión de verdad: la cookie es HttpOnly y solo el servidor la puede borrar.
 *
 * **No lleva `Authorization`, a propósito.** El endpoint es público y solo lee
 * la cookie. Hasta el 25/09, el filtro JWT del backend validaba cualquier Bearer
 * que llegara: con el access token vencido (más de 30 minutos sin usar la web)
 * respondía 401 antes de llegar al logout, la cookie sobrevivía, y el siguiente
 * que abría la web en esa PC entraba con la sesión anterior. El backend ya lo
 * arregló (B9), pero el logout no necesita el token, así que no se manda.
 *
 * Tira el error en vez de tragarlo: si falla, la sesión sigue viva en el
 * servidor y la pantalla no puede decir que se cerró.
 */
export async function logout(portal: TipoPortal): Promise<void> {
  try {
    await sinInterceptor.post(PORTALES[portal].logout, {});
  } catch (error) {
    throw normalizarError(error);
  }
}

/**
 * Cierra las dos sesiones que puede haber en este navegador, la de staff y la
 * de socio: conviven en cookies distintas, y cerrar solo la del portal activo
 * dejaría viva la otra (por ejemplo la de un empleado que no cerró sesión antes
 * de que un socio entrara a su portal en la misma PC). Sin cookie, el backend
 * responde 200 igual.
 */
export async function logoutDeTodo(): Promise<void> {
  await Promise.all([logout('staff'), logout('socio')]);
}
