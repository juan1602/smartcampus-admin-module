import "./ToastAlert.css";

export default function ToastAlert({ toasts, onRemove }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast toast-${toast.type}`}>
          <span className="toast-icon">{toast.icon}</span>
          <div className="toast-body">
            <strong className="toast-title">{toast.title}</strong>
            <span className="toast-message">{toast.message}</span>
          </div>
          <button className="toast-close" onClick={() => onRemove(toast.id)}>✕</button>
        </div>
      ))}
    </div>
  );
}
