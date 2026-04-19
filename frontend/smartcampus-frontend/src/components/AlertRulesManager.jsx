import { useEffect, useState } from "react";
import {
  getAlertRules,
  createAlertRule,
  updateAlertRule,
  deleteAlertRule,
} from "../services/alertRuleService";
import { getProperties } from "../services/propertyService";
import "./AlertRulesManager.css";

const EMPTY_RULE = {
  property:  "",
  operator:  "GREATER_THAN",
  threshold: "",
  label:     "",
  active:    true,
};

export default function AlertRulesManager({ isAdmin }) {
  const [rules,      setRules]      = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [showForm,   setShowForm]   = useState(false);
  const [editingId,  setEditingId]  = useState(null);
  const [form,       setForm]       = useState(EMPTY_RULE);
  const [saving,     setSaving]     = useState(false);

  const loadRules = async () => {
    try {
      const res = await getAlertRules();
      setRules(res.data || []);
    } catch (e) {
      console.error("Error al cargar reglas:", e);
    } finally {
      setLoading(false);
    }
  };

  const loadProperties = async () => {
    try {
      const res = await getProperties();
      // Deduplica por nombre para el selector
      const unique = [];
      const seen   = new Set();
      (res.data || []).forEach(p => {
        const key = p.name.toLowerCase();
        if (!seen.has(key)) { seen.add(key); unique.push(p); }
      });
      setProperties(unique);
    } catch (e) {
      console.error("Error al cargar propiedades:", e);
    }
  };

  useEffect(() => {
    loadRules();
    loadProperties();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
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
      threshold: String(rule.threshold),
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
    setSaving(true);
    const payload = { ...form, threshold: parseFloat(form.threshold), active: form.active === true || form.active === "true" };
    try {
      if (editingId) {
        await updateAlertRule(editingId, payload);
      } else {
        await createAlertRule(payload);
      }
      handleCancel();
      loadRules();
    } catch (err) {
      console.error("Error al guardar regla:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Eliminar esta regla de alerta?")) return;
    try {
      await deleteAlertRule(id);
      loadRules();
    } catch (err) {
      console.error("Error al eliminar regla:", err);
    }
  };

  const handleToggleActive = async (rule) => {
    try {
      await updateAlertRule(rule.id, { ...rule, active: !rule.active });
      loadRules();
    } catch (err) {
      console.error("Error al cambiar estado:", err);
    }
  };

  const operatorLabel = (op) =>
    op === "GREATER_THAN" ? "Mayor que ( > )" : "Menor que ( < )";

  return (
    <div className="arm-wrapper">

      {/* ── Cabecera ── */}
      <div className="arm-header">
        <div className="arm-header-text">
          <h2>Reglas de Alerta</h2>
          <p>
            Configura umbrales por propiedad. Cuando se supere un umbral activo
            recibirás una notificación en pantalla en tiempo real.
          </p>
        </div>
        {isAdmin && !showForm && (
          <button className="arm-btn-primary" onClick={handleOpenCreate}>
            + Nueva regla
          </button>
        )}
      </div>

      {/* ── Info banner ── */}
      <div className="arm-info-banner">
        <span className="arm-info-icon">ℹ️</span>
        <span>
          Las alertas se evalúan en el backend. Hay un{" "}
          <strong>cooldown de 5 minutos</strong> por regla y dispositivo
          para evitar notificaciones repetidas.
        </span>
      </div>

      {/* ── Formulario ── */}
      {showForm && isAdmin && (
        <div className="arm-form-card">
          <div className="arm-form-title">
            <span>{editingId ? "✏️ Editar regla" : "➕ Nueva regla"}</span>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="arm-form-grid">

              {/* Propiedad */}
              <div className="arm-field">
                <label className="arm-label">Propiedad <span className="arm-required">*</span></label>
                <select
                  name="property"
                  value={form.property}
                  onChange={handleChange}
                  className="arm-select"
                  required
                >
                  <option value="">— Selecciona una propiedad —</option>
                  {properties.map(p => (
                    <option key={p.id} value={p.name.toLowerCase()}>
                      {p.name}
                      {p.unit ? ` (${p.unit})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Operador */}
              <div className="arm-field">
                <label className="arm-label">Condición <span className="arm-required">*</span></label>
                <select
                  name="operator"
                  value={form.operator}
                  onChange={handleChange}
                  className="arm-select"
                >
                  <option value="GREATER_THAN">Mayor que ( &gt; )</option>
                  <option value="LESS_THAN">Menor que ( &lt; )</option>
                </select>
              </div>

              {/* Umbral */}
              <div className="arm-field">
                <label className="arm-label">Umbral <span className="arm-required">*</span></label>
                <input
                  type="number"
                  name="threshold"
                  step="any"
                  placeholder="Ej: 80"
                  value={form.threshold}
                  onChange={handleChange}
                  className="arm-input"
                  required
                />
              </div>

              {/* Estado */}
              <div className="arm-field">
                <label className="arm-label">Estado</label>
                <select
                  name="active"
                  value={String(form.active)}
                  onChange={handleChange}
                  className="arm-select"
                >
                  <option value="true">Activa</option>
                  <option value="false">Inactiva</option>
                </select>
              </div>

              {/* Etiqueta — ocupa todo el ancho */}
              <div className="arm-field arm-field-full">
                <label className="arm-label">Etiqueta descriptiva <span className="arm-required">*</span></label>
                <input
                  type="text"
                  name="label"
                  placeholder="Ej: Temperatura crítica del sensor"
                  value={form.label}
                  onChange={handleChange}
                  className="arm-input"
                  required
                />
              </div>

            </div>

            <div className="arm-form-actions">
              <button type="button" className="arm-btn-cancel" onClick={handleCancel}>
                Cancelar
              </button>
              <button type="submit" className="arm-btn-primary" disabled={saving}>
                {saving ? "Guardando..." : editingId ? "Guardar cambios" : "Crear regla"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Tabla de reglas ── */}
      <div className="arm-table-card">
        {loading ? (
          <div className="arm-empty">Cargando reglas...</div>
        ) : rules.length === 0 ? (
          <div className="arm-empty">
            <div className="arm-empty-icon">🔔</div>
            <p>No hay reglas configuradas.</p>
            {isAdmin && (
              <p style={{ fontSize: 13, marginTop: 4 }}>
                Usa el botón <strong>"+ Nueva regla"</strong> para crear una.
              </p>
            )}
          </div>
        ) : (
          <table className="arm-table">
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
                  <td>
                    <span className="arm-rule-label">{rule.label}</span>
                  </td>
                  <td>
                    <code className="arm-code">{rule.property}</code>
                  </td>
                  <td>
                    <span className="arm-badge arm-badge-op">
                      {operatorLabel(rule.operator)}
                    </span>
                  </td>
                  <td>
                    <strong className="arm-threshold">{rule.threshold}</strong>
                  </td>
                  <td>
                    <span className={`arm-badge ${rule.active ? "arm-badge-active" : "arm-badge-inactive"}`}>
                      {rule.active ? "Activa" : "Inactiva"}
                    </span>
                  </td>
                  {isAdmin && (
                    <td>
                      <div className="arm-actions">
                        <button
                          className={`arm-btn-sm ${rule.active ? "arm-btn-sm-muted" : "arm-btn-sm-green"}`}
                          onClick={() => handleToggleActive(rule)}
                          title={rule.active ? "Desactivar" : "Activar"}
                        >
                          {rule.active ? "Desactivar" : "Activar"}
                        </button>
                        <button
                          className="arm-btn-sm arm-btn-sm-blue"
                          onClick={() => handleOpenEdit(rule)}
                          title="Editar"
                        >
                          Editar
                        </button>
                        <button
                          className="arm-btn-sm arm-btn-sm-red"
                          onClick={() => handleDelete(rule.id)}
                          title="Eliminar"
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
