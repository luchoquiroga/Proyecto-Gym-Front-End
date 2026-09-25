/** `/planes` (CONTRATO-API §3). La duración está en DÍAS y define el vencimiento del pago. */
export interface Plan {
  id: number;
  nombre: string;
  precio: number;
  duracion: number;
}

/** Cuerpo de `POST /planes` y `PUT /planes/{id}`. */
export type PlanRequest = Omit<Plan, 'id'>;
