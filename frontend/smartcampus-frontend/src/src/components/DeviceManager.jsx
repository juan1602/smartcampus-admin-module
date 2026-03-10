import { useState } from "react";
import { createDevice, updateDevice, deleteDevice } from "../api.js";
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
        setMessage("Dispositivo actualizado");
      } else {
        await createDevice(payload);
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
                {device.properties && device.properties.length > 0 && (
                  <div className="info-row">
                    <span className="label">Propiedades:</span>
                    <span className="properties-count">{device.properties.length}</span>
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
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="empty-state">No hay dispositivos registrados</p>
      )}
    </div>
  );
}
