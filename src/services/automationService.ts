import { AutomationRule, Alert, AutomationStats } from '@/types/automation';

const RULES_KEY = 'tom_automation_rules';
const ALERTS_KEY = 'tom_automation_alerts';

export const automationService = {
  getRules(): AutomationRule[] {
    const stored = localStorage.getItem(RULES_KEY);
    if (!stored) return this.getDefaultRules();
    try {
      return JSON.parse(stored);
    } catch {
      return this.getDefaultRules();
    }
  },

  saveRules(rules: AutomationRule[]): void {
    localStorage.setItem(RULES_KEY, JSON.stringify(rules));
  },

  addRule(rule: Omit<AutomationRule, 'id' | 'creadaEn' | 'vecesEjecutada'>): AutomationRule {
    const rules = this.getRules();
    const newRule: AutomationRule = {
      ...rule,
      id: `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      creadaEn: new Date().toISOString(),
      vecesEjecutada: 0
    };
    rules.push(newRule);
    this.saveRules(rules);
    return newRule;
  },

  updateRule(id: string, updates: Partial<AutomationRule>): AutomationRule | null {
    const rules = this.getRules();
    const index = rules.findIndex(r => r.id === id);
    if (index === -1) return null;
    rules[index] = { ...rules[index], ...updates };
    this.saveRules(rules);
    return rules[index];
  },

  deleteRule(id: string): boolean {
    const rules = this.getRules();
    const filtered = rules.filter(r => r.id !== id);
    if (filtered.length === rules.length) return false;
    this.saveRules(filtered);
    return true;
  },

  toggleRule(id: string): AutomationRule | null {
    const rules = this.getRules();
    const rule = rules.find(r => r.id === id);
    if (!rule) return null;
    rule.activa = !rule.activa;
    this.saveRules(rules);
    return rule;
  },

  getAlerts(): Alert[] {
    const stored = localStorage.getItem(ALERTS_KEY);
    if (!stored) return [];
    try {
      return JSON.parse(stored);
    } catch {
      return [];
    }
  },

  saveAlerts(alerts: Alert[]): void {
    localStorage.setItem(ALERTS_KEY, JSON.stringify(alerts));
  },

  addAlert(alert: Omit<Alert, 'id' | 'creadaEn' | 'leida'>): Alert {
    const alerts = this.getAlerts();
    const newAlert: Alert = {
      ...alert,
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      creadaEn: new Date().toISOString(),
      leida: false
    };
    alerts.unshift(newAlert);
    if (alerts.length > 100) {
      alerts.splice(100);
    }
    this.saveAlerts(alerts);
    return newAlert;
  },

  markAlertAsRead(id: string): void {
    const alerts = this.getAlerts();
    const alert = alerts.find(a => a.id === id);
    if (alert) {
      alert.leida = true;
      this.saveAlerts(alerts);
    }
  },

  markAllAlertsAsRead(): void {
    const alerts = this.getAlerts();
    alerts.forEach(a => a.leida = true);
    this.saveAlerts(alerts);
  },

  deleteAlert(id: string): void {
    const alerts = this.getAlerts().filter(a => a.id !== id);
    this.saveAlerts(alerts);
  },

  clearOldAlerts(daysOld: number = 7): void {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - daysOld);
    const alerts = this.getAlerts().filter(a => new Date(a.creadaEn) > cutoff);
    this.saveAlerts(alerts);
  },

  getStats(): AutomationStats {
    const rules = this.getRules();
    const alerts = this.getAlerts();
    const today = new Date().toDateString();
    
    return {
      totalReglas: rules.length,
      reglasActivas: rules.filter(r => r.activa).length,
      alertasHoy: alerts.filter(a => new Date(a.creadaEn).toDateString() === today).length,
      alertasSinLeer: alerts.filter(a => !a.leida).length
    };
  },

  getDefaultRules(): AutomationRule[] {
    return [
      {
        id: 'default_1',
        nombre: 'Alerta de Stock Bajo',
        descripcion: 'Notifica cuando un producto tiene menos de 10 unidades',
        condicion: {
          type: 'stock_bajo',
          operator: 'menor_que',
          value: 10,
          unit: 'unidades'
        },
        accion: {
          type: 'alerta_dashboard',
          params: {
            prioridad: 'media',
            mensaje: 'Stock bajo detectado'
          }
        },
        frecuencia: 'diaria',
        activa: true,
        creadaEn: new Date().toISOString(),
        vecesEjecutada: 0
      },
      {
        id: 'default_2',
        nombre: 'Productos por Vencer',
        descripcion: 'Alerta cuando productos vencen en menos de 30 días',
        condicion: {
          type: 'producto_por_vencer',
          operator: 'menor_que',
          value: 30,
          unit: 'días'
        },
        accion: {
          type: 'alerta_critica',
          params: {
            prioridad: 'alta',
            mensaje: 'Productos próximos a vencer'
          }
        },
        frecuencia: 'diaria',
        activa: true,
        creadaEn: new Date().toISOString(),
        vecesEjecutada: 0
      },
      {
        id: 'default_3',
        nombre: 'Productos Vencidos',
        descripcion: 'Alerta crítica cuando hay productos ya vencidos',
        condicion: {
          type: 'producto_vencido',
          operator: 'mayor_que',
          value: 0,
          unit: 'productos'
        },
        accion: {
          type: 'alerta_critica',
          params: {
            prioridad: 'critica',
            mensaje: 'URGENTE: Productos vencidos en inventario'
          }
        },
        frecuencia: 'tiempo_real',
        activa: true,
        creadaEn: new Date().toISOString(),
        vecesEjecutada: 0
      }
    ];
  }
};
