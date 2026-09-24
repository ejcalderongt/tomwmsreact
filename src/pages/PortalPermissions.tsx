import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { getUser } from '@/utils/auth';
import { portalAccessApi, type PortalModuleRecord, type PortalUserInput, type PortalUserRecord } from '@/api/portalAccessApi';
import toast from 'react-hot-toast';

const emptyForm = (): PortalUserInput => ({
  codigoAcceso: '', nombre: '', email: '', password: '', esAdministrador: false,
  activo: true, permisos: [],
});

export default function PortalPermissions() {
  const current = getUser();
  const [catalog, setCatalog] = useState<Record<string, string[]>>({});
  const [modules, setModules] = useState<PortalModuleRecord[]>([]);
  const [users, setUsers] = useState<PortalUserRecord[]>([]);
  const [ownerId, setOwnerId] = useState<number>(current.propietario?.idPropietario || 0);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [form, setForm] = useState<PortalUserInput>(emptyForm);
  const [busy, setBusy] = useState(false);

  const load = async (id = ownerId) => {
    if (!id) return;
    try {
      const [moduleRows, userRows] = await Promise.all([
        portalAccessApi.modules(current.token, id),
        current.isSystemAdmin ? Promise.resolve([]) : portalAccessApi.users(current.token),
      ]);
      setModules(moduleRows);
      setUsers(userRows);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo cargar la configuración');
    }
  };

  useEffect(() => {
    portalAccessApi.catalog(current.token).then(setCatalog)
      .catch(() => toast.error('No se pudo cargar el catálogo de permisos'));
    if (ownerId) load(ownerId);
  }, []);

  const enabled = new Set(modules.filter(module => module.habilitado).map(module => module.codigoModulo));
  const allowedPermissions = Object.entries(catalog)
    .filter(([module]) => enabled.has(module))
    .flatMap(([, permissions]) => permissions);

  const newUser = () => {
    setSelectedId(null);
    setForm({ ...emptyForm(), permisos: allowedPermissions });
  };

  const editUser = (user: PortalUserRecord) => {
    setSelectedId(user.idPortalUsuario);
    setForm({ codigoAcceso: user.codigoAcceso, nombre: user.nombre, email: user.email,
      password: '', esAdministrador: user.esAdministrador, activo: user.activo,
      permisos: user.permisos.filter(code => allowedPermissions.includes(code)) });
  };

  const saveUser = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      if (selectedId) await portalAccessApi.updateUser(current.token, selectedId, form);
      else await portalAccessApi.createUser(current.token, form);
      toast.success('Usuario y permisos guardados');
      await load();
      newUser();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo guardar');
    } finally {
      setBusy(false);
    }
  };

  const setModule = async (code: string, value: boolean) => {
    setBusy(true);
    try {
      await portalAccessApi.setModule(current.token, ownerId, code, value);
      await load();
      toast.success('Módulo actualizado');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo actualizar');
    } finally {
      setBusy(false);
    }
  };

  return <Layout pageTitle="Permisos del Portal">
    <div className="space-y-6">
      <div className="rounded-lg border bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold">Módulos del propietario</h2>
        {current.isSystemAdmin && <div className="mt-3 flex gap-2">
          <input type="number" min="1" className="rounded border p-2" value={ownerId || ''}
            onChange={e => setOwnerId(Number(e.target.value))} aria-label="Id del propietario" />
          <button className="rounded bg-blue-600 px-4 text-white" onClick={() => load()}>Cargar propietario</button>
        </div>}
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {Object.keys(catalog).map(code => <label key={code} className="flex items-center gap-2 rounded border p-3">
            <input type="checkbox" checked={enabled.has(code)} disabled={!current.isSystemAdmin || busy || !ownerId}
              onChange={e => setModule(code, e.target.checked)} />
            <span className="capitalize">{code}</span>
          </label>)}
        </div>
        {!current.isSystemAdmin && <p className="mt-3 text-sm text-gray-500">
          Estos módulos los habilita la empresa. Puedes asignar a tus usuarios los permisos de los módulos activos.
        </p>}
      </div>

      {!current.isSystemAdmin && <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-lg border bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg font-semibold">Usuarios</h2>
            <button className="text-blue-600" onClick={newUser}>Nuevo</button>
          </div>
          <div className="mt-4 space-y-2">
            {users.map(user => <button key={user.idPortalUsuario} onClick={() => editUser(user)}
              className="w-full rounded border p-3 text-left hover:bg-blue-50">
              <span className="font-medium">{user.nombre}</span>
              <span className="block text-sm text-gray-500">{user.codigoAcceso}{!user.activo ? ' · inactivo' : ''}</span>
            </button>)}
            {!users.length && <p className="text-sm text-gray-500">Todavía no hay usuarios delegados.</p>}
          </div>
        </div>
        <form onSubmit={saveUser} className="rounded-lg border bg-white p-5 shadow-sm space-y-4 lg:col-span-2">
          <h2 className="text-lg font-semibold">{selectedId ? 'Editar usuario' : 'Crear usuario'}</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <input className="rounded border p-2" placeholder="Código de acceso" required maxLength={100}
              disabled={!!selectedId} value={form.codigoAcceso}
              onChange={e => setForm({ ...form, codigoAcceso: e.target.value })} />
            <input className="rounded border p-2" placeholder="Nombre" required maxLength={150}
              value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} />
            <input className="rounded border p-2" placeholder="Correo" type="email" maxLength={254}
              value={form.email || ''} onChange={e => setForm({ ...form, email: e.target.value })} />
            <input className="rounded border p-2" placeholder={selectedId ? 'Nueva contraseña (opcional)' : 'Contraseña'}
              type="password" required={!selectedId} value={form.password || ''}
              onChange={e => setForm({ ...form, password: e.target.value })} />
          </div>
          <div className="flex gap-6">
            <label className="flex items-center gap-2"><input type="checkbox" checked={form.activo}
              onChange={e => setForm({ ...form, activo: e.target.checked })} /> Activo</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={form.esAdministrador}
              onChange={e => setForm({ ...form, esAdministrador: e.target.checked })} /> Administrador del propietario</label>
          </div>
          <h3 className="font-medium">Permisos</h3>
          <div className="grid gap-2 sm:grid-cols-2">
            {allowedPermissions.map(code => <label key={code} className="flex items-center gap-2 rounded border p-2 text-sm">
              <input type="checkbox" checked={form.permisos.includes(code)}
                onChange={e => setForm({ ...form, permisos: e.target.checked
                  ? [...form.permisos, code] : form.permisos.filter(value => value !== code) })} />
              {code}
            </label>)}
          </div>
          <button disabled={busy} className="rounded bg-green-600 px-5 py-2 text-white disabled:opacity-50">
            {busy ? 'Guardando...' : 'Guardar usuario'}
          </button>
        </form>
      </div>}
    </div>
  </Layout>;
}
