import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { 
  PaperAirplaneIcon, 
  ArrowPathIcon,
  SparklesIcon,
  UserIcon,
  CpuChipIcon,
  TrashIcon,
  LightBulbIcon,
  BookOpenIcon,
  PencilSquareIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { kpiAPI } from '@/api/api';
import { getToken } from '@/utils/auth';
import { KNOWLEDGE_BASE } from '@/data/knowledge-base';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface InventoryStats {
  totalSKUs: number;
  totalUnidades: number;
  totalBodegas: number;
  ubicaciones: string[];
  productosVencidos: number;
  productosPorVencer: number;
}

const DEFAULT_KNOWLEDGE_BASE = KNOWLEDGE_BASE;

const SUGERENCIAS = [
  "¿Cuántos productos tengo en inventario?",
  "¿Qué productos están próximos a vencer?",
  "¿Cuál es la distribución por ubicación?",
  "Dame un resumen del estado del inventario",
  "¿Cuántos productos están en RECEPCIÓN?",
  "¿Cuáles son los productos con más stock?"
];

export default function AsistenteInventario() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [inventoryStats, setInventoryStats] = useState<InventoryStats | null>(null);
  const [inventoryContext, setInventoryContext] = useState<string>('');
  const [loadingInventory, setLoadingInventory] = useState(true);
  const [knowledgeBase, setKnowledgeBase] = useState<string>(() => {
    const saved = localStorage.getItem('kairos_knowledge_base');
    return saved || DEFAULT_KNOWLEDGE_BASE;
  });
  const [showKnowledgeEditor, setShowKnowledgeEditor] = useState(false);
  const [editingKnowledge, setEditingKnowledge] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      navigate('/login');
      return;
    }
    cargarInventario();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const cargarInventario = async () => {
    setLoadingInventory(true);
    try {
      const [stockData, bodegasData] = await Promise.all([
        kpiAPI.getStock(),
        kpiAPI.getBodegas()
      ]);

      const hoy = new Date();
      const en30Dias = new Date();
      en30Dias.setDate(en30Dias.getDate() + 30);

      const productosVencidos = stockData.filter((item: any) => {
        if (!item.fecha_vence) return false;
        const fechaVence = new Date(item.fecha_vence);
        return fechaVence < hoy;
      }).length;

      const productosPorVencer = stockData.filter((item: any) => {
        if (!item.fecha_vence) return false;
        const fechaVence = new Date(item.fecha_vence);
        return fechaVence >= hoy && fechaVence <= en30Dias;
      }).length;

      const ubicaciones = [...new Set(stockData.map((item: any) => item.ubicacion || 'Sin Ubicación'))];
      const totalUnidades = stockData.reduce((sum: number, item: any) => sum + (item.disponible_UMBas || 0), 0);

      const stats: InventoryStats = {
        totalSKUs: stockData.length,
        totalUnidades,
        totalBodegas: bodegasData.length,
        ubicaciones: ubicaciones as string[],
        productosVencidos,
        productosPorVencer
      };

      setInventoryStats(stats);

      const ubicacionResumen = ubicaciones.reduce((acc: Record<string, { count: number; unidades: number }>, ubi: any) => {
        const items = stockData.filter((i: any) => (i.ubicacion || 'Sin Ubicación') === ubi);
        acc[ubi] = {
          count: items.length,
          unidades: items.reduce((s: number, i: any) => s + (i.disponible_UMBas || 0), 0)
        };
        return acc;
      }, {});

      const topProductos = [...stockData]
        .sort((a: any, b: any) => (b.disponible_UMBas || 0) - (a.disponible_UMBas || 0))
        .slice(0, 10)
        .map((p: any) => `${p.nombre} (${p.codigo}): ${p.disponible_UMBas} unidades en ${p.ubicacion}`);

      const context = `
RESUMEN DE INVENTARIO (${new Date().toLocaleDateString('es-ES')}):
- Total de SKUs/Productos: ${stats.totalSKUs}
- Total de Unidades: ${totalUnidades.toLocaleString()}
- Total de Bodegas: ${stats.totalBodegas}
- Productos Vencidos: ${productosVencidos}
- Productos por Vencer (30 días): ${productosPorVencer}

DISTRIBUCIÓN POR UBICACIÓN:
${Object.entries(ubicacionResumen).map(([ubi, data]: [string, any]) => 
  `- ${ubi}: ${data.count} productos, ${data.unidades.toLocaleString()} unidades`
).join('\n')}

TOP 10 PRODUCTOS CON MÁS STOCK:
${topProductos.map((p, i) => `${i + 1}. ${p}`).join('\n')}

BODEGAS DISPONIBLES:
${bodegasData.map((b: any) => `- ${b.bodega || b.nombre} (${b.idBodega || b.idbodega})`).join('\n')}
`;

      setInventoryContext(context);
      toast.success('Datos de inventario cargados');
    } catch (error) {
      console.error('Error cargando inventario:', error);
      toast.error('Error al cargar datos de inventario');
    } finally {
      setLoadingInventory(false);
    }
  };

  const enviarMensaje = async (mensaje?: string) => {
    const textoEnviar = mensaje || inputMessage.trim();
    if (!textoEnviar || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: textoEnviar,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: '',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, assistantMessage]);

    try {
      const response = await fetch('/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textoEnviar,
          inventoryContext,
          knowledgeBase
        })
      });

      if (!response.ok) throw new Error('Error en la respuesta');

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No se pudo leer la respuesta');

      const decoder = new TextDecoder();
      let fullContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          
          try {
            const data = JSON.parse(line.slice(6));
            if (data.content) {
              fullContent += data.content;
              setMessages(prev => 
                prev.map(msg => 
                  msg.id === assistantMessage.id 
                    ? { ...msg, content: fullContent }
                    : msg
                )
              );
            }
          } catch (e) {
          }
        }
      }
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => 
        prev.map(msg => 
          msg.id === assistantMessage.id 
            ? { ...msg, content: 'Lo siento, hubo un error al procesar tu mensaje. Por favor, intenta de nuevo.' }
            : msg
        )
      );
      toast.error('Error al comunicarse con el asistente');
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const limpiarChat = () => {
    setMessages([]);
    toast.success('Conversación limpiada');
  };

  const openKnowledgeEditor = () => {
    setEditingKnowledge(knowledgeBase);
    setShowKnowledgeEditor(true);
  };

  const saveKnowledgeBase = () => {
    setKnowledgeBase(editingKnowledge);
    localStorage.setItem('kairos_knowledge_base', editingKnowledge);
    setShowKnowledgeEditor(false);
    toast.success('Base de conocimiento actualizada');
  };

  const resetKnowledgeBase = () => {
    setEditingKnowledge(DEFAULT_KNOWLEDGE_BASE);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      enviarMensaje();
    }
  };

  const formatMessageContent = (content: string) => {
    const lines = content.split('\n');
    const formattedLines: React.ReactNode[] = [];
    let inDataBlock = false;
    let dataBlockLines: string[] = [];
    let blockKey = 0;

    const isDataLine = (line: string) => {
      return /^[\s]*[-•]?\s*(Producto|Código|Stock|Ubicación|Bodega|Unidades|Estado|SKU|Cantidad|Fecha|Total|Vencimiento):/i.test(line) ||
             /^[\s]*\d+\.\s/.test(line) ||
             /^[\s]*(R\d{2}-[A-Z]|RECEPCIÓN|PICKING|MERMA):/i.test(line);
    };

    const renderDataBlock = (lines: string[], key: number) => (
      <div key={key} className="my-2 bg-gray-900 text-emerald-400 rounded-lg p-3 font-mono text-sm overflow-x-auto">
        {lines.map((line, i) => (
          <div key={i} className="py-0.5">{line}</div>
        ))}
      </div>
    );

    lines.forEach((line, index) => {
      if (isDataLine(line)) {
        if (!inDataBlock) {
          inDataBlock = true;
          dataBlockLines = [];
        }
        dataBlockLines.push(line);
      } else {
        if (inDataBlock && dataBlockLines.length > 0) {
          formattedLines.push(renderDataBlock(dataBlockLines, blockKey++));
          inDataBlock = false;
          dataBlockLines = [];
        }
        if (line.trim()) {
          formattedLines.push(<p key={`text-${index}`} className="py-1">{line}</p>);
        } else {
          formattedLines.push(<div key={`space-${index}`} className="h-2" />);
        }
      }
    });

    if (inDataBlock && dataBlockLines.length > 0) {
      formattedLines.push(renderDataBlock(dataBlockLines, blockKey++));
    }

    return formattedLines;
  };

  return (
    <Layout pageTitle="Kairos EC">
      <div className="flex flex-col h-[calc(100vh-120px)]">
        {showKnowledgeEditor && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
              <div className="p-4 border-b flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpenIcon className="h-6 w-6 text-indigo-600" />
                  <h3 className="font-semibold text-lg">Base de Conocimiento</h3>
                </div>
                <button
                  onClick={() => setShowKnowledgeEditor(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              <div className="p-4 flex-1 overflow-hidden">
                <p className="text-sm text-gray-600 mb-3">
                  Edita la base de conocimiento para personalizar las respuestas de Kairos EC.
                  Esta información se incluirá como contexto en cada conversación.
                </p>
                <textarea
                  value={editingKnowledge}
                  onChange={(e) => setEditingKnowledge(e.target.value)}
                  className="w-full h-[50vh] p-3 border rounded-lg font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Escribe aquí la información que Kairos EC debe conocer..."
                />
              </div>
              <div className="p-4 border-t flex justify-between">
                <button
                  onClick={resetKnowledgeBase}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Restaurar predeterminado
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowKnowledgeEditor(false)}
                    className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={saveKnowledgeBase}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    Guardar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-4 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-full">
                <SparklesIcon className="h-6 w-6" />
              </div>
              <div>
                <h2 className="font-semibold text-lg">Kairos EC</h2>
                <p className="text-sm text-white/80">
                  {loadingInventory ? 'Cargando datos...' : `${inventoryStats?.totalSKUs || 0} productos en contexto`}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={openKnowledgeEditor}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
                title="Base de conocimiento"
              >
                <BookOpenIcon className="h-5 w-5" />
              </button>
              <button
                onClick={cargarInventario}
                disabled={loadingInventory}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
                title="Actualizar datos"
              >
                <ArrowPathIcon className={`h-5 w-5 ${loadingInventory ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={limpiarChat}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
                title="Limpiar chat"
              >
                <TrashIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-gray-50 p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="bg-emerald-100 p-4 rounded-full mb-4">
                <CpuChipIcon className="h-12 w-12 text-emerald-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                ¡Hola! Soy Kairos EC
              </h3>
              <p className="text-xs text-emerald-600 font-medium mb-2 tracking-wide">
                "Inteligencia Operativa en Tiempo Real"
              </p>
              <p className="text-gray-500 mb-6 max-w-md">
                Tu asistente inteligente de inventario. Puedo responder preguntas sobre productos, 
                ubicaciones, vencimientos y más. También puedes personalizar mi conocimiento.
              </p>
              
              <div className="w-full max-w-lg">
                <div className="flex items-center gap-2 mb-3 text-sm text-gray-600">
                  <LightBulbIcon className="h-4 w-4" />
                  <span>Prueba con alguna de estas preguntas:</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {SUGERENCIAS.map((sugerencia, idx) => (
                    <button
                      key={idx}
                      onClick={() => enviarMensaje(sugerencia)}
                      disabled={isLoading || loadingInventory}
                      className="text-left p-3 bg-white border border-gray-200 rounded-lg hover:border-emerald-300 hover:bg-emerald-50 transition-colors text-sm text-gray-700"
                    >
                      {sugerencia}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="flex-shrink-0 w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center">
                    <SparklesIcon className="h-4 w-4 text-white" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] p-4 rounded-lg ${
                    msg.role === 'user'
                      ? 'bg-emerald-600 text-white rounded-br-none'
                      : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-sm'
                  }`}
                >
                  <div className={`${msg.role === 'user' ? 'text-base' : 'text-base leading-relaxed'}`}>
                    {msg.role === 'assistant' && msg.content ? formatMessageContent(msg.content) : (msg.content || '...')}
                  </div>
                  <div className={`text-xs mt-1 ${msg.role === 'user' ? 'text-emerald-200' : 'text-gray-400'}`}>
                    {msg.timestamp.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                {msg.role === 'user' && (
                  <div className="flex-shrink-0 w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                    <UserIcon className="h-4 w-4 text-white" />
                  </div>
                )}
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="bg-white border-t p-4">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={loadingInventory ? "Cargando datos de inventario..." : "Escribe tu pregunta..."}
              disabled={isLoading || loadingInventory}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:bg-gray-100"
            />
            <button
              onClick={() => enviarMensaje()}
              disabled={!inputMessage.trim() || isLoading || loadingInventory}
              className="px-4 py-2 bg-emerald-600 text-white rounded-full hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {isLoading ? (
                <ArrowPathIcon className="h-5 w-5 animate-spin" />
              ) : (
                <PaperAirplaneIcon className="h-5 w-5" />
              )}
              <span className="hidden sm:inline">Enviar</span>
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2 text-center">
            Kairos EC • Powered by AI • Los datos se actualizan del sistema en tiempo real
          </p>
        </div>
      </div>
    </Layout>
  );
}
