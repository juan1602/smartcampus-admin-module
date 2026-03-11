import { useState } from "react";
import { createDevice, updateDevice, deleteDevice,assignProperties,updatePropertyValue } from "../services/deviceService";
import "./DeviceManager.css";

export default function DeviceManager({ devices, properties, onRefresh }) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ 
    code: "", 
    name: "", 
    type: "SENSOR",
    location: "",
    selectedProperties: []
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const deviceTypes = ["SENSOR", "ACTUATOR", "CAMERA", "CONTROLLER"];
  const statusOptions = ["ONLINE", "OFFLINE", "MAINTENANCE", "ERROR"];

  const resetForm = () => {
    setFormData({ 
      code: "", 
      name: "", 
      type: "SENSOR",
      location: "",
      selectedProperties: []
    });
    setEditingId(null);
    setShowForm(false);
    setMessage("");
  };

  const handleEdit = (device) => {
    setFormData({ 
      code: device.code, 
      name: device.name || "",
      type: device.type || "SENSOR",
      location: device.location || "",
      selectedProperties: device.properties && device.properties.length > 0 
        ? device.properties.map(p => p.id) 
        : []
    });
    setEditingId(device.id);
    setShowForm(true);
  };

  const handlePropertyToggle = (propertyId) => {
    setFormData(prev => ({
      ...prev,
      selectedProperties: prev.selectedProperties.includes(propertyId)
        ? prev.selectedProperties.filter(id => id !== propertyId)
        : [...prev.selectedProperties, propertyId]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.code.trim()) {
      setMessage("El código del dispositivo es requerido");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        code: formData.code,
        name: formData.name,
        type: formData.type,
        location: formData.location,
        status: "OFFLINE"
      };

      if (editingId) {
    await updateDevice(editingId, payload);

  // asignar propiedades nuevamente
      if (formData.selectedProperties.length > 0) {
    await assignProperties(editingId, formData.selectedProperties);
    }

    setMessage("Dispositivo actualizado");
    } else {
    const response = await createDevice(payload);

    const newDeviceId = response.data.id;

    if (formData.selectedProperties.length > 0) {
    await assignProperties(newDeviceId, formData.selectedProperties);
    }

    setMessage("Dispositivo creado");
    }
      resetForm();
      onRefresh();
    } catch (error) {
      setMessage("Error: " + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("¿Estás seguro de que deseas eliminar este dispositivo?")) {
      setLoading(true);
      try {
        await deleteDevice(id);
        setMessage("Dispositivo eliminado");
        onRefresh();
      } catch (error) {
        setMessage("Error: " + (error.response?.data?.message || error.message));
      } finally {
        setLoading(false);
      }
    }
  };

  // Estado para mostrar información
  const [infoDevice, setInfoDevice] = useState(null);
  // Estado para edición de valores
  const [editValues, setEditValues] = useState({});

  // Función para manejar cambios en valores editables
  const handleValueChange = (propertyId, value) => {
    setEditValues(prev => ({ ...prev, [propertyId]: value }));
  };

  // Función para guardar valores editados
  const handleSaveValues = async () => {

  if (!infoDevice) return;

  try {

    const updates = Object.entries(editValues);

    for (const [propertyId, value] of updates) {

      const property = infoDevice.properties.find(p => p.id === Number(propertyId));

      if (property && property.writable) {

        await updatePropertyValue(infoDevice.id, property.name, value);

      }
    }

    setMessage("Valores actualizados correctamente");

    setInfoDevice(null);
    setEditValues({});

    onRefresh();

  } catch (error) {

    setMessage("Error actualizando valores");

  }

};

  return (
    <div className="device-manager">
      <div className="device-header">
        <h2>Gestionar Dispositivos ({devices.length})</h2>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          {showForm ? "Cancelar" : "+ Nuevo Dispositivo"}
        </button>
      </div>

      {message && (
        <div className={`message ${message.includes("Error") ? "error" : "success"}`}>
          {message}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="device-form">
          <div className="form-section">
            <h3>Información del Dispositivo</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Código *</label>
                <input
                  type="text"
                  placeholder="Ej: SENSOR-01"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Nombre</label>
                <input
                  type="text"
                  placeholder="Ej: Sensor Laboratorio"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Tipo</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                >
                  {deviceTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Ubicación</label>
                <input
                  type="text"
                  placeholder="Ej: Lab A"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>
            </div>
          </div>

          {properties.length > 0 && (
            <div className="form-section">
              <h3>Propiedades del Dispositivo</h3>
              <div className="properties-selector">
                {properties.map((property) => (
                  <label key={property.id} className="property-checkbox">
                    <input
                      type="checkbox"
                      checked={formData.selectedProperties.includes(property.id)}
                      onChange={() => handlePropertyToggle(property.id)}
                    />
                    <span className="checkbox-label">
                      <strong>{property.name}</strong>
                      {property.unit && <span className="unit">{property.unit}</span>}
                      {property.description && <span className="desc">{property.description}</span>}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-submit">
            {loading ? "Guardando..." : editingId ? "Actualizar" : "Crear"}
          </button>
        </form>
      )}

      {devices.length > 0 ? (
        <div className="devices-grid">
          {devices.map((device) => (
            <div key={device.id} className="device-card">
              <div className="device-header-card">
                <div>
                  <h3>{device.code}</h3>
                  {device.name && <p className="device-name">{device.name}</p>}
                </div>
                <span className={`device-status ${device.status?.toLowerCase()}`}>
                  {device.status}
                </span>
              </div>

              <div className="device-info">
                {device.type && (
                  <div className="info-row">
                    <span className="label">Tipo:</span>
                    <span className="device-type">{device.type}</span>
                  </div>
                )}
                {device.location && (
                  <div className="info-row">
                    <span className="label">Ubicación:</span>
                    <span className="value">{device.location}</span>
                  </div>
                )}
                {device.lastSeen && (
                  <div className="info-row">
                    <span className="label">Última vez visto:</span>
                    <span className="value">
                      {new Date(device.lastSeen).toLocaleString()}
                    </span>
                  </div>
                )}
                {/* Tabla de propiedades y valores de telemetría */}
                {device.properties && device.properties.length > 0 && (
                  <div className="info-row">
                    <span className="label">Valores de propiedades:</span>
                    <table className="device-properties-table" style={{ width: "100%", marginTop: 8 }}>
                      <thead>
                        <tr>
                          <th>Propiedad</th>
                          <th>Unidad</th>
                          <th>Valor</th>
                        </tr>
                      </thead>
                      <tbody>
                        {device.properties.map((p) => {
                          let telemetry = {};
                          try {
                            telemetry = device.twin && device.twin.telemetryJson ? JSON.parse(device.twin.telemetryJson) : {};
                          } catch (e) { telemetry = {}; }
                          const value = telemetry[p.name] !== undefined ? telemetry[p.name] : "-";
                          return (
                            <tr key={p.id}>
                              <td>{p.name}</td>
                              <td>{p.unit || '-'}</td>
                              <td>{value}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="device-actions">
                <button onClick={() => handleEdit(device)} className="btn-edit">
                  ✏️ Editar
                </button>
                <button onClick={() => handleDelete(device.id)} className="btn-delete">
                  🗑️ Eliminar
                </button>
                <button onClick={() => setInfoDevice(device)} className="btn-info">
                  ℹ️ Información
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="empty-state">No hay dispositivos registrados</p>
      )}

      {infoDevice && (
        <div className="modal-overlay" style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "rgba(0,0,0,0.3)", zIndex: 1000 }}>
          <div className="modal-content" style={{ background: "#fff", margin: "5% auto", padding: 24, borderRadius: 8, maxWidth: 600, boxShadow: "0 2px 8px rgba(0,0,0,0.2)" }}>
            <h2>Información del dispositivo</h2>
            <p><strong>Código:</strong> {infoDevice.code}</p>
            <p><strong>Nombre:</strong> {infoDevice.name}</p>
            <p><strong>Tipo:</strong> {infoDevice.type}</p>
            <p><strong>Ubicación:</strong> {infoDevice.location}</p>
            <p><strong>Status:</strong> {infoDevice.status}</p>
            <p><strong>Última vez visto:</strong> {infoDevice.lastSeen ? new Date(infoDevice.lastSeen).toLocaleString() : '-'}</p>
            <h3>Propiedades y valores</h3>
            <table style={{ width: "100%", marginTop: 8 }}>
              <thead>
                <tr>
                  <th>Propiedad</th>
                  <th>Unidad</th>
                  <th>Valor</th>
                  <th>Editar</th>
                </tr>
              </thead>
              <tbody>
                {infoDevice.properties.map((p) => {
                  let telemetry = {};
                  try {
                    telemetry = infoDevice.twin && infoDevice.twin.telemetryJson ? JSON.parse(infoDevice.twin.telemetryJson) : {};
                  } catch (e) { telemetry = {}; }
                  const value = telemetry[p.name] !== undefined ? telemetry[p.name] : "-";
                  return (
                    <tr key={p.id}>
                      <td>{p.name}</td>
                      <td>{p.unit || '-'}</td>
                      <td>
                        {p.writable ? (
                          <input
                            type="text"
                            value={editValues[p.id] !== undefined ? editValues[p.id] : value}
                            onChange={e => handleValueChange(p.id, e.target.value)}
                            style={{ width: 80 }}
                          />
                        ) : (
                          value
                        )}
                      </td>
                      <td>
                        {p.writable ? (
                          <span style={{ color: 'green' }}>Editable</span>
                        ) : (
                          <span style={{ color: 'gray' }}>No editable</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div style={{ marginTop: 16 }}>
              <button onClick={() => setInfoDevice(null)} style={{ marginRight: 8 }}>Cerrar</button>
              <button onClick={handleSaveValues} style={{ background: '#007bff', color: '#fff' }}>Guardar cambios</button>
            </div>
          </div>
        </div>
      )
}</div>
  );
}
