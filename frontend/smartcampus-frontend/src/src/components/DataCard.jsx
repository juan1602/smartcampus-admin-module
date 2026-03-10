import "./DataCard.css";

export default function DataCard({ title, count, data, type }) {
  return (
    <div className="data-card">
      <div className="card-header">
        <h3>{title}</h3>
        <span className="badge">{count}</span>
      </div>
      
      {data && data.length > 0 ? (
        <ul className="data-list">
          {data.map((item, index) => (
            <li key={item.id || index}>
              {type === "device" && (
                <>
                  <strong>{item.code}</strong>
                  <span className={`status ${item.status?.toLowerCase()}`}>
                    {item.status}
                  </span>
                </>
              )}
              {type === "twin" && (
                <>
                  <strong>{item.name || `Twin ${item.id}`}</strong>
                  <span className={`status ${item.status?.toLowerCase()}`}>
                    {item.status || "activo"}
                  </span>
                </>
              )}
              {type === "telemetry" && (
                <>
                  <span className="timestamp">
                    {item.timestamp
                      ? new Date(item.timestamp).toLocaleString()
                      : "Sin fecha"}
                  </span>
                  <span className="value">{item.value || "N/A"}</span>
                </>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="empty">No hay datos disponibles</p>
      )}
    </div>
  );
}
