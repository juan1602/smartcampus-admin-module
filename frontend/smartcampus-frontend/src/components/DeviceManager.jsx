import { useState, useEffect } from "react";
import { createDevice, updateDevice, deleteDevice, assignProperties, updatePropertyValue } from "../services/deviceService";
import "./DeviceManager.css";
import yaml from "js-yaml";

export default function DeviceManager({ twins, devices, properties, onRefresh, onFormOpen, highlightedDeviceId, onClearHighlight }) {

  // ── Estados del formulario ──────────────────────────────────────────────────
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
  
  // Notifica al padre cuando se abre/cierra el formulario para pausar polling
  useEffect(() => {
    if (onFormOpen) {
      onFormOpen(showForm);
    }
  }, [showForm, onFormOpen]);

  useEffect(() => {
    if (highlightedDeviceId) {
      const el = document.getElementById(`device-card-${highlightedDeviceId}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        setTimeout(() => {
          onClearHighlight?.();
        }, 3000);
      }
    }
  }, [highlightedDeviceId, onClearHighlight]);
  useEffect(() => {
  if (message) {
    const timer = setTimeout(() => {
      setMessage("");
    }, 7000);

    return () => clearTimeout(timer);
  }
}, [message]);

  // ── Estados del modal de información ───────────────────────────────────────
  const [infoDevice, setInfoDevice] = useState(null);
  const [editValues, setEditValues] = useState({});

  const deviceTypes = ["SENSOR", "ACTUATOR", "CAMERA", "CONTROLLER"];

  // ── Utilidades de telemetría ────────────────────────────────────────────────

  // Busca el twin del dispositivo y retorna su telemetría parseada como objeto
  const getTelemetryForDevice = (deviceId) => {
    const twin = (twins || []).find(t => t.device?.id === deviceId);
    if (!twin?.telemetryJson) return {};
    try {
      return JSON.parse(twin.telemetryJson);
    } catch {
      return {};
    }
  };

  // Hace matching case-insensitive entre el nombre de propiedad y las claves del JSON
  const getPropertyValue = (telemetry, propertyName) => {
    const keys = Object.keys(telemetry);
    const match = keys.find(k => k.toLowerCase() === propertyName.toLowerCase());
    return match !== undefined ? telemetry[match] : "-";
  };

  const resolvePropertyIdsFromNames = (propertyNames = []) => {
    const availableProperties = properties || [];

    const matchedIds = [];
    const missing = [];

    propertyNames.forEach((propName) => {
      const found = availableProperties.find(
        (p) => p.name?.toLowerCase() === String(propName).toLowerCase()
      );

      if (found) {
        matchedIds.push(found.id);
      } else {
        missing.push(propName);
      }
    });

    return { matchedIds, missing };
  };

  // ── Formulario ──────────────────────────────────────────────────────────────

  const resetForm = () => {
    setFormData({ code: "", name: "", type: "SENSOR", location: "", selectedProperties: [] });
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
      selectedProperties: device.properties?.length > 0 ? device.properties.map(p => p.id) : []
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

  const handleClone = async (device) => {
    const baseCode = device.code.replace(/-COPIA(-\d+)?$/, "");
    const existingCodes = (devices || []).map(d => d.code);
    let newCode = `${baseCode}-COPIA`;
    let counter = 1;
    while (existingCodes.includes(newCode)) {
      newCode = `${baseCode}-COPIA-${counter++}`;
    }

    setLoading(true);
    try {
      const payload = {
        code: newCode,
        name: device.name ? `${device.name} (copia)` : "",
        type: device.type || "SENSOR",
        location: device.location || "",
        status: "OFFLINE"
      };
      const response = await createDevice(payload);
      const newDeviceId = response.data.id;
      const propertyIds = (device.properties || []).map(p => p.id);
      if (propertyIds.length > 0) {
        await assignProperties(newDeviceId, propertyIds);
      }
      setMessage(`Dispositivo clonado como ${newCode}`);
      onRefresh();
    } catch (error) {
      setMessage("Error al clonar: " + (error.response?.data?.message || error.message));
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

    const handleYamlUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    setMessage("");

    try {
      const text = await file.text();
      const data = yaml.load(text);

      if (!data || typeof data !== "object") {
        throw new Error("El archivo YAML está vacío o tiene un formato inválido");
      }

      // Función interna para validar y crear un dispositivo
      const createDeviceFromYaml = async (deviceData) => {
        const payload = {
          code: deviceData.code || "",
          name: deviceData.name || "",
          type: deviceData.type || "SENSOR",
          location: deviceData.location || "",
          status: "OFFLINE"
        };

        if (!payload.code.trim()) {
          throw new Error("Cada dispositivo del YAML debe incluir al menos el campo 'code'");
        }

        // Validar propiedades antes de crear el dispositivo
        let propertyIds = [];
        if (Array.isArray(deviceData.selectedProperties) && deviceData.selectedProperties.length > 0) {
          const { matchedIds, missing } = resolvePropertyIdsFromNames(deviceData.selectedProperties);

          if (missing.length > 0) {
            throw new Error(
              `El dispositivo ${payload.code} contiene propiedades no registradas: ${missing.join(", ")}. Debes registrarlas primero en el módulo de propiedades.`
            );
          }

          propertyIds = matchedIds;
        }

        // Crear el dispositivo solo si todo está validado
        const response = await createDevice(payload);
        const newDeviceId = response.data.id;

        if (propertyIds.length > 0) {
          await assignProperties(newDeviceId, propertyIds);
        }
      };

      // Caso 1: un solo dispositivo
      if (!data.devices) {
        await createDeviceFromYaml(data);
        setMessage("Dispositivo creado desde YAML");
      }

      // Caso 2: varios dispositivos
      else if (Array.isArray(data.devices)) {
        if (data.devices.length < 1) {
          throw new Error("El arreglo 'devices' está vacío");
        }

        for (const device of data.devices) {
          await createDeviceFromYaml(device);
        }

        setMessage(`Se crearon ${data.devices.length} dispositivos desde YAML`);
      } else {
        throw new Error("Formato YAML no válido");
      }

      onRefresh();
    } catch (error) {
      setMessage("Error: " + (error.message || "No se pudo cargar el YAML"));
    } finally {
      setLoading(false);
      e.target.value = "";
    }
  };

  // ── Modal de información ────────────────────────────────────────────────────

  const handleValueChange = (propertyId, value) => {
    setEditValues(prev => ({ ...prev, [propertyId]: value }));
  };

  const handleSaveValues = async () => {
    if (!infoDevice) return;
    try {
      for (const [propertyId, value] of Object.entries(editValues)) {
        const property = (infoDevice.properties || []).find(p => p.id === Number(propertyId));
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

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="device-manager">

      {/* Encabezado */}
      <div className="device-header">
        <h2>Gestionar Dispositivos ({devices.length})</h2>
        <button type="button" onClick={() => {
          setShowForm(!showForm);
          if (showForm) setInfoDevice(null); // Cierra el modal si está abierto
        }} className="btn-primary">
          {showForm ? "✕ Cancelar" : "+ Nuevo Dispositivo"}
        </button>
      </div>

      {/* Mensaje de éxito o error */}
      {message && (
        <div className={`message ${message.includes("Error") ? "error" : "success"}`}>
          {message.includes("Error") ? "❌" : "✅"} {message}
        </div>
      )}

      {/* Formulario de creación/edición */}
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
                    <option key={type} value={type}>{type}</option>
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
            {loading ? "Guardando..." : editingId ? "Actualizar Dispositivo" : "Crear Dispositivo"}
          </button>
          {!editingId && (
            <div className="form-section">
              <h3>Cargar desde archivo YAML</h3>
              <div className="form-actions">
            
              {!editingId && (
                <label className="btn-submit file-upload-btn">
                  {loading ? "Cargando..." : "Subir archivo YAML"}
                  <input
                    type="file"
                    accept=".yaml,.yml"
                    onChange={handleYamlUpload}
                    disabled={loading}
                    hidden
                  />
                </label>
              )}

                <small>
                  Puedes cargar un solo dispositivo o varios dispositivos desde un archivo YAML.
                </small>

                
              </div>
            </div>
          )}
        </form>
      )}

      {/* Grid de cards */}
      {devices.length > 0 ? (
        <div className="devices-grid">
          {devices.map((device) => {
            const telemetry = getTelemetryForDevice(device.id);
            return (
              <div key={device.id} 
              id={`device-card-${device.id}`}
              className="device-card"
              style={highlightedDeviceId === device.id ? { border: "2px solid var(--primary-color)", boxShadow: "0 0 10px var(--primary-color)" } : {}}
              >

                {/* Encabezado de la card */}
                <div className="device-header-card">
                  <div>
                    <h3>{device.code}</h3>
                    {device.name && <p className="device-name">{device.name}</p>}
                  </div>
                  <span className={`device-status ${device.status?.toLowerCase()}`}>
                    {device.status}
                  </span>
                </div>

                {/* Info del dispositivo */}
                <div className="device-info">
                  {device.type && (
                    <div className="info-row">
                      <span className="label">Tipo</span>
                      <span className="device-type">{device.type}</span>
                    </div>
                  )}
                  {device.location && (
                    <div className="info-row">
                      <span className="label">Ubicación</span>
                      <span className="value">{device.location}</span>
                    </div>
                  )}
                  {device.lastSeen && (
                    <div className="info-row">
                      <span className="label">Última vez visto</span>
                      <span className="value">{new Date(device.lastSeen).toLocaleString()}</span>
                    </div>
                  )}

                  {/* Tabla de propiedades con telemetría */}
                  {device.properties?.length > 0 && (
                    <table className="device-properties-table">
                      <thead>
                        <tr>
                          <th>Propiedad</th>
                          <th>Unidad</th>
                          <th>Valor</th>
                        </tr>
                      </thead>
                      <tbody>
                        {device.properties.map((p) => (
                          <tr key={p.id}>
                            <td>{p.name}</td>
                            <td>{p.unit || "-"}</td>
                            <td>{getPropertyValue(telemetry, p.name)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                {/* Acciones */}
                <div className="device-actions">
                  <button onClick={() => handleEdit(device)} className="btn-edit">✏️ Editar</button>
                  <button onClick={() => handleClone(device)} className="btn-clone" disabled={loading}>📋 Clonar</button>
                  <button onClick={() => handleDelete(device.id)} className="btn-delete">🗑️ Eliminar</button>
                  <button onClick={() => setInfoDevice(device)} className="btn-info">ℹ️ Información</button>
                </div>

              </div>
            );
          })}
        </div>
      ) : (
        <p className="empty-state">No hay dispositivos registrados</p>
      )}

      {/* Modal de información del dispositivo */}
      {infoDevice && (
        <div className="modal-overlay" onClick={() => setInfoDevice(null)}>
          <div className="device-modal" onClick={(e) => e.stopPropagation()}>

            {/* Header del modal */}
            <div className="device-modal-header">
              <h2> {infoDevice.code}</h2>
              <button className="device-modal-close" onClick={() => setInfoDevice(null)}>✕</button>
            </div>

            {/* Info general en grid de tarjetas */}
            <div className="device-modal-info">
              <div className="device-modal-info-item">
                <div className="info-label">Nombre</div>
                <div className="info-value">{infoDevice.name || "-"}</div>
              </div>
              <div className="device-modal-info-item">
                <div className="info-label">Tipo</div>
                <div className="info-value">{infoDevice.type}</div>
              </div>
              <div className="device-modal-info-item">
                <div className="info-label">Ubicación</div>
                <div className="info-value">{infoDevice.location || "-"}</div>
              </div>
              <div className="device-modal-info-item">
                <div className="info-label">Status</div>
                <div className="info-value">
                  <span className={`device-status ${infoDevice.status?.toLowerCase()}`}>
                    {infoDevice.status}
                  </span>
                </div>
              </div>
              <div className="device-modal-info-item" style={{ gridColumn: "1 / -1" }}>
                <div className="info-label">Última vez visto</div>
                <div className="info-value">
                  {infoDevice.lastSeen ? new Date(infoDevice.lastSeen).toLocaleString() : "-"}
                </div>
              </div>
            </div>

            {/* Tabla de propiedades y valores editables */}
            <h3>Propiedades y valores</h3>
            <table className="modal-properties-table">
              <thead>
                <tr>
                  <th>Propiedad</th>
                  <th>Unidad</th>
                  <th>Valor</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {(infoDevice.properties || []).map((p) => {
                  const telemetry = getTelemetryForDevice(infoDevice.id);
                  const value = getPropertyValue(telemetry, p.name);
                  return (
                    <tr key={p.id}>
                      <td><strong>{p.name}</strong></td>
                      <td>{p.unit || "-"}</td>
                      <td>
                        {p.writable ? (
                          <input
                            className="editable-input"
                            type="text"
                            value={editValues[p.id] !== undefined ? editValues[p.id] : value}
                            onChange={(e) => handleValueChange(p.id, e.target.value)}
                          />
                        ) : value}
                      </td>
                      <td>
                        {p.writable
                          ? <span className="badge-editable">Editable</span>
                          : <span className="badge-readonly">Solo lectura</span>
                        }
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Footer del modal */}
            <div className="device-modal-footer">
              <button className="btn-modal-close" onClick={() => setInfoDevice(null)}>Cerrar</button>
              <button className="btn-modal-save" onClick={handleSaveValues}>💾 Guardar cambios</button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}