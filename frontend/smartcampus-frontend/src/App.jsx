import { useEffect, useState } from "react";
import { getDevices } from "./services/deviceService";
import { getTwins } from "./services/twinService";
import { getTelemetry } from "./services/telemetryService";
import { getProperties } from "./services/propertyService";
import DataCard from "./components/DataCard";
import DeviceManager from "./components/DeviceManager";
import PropertyManager from "./components/PropertyManager";
import Tabs from "./components/Tabs";
import "./App.css";

function App() {
  const [devices, setDevices] = useState([]);
  const [twins, setTwins] = useState([]);
  const [telemetry, setTelemetry] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState("all");

  useEffect(() => {
    loadData();

    const interval = setInterval(() => {
      loadData();
    }, 100000);

    return () => clearInterval(interval);
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

  // 🔹 Filtrar telemetría por dispositivo
  const filteredTelemetry =
    selectedDevice === "all"
      ? telemetry
      : telemetry.filter(t => t.device?.id === Number(selectedDevice));

  const parsedTelemetry = filteredTelemetry.flatMap(item => {
  try {
    const telemetryData = JSON.parse(item.device?.twin?.telemetryJson || "{}");

    return Object.entries(telemetryData).map(([key, value]) => ({
      timestamp: item.timestamp,
      deviceId: item.device?.id,
      property: key,
      value: value
    }));
  } catch {
    return [];
  }
});
  // 🔹 Ordenar por fecha (más reciente primero)
  const sortedTelemetry = [...parsedTelemetry].sort(
    (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
  );

  // 🔹 Limitar a 100 registros
  const limitedTelemetry = sortedTelemetry.slice(0, 100);

  // 🔹 Crear mapa de dispositivos (más eficiente)
  const deviceMap = {};
  devices.forEach(d => {
    deviceMap[d.id] = d.code;
  });

  const deviceOptions = devices.map(d => ({
    id: d.id,
    code: d.code
  }));

  const tabs = [
    {
      label: `📊 Dashboard`,
      content: (
        <div className="dashboard-grid">

          <DataCard
            title="Dispositivos"
            count={devices.length}
            data={devices}
            type="device"
          />

          <DataCard
            title="Digital Twins"
            count={twins.length}
            data={twins}
            type="twin"
          />
          <DataCard
            title="Historial de Telemetría"
            count={telemetry.length}
            data={telemetry.slice(0, 5)} // mostrar solo los 5 más recientes en el dashboard
            type="telemetry"
            onOpen={() => setShowHistoryModal(true)}
          />

        </div>
      )
    },
    {
      label: `📱 Dispositivos`,
      content: (
        <DeviceManager
          devices={devices}
          properties={properties}
          onRefresh={loadData}
        />
      )
    },
    {
      label: `⚙️ Propiedades`,
      content: (
        <PropertyManager
          properties={properties}
          onRefresh={loadData}
        />
      )
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
          <Tabs tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab} />
        )}

        {/* 🔹 MODAL HISTORIAL */}
        {showHistoryModal && (
          <div
            className="modal-overlay"
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100vw",
              height: "100vh",
              background: "rgba(0,0,0,0.3)",
              zIndex: 1000
            }}
          >

            <div
              className="modal-content"
              style={{
                background: "#fff",
                margin: "5% auto",
                padding: 24,
                borderRadius: 8,
                maxWidth: 700,
                boxShadow: "0 2px 8px rgba(0,0,0,0.2)"
              }}
            >

              <h2>Historial de Telemetría</h2>

              <div style={{ marginBottom: 16 }}>
                <label>Filtrar por dispositivo: </label>

                <select
                  value={selectedDevice}
                  onChange={e => setSelectedDevice(e.target.value)}
                >
                  <option value="all">Todos</option>

                  {deviceOptions.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.code}
                    </option>
                  ))}

                </select>

              </div>

              <div style={{ maxHeight: 400, overflowY: "auto" }}>

                {limitedTelemetry.length === 0 ? (
                  <p>No hay registros de telemetría.</p>
                ) : (

                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse"
                    }}
                  >

                    <thead>
                      <tr>
                        <th style={{ borderBottom: "1px solid #ccc" }}>Fecha</th>
                        <th style={{ borderBottom: "1px solid #ccc" }}>Dispositivo</th>
                        <th style={{ borderBottom: "1px solid #ccc" }}>Propiedad</th>
                        <th style={{ borderBottom: "1px solid #ccc" }}>Valor</th>
                      </tr>
                    </thead>

                    <tbody>

                      {limitedTelemetry.map((item, idx) => (

                        <tr key={item.id || idx}>

                          <td>
                            {item.timestamp
                              ? new Date(item.timestamp).toLocaleString()
                              : "Sin fecha"}
                          </td>

                          <td>
                            {deviceMap[item.deviceId] || "N/A"}
                          </td>

                          <td>
                            {item.property || "N/A"}
                          </td>
                          <td>
                            {item.value || "N/A"}
                          </td>

                          

                        </tr>

                      ))}

                    </tbody>

                  </table>

                )}

              </div>

              <button
                style={{ marginTop: 16 }}
                onClick={() => setShowHistoryModal(false)}
              >
                Cerrar
              </button>

            </div>
          </div>
        )}

      </main>

      <footer className="app-footer">
        <p>
          Smart Campus UIS © 2026 | Desarrollado por el equipo de proyecto de grado
        </p>
      </footer>

    </div>
  );
}

export default App;