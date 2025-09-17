
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { passwordAPI } from '@/api/api';
import toast from 'react-hot-toast';

function CambiarPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error('Por favor ingresa tu correo electrónico');
      return;
    }

    // Validación básica de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Por favor ingresa un correo electrónico válido');
      return;
    }

    setLoading(true);

    try {
      await passwordAPI.resetPassword(email);
      setEmailSent(true);
      toast.success('¡Enlace de restablecimiento enviado! Revisa tu correo electrónico.');
    } catch (error) {
      console.error('Error al enviar enlace de reset:', error);
      toast.error('Error al enviar el enlace. Verifica que el correo sea correcto.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-700 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          {/* Logo and Brand */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center mb-2">
              <img 
                src="/tom_wms.png" 
                alt="TOM WMS Logo" 
                className="w-32 h-32 object-contain"
              />
            </div>
            <p className="text-gray-400">Administración de Bodegas</p>
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <button
              onClick={() => navigate('/login')}
              className="inline-flex items-center text-blue-400 hover:text-blue-300 mb-4 transition-colors"
            >
              <ArrowLeftIcon className="h-5 w-5 mr-2" />
              Volver al Login
            </button>
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-10.712 3.712m0 0a6 6 0 01-9.546-3.976L3 12m0 0l3.546 3.546M3 12l3.546-3.546m0 0a6 6 0 0113.176 4.469M21 12l-3.546 3.546M21 12l-3.546-3.546" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">
              Restablecer Contraseña
            </h1>
            <p className="text-gray-400">
              Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña
            </p>
          </div>

          {!emailSent ? (
            /* Formulario */
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Correo Electrónico
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                      </svg>
                    </div>
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-md placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      placeholder="usuario@empresa.com"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Enviando...
                    </>
                  ) : (
                    'Enviar Enlace de Restablecimiento'
                  )}
                </button>
              </form>
            </div>
          ) : (
            /* Mensaje de confirmación */
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-green-900 mb-2">
                ¡Enlace Enviado!
              </h3>
              <p className="text-green-700 mb-4">
                Hemos enviado un enlace de restablecimiento a <strong>{email}</strong>
              </p>
              <p className="text-sm text-green-600 mb-6">
                Revisa tu bandeja de entrada y sigue las instrucciones para restablecer tu contraseña.
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => {
                    setEmailSent(false);
                    setEmail('');
                  }}
                  className="w-full px-4 py-2 text-sm font-medium text-green-700 bg-green-100 border border-green-300 rounded-md hover:bg-green-200 transition-colors"
                >
                  Enviar a otro correo
                </button>
                <button
                  onClick={() => navigate('/login')}
                  className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Volver al Login
                </button>
              </div>
            </div>
          )}

          {/* Información adicional */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              ¿No recibiste el correo? Revisa tu carpeta de spam o{' '}
              <button
                onClick={() => setEmailSent(false)}
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                intenta de nuevo
              </button>
            </p>
          </div>
        </div>
    </div>
  );
}

export default CambiarPassword;
