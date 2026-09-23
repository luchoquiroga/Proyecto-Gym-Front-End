/** Registro del portal del socio (CONTRATO-API §3, "Socios — /clientes"). */

/**
 * `POST /clientes/registro`, público. El socio reclama la ficha que el staff le
 * cargó, identificándose con el código de activación que le dieron en persona
 * (no con nombre y teléfono: eso se cerró por ser adivinable).
 */
export interface RegistroSocioRequest {
  codigoActivacion: string;
  email: string;
  contrasena: string;
}

/** El registro NO inicia sesión: responde solo un mensaje y hay que loguearse después. */
export interface MensajeResponse {
  mensaje: string;
}
