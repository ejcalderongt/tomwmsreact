import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { portalAccessApi } from '@/api/portalAccessApi';
import { saveUser } from '@/utils/auth';
import toast from 'react-hot-toast';

export default function InternalLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      const user = await portalAccessApi.internalLogin(username.trim(), password);
      saveUser(user);
      navigate('/permisos', { replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
    <form onSubmit={submit} className="w-full max-w-sm rounded-lg bg-white p-8 shadow space-y-4">
      <h1 className="text-xl font-semibold">Administración interna</h1>
      <p className="text-sm text-gray-600">Configuración de módulos por propietario</p>
      <input className="w-full rounded border p-2" value={username} onChange={e => setUsername(e.target.value)}
        placeholder="Usuario interno" autoComplete="username" required />
      <input className="w-full rounded border p-2" value={password} onChange={e => setPassword(e.target.value)}
        type="password" placeholder="Contraseña" autoComplete="current-password" required />
      <button disabled={loading} className="w-full rounded bg-blue-600 p-2 text-white disabled:opacity-50">
        {loading ? 'Ingresando...' : 'Ingresar'}
      </button>
    </form>
  </div>;
}
