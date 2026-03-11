import { useState } from "react";
import { createProperty, updateProperty, deleteProperty } from "../services/propertyService";
import "./PropertyManager.css";

export default function PropertyManager({ properties, onRefresh }) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: "", unit: "", description: "", writable: false });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const resetForm = () => {
    setFormData({ name: "", unit: "", description: "" });
    setEditingId(null);
    setShowForm(false);
    setMessage("");
  };

  const handleEdit = (property) => {
    setFormData({ 
      name: property.name, 
      unit: property.unit || "", 
      description: property.description || "",
      writable: property.writable ?? false
    });
    setEditingId(property.id);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setMessage("El nombre es requerido");
      return;
    }

    setLoading(true);
    try {
      if (editingId) {
        await updateProperty(editingId, formData);
        setMessage("Propiedad actualizada");
      } else {
        await createProperty(formData);
        setMessage("Propiedad creada");
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
    if (window.confirm("¿Estás seguro de que deseas eliminar esta propiedad?")) {
      setLoading(true);
      try {
        await deleteProperty(id);
        setMessage("Propiedad eliminada");
        onRefresh();
      } catch (error) {
        setMessage("Error: " + (error.response?.data?.message || error.message));
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="property-manager">
      <div className="property-header">
        <h2>Gestionar Propiedades ({properties.length})</h2>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          {showForm ? "Cancelar" : "+ Nueva Propiedad"}
        </button>
      </div>

      {message && (
        <div className={`message ${message.includes("Error") ? "error" : "success"}`}>
          {message}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="property-form">
          <div className="form-group">
            <label>Nombre *</label>
            <input
              type="text"
              placeholder="Ej: temperature"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Unidad</label>
            <input
              type="text"
              placeholder="Ej: °C, m/s, %"
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Descripción</label>
            <textarea
              placeholder="Descripción de la propiedad"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows="3"
            />
          </div>

          <div className="form-group">
            <label>Es editable esta propiedad </label>
            <select
              value={formData.writable ? "yes" : "no"}
              onChange={e => setFormData({ ...formData, writable: e.target.value === "yes" })}
            >
              <option value="yes">Sí</option>
              <option value="no">No</option>
            </select>
          </div>

          <button type="submit" disabled={loading} className="btn-submit">
            {loading ? "Guardando..." : editingId ? "Actualizar" : "Crear"}
          </button>
        </form>
      )}

      {properties.length > 0 ? (
        <div className="properties-list">
          {properties.map((prop) => (
            <div key={prop.id} className="property-item">
              <div className="property-content">
                <h4>{prop.name}</h4>
                {prop.unit && <p className="unit">Unidad: {prop.unit}</p>}
                {prop.description && <p className="description">{prop.description}</p>}
                <p className="writable">Editable: {prop.writable ? "Sí" : "No"}</p>
              </div>
              <div className="property-actions">
                <button onClick={() => handleEdit(prop)} className="btn-edit">
                  ✏️ Editar
                </button>
                <button onClick={() => handleDelete(prop.id)} className="btn-delete">
                  🗑️ Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="empty-state">No hay propiedades registradas</p>
      )}
    </div>
  );
}
