import { useEffect, useState } from "react";
import { getUsers, createUser, updateUser, deleteUser } from "../services/userService";
import "./UserManager.css";

const EMPTY_FORM = { username: "", password: "", role: "VIEWER" };

export default function UserManager() {
  const [users, setUsers]       = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm]         = useState(EMPTY_FORM);
  const [loading, setLoading]   = useState(false);
  const [message, setMessage]   = useState({ text: "", type: "" });

  const currentUsername = localStorage.getItem("username");

  useEffect(() => { loadUsers(); }, []);

  useEffect(() => {
    if (message.text) {
      const t = setTimeout(() => setMessage({ text: "", type: "" }), 5000);
      return () => clearTimeout(t);
    }
  }, [message]);

  const loadUsers = async () => {
    try {
      const res = await getUsers();
      setUsers(res.data || []);
    } catch {
      setMessage({ text: "Error al cargar usuarios", type: "error" });
    }
  };

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (user) => {
    setForm({ username: user.username, password: "", role: user.role });
    setEditingId(user.id);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username.trim()) {
      setMessage({ text: "El nombre de usuario es requerido", type: "error" });
      return;
    }
    if (!editingId && !form.password.trim()) {
      setMessage({ text: "La contraseña es requerida al crear un usuario", type: "error" });
      return;
    }
    setLoading(true);
    try {
      const payload = { username: form.username, role: form.role };
      if (form.password.trim()) payload.password = form.password;

      if (editingId) {
        await updateUser(editingId, payload);
        setMessage({ text: "Usuario actualizado correctamente", type: "success" });
      } else {
        await createUser(payload);
        setMessage({ text: "Usuario creado correctamente", type: "success" });
      }
      resetForm();
      loadUsers();
    } catch (err) {
      const msg = err.response?.data?.error || "Error al guardar el usuario";
      setMessage({ text: msg, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (user) => {
    if (!window.confirm(`¿Eliminar el usuario "${user.username}"?`)) return;
    try {
      await deleteUser(user.id);
      setMessage({ text: "Usuario eliminado", type: "success" });
      loadUsers();
    } catch (err) {
      const msg = err.response?.data?.error || "Error al eliminar el usuario";
      setMessage({ text: msg, type: "error" });
    }
  };

  return (
    <div className="user-manager">

      <div className="um-header">
        <div>
          <h2>Gestión de Usuarios</h2>
          <p className="um-subtitle">Administra los usuarios que tienen acceso al sistema.</p>
        </div>
        <button className="btn-primary" onClick={() => { resetForm(); setShowForm(!showForm); }}>
          {showForm ? "✕ Cancelar" : "+ Nuevo Usuario"}
        </button>
      </div>

      {message.text && (
        <div className={`message ${message.type}`}>
          {message.type === "error" ? "❌" : "✅"} {message.text}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="um-form">
          <h3>{editingId ? "Editar usuario" : "Nuevo usuario"}</h3>
          <div className="um-form-grid">

            <div className="form-group">
              <label>Usuario *</label>
              <input
                type="text"
                placeholder="Ej: juan.perez"
                value={form.username}
                onChange={e => setForm({ ...form, username: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>{editingId ? "Nueva contraseña (dejar vacío para no cambiar)" : "Contraseña *"}</label>
              <input
                type="password"
                placeholder={editingId ? "Dejar vacío para no cambiar" : "Mínimo 6 caracteres"}
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                required={!editingId}
              />
            </div>

            <div className="form-group">
              <label>Rol *</label>
              <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                <option value="ADMIN">ADMIN — Acceso total</option>
                <option value="VIEWER">VIEWER — Solo lectura</option>
              </select>
            </div>

          </div>
          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? "Guardando..." : editingId ? "Actualizar usuario" : "Crear usuario"}
          </button>
        </form>
      )}

      <div className="um-table-wrapper">
        <table className="um-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Usuario</th>
              <th>Rol</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ textAlign: "center", padding: 32, color: "var(--text-secondary)" }}>
                  No hay usuarios registrados
                </td>
              </tr>
            ) : users.map((user, i) => (
              <tr key={user.id} style={{ background: i % 2 === 0 ? "var(--bg-card)" : "var(--bg-hover)" }}>
                <td style={{ color: "var(--text-secondary)", fontSize: 13 }}>{user.id}</td>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <strong>{user.username}</strong>
                    {user.username === currentUsername && (
                      <span style={{
                        fontSize: 11, padding: "1px 7px", borderRadius: 999,
                        background: "rgba(0,108,53,0.15)", color: "var(--color-primary)", fontWeight: 600
                      }}>
                        Tú
                      </span>
                    )}
                  </div>
                </td>
                <td>
                  <span className={`um-role-badge ${user.role.toLowerCase()}`}>
                    {user.role}
                  </span>
                </td>
                <td>
                  <div className="um-actions">
                    <button className="btn-edit" onClick={() => handleEdit(user)}>
                      ✏️ Editar
                    </button>
                    <button
                      className="btn-delete"
                      onClick={() => handleDelete(user)}
                      disabled={user.username === currentUsername}
                      title={user.username === currentUsername ? "No puedes eliminarte a ti mismo" : ""}
                    >
                      🗑️ Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}
