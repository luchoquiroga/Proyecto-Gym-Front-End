import { useMutation } from '@tanstack/react-query';
import { cambiarContrasenaPropia } from './api';

/** No invalida nada: ningún dato en pantalla depende de la contraseña. Lo que sigue es cerrar la sesión. */
export const useCambiarContrasena = () => useMutation({ mutationFn: cambiarContrasenaPropia });
