import "./DataCard.css";
import { useState } from "react";
import { createPortal } from "react-dom";

export default function DataCard({ title, count, data, type, onOpen, onDeviceClick }) {

  const [twinInfo, setTwinInfo] = useState(null);
  let telemetryData = {};

  if (twinInfo?.telemetryJson) {
    try {
      telemetryData = JSON.parse(twinInfo.telemetryJson);
    } catch {
      telemetryData = {};
    }
  }
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

              {/* DEVICES */}

              {type === "device" && (
                <>
                  <strong onClick={() => onDeviceClick(item)} style={{cursor:"pointer", textDecoration: "underline", textDecorationColor: "var(--primary-color)"}}
                    >
                      {item.code}
                  </strong>
                  <span className={`status ${item.status?.toLowerCase() || "unknown"}`}>
                    {item.status || "Desconocido"}
                  </span>
                </>
              )}
              

              {/* DIGITAL TWINS */}

              {type === "twin" && (
                <>
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                    <strong>{item.name || `Twin ${item.id}`}</strong>
                    {item.device?.code && (
                      <span style={{ 
                        fontSize: "0.75rem", 
                        color: "var(--text-secondary)",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px"
                      }}>
                       <span style={{ color: "var(--color-primary)", fontWeight: 600 }}>{item.device.code}</span>
                      </span>
                      )}
                  </div>

                  <button
                    className="info-button"
                    onClick={() => setTwinInfo(item)}
                  >
                    Información
                  </button>
                </>
              )}

              {/* TELEMETRY */}

              {type === "telemetry" && (
                <>
                  <span className="timestamp">
                    {item.timestamp
                      ? new Date(item.timestamp).toLocaleString()
                      : "Sin fecha"}
                  </span>

                  <span className="value">
                    {item.device?.code || "Dispositivo desconocido"}
                  </span>
                </>
              )}

            </li>

          ))}

        </ul>

      ) : (

        <p className="empty">No hay datos disponibles</p>

      )}
      {/* Boton ver historial completo - solo para telemetría */}
      {type === "telemetry" && (
        <button className="btn-ver-historial" onClick={onOpen}>
          Ver historial completo
        </button>
      )}

      {/* MODAL TWIN */}

      {twinInfo && (

        createPortal(

        <div
          className="modal-overlay"
          onClick={() => setTwinInfo(null)}
        >

          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
          >

            <h2>Información del Twin</h2>

            <p>
              <strong>ID:</strong> {twinInfo.id}
            </p>

            <p>
              <strong>Nombre:</strong> {twinInfo.name || `Twin ${twinInfo.id}`}
            </p>

            <p>
              <strong>Gemelo de:</strong>{" "}
              {twinInfo.device?.name ||
               twinInfo.device?.code ||
               "Desconocido"}
            </p>

            <p>
              <strong>Última actualización:</strong>{" "}
              {twinInfo.lastUpdate
                ? new Date(twinInfo.lastUpdate).toLocaleString()
                : "-"}
            </p>

            <p><strong>Telemetría:</strong></p>

            <div className="telemetry-grid">
              {Object.keys(telemetryData).length === 0 &&(
                <p>No hay datos de telemetría disponibles</p>
              )}
              {Object.entries(telemetryData).map(([key, value]) => (
                <div key={key} className="sensor-card">
                  <span className="sensor-name">{key.replace("_", " ")}</span>
                  <span className="sensor-value">{value}</span>
                </div>
              ))}
            </div>
            <button
              className="close-button"
              onClick={() => setTwinInfo(null)}
            >
              Cerrar
            </button>

          </div>

        </div>,

        document.body
      ))}

    </div>
  );
}