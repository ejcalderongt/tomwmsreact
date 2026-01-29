export type ConditionType = 
  | 'stock_bajo'
  | 'producto_por_vencer'
  | 'producto_vencido'
  | 'picking_lento'
  | 'merma_alta'
  | 'sin_movimiento';

export type ActionType = 
  | 'alerta_dashboard'
  | 'alerta_critica'
  | 'generar_reporte'
  | 'marcar_prioritario';

export type FrequencyType = 
  | 'tiempo_real'
  | 'cada_hora'
  | 'diaria'
  | 'semanal';

export interface RuleCondition {
  type: ConditionType;
  operator: 'menor_que' | 'mayor_que' | 'igual_a' | 'entre';
  value: number;
  value2?: number;
  unit?: string;
}

export interface RuleAction {
  type: ActionType;
  params?: {
    mensaje?: string;
    prioridad?: 'baja' | 'media' | 'alta' | 'critica';
    destinatarios?: string[];
  };
}

export interface AutomationRule {
  id: string;
  nombre: string;
  descripcion: string;
  condicion: RuleCondition;
  accion: RuleAction;
  frecuencia: FrequencyType;
  activa: boolean;
  creadaEn: string;
  ultimaEjecucion?: string;
  vecesEjecutada: number;
}

export interface Alert {
  id: string;
  reglaId: string;
  reglaNombre: string;
  tipo: 'info' | 'warning' | 'error' | 'critical';
  mensaje: string;
  detalles?: string;
  creadaEn: string;
  leida: boolean;
  datos?: Record<string, any>;
}

export interface AutomationStats {
  totalReglas: number;
  reglasActivas: number;
  alertasHoy: number;
  alertasSinLeer: number;
}

export const CONDITION_LABELS: Record<ConditionType, string> = {
  stock_bajo: 'Stock bajo mínimo',
  producto_por_vencer: 'Producto por vencer',
  producto_vencido: 'Producto vencido',
  picking_lento: 'Picking lento',
  merma_alta: 'Merma alta',
  sin_movimiento: 'Sin movimiento'
};

export const CONDITION_DESCRIPTIONS: Record<ConditionType, string> = {
  stock_bajo: 'Cuando el stock de un producto está por debajo de X unidades',
  producto_por_vencer: 'Cuando un producto vence en menos de X días',
  producto_vencido: 'Cuando se detectan productos ya vencidos',
  picking_lento: 'Cuando un picking toma más de X minutos',
  merma_alta: 'Cuando la merma supera X unidades en el período',
  sin_movimiento: 'Cuando un producto no tiene movimiento en X días'
};

export const ACTION_LABELS: Record<ActionType, string> = {
  alerta_dashboard: 'Mostrar alerta en dashboard',
  alerta_critica: 'Alerta crítica (destacada)',
  generar_reporte: 'Generar reporte automático',
  marcar_prioritario: 'Marcar como prioritario'
};

export const FREQUENCY_LABELS: Record<FrequencyType, string> = {
  tiempo_real: 'Tiempo real',
  cada_hora: 'Cada hora',
  diaria: 'Diaria (8:00 AM)',
  semanal: 'Semanal (Lunes 8:00 AM)'
};

export const CONDITION_UNITS: Record<ConditionType, string> = {
  stock_bajo: 'unidades',
  producto_por_vencer: 'días',
  producto_vencido: 'productos',
  picking_lento: 'minutos',
  merma_alta: 'unidades',
  sin_movimiento: 'días'
};
