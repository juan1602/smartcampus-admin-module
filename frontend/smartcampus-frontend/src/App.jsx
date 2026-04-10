import { useEffect, useState } from "react";
import { getDevices } from "./services/deviceService";
import { getTwins } from "./services/twinService";
import { getTelemetry, getTelemetryByDevice } from "./services/telemetryService";
import { getProperties } from "./services/propertyService";
import DataCard from "./components/DataCard";
import DeviceManager from "./components/DeviceManager";
import PropertyManager from "./components/PropertyManager";
import Tabs from "./components/Tabs";
import "./App.css";
import TelemetryCharts from "./components/TelemetryCharts";

function App() {

  // ── Estados globales de datos ───────────────────────────────────────────────
  const [highlightedDeviceId, setHighlightedDeviceId] = useState(null);
  const [devices, setDevices] = useState([]);
  const [twins, setTwins] = useState([]);
  const [telemetry, setTelemetry] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);

  // ── Estados del modal de historial ─────────────────────────────────────────
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState("all");
  // modalTelemetry guarda los registros del modal por separado
  // para no mezclarlos con la telemetría del dashboard
  const [modalTelemetry, setModalTelemetry] = useState([]);
  const [modalLoading, setModalLoading] = useState(false);
  // searchText es el texto del buscador dentro del modal
  const [searchText, setSearchText] = useState("");

  // ── Estado para pausar polling durante edición ───────────────────────────────
  const [isFormOpen, setIsFormOpen] = useState(false);

  // ── Carga inicial y polling cada 10 segundos (pausa si hay formulario abierto) 
  useEffect(() => {
  loadData();
}, []);

