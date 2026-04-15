import { useEffect, useRef, useState } from "react";
import { getTelemetry, getTelemetryByDevice } from "../services/telemetryService";

// Colores por dispositivo — se asignan en orden
const DEVICE_COLORS = [
  "#D85A30", "#1D9E75", "#378ADD", "#7F77DD",
  "#E24B4A", "#BA7517", "#639922", "#D4537E"
];

export default function TelemetryCharts({ devices }) {

  const [selectedDevice, setSelectedDevice] = useState("all");
  const [limit, setLimit] = useState(20);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);

  const tempChartRef = useRef(null);
  const batChartRef  = useRef(null);
  const humChartRef  = useRef(null);
  const tempChartInstance = useRef(null);
  const batChartInstance  = useRef(null);
  const humChartInstance  = useRef(null);

  // ── Carga de datos ──────────────────────────────────────────────────────────
  useEffect(() => {
    loadData();
  }, [selectedDevice]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = selectedDevice === "all"
        ? await getTelemetry()
        : await getTelemetryByDevice(selectedDevice);
      setRecords(res.data || []);
    } catch (err) {
      console.error("Error cargando telemetría:", err);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  // ── Procesamiento de datos ──────────────────────────────────────────────────
  const parsedRecords = records
    .map(record => {
      try {
        const data = JSON.parse(record.telemetryJson || "{}");
        return {
          timestamp: record.timestamp,
          deviceCode: record.device?.code || "Desconocido",
          ...data
        };
      } catch {
        return null;
      }
    })
    .filter(Boolean)
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  const isSingleDevice = selectedDevice !== "all";
  const deviceCodes = [...new Set(parsedRecords.map(r => r.deviceCode))];

  // ── Construcción de datasets por dispositivo ────────────────────────────────
  const buildDatasets = (propKey) => {
    if (isSingleDevice) {
      const limited = parsedRecords.slice(-limit);
      const data = limited.map(r => {
        const match = Object.keys(r).find(k => k.toLowerCase() === propKey.toLowerCase());
        return match !== undefined ? parseFloat(r[match]) : null;
      });
      const color = DEVICE_COLORS[0];
      return {
        labels: limited.map(r => new Date(r.timestamp).toLocaleTimeString()),
        datasets: [{
          label: parsedRecords[0]?.deviceCode || propKey,
          data,
          borderColor: color,
          backgroundColor: color + "15",
          fill: true,
          tension: 0.4,
          spanGaps: true
        }]
      };
    }

    // Modo "todos": una línea por dispositivo
    const allDatasets = deviceCodes.map((code, idx) => {
      const deviceRecords = parsedRecords
        .filter(r => r.deviceCode === code)
        .slice(-limit);
      const data = deviceRecords.map(r => {
        const match = Object.keys(r).find(k => k.toLowerCase() === propKey.toLowerCase());
        return match !== undefined ? parseFloat(r[match]) : null;
      });
      const color = DEVICE_COLORS[idx % DEVICE_COLORS.length];
      return {
        label: code,
        data,
        borderColor: color,
        backgroundColor: color + "15",
        fill: false,
        tension: 0.4,
        spanGaps: true,
        _timestamps: deviceRecords.map(r => new Date(r.timestamp).toLocaleTimeString())
      };
    });

    // Etiquetas unificadas: unión de todos los timestamps ordenados
    const allTimestamps = [...new Set(
      parsedRecords
        .slice(-limit * deviceCodes.length)
        .map(r => new Date(r.timestamp).toLocaleTimeString())
    )];

    // Alinear cada dataset con las etiquetas unificadas
    const alignedDatasets = allDatasets.map(ds => {
      const map = {};
      ds._timestamps.forEach((t, i) => { map[t] = ds.data[i]; });
      return {
        ...ds,
        data: allTimestamps.map(t => map[t] !== undefined ? map[t] : null),
        _timestamps: undefined
      };
    });

    return { labels: allTimestamps, datasets: alignedDatasets };
  };

  const tempChart = buildDatasets("temperature");
  const batChart  = buildDatasets("battery_level");
  const humChart  = buildDatasets("humidity");

  // ── Promedio general ────────────────────────────────────────────────────────
  const avg = (propKey) => {
    const values = parsedRecords
      .map(r => {
        const match = Object.keys(r).find(k => k.toLowerCase() === propKey.toLowerCase());
        return match !== undefined ? parseFloat(r[match]) : null;
      })
      .filter(v => v !== null && !isNaN(v));
    if (!values.length) return "-";
    return (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1);
  };

  // ── Render de gráficas ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!window.Chart) return;

    const showLegend = !isSingleDevice && deviceCodes.length > 1;

    const chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: showLegend,
          position: "top",
          labels: { font: { size: 11 }, boxWidth: 12, padding: 12 }
        }
      },
      scales: {
        x: {
          ticks: { autoSkip: true, maxTicksLimit: 6, font: { size: 11 } },
          grid: { display: false }
        },
        y: {
          ticks: { font: { size: 11 } },
          grid: { color: "rgba(0,0,0,0.06)" }
        }
      },
      elements: { point: { radius: 2 } }
    };

    const makeChart = (ref, instanceRef, chartData) => {
      if (!ref.current) return;
      if (instanceRef.current) instanceRef.current.destroy();
      instanceRef.current = new window.Chart(ref.current, {
        type: "line",
        data: { labels: chartData.labels, datasets: chartData.datasets },
        options: chartOptions
      });
    };

    makeChart(tempChartRef, tempChartInstance, tempChart);
    makeChart(batChartRef,  batChartInstance,  batChart);
    makeChart(humChartRef,  humChartInstance,  humChart);

    return () => {
      [tempChartInstance, batChartInstance, humChartInstance].forEach(i => {
        if (i.current) i.current.destroy();
      });
    };
  }, [records.length, selectedDevice, limit]);

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: "1rem 0" }}>

      {/* Filtros */}
      <div style={{ display: "flex", gap: 12, marginBottom: "1.5rem", flexWrap: "wrap", alignItems: "flex-end" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <label style={{ fontSize: 13, color: "#666", fontWeight: 600 }}>Dispositivo</label>
          <select
            value={selectedDevice}
            onChange={e => setSelectedDevice(e.target.value)}
            style={{ padding: "8px 12px", borderRadius: 8, border: "1.5px solid #ddd", fontSize: 14, minWidth: 200 }}
          >
            <option value="all">Todos los dispositivos</option>
            {(devices || []).map(d => (
              <option key={d.id} value={d.id}>
                {d.code}{d.name ? ` — ${d.name}` : ""}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <label style={{ fontSize: 13, color: "#666", fontWeight: 600 }}>Registros por dispositivo</label>
          <select
            value={limit}
            onChange={e => setLimit(Number(e.target.value))}
            style={{ padding: "8px 12px", borderRadius: 8, border: "1.5px solid #ddd", fontSize: 14 }}
          >
            <option value={20}>Últimos 20</option>
            <option value={50}>Últimos 50</option>
            <option value={100}>Últimos 100</option>
          </select>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
        style={{
  padding: "0.5rem 1rem", // más pequeño
  borderRadius: 12,
  background: loading ? "rgba(0, 108, 53, 0.5)" : "var(--color-primary)",
  color: "#fff",
  border: "1px solid var(--color-primary)",
  fontWeight: 600,
  fontFamily: "inherit",
  cursor: loading ? "not-allowed" : "pointer",
  fontSize: 14,
  opacity: loading ? 0.7 : 1,
  boxShadow: loading ? "none" : "0 4px 12px rgba(0,108,53,0.4)",
  transition: "transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease"
}}
onMouseEnter={e => {
  if (!loading) {
    e.currentTarget.style.transform = "translateY(-2px)";
    e.currentTarget.style.boxShadow = "0 6px 18px rgba(0,108,53,0.5)";
    e.currentTarget.style.background = "#00532b";
  }
}}
onMouseLeave={e => {
  if (!loading) {
    e.currentTarget.style.transform = "translateY(0)";
    e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,108,53,0.4)";
    e.currentTarget.style.background = "var(--color-primary)";
  }
}}
        >
          {loading ? "⏳ Cargando..." : "🔄 Actualizar"}
        </button>
      </div>

      {/* Leyenda de dispositivos cuando es "todos" */}
      {!isSingleDevice && deviceCodes.length > 1 && (
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: "1rem" }}>
          {deviceCodes.map((code, idx) => (
            <span key={code} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#555" }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: DEVICE_COLORS[idx % DEVICE_COLORS.length], display: "inline-block" }}></span>
              {code}
            </span>
          ))}
        </div>
      )}

      {/* Tarjetas de resumen */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: "1.5rem" }}>
        {[
          { label: "Temperatura promedio", prop: "temperature",   unit: "°C", color: "#D85A30" },
          { label: "Batería promedio",      prop: "battery_level", unit: "%",  color: "#1D9E75" },
          { label: "Humedad promedio",      prop: "humidity",       unit: "%",  color: "#378ADD" }
        ].map(({ label, prop, unit, color }) => {
          const value = avg(prop);
          return (
            <div key={label} style={{
  background: "var(--bg-card)",
  borderRadius: 8,
  padding: "1rem"
}}>
  <p style={{
    fontSize: 13,
    color: "var(--text-secondary)",
    margin: "0 0 4px"
  }}>{label}</p>
  <p style={{
    fontSize: 24,
    fontWeight: 600,
    margin: 0,
    color: "var(--text-primary)"
  }}>
                {value !== "-" ? `${value} ${unit}` : "Sin datos"}
              </p>
            </div>
          );
        })}
      </div>

      {/* Gráfica temperatura — ancho completo */}
      <div style={{
  background: "var(--bg-card)",
  border: "1px solid var(--border-color)",
  borderRadius: 12,
  padding: "1.25rem",
  marginBottom: "1rem"
}}>
  <p style={{
    fontSize: 14,
    fontWeight: 600,
    margin: "0 0 1rem",
    color: "var(--text-primary)"
  }}>
          🌡️ Temperatura vs tiempo
        </p>
        <div style={{ position: "relative", width: "100%", height: 220 }}>
          <canvas ref={tempChartRef}></canvas>
        </div>
      </div>

      {/* Gráficas batería y humedad — dos columnas */}
     <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
  <div style={{
    background: "var(--bg-card)",
    border: "1px solid var(--border-color)",
    borderRadius: 12,
    padding: "1.25rem"
  }}>
    <p style={{
      fontSize: 14,
      fontWeight: 600,
      margin: "0 0 1rem",
      color: "var(--text-primary)"
    }}>
            🔋 Batería vs tiempo
          </p>
          <div style={{ position: "relative", width: "100%", height: 180 }}>
            <canvas ref={batChartRef}></canvas>
          </div>
        </div>

        <div style={{
  background: "var(--bg-card)",
  border: "1px solid var(--border-color)",
  borderRadius: 12,
  padding: "1.25rem"
}}>
  <p style={{
    fontSize: 14,
    fontWeight: 600,
    margin: "0 0 1rem",
    color: "var(--text-primary)"
  }}>
            💧 Humedad vs tiempo
          </p>
          <div style={{ position: "relative", width: "100%", height: 180 }}>
            <canvas ref={humChartRef}></canvas>
          </div>
        </div>
      </div>

      {parsedRecords.length === 0 && !loading && (
        <p style={{ textAlign: "center", color: "#aaa", marginTop: "2rem" }}>
          No hay datos de telemetría disponibles.
        </p>
      )}

    </div>
  );
}