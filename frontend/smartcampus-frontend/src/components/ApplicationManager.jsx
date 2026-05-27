import { useEffect, useState } from "react";
import {
  getApplications,
  createApplication,
  updateApplication,
  deleteApplication,
  addDeviceToApp,
  removeDeviceFromApp,
} from "../services/applicationService";
import "./ApplicationManager.css";

export default function ApplicationManager({ devices = [], isAdmin }) {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingApp, setEditingApp] = useState(null);
  const [selectedApp, setSelectedApp] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [form, setForm] = useState({ name: "", repository: "", status: "ACTIVE" });
  const [formError, setFormError] = useState("");
  const [deviceToAdd, setDeviceToAdd] = useState("");

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    setLoading(true);
    try {
      const res = await getApplications();
      setApplications(res.data || []);
    } catch {
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditingApp(null);
    setForm({ name: "", repository: "", status: "ACTIVE" });
    setFormError("");
    setShowForm(true);
  };

  const openEdit = (app) => {
    setEditingApp(app);
    setForm({ name: app.name, repository: app.repository, status: app.status });
    setFormError("");
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.repository.trim()) {
      setFormError("Nombre y repositorio son obligatorios.");
      return;
    }
    try {
      if (editingApp) {
        await updateApplication(editingApp.id, form);
      } else {
        await createApplication(form);
      }
      setShowForm(false);
      loadApplications();
    } catch {
      setFormError("Error al guardar la aplicación.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Eliminar esta aplicación?")) return;
    await deleteApplication(id);
    if (selectedApp?.id === id) setSelectedApp(null);
    loadApplications();
  };

  const handleAddDevice = async () => {
    if (!deviceToAdd) return;
    await addDeviceToApp(selectedApp.id, deviceToAdd);
    setDeviceToAdd("");
    const res = await getApplications();
    const updated = (res.data || []).find(a => a.id === selectedApp.id);
    setSelectedApp(updated);
    setApplications(res.data || []);
  };

  const handleRemoveDevice = async (deviceId) => {
    await removeDeviceFromApp(selectedApp.id, deviceId);
    const res = await getApplications();
    const updated = (res.data || []).find(a => a.id === selectedApp.id);
    setSelectedApp(updated);
    setApplications(res.data || []);
  };

  const filtered = applications.filter(app => {
    const q = searchText.toLowerCase();
    if (q && !app.name?.toLowerCase().includes(q) && !app.repository?.toLowerCase().includes(q)) return false;
    if (filterStatus && app.status !== filterStatus) return false;
    return true;
  });

  const assignedIds = new Set((selectedApp?.devices || []).map(d => d.id));
  const availableDevices = devices.filter(d => !assignedIds.has(d.id));

  if (loading) return <div className="am-loading">Cargando aplicaciones...</div>;

  return (
    <div className="am-container">

      {/* Encabezado */}
      <div className="am-header">
        <div>
          <h2 className="am-title">Aplicaciones</h2>
          <p className="am-subtitle">{applications.length} aplicación{applications.length !== 1 ? "es" : ""} registrada{applications.length !== 1 ? "s" : ""}</p>
        </div>
        {isAdmin && (
          <button className="am-btn-primary" onClick={openCreate}>+ Nueva aplicación</button>
        )}
      </div>

      {/* Filtros */}
      <div className="am-filters">
        <input
          className="am-input"
          placeholder="Buscar por nombre o repositorio..."
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
        />
        <select className="am-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">Todos los estados</option>
          <option value="ACTIVE">ACTIVE</option>
          <option value="INACTIVE">INACTIVE</option>
        </select>
        {(searchText || filterStatus) && (
          <button className="am-btn-clear" onClick={() => { setSearchText(""); setFilterStatus(""); }}>
            ✕ Limpiar
          </button>
        )}
      </div>

      {/* Lista de aplicaciones */}
      {filtered.length === 0 ? (
        <div className="am-empty">No hay aplicaciones{searchText || filterStatus ? " con esos filtros" : ""}.</div>
      ) : (
        <div className="am-grid">
          {filtered.map(app => (
            <div
              key={app.id}
              className={`am-card ${selectedApp?.id === app.id ? "am-card--selected" : ""}`}
              onClick={() => setSelectedApp(selectedApp?.id === app.id ? null : app)}
            >
              <div className="am-card-header">
                <span className="am-card-name">{app.name}</span>
                <span className={`am-badge ${app.status === "ACTIVE" ? "am-badge--active" : "am-badge--inactive"}`}>
                  {app.status}
                </span>
              </div>
              <div className="am-card-repo">📦 {app.repository}</div>
              <div className="am-card-devices">
                🔌 {app.devices?.length || 0} dispositivo{app.devices?.length !== 1 ? "s" : ""}
              </div>
              {isAdmin && (
                <div className="am-card-actions" onClick={e => e.stopPropagation()}>
                  <button className="am-btn-edit" onClick={() => openEdit(app)}>Editar</button>
                  <button className="am-btn-delete" onClick={() => handleDelete(app.id)}>Eliminar</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Panel de dispositivos de la app seleccionada */}
      {selectedApp && (
        <div className="am-devices-panel">
          <h3 className="am-devices-title">
            Dispositivos de <span style={{ color: "var(--color-primary)" }}>{selectedApp.name}</span>
          </h3>

          {isAdmin && (
            <div className="am-devices-add">
              <select
                className="am-select"
                value={deviceToAdd}
                onChange={e => setDeviceToAdd(e.target.value)}
              >
                <option value="">Seleccionar dispositivo...</option>
                {availableDevices.map(d => (
                  <option key={d.id} value={d.id}>{d.code}{d.name ? ` — ${d.name}` : ""}</option>
                ))}
              </select>
              <button
                className="am-btn-primary"
                onClick={handleAddDevice}
                disabled={!deviceToAdd}
              >
                + Agregar
              </button>
            </div>
          )}

          {selectedApp.devices?.length === 0 ? (
            <p className="am-empty">Sin dispositivos asignados.</p>
          ) : (
            <table className="am-table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Nombre</th>
                  <th>Tipo</th>
                  <th>Estado</th>
                  {isAdmin && <th></th>}
                </tr>
              </thead>
              <tbody>
                {selectedApp.devices.map(d => (
                  <tr key={d.id}>
                    <td><strong style={{ color: "var(--color-primary)" }}>{d.code}</strong></td>
                    <td>{d.name || "-"}</td>
                    <td>{d.type}</td>
                    <td>
                      <span className={`am-status am-status--${d.status?.toLowerCase()}`}>
                        {d.status}
                      </span>
                    </td>
                    {isAdmin && (
                      <td>
                        <button className="am-btn-delete" onClick={() => handleRemoveDevice(d.id)}>
                          Quitar
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Modal de formulario */}
      {showForm && (
        <div className="am-overlay" onClick={() => setShowForm(false)}>
          <div className="am-modal" onClick={e => e.stopPropagation()}>
            <h3 className="am-modal-title">{editingApp ? "Editar aplicación" : "Nueva aplicación"}</h3>

            <label className="am-label">Nombre</label>
            <input
              className="am-input"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Ej: Campus Norte"
            />

            <label className="am-label">Repositorio</label>
            <input
              className="am-input"
              value={form.repository}
              onChange={e => setForm(f => ({ ...f, repository: e.target.value }))}
              placeholder="Ej: campus_norte"
            />

            <label className="am-label">Estado</label>
            <select
              className="am-select"
              value={form.status}
              onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>

            {formError && <p className="am-error">{formError}</p>}

            <div className="am-modal-actions">
              <button className="am-btn-cancel" onClick={() => setShowForm(false)}>Cancelar</button>
              <button className="am-btn-primary" onClick={handleSubmit}>
                {editingApp ? "Guardar cambios" : "Crear"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}