useEffect(() => {
  if (isFormOpen) return;
  const interval = setInterval(() => loadData(), 10000);
  return () => clearInterval(interval);
}, [isFormOpen]);

  // Carga todos los datos del dashboard en paralelo
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

  // ── Lógica del modal de historial ──────────────────────────────────────────

  // Se llama al hacer clic en "Ver historial completo" en la DataCard de telemetría.
  // Abre el modal, resetea filtros y carga todos los registros desde el backend.
  const handleOpenHistorial = async () => {
    setShowHistoryModal(true);
    setSelectedDevice("all");
    setSearchText("");
    await loadModalTelemetry("all");
  };

  // Carga la telemetría para el modal.
  // Si deviceId es "all" trae todos los registros,
  // si no, llama al endpoint filtrado por dispositivo en el backend.
  const loadModalTelemetry = async (deviceId) => {
    setModalLoading(true);
    try {
      const res = deviceId === "all"
        ? await getTelemetry()
        : await getTelemetryByDevice(deviceId);
      setModalTelemetry(res.data || []);
    } catch (err) {
      console.error("Error al cargar telemetría del modal:", err);
      setModalTelemetry([]);
    } finally {
      setModalLoading(false);
    }
  };

  // Se llama cuando el usuario cambia el select de dispositivo en el modal.
  // Actualiza el estado y recarga los datos desde el backend.
  const handleDeviceFilter = async (deviceId) => {
    setSelectedDevice(deviceId);
    await loadModalTelemetry(deviceId);
  };

  // ── Procesamiento de datos del modal ───────────────────────────────────────

  // Convierte cada registro de telemetría en filas individuales por propiedad.
  // Lee record.telemetryJson directamente — ese es el campo correcto del backend.
  const parsedModalRows = modalTelemetry.flatMap(record => {
    try {
      const data = JSON.parse(record.telemetryJson || "{}");
      return Object.entries(data).map(([key, value]) => ({
        timestamp: record.timestamp,
        deviceCode: record.device?.code,
        property: key,
        value: String(value),
        rowId: `${record.id}-${key}`
      }));
    } catch {
      return [];
    }
  });

  // Filtra las filas por el texto del buscador (dispositivo, propiedad o valor)
  const filteredRows = parsedModalRows.filter(row => {
    if (!searchText) return true;
    const q = searchText.toLowerCase();
    return (
      row.deviceCode?.toLowerCase().includes(q) ||
      row.property?.toLowerCase().includes(q) ||
      row.value?.toLowerCase().includes(q)
    );
  });

  // Ordena por fecha más reciente y limita a 100 filas
  const limitedRows = [...filteredRows]
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 100);

  // ── Definición de tabs ─────────────────────────────────────────────────────
  const tabs = [
    {
      label: `Dashboard`,
      content: (
        <div className="dashboard-grid">
          <DataCard
            title="Dispositivos"
            count={devices.length}
            data={devices}
            type="device"
            onDeviceClick={(device) => {
              setActiveTab(1);
              setHighlightedDeviceId(device.id);
            }}
          />
          <DataCard
            title="Digital Twins"
            count={twins.length}
            data={twins}
            type="twin"
          />
          {/* onOpen llama a handleOpenHistorial que carga los datos al abrir */}
          <DataCard
            title="Historial de Telemetría"
            count={telemetry.length}
            data={telemetry.slice(0, 5)}
            type="telemetry"
            onOpen={handleOpenHistorial}
          />
        </div>
      )
    },
    {
      label: `Dispositivos`,
      content: (
        <DeviceManager
          twins={twins}
          devices={devices}
          properties={properties}
          onRefresh={loadData}
          onFormOpen={setIsFormOpen}
          highlightedDeviceId={highlightedDeviceId}
          onClearHighlight={() => setHighlightedDeviceId(null)}
        />
      )
    },
    {
      label: `Propiedades`,
      content: (
        <PropertyManager
          properties={properties}
          onRefresh={loadData}
        />
      )
    },
    {
      label: `Gráficas`,
      content: (
        <TelemetryCharts devices={devices}/>
      )
    }
  ];

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="app-container">

      <header className="app-header">
        <div className="header-content">
          <div>
            <h1>Smart Campus UIS</h1>
            <p>Panel de Control y Gestión</p>
          </div>
          <div className="header-actions">
            <button onClick={loadData} className="btn-refresh" disabled={loading}>
              {loading ? "Actualizando..." : "🔄 Actualizar"}
            </button>
          </div>
        </div>
      </header>

      <main className="app-main">

        {/* Banner de error — aparece si loadData falla */}
        {error && (
          <div className="error-banner">
            <span>⚠️ {error}</span>
            <button onClick={loadData}>Reintentar</button>
          </div>
        )}

        {/* Muestra spinner solo en la carga inicial (cuando no hay datos aún) */}
        {loading && devices.length === 0 ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Cargando datos...</p>
          </div>
        ) : (
          <Tabs tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab} />
        )}

        {/* Modal de historial de telemetría */}
        {showHistoryModal && (
          // Clic en el fondo oscuro cierra el modal
          <div
            onClick={() => setShowHistoryModal(false)}
            style={{
              position: "fixed", top: 0, left: 0,
              width: "100vw", height: "100vh",
              background: "rgba(0,0,0,0.45)",
              zIndex: 1000,
              display: "flex", alignItems: "flex-start", justifyContent: "center",
              paddingTop: "4vh",
            }}
          >
            {/* stopPropagation evita que el clic dentro cierre el modal */}
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                background: "var(--bg-card)",
                borderRadius: 12,
                boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
                padding: 28,
                width: "90%",
                maxWidth: 860,
                maxHeight: "88vh",
                display: "flex",
                flexDirection: "column",
                gap: 16,
                color: "var(--text-primary)"
              }}
            >
              {/* Encabezado del modal */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h2 style={{ margin: 0, fontSize: 20 }}>📡 Historial de Telemetría</h2>
                <button
                  onClick={() => setShowHistoryModal(false)}
                  style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#666" }}
                >✕</button>
              </div>

              {/* Filtros: select de dispositivo + buscador de texto */}
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>

                {/* Select — al cambiar llama al backend con el dispositivo seleccionado */}
                <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: "1 1 200px" }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "#555" }}>Filtrar por dispositivo</label>
                 <select
  value={selectedDevice}
  onChange={(e) => handleDeviceFilter(e.target.value)}
  style={{
    padding: "8px 12px",
    borderRadius: 8,
    border: `1.5px solid var(--border-color)`,
    fontSize: 14,
    background: "var(--bg-main)",
    color: "var(--text-primary)",
    cursor: "pointer",
    transition: "border-color 0.2s ease, background 0.2s ease",
  }}
>
                    <option value="all">Todos los dispositivos</option>
                    {devices.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.code}{d.name ? ` — ${d.name}` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Buscador — filtra sobre los datos ya cargados en el frontend */}
                <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: "2 1 260px" }}>
  <label style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>Buscar</label>
  <input
    type="text"
    placeholder="Buscar por propiedad, valor o dispositivo..."
    value={searchText}
    onChange={(e) => setSearchText(e.target.value)}
    style={{
      padding: "8px 12px",
      borderRadius: 8,
      border: `1.5px solid var(--border-color)`,
      fontSize: 14,
      background: "var(--bg-main)",
      color: "var(--text-primary)",
      fontFamily: "inherit",
      transition: "border-color 0.2s ease, background 0.2s ease",
    }}
  />
