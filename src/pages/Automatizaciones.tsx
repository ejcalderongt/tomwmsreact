import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { 
  BoltIcon, 
  PlusIcon, 
  PlayIcon, 
  PauseIcon,
  PencilIcon,
  TrashIcon,
  BellAlertIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  CogIcon
} from '@heroicons/react/24/outline';
import { BellIcon } from '@heroicons/react/24/solid';
import toast from 'react-hot-toast';
import { getToken } from '@/utils/auth';
import { automationService } from '@/services/automationService';
import { ruleEngine } from '@/services/ruleEngine';
import { 
  AutomationRule, 
  Alert,
  AutomationStats,
  CONDITION_LABELS,
  ACTION_LABELS,
  FREQUENCY_LABELS,
  ConditionType,
  ActionType,
  FrequencyType,
  CONDITION_DESCRIPTIONS,
  CONDITION_UNITS
} from '@/types/automation';

export default function Automatizaciones() {
  const navigate = useNavigate();
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [stats, setStats] = useState<AutomationStats | null>(null);
  const [activeTab, setActiveTab] = useState<'reglas' | 'alertas'>('reglas');
  const [showModal, setShowModal] = useState(false);
  const [editingRule, setEditingRule] = useState<AutomationRule | null>(null);
  const [evaluating, setEvaluating] = useState(false);
  
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    condicionTipo: 'stock_bajo' as ConditionType,
    condicionOperador: 'menor_que' as 'menor_que' | 'mayor_que' | 'igual_a' | 'entre',
    condicionValor: 10,
    accionTipo: 'alerta_dashboard' as ActionType,
    accionPrioridad: 'media' as 'baja' | 'media' | 'alta' | 'critica',
    accionMensaje: '',
    frecuencia: 'diaria' as FrequencyType
  });

  const handleEvaluateRules = async () => {
    setEvaluating(true);
    try {
      const result = await ruleEngine.evaluateRules();
      if (result.alertasGeneradas > 0) {
        toast.success(`${result.alertasGeneradas} alerta(s) generada(s)`);
        setActiveTab('alertas');
      } else {
        toast.success(`${result.reglasEvaluadas} regla(s) evaluada(s), sin alertas nuevas`);
      }
      loadData();
    } catch (error) {
      console.error('Error evaluating rules:', error);
      toast.error('Error al evaluar reglas');
    } finally {
      setEvaluating(false);
    }
  };

  useEffect(() => {
    const token = getToken();
    if (!token) {
      navigate('/login');
      return;
    }
    loadData();
  }, []);

  const loadData = () => {
    setRules(automationService.getRules());
    setAlerts(automationService.getAlerts());
    setStats(automationService.getStats());
  };

  const handleToggleRule = (id: string) => {
    const updated = automationService.toggleRule(id);
    if (updated) {
      toast.success(updated.activa ? 'Regla activada' : 'Regla desactivada');
      loadData();
    }
  };

  const handleDeleteRule = (id: string) => {
    if (confirm('¿Estás seguro de eliminar esta regla?')) {
      automationService.deleteRule(id);
      toast.success('Regla eliminada');
      loadData();
    }
  };

  const handleEditRule = (rule: AutomationRule) => {
    setEditingRule(rule);
    setFormData({
      nombre: rule.nombre,
      descripcion: rule.descripcion,
      condicionTipo: rule.condicion.type,
      condicionOperador: rule.condicion.operator,
      condicionValor: rule.condicion.value,
      accionTipo: rule.accion.type,
      accionPrioridad: rule.accion.params?.prioridad || 'media',
      accionMensaje: rule.accion.params?.mensaje || '',
      frecuencia: rule.frecuencia
    });
    setShowModal(true);
  };

  const handleNewRule = () => {
    setEditingRule(null);
    setFormData({
      nombre: '',
      descripcion: '',
      condicionTipo: 'stock_bajo',
      condicionOperador: 'menor_que',
      condicionValor: 10,
      accionTipo: 'alerta_dashboard',
      accionPrioridad: 'media',
      accionMensaje: '',
      frecuencia: 'diaria'
    });
    setShowModal(true);
  };

  const handleSaveRule = () => {
    if (!formData.nombre.trim()) {
      toast.error('El nombre es requerido');
      return;
    }

    const ruleData = {
      nombre: formData.nombre,
      descripcion: formData.descripcion,
      condicion: {
        type: formData.condicionTipo,
        operator: formData.condicionOperador,
        value: formData.condicionValor,
        unit: CONDITION_UNITS[formData.condicionTipo]
      },
      accion: {
        type: formData.accionTipo,
        params: {
          prioridad: formData.accionPrioridad,
          mensaje: formData.accionMensaje || CONDITION_LABELS[formData.condicionTipo]
        }
      },
      frecuencia: formData.frecuencia,
      activa: editingRule?.activa ?? true
    };

    if (editingRule) {
      automationService.updateRule(editingRule.id, ruleData);
      toast.success('Regla actualizada');
    } else {
      automationService.addRule(ruleData);
      toast.success('Regla creada');
    }

    setShowModal(false);
    loadData();
  };

  const handleMarkAlertRead = (id: string) => {
    automationService.markAlertAsRead(id);
    loadData();
  };

  const handleMarkAllRead = () => {
    automationService.markAllAlertsAsRead();
    toast.success('Todas las alertas marcadas como leídas');
    loadData();
  };

  const handleDeleteAlert = (id: string) => {
    automationService.deleteAlert(id);
    loadData();
  };

  const getAlertIcon = (tipo: Alert['tipo']) => {
    switch (tipo) {
      case 'critical':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
      case 'error':
        return <ExclamationTriangleIcon className="h-5 w-5 text-orange-500" />;
      case 'warning':
        return <BellAlertIcon className="h-5 w-5 text-yellow-500" />;
      default:
        return <BellIcon className="h-5 w-5 text-blue-500" />;
    }
  };

  const getAlertBgColor = (tipo: Alert['tipo'], leida: boolean) => {
    if (leida) return 'bg-gray-50';
    switch (tipo) {
      case 'critical':
        return 'bg-red-50 border-l-4 border-red-500';
      case 'error':
        return 'bg-orange-50 border-l-4 border-orange-500';
      case 'warning':
        return 'bg-yellow-50 border-l-4 border-yellow-500';
      default:
        return 'bg-blue-50 border-l-4 border-blue-500';
    }
  };

  return (
    <Layout pageTitle="Automatizaciones">
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <BoltIcon className="h-10 w-10 mr-4" />
              <div>
                <h1 className="text-2xl font-bold">Centro de Automatizaciones</h1>
                <p className="text-indigo-100">Configura reglas inteligentes para optimizar tus operaciones</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleEvaluateRules}
                disabled={evaluating}
                className="flex items-center px-4 py-2 bg-indigo-800 text-white rounded-lg font-medium hover:bg-indigo-900 transition-colors disabled:opacity-50"
              >
                <PlayIcon className={`h-5 w-5 mr-2 ${evaluating ? 'animate-pulse' : ''}`} />
                {evaluating ? 'Evaluando...' : 'Evaluar Ahora'}
              </button>
              <button
                onClick={handleNewRule}
                className="flex items-center px-4 py-2 bg-white text-indigo-600 rounded-lg font-medium hover:bg-indigo-50 transition-colors"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Nueva Regla
              </button>
            </div>
          </div>
        </div>

        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <CogIcon className="h-5 w-5 text-indigo-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-gray-500">Total Reglas</p>
                  <p className="text-xl font-bold text-gray-900">{stats.totalReglas}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircleIcon className="h-5 w-5 text-green-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-gray-500">Reglas Activas</p>
                  <p className="text-xl font-bold text-gray-900">{stats.reglasActivas}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <BellAlertIcon className="h-5 w-5 text-yellow-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-gray-500">Alertas Hoy</p>
                  <p className="text-xl font-bold text-gray-900">{stats.alertasHoy}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <BellIcon className="h-5 w-5 text-red-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-gray-500">Sin Leer</p>
                  <p className="text-xl font-bold text-gray-900">{stats.alertasSinLeer}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm border">
          <div className="border-b">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('reglas')}
                className={`px-6 py-4 text-sm font-medium border-b-2 ${
                  activeTab === 'reglas'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <CogIcon className="h-5 w-5 inline mr-2" />
                Reglas ({rules.length})
              </button>
              <button
                onClick={() => setActiveTab('alertas')}
                className={`px-6 py-4 text-sm font-medium border-b-2 ${
                  activeTab === 'alertas'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <BellAlertIcon className="h-5 w-5 inline mr-2" />
                Alertas ({alerts.length})
                {stats && stats.alertasSinLeer > 0 && (
                  <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                    {stats.alertasSinLeer}
                  </span>
                )}
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'reglas' && (
              <div className="space-y-4">
                {rules.length === 0 ? (
                  <div className="text-center py-12">
                    <BoltIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No hay reglas configuradas</p>
                    <button
                      onClick={handleNewRule}
                      className="mt-4 text-indigo-600 hover:text-indigo-800 font-medium"
                    >
                      Crear primera regla
                    </button>
                  </div>
                ) : (
                  rules.map(rule => (
                    <div
                      key={rule.id}
                      className={`border rounded-lg p-4 ${rule.activa ? 'bg-white' : 'bg-gray-50 opacity-75'}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center">
                            <h3 className="text-lg font-medium text-gray-900">{rule.nombre}</h3>
                            <span className={`ml-3 px-2 py-0.5 text-xs rounded-full ${
                              rule.activa ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'
                            }`}>
                              {rule.activa ? 'Activa' : 'Inactiva'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 mt-1">{rule.descripcion}</p>
                          
                          <div className="mt-3 flex flex-wrap gap-2">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                              SI: {CONDITION_LABELS[rule.condicion.type]} {rule.condicion.operator.replace('_', ' ')} {rule.condicion.value} {rule.condicion.unit}
                            </span>
                            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-purple-100 text-purple-800">
                              ENTONCES: {ACTION_LABELS[rule.accion.type]}
                            </span>
                            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
                              <ClockIcon className="h-3 w-3 mr-1" />
                              {FREQUENCY_LABELS[rule.frecuencia]}
                            </span>
                          </div>

                          {rule.ultimaEjecucion && (
                            <p className="text-xs text-gray-400 mt-2">
                              Última ejecución: {new Date(rule.ultimaEjecucion).toLocaleString('es-ES')} 
                              ({rule.vecesEjecutada} veces)
                            </p>
                          )}
                        </div>

                        <div className="flex items-center space-x-2 ml-4">
                          <button
                            onClick={() => handleToggleRule(rule.id)}
                            className={`p-2 rounded-lg ${
                              rule.activa 
                                ? 'text-yellow-600 hover:bg-yellow-50' 
                                : 'text-green-600 hover:bg-green-50'
                            }`}
                            title={rule.activa ? 'Pausar' : 'Activar'}
                          >
                            {rule.activa ? <PauseIcon className="h-5 w-5" /> : <PlayIcon className="h-5 w-5" />}
                          </button>
                          <button
                            onClick={() => handleEditRule(rule)}
                            className="p-2 rounded-lg text-gray-600 hover:bg-gray-100"
                            title="Editar"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteRule(rule.id)}
                            className="p-2 rounded-lg text-red-600 hover:bg-red-50"
                            title="Eliminar"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'alertas' && (
              <div className="space-y-4">
                {alerts.length > 0 && (
                  <div className="flex justify-end">
                    <button
                      onClick={handleMarkAllRead}
                      className="text-sm text-indigo-600 hover:text-indigo-800"
                    >
                      Marcar todas como leídas
                    </button>
                  </div>
                )}

                {alerts.length === 0 ? (
                  <div className="text-center py-12">
                    <BellAlertIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No hay alertas</p>
                    <p className="text-sm text-gray-400 mt-1">Las alertas aparecerán aquí cuando se activen las reglas</p>
                  </div>
                ) : (
                  alerts.slice(0, 20).map(alert => (
                    <div
                      key={alert.id}
                      className={`rounded-lg p-4 ${getAlertBgColor(alert.tipo, alert.leida)}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start">
                          {getAlertIcon(alert.tipo)}
                          <div className="ml-3">
                            <p className={`text-sm font-medium ${alert.leida ? 'text-gray-600' : 'text-gray-900'}`}>
                              {alert.mensaje}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              Regla: {alert.reglaNombre} • {new Date(alert.creadaEn).toLocaleString('es-ES')}
                            </p>
                            {alert.detalles && (
                              <p className="text-sm text-gray-600 mt-2">{alert.detalles}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {!alert.leida && (
                            <button
                              onClick={() => handleMarkAlertRead(alert.id)}
                              className="text-xs text-indigo-600 hover:text-indigo-800"
                            >
                              Marcar leída
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteAlert(alert.id)}
                            className="p-1 text-gray-400 hover:text-red-500"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b bg-gradient-to-r from-indigo-600 to-purple-600 rounded-t-xl">
                <h2 className="text-xl font-bold text-white">
                  {editingRule ? 'Editar Regla' : 'Nueva Regla de Automatización'}
                </h2>
              </div>

              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre de la Regla *
                  </label>
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Ej: Alerta de stock crítico"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descripción
                  </label>
                  <textarea
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    rows={2}
                    placeholder="Describe qué hace esta regla..."
                  />
                </div>

                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="font-medium text-blue-900 mb-3 flex items-center">
                    <span className="bg-blue-600 text-white px-2 py-0.5 rounded text-sm mr-2">SI</span>
                    Condición
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Tipo de condición</label>
                      <select
                        value={formData.condicionTipo}
                        onChange={(e) => setFormData({ ...formData, condicionTipo: e.target.value as ConditionType })}
                        className="w-full px-3 py-2 border rounded-lg"
                      >
                        {Object.entries(CONDITION_LABELS).map(([key, label]) => (
                          <option key={key} value={key}>{label}</option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-500 mt-1">
                        {CONDITION_DESCRIPTIONS[formData.condicionTipo]}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Valor</label>
                      <div className="flex items-center">
                        <select
                          value={formData.condicionOperador}
                          onChange={(e) => setFormData({ ...formData, condicionOperador: e.target.value as any })}
                          className="px-3 py-2 border rounded-l-lg"
                        >
                          <option value="menor_que">menor que</option>
                          <option value="mayor_que">mayor que</option>
                          <option value="igual_a">igual a</option>
                        </select>
                        <input
                          type="number"
                          value={formData.condicionValor}
                          onChange={(e) => setFormData({ ...formData, condicionValor: parseInt(e.target.value) || 0 })}
                          className="w-24 px-3 py-2 border-t border-b"
                        />
                        <span className="px-3 py-2 bg-gray-100 border rounded-r-lg text-sm text-gray-600">
                          {CONDITION_UNITS[formData.condicionTipo]}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-purple-50 rounded-lg p-4">
                  <h3 className="font-medium text-purple-900 mb-3 flex items-center">
                    <span className="bg-purple-600 text-white px-2 py-0.5 rounded text-sm mr-2">ENTONCES</span>
                    Acción
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Tipo de acción</label>
                      <select
                        value={formData.accionTipo}
                        onChange={(e) => setFormData({ ...formData, accionTipo: e.target.value as ActionType })}
                        className="w-full px-3 py-2 border rounded-lg"
                      >
                        {Object.entries(ACTION_LABELS).map(([key, label]) => (
                          <option key={key} value={key}>{label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Prioridad</label>
                      <select
                        value={formData.accionPrioridad}
                        onChange={(e) => setFormData({ ...formData, accionPrioridad: e.target.value as any })}
                        className="w-full px-3 py-2 border rounded-lg"
                      >
                        <option value="baja">Baja</option>
                        <option value="media">Media</option>
                        <option value="alta">Alta</option>
                        <option value="critica">Crítica</option>
                      </select>
                    </div>
                  </div>
                  <div className="mt-3">
                    <label className="block text-sm text-gray-600 mb-1">Mensaje personalizado</label>
                    <input
                      type="text"
                      value={formData.accionMensaje}
                      onChange={(e) => setFormData({ ...formData, accionMensaje: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="Mensaje que aparecerá en la alerta..."
                    />
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                    <ClockIcon className="h-5 w-5 mr-2 text-gray-600" />
                    Frecuencia de Evaluación
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {Object.entries(FREQUENCY_LABELS).map(([key, label]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setFormData({ ...formData, frecuencia: key as FrequencyType })}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          formData.frecuencia === key
                            ? 'bg-indigo-600 text-white'
                            : 'bg-white border text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-6 border-t bg-gray-50 rounded-b-xl flex justify-end space-x-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveRule}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  {editingRule ? 'Guardar Cambios' : 'Crear Regla'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
