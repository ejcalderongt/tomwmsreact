import { AutomationRule, Alert } from '@/types/automation';
import { automationService } from './automationService';
import { kpiAPI } from '@/api/api';

interface EvaluationContext {
  stockData: any[];
  productosVencidos: number;
  productosPorVencer: any[];
  productosStockBajo: any[];
  productosSinMovimiento: any[];
}

export const ruleEngine = {
  async evaluateRules(): Promise<{ alertasGeneradas: number; reglasEvaluadas: number }> {
    const rules = automationService.getRules().filter(r => r.activa);
    if (rules.length === 0) {
      return { alertasGeneradas: 0, reglasEvaluadas: 0 };
    }

    const context = await this.buildContext();
    let alertasGeneradas = 0;

    for (const rule of rules) {
      const result = await this.evaluateRule(rule, context);
      if (result.triggered) {
        this.createAlert(rule, result);
        alertasGeneradas++;
        
        automationService.updateRule(rule.id, {
          ultimaEjecucion: new Date().toISOString(),
          vecesEjecutada: rule.vecesEjecutada + 1
        });
      }
    }

    return { alertasGeneradas, reglasEvaluadas: rules.length };
  },

  async buildContext(): Promise<EvaluationContext> {
    try {
      const stockData = await kpiAPI.getStock();
      const hoy = new Date();
      const en30Dias = new Date();
      en30Dias.setDate(en30Dias.getDate() + 30);

      const productosVencidos = stockData.filter((item: any) => {
        if (!item.fecha_vence) return false;
        const fechaVence = new Date(item.fecha_vence);
        return fechaVence < hoy;
      });

      const productosPorVencer = stockData.filter((item: any) => {
        if (!item.fecha_vence) return false;
        const fechaVence = new Date(item.fecha_vence);
        return fechaVence >= hoy && fechaVence <= en30Dias;
      });

      const productosStockBajo = stockData.filter((item: any) => {
        return (item.disponible_UMBas || 0) < 10;
      });

      return {
        stockData,
        productosVencidos: productosVencidos.length,
        productosPorVencer,
        productosStockBajo,
        productosSinMovimiento: []
      };
    } catch (error) {
      console.error('Error building context:', error);
      return {
        stockData: [],
        productosVencidos: 0,
        productosPorVencer: [],
        productosStockBajo: [],
        productosSinMovimiento: []
      };
    }
  },

  evaluateRule(rule: AutomationRule, context: EvaluationContext): { triggered: boolean; details?: string; data?: any } {
    const { condicion } = rule;
    const { type, operator, value } = condicion;

    switch (type) {
      case 'stock_bajo': {
        const productos = context.productosStockBajo.filter((p: any) => {
          const stock = p.disponible_UMBas || 0;
          return this.compareValue(stock, operator, value);
        });
        if (productos.length > 0) {
          return {
            triggered: true,
            details: `${productos.length} productos con stock bajo (< ${value} unidades)`,
            data: { productos: productos.slice(0, 5).map((p: any) => p.nombre) }
          };
        }
        break;
      }

      case 'producto_por_vencer': {
        const hoy = new Date();
        const limite = new Date();
        limite.setDate(limite.getDate() + value);
        
        const productos = context.stockData.filter((item: any) => {
          if (!item.fecha_vence) return false;
          const fechaVence = new Date(item.fecha_vence);
          return fechaVence >= hoy && fechaVence <= limite;
        });

        if (productos.length > 0) {
          return {
            triggered: true,
            details: `${productos.length} productos vencen en los próximos ${value} días`,
            data: { productos: productos.slice(0, 5).map((p: any) => `${p.nombre} (${new Date(p.fecha_vence).toLocaleDateString('es-ES')})`) }
          };
        }
        break;
      }

      case 'producto_vencido': {
        if (context.productosVencidos > value) {
          return {
            triggered: true,
            details: `${context.productosVencidos} productos vencidos en inventario`,
            data: { cantidad: context.productosVencidos }
          };
        }
        break;
      }

      case 'merma_alta': {
        const merma = context.stockData.filter((item: any) => 
          (item.ubicacion || '').toUpperCase().includes('MERMA')
        );
        const totalMerma = merma.reduce((sum: number, item: any) => sum + (item.disponible_UMBas || 0), 0);
        
        if (this.compareValue(totalMerma, operator, value)) {
          return {
            triggered: true,
            details: `Merma alta detectada: ${totalMerma} unidades`,
            data: { totalMerma }
          };
        }
        break;
      }

      default:
        break;
    }

    return { triggered: false };
  },

  compareValue(actual: number, operator: string, expected: number): boolean {
    switch (operator) {
      case 'menor_que':
        return actual < expected;
      case 'mayor_que':
        return actual > expected;
      case 'igual_a':
        return actual === expected;
      default:
        return false;
    }
  },

  createAlert(rule: AutomationRule, result: { triggered: boolean; details?: string; data?: any }) {
    const tipoAlerta = rule.accion.type === 'alerta_critica' ? 'critical' 
      : rule.accion.params?.prioridad === 'alta' ? 'error'
      : rule.accion.params?.prioridad === 'media' ? 'warning'
      : 'info';

    automationService.addAlert({
      reglaId: rule.id,
      reglaNombre: rule.nombre,
      tipo: tipoAlerta,
      mensaje: rule.accion.params?.mensaje || rule.nombre,
      detalles: result.details,
      datos: result.data
    });
  },

  shouldEvaluateNow(rule: AutomationRule): boolean {
    if (!rule.ultimaEjecucion) return true;

    const ultima = new Date(rule.ultimaEjecucion);
    const ahora = new Date();
    const diffMs = ahora.getTime() - ultima.getTime();
    const diffHoras = diffMs / (1000 * 60 * 60);

    switch (rule.frecuencia) {
      case 'tiempo_real':
        return diffHoras >= 0.25;
      case 'cada_hora':
        return diffHoras >= 1;
      case 'diaria':
        return diffHoras >= 24;
      case 'semanal':
        return diffHoras >= 168;
      default:
        return true;
    }
  }
};
