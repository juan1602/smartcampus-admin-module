import { useEffect, useState } from "react";
import { getAlertRules, createAlertRule, updateAlertRule, deleteAlertRule } from "../services/alertRuleService";
import "./AlertRulesManager.css";

const EMPTY_FORM = { property: "", operator: "GREATER_THAN", threshold: "", label: "", active: true };

export default function AlertRulesManager() {
  const [rules, setRules]       = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm]         = useState(EMPTY_FORM);
  const [loading, setLoading]   = useState(false);
  const [message, setMessage]   = useState("");

  useEffect(() => { loadRules(); }, []);

  useEffect(() => {
    if (message) {
      const t = setTimeout(() => setMessage(""), 5000);
      return () => clearTimeout(t);
    }
  }, [message]);

  const loadRules = async () => {
    try {
      const res = await getAlertRules();
      setRules(res.data || []);
    } catch {
      setMessage("Error al cargar reglas");
    }
  };

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (rule) => {
    setForm({
      property:  rule.property,
      operator:  rule.operator,
      threshold: rule.threshold,
      label:     rule.label || "",
      active:    rule.active
    });
    setEditingId(rule.id);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.property.trim() || form.threshold === "") {
      setMessage("Propiedad y umbral son requeridos");
      return;
    }
    setLoading(true);
    try {
      const payload = { ...form, threshold: parseFloat(form.threshold) };
      if (editingId) {
        await updateAlertRule(editingId, payload);
        setMessage("Regla actualizada");
      } else {
        await createAlertRule(payload);
        setMessage("Regla creada");
      }
      resetForm();
      loadRules();
    } catch {
      setMessage("Error al guardar la regla");
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (rule) => {
    try {
      await updateAlertRule(rule.id, { ...rule, active: !rule.active });
      loadRules();
    } catch {
      setMessage("Error al actualizar el estado");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Eliminar esta regla de alerta?")) return;
    try {
      await deleteAlertRule(id);
      setMessage("Regla eliminada");
      loadRules();
    } catch {
      setMessage("Error al eliminar la regla");
    }
  };

  return (
    <div className="alert-rules-manager">

      <div className="ar-header">
        <div>
          <h2>Reglas de Alerta</h2>
          <p className="ar-subtitle">Define cuándo el sistema debe enviar alertas por correo y notificaciones en la app.</p>
        </div>
        <button className="btn-primary" onClick={() => { resetForm(); setShowForm(!showForm); }}>
          {showForm ? "✕ Cancelar" : "+ Nueva Regla"}
        </button>
      </div>

      {message && (
        <div className={`message ${message.includes("Error") ? "error" : "success"}`}>
          {message.includes("Error") ? "❌" : "✅"} {message}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="ar-form">
          <h3>{editingId ? "Editar regla" : "Nueva regla"}</h3>
          <div className="ar-form-grid">

            <div className="form-group">
              <label>Etiqueta</label>
              <input
                type="text"
                placeholder="Ej: Temperatura crítica"
                value={form.label}
                onChange={e => setForm({ ...form, label: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Propiedad *</label>
              <input
                type="text"
                placeholder="Ej: temperature, battery_level"
                value={form.property}
                onChange={e => setForm({ ...form, property: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Operador *</label>
              <select value={form.operator} onChange={e => setForm({ ...form, operator: e.target.value })}>
                <option value="GREATER_THAN">Mayor que (&gt;)</option>
                <option value="LESS_THAN">Menor que (&lt;)</option>
              </select>
            </div>

            <div className="form-group">
              <label>Umbral *</label>
              <input
                type="number"
                step="any"
                placeholder="Ej: 80, 10"
                value={form.threshold}
                onChange={e => setForm({ ...form, threshold: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Activa</label>
              <select value={form.active ? "yes" : "no"} onChange={e => setForm({ ...form, active: e.target.value === "yes" })}>
                <option value="yes">Sí</option>
                <option value="no">No</option>
              </select>
            </div>

          </div>
          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? "Guardando..." : editingId ? "Actualizar" : "Crear regla"}
          </button>
        </form>
      )}

      {rules.length === 0 ? (
        <p className="empty-state">No hay reglas de alerta configuradas.</p>
      ) : (
        <div className="ar-table-wrapper">
          <table className="ar-table">
            <thead>
              <tr>
                <th>Etiqueta</th>
                <th>Propiedad</th>
                <th>Condición</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {rules.map((rule, i) => (
                <tr key={rule.id} style={{ background: i % 2 === 0 ? "var(--bg-card)" : "var(--bg-hover)" }}>
                  <td><strong>{rule.label || rule.property}</strong></td>
                  <td><code>{rule.property}</code></td>
                  <td>
                    <span className="ar-condition">
                      {rule.operator === "GREATER_THAN" ? ">" : "<"} {rule.threshold}
                    </span>
                  </td>
                  <td>
                    <button
                      className={`ar-toggle ${rule.active ? "active" : "inactive"}`}
                      onClick={() => handleToggle(rule)}
                    >
                      {rule.active ? "Activa" : "Inactiva"}
                    </button>
                  </td>
                  <td>
                    <div className="ar-actions">
                      <button className="btn-edit" onClick={() => handleEdit(rule)}>✏️ Editar</button>
                      <button className="btn-delete" onClick={() => handleDelete(rule.id)}>🗑️ Eliminar</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
