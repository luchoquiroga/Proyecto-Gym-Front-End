import { useMutation } from '@tanstack/react-query';
import { loginSocio } from '../../auth/api';
import { registrarCuentaSocio } from './api';

/** Ninguna de las dos invalida cache: pasan antes de que haya sesión, y no hay nada leído todavía. */

export const useLoginSocio = () => useMutation({ mutationFn: loginSocio });

export const useRegistrarCuentaSocio = () => useMutation({ mutationFn: registrarCuentaSocio });
