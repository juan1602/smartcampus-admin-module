import { useEffect, useState } from "react";
import { getDevices } from "./src/services/deviceService";
import { getTwins } from "./src/services/twinService";
import { getTelemetry } from "./src/services/telemetryService";
import { getProperties } from "./src/services/propertyService";
import DataCard from "./src/components/DataCard";
import DeviceManager from "./src/components/DeviceManager";
import PropertyManager from "./src/components/PropertyManager";
import Tabs from "./src/components/Tabs";
import "./App.css";

function App() {
  const [devices, setDevices] = useState([]);
  const [twins, setTwins] = useState([]);
  const [telemetry, setTelemetry] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [devicesRes, twinsRes, telemetryRes, propertiesRes] = await Promise.all([
        getDevices(),
        getTwins(),
        getTelemetry(),
        getProperties()
      ]);

      setDevices(devicesRes.data || []);
      setTwins(twinsRes.data || []);
      setTelemetry(telemetryRes.data || []);
      setProperties(propertiesRes.data || []);
      setError(null);
    } catch (err) {
      console.error("Error al cargar datos:", err);
      setError("No se pudieron cargar los datos. Verifica que el backend esté corriendo.");
    } finally {
      setLoading(false);
    }
  };

  // Estado para el modal de historial
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState("all");

  // Filtrar telemetría por dispositivo
  const filteredTelemetry = selectedDevice === "all"
    ? telemetry
    : telemetry.filter(t => t.deviceId === selectedDevice);

  // Obtener lista de dispositivos para el filtro
  const deviceOptions = devices.map(d => ({ id: d.id, code: d.code }));

  const tabs = [
    {
      label: `📊 Dashboard`,
      content: (
        <div className="dashboard-grid">
          <DataCard title="Dispositivos" count={devices.length} data={devices} type="device" />
          <DataCard title="Digital Twins" count={twins.length} data={twins} type="twin" />
          <div style={{ cursor: "pointer" }} onClick={() => setShowHistoryModal(true)}>
            <DataCard title="Historial" count={telemetry.length} data={telemetry.slice(0, 5)} type="telemetry" />
          </div>
        </div>
      )
    },
    {
      label: `📱 Dispositivos`,
      content: <DeviceManager devices={devices} properties={properties} onRefresh={loadData} />
    },
    {
      label: `⚙️ Propiedades`,
      content: <PropertyManager properties={properties} onRefresh={loadData} />
    }
  ];

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-content">
          <div>
            <h1>🏫 Smart Campus UIS</h1>
            <p>Panel de Control y Gestión</p>
          </div>
          <div className="header-actions">
            <button 
              onClick={loadData} 
              className="btn-refresh"
              disabled={loading}
            >
              {loading ? "Actualizando..." : "🔄 Actualizar"}
            </button>
          </div>
        </div>
      </header>

      <main className="app-main">
        {error && (
          <div className="error-banner">
            <span>⚠️ {error}</span>
            <button onClick={loadData}>Reintentar</button>
          </div>
        )}

        {loading && devices.length === 0 ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Cargando datos...</p>
          </div>
        ) : (
          <Tabs tabs={tabs} defaultTab={0} />
        )}

        {/* Modal de historial */}
        {showHistoryModal && (
          <div className="modal-overlay" style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "rgba(0,0,0,0.3)", zIndex: 1000 }}>
            <div className="modal-content" style={{ background: "#fff", margin: "5% auto", padding: 24, borderRadius: 8, maxWidth: 600, boxShadow: "0 2px 8px rgba(0,0,0,0.2)" }}>
              <h2>Historial de Telemetría</h2>
              <div style={{ marginBottom: 16 }}>
                <label>Filtrar por dispositivo: </label>
                <select value={selectedDevice} onChange={e => setSelectedDevice(e.target.value)}>
                  <option value="all">Todos</option>
                  {deviceOptions.map(d => (
                    <option key={d.id} value={d.id}>{d.code}</option>
                  ))}
                </select>
              </div>
              <div style={{ maxHeight: 350, overflowY: "auto" }}>
                {filteredTelemetry.length === 0 ? (
                  <p>No hay registros de telemetría.</p>
                ) : (
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr>
                        <th style={{ borderBottom: "1px solid #ccc" }}>Fecha</th>
                        <th style={{ borderBottom: "1px solid #ccc" }}>Valor</th>
                        <th style={{ borderBottom: "1px solid #ccc" }}>Dispositivo</th>
                        <th style={{ borderBottom: "1px solid #ccc" }}>Detalles</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTelemetry.map((item, idx) => (
                        <tr key={item.id || idx}>
                          <td>{item.timestamp ? new Date(item.timestamp).toLocaleString() : "Sin fecha"}</td>
                          <td>{item.value || "N/A"}</td>
                          <td>{devices.find(d => d.id === item.deviceId)?.code || "N/A"}</td>
                          <td>
                            <pre style={{ fontSize: 12, background: "#f6f6f6", padding: 4, borderRadius: 4 }}>{JSON.stringify(item, null, 2)}</pre>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
              <button style={{ marginTop: 16 }} onClick={() => setShowHistoryModal(false)}>Cerrar</button>
            </div>
          </div>
        )}
      </main>

      <footer className="app-footer">
        <p>
          Smart Campus UIS © 2026 | Desarrollado por el equipo de proyecto de grado |
        </p>
      </footer>
    </div>
  );
}

export default App;