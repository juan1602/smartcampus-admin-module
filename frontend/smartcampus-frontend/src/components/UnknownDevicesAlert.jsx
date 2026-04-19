import { useEffect, useState } from "react";
import { getUnknownDevices, ignoreUnknownDevice } from "../services/unknownDeviceService";
import "./UnknownDevicesAlert.css";

export default function UnknownDevicesAlert({ onCreateDevice, newEventSignal }) {
  const [events, setEvents] = useState([]);
  const [expanded, setExpanded] = useState(true);

  useEffect(() => { load(); }, []);

  // Recarga cuando llega un nuevo evento por WebSocket
  useEffect(() => {
    if (newEventSignal) load();
  }, [newEventSignal]);

  const load = async () => {
    try {
      const res = await getUnknownDevices();
      setEvents(res.data || []);
    } catch {
      setEvents([]);
    }
  };

  const handleIgnore = async (id) => {
    try {
      await ignoreUnknownDevice(id);
      setEvents(prev => prev.filter(e => e.id !== id));
    } catch {}
  };

  const handleCreate = (event) => {
    let parsedData = {};
    try { parsedData = JSON.parse(event.telemetryJson || "{}"); } catch {}
    onCreateDevice({ code: event.deviceCode, telemetryJson: parsedData });
  };

  if (events.length === 0) return null;

  return (
    <div className="uda-wrapper">
      <div className="uda-header" onClick={() => setExpanded(p => !p)}>
        <div className="uda-title">
          <span className="uda-icon">⚠️</span>
          <strong>Dispositivos desconocidos detectados</strong>
          <span className="uda-badge">{events.length}</span>
        </div>
        <span className="uda-toggle">{expanded ? "▲" : "▼"}</span>
      </div>

      {expanded && (
        <div className="uda-list">
          {events.map(event => {
            let data = {};
            try { data = JSON.parse(event.telemetryJson || "{}"); } catch {}
            const dataEntries = Object.entries(data).slice(0, 5);

            return (
              <div key={event.id} className="uda-item">
                <div className="uda-item-info">
                  <span className="uda-code">{event.deviceCode}</span>
                  <span className="uda-time">
                    {new Date(event.receivedAt).toLocaleString("es-CO")}
                  </span>
                  <div className="uda-payload">
                    {dataEntries.map(([k, v]) => (
                      <span key={k} className="uda-prop">
                        <em>{k}:</em> {String(v)}
                      </span>
                    ))}
                    {Object.keys(data).length > 5 && (
                      <span className="uda-prop-more">+{Object.keys(data).length - 5} más</span>
                    )}
                  </div>
                </div>
                <div className="uda-actions">
                  <button className="btn-uda-create" onClick={() => handleCreate(event)}>
                    ✚ Crear dispositivo
                  </button>
                  <button className="btn-uda-ignore" onClick={() => handleIgnore(event.id)}>
                    ✕ Ignorar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
