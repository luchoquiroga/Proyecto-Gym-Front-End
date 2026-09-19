/** `/planes` (CONTRATO-API §3). La duración está en DÍAS y define el vencimiento del pago. */
export interface Plan {
  id: number;
  nombre: string;
  precio: number;
  duracion: number;
}
