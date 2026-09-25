import { QueryClient } from '@tanstack/react-query';

/**
 * Cache del estado del servidor. Vive en su propio módulo y no en `App.tsx`
 * porque la sesión lo tiene que poder vaciar (`auth/sesion.ts`): en la PC del
 * mostrador, lo que leyó una persona no tiene que quedarle a la siguiente.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      // Un 401 lo resuelve el interceptor con el refresh; reintentar de más solo
      // retrasa el mensaje de error cuando el backend está caído de verdad.
      retry: 1,
    },
  },
});
