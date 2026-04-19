import { useEffect, useState } from "react";
import {
  getAlertRules,
  createAlertRule,
  updateAlertRule,
  deleteAlertRule,
} from "../services/alertRuleService";
import "./AlertRulesManager.css";

const EMPTY_RULE = {
  property: "",
  operator: "GREATER_THAN",
  threshold: "",
  label: "",
  active: true,
};

export default function AlertRulesManager({ isAdmin }) {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_RULE);

  const load = async () => {
    try {
      const res = await getAlertRules();
      setRules(res.data || []);
    } catch (e) {
      console.error("Error al cargar reglas de alerta:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleOpenCreate = () => {
    setForm(EMPTY_RULE);
    setEditingId(null);
    setShowForm(true);
  };

  const handleOpenEdit = (rule) => {
    setForm({
      property:  rule.property,
      operator:  rule.operator,
      threshold: rule.threshold,
      label:     rule.label,
      active:    rule.active,
    });
    setEditingId(rule.id);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_RULE);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...form, threshold: parseFloat(form.threshold) };
    try {
      if (editingId) {
        await updateAlertRule(editingId, payload);
      } else {
        await createAlertRule(payload);
      }
      handleCancel();
      load();
    } catch (err) {
      console.error("Error al guardar regla:", err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Eliminar esta regla de alerta?")) return;
    try {
      await deleteAlertRule(id);
      load();
    } catch (err) {
      console.error("Error al eliminar regla:", err);
    }
  };

  const handleToggleActive = async (rule) => {
    try {
      await updateAlertRule(rule.id, { ...rule, active: !rule.active });
      load();
    } catch (err) {
      console.error("Error al cambiar estado de regla:", err);
    }
  };

  const operatorLabel = (op) =>
    op === "GREATER_THAN" ? "Mayor que ( > )" : "Menor que ( < )";

  return (
    <div className="alert-rules-manager">

      <div className="alert-rules-header">
        <div>
          <h2>Reglas de Alerta</h2>
          <p>
            Configura umbrales por propiedad. Cuando un dispositivo supere un umbral
            activo recibirás una notificación en pantalla.
          </p>
        </div>
        {isAdmin && (
          <button className="btn-add-rule" onClick={handleOpenCreate}>
            + Nueva regla
          </button>
        )}
      </div>

      <div className="alert-info-card">
        Las alertas se evalúan en el backend al recibir telemetría. Si el valor de una
        propiedad supera el umbral definido, se envía una notificación en tiempo real
        via WebSocket. Hay un <strong>cooldown de 5 minutos</strong> por regla y
        dispositivo para evitar notificaciones repetitivas.
      </div>

      {/* ── Formulario ── */}
      {showForm && isAdmin && (
        <form className="alert-rule-form" onSubmit={handleSubmit}>
          <h3>{editingId ? "Editar regla" : "Nueva regla"}</h3>

          <div className="form-row">
            <div className="form-field">
              <label>Propiedad</label>
              <input
                name="property"
                placeholder="ej: temperature, battery_level"
                value={form.property}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-field">
              <label>Operador</label>
              <select name="operator" value={form.operator} onChange={handleChange}>
                <option value="GREATER_THAN">Mayor que ( &gt; )</option>
                <option value="LESS_THAN">Menor que ( &lt; )</option>
              </select>
            </div>

            <div className="form-field">
              <label>Umbral</label>
              <input
                name="threshold"
                type="number"
                step="any"
                placeholder="ej: 80"
                value={form.threshold}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-field" style={{ flex: "3 1 280px" }}>
              <label>Etiqueta (descripción)</label>
              <input
                name="label"
                placeholder="ej: Temperatura crítica"
                value={form.label}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-field" style={{ flex: "0 0 auto", justifyContent: "flex-end" }}>
              <label>Activa</label>
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  name="active"
                  checked={form.active}
                  onChange={handleChange}
                  style={{ width: 16, height: 16 }}
                />
                {form.active ? "Sí" : "No"}
              </label>
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={handleCancel}>
              Cancelar
            </button>
            <button type="submit" className="btn-save">
              {editingId ? "Guardar cambios" : "Crear regla"}
            </button>
          </div>
        </form>
      )}

      {/* ── Tabla ── */}
      <div className="alert-rules-table-wrapper">
        {loading ? (
          <div className="empty-rules">Cargando reglas...</div>
        ) : rules.length === 0 ? (
          <div className="empty-rules">
            No hay reglas configuradas.
            {isAdmin && " Usa el botón "+ Nueva regla" para crear una."}
          </div>
        ) : (
          <table className="alert-rules-table">
            <thead>
              <tr>
                <th>Etiqueta</th>
                <th>Propiedad</th>
                <th>Condición</th>
                <th>Umbral</th>
                <th>Estado</th>
                {isAdmin && <th>Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {rules.map(rule => (
                <tr key={rule.id}>
                  <td><strong>{rule.label}</strong></td>
                  <td style={{ fontFamily: "monospace" }}>{rule.property}</td>
                  <td>
                    <span className="badge-operator">{operatorLabel(rule.operator)}</span>
                  </td>
                  <td><strong>{rule.threshold}</strong></td>
                  <td>
                    <span className={rule.active ? "badge-active" : "badge-inactive"}>
                      {rule.active ? "Activa" : "Inactiva"}
                    </span>
                  </td>
                  {isAdmin && (
                    <td>
                      <div className="rule-actions">
                        <button
                          className={`btn-toggle-rule${rule.active ? " deactivate" : ""}`}
                          onClick={() => handleToggleActive(rule)}
                        >
                          {rule.active ? "Desactivar" : "Activar"}
                        </button>
                        <button
                          className="btn-edit-rule"
                          onClick={() => handleOpenEdit(rule)}
                        >
                          Editar
                        </button>
                        <button
                          className="btn-delete-rule"
                          onClick={() => handleDelete(rule.id)}
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

    </div>
  );
}