</div>

                <div style={{ display: "flex", alignItems: "flex-end" }}>
                  <button
  onClick={() => loadModalTelemetry(selectedDevice)}
  disabled={modalLoading}
  style={{
  padding: "6px 14px",
  borderRadius: 8,
  background: "var(--color-primary)", // color principal del mockup
  color: "#fff",
  border: "1px solid var(--color-primary)",
  fontWeight: 600,
  fontFamily: "inherit",
  fontSize: 14,
  cursor: modalLoading ? "not-allowed" : "pointer",
  opacity: modalLoading ? 0.7 : 1,
  transition: "background 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease",
  boxShadow: modalLoading ? "none" : "0 4px 12px rgba(0,108,53,0.4)",
}}
  onMouseEnter={(e) => !modalLoading && (e.currentTarget.style.background = "#00532b")}
  onMouseLeave={(e) => !modalLoading && (e.currentTarget.style.background = "var(--color-primary)")}
>
  {modalLoading ? "⏳ Cargando..." : "🔄 Actualizar"}
</button>
                </div>
              </div>

              {/* Contador de registros visibles */}
              <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
  Mostrando <strong style={{ color: "var(--text-primary)" }}>{limitedRows.length}</strong> de <strong style={{ color: "var(--text-primary)" }}>{filteredRows.length}</strong> registros
  {filteredRows.length > 100 && " (máximo 100)"}
</div>

              {/* Tabla de resultados */}
              <div style={{ overflowY: "auto", flex: 1, borderRadius: 8, border: "1px solid var(--border-color)", background: "var(--bg-card)" }}>
                {modalLoading ? (
                  <div style={{ padding: 40, textAlign: "center", color: "var(--text-secondary)" }}>Cargando datos...</div>
                ) : limitedRows.length === 0 ? (
                  <div style={{ padding: 40, textAlign: "center", color: "var(--text-secondary)" }}>No hay registros de telemetría.</div>
                ) : (
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                    <thead>
                      <tr style={{ background: "var(--bg-card)", position: "sticky", top: 0 }}>
                        <th style={thStyle}>Fecha / Hora</th>
                        <th style={thStyle}>Dispositivo</th>
                        <th style={thStyle}>Propiedad</th>
                        <th style={thStyle}>Valor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {limitedRows.map((row, idx) => (
                        <tr key={row.rowId} style={{ background: idx % 2 === 0 ? "var(--bg-card)" : "var(--bg-hover)" }}>
                          <td style={tdStyle}>
                            {row.timestamp ? new Date(row.timestamp).toLocaleString() : "Sin fecha"}
                          </td>
                          <td style={tdStyle}>
                            <span style={{ background: "var(--bg-card)", color: "var(--color-primary)", padding: "2px 8px", borderRadius: 12, fontWeight: 600, fontSize: 12 }}>
                              {row.deviceCode}
                            </span>
                          </td>
                          <td style={{ ...tdStyle, fontFamily: "monospace", color: "var(--text-primary)" }}>{row.property}</td>
                          <td style={{ ...tdStyle, fontWeight: 600 }}>{row.value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Botón cerrar en el footer del modal */}
              <div style={{ textAlign: "right" }}>
                <button
                  onClick={() => setShowHistoryModal(false)}
                  style={{ padding: "8px 24px", borderRadius: 8, background: "var(--bg-card)", border: "none", fontWeight: 600, cursor: "pointer", fontSize: 14, color: "var(--text-primary)" }}
                >
                  Cerrar
                </button>
              </div>

            </div>
          </div>
        )}

      </main>

      <footer className="app-footer">
        <p>Smart Campus UIS © 2026 | Desarrollado por el equipo de proyecto de grado</p>
      </footer>

    </div>
  );
}

export default App;

// Estilos de la tabla del modal — definidos fuera del componente
// para no recrearlos en cada render
const thStyle = {
  padding: "10px 14px",
  textAlign: "left",
  fontWeight: 600,
  color: "var(--text-secondary)",
  borderBottom: "1px solid var(--border-color)",
  fontSize: 13
};

const tdStyle = {
  padding: "9px 14px",
  borderBottom: "1px solid var(--bg-hover)",
  color: "var(--text-primary)"
};