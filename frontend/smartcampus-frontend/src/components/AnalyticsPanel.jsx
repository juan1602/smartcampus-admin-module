import { useEffect, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { getTelemetry, getTelemetryByDevice } from "../services/telemetryService";
import "./AnalyticsPanel.css";

export default function AnalyticsPanel({ devices }) {
  const [records, setRecords]         = useState([]);
  const [loading, setLoading]         = useState(false);
  const [selectedDevice, setSelectedDevice] = useState("all");
  const [dateFrom, setDateFrom]       = useState("");
  const [dateTo, setDateTo]           = useState("");

  useEffect(() => { loadRecords(); }, [selectedDevice]);

  const loadRecords = async () => {
    setLoading(true);
    try {
      const res = selectedDevice === "all"
        ? await getTelemetry()
        : await getTelemetryByDevice(selectedDevice);
      setRecords(res.data || []);
    } catch {
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  // ── Parsear registros ───────────────────────────────────────────────────────
  const parsed = records
    .map(r => {
      try {
        const data = JSON.parse(r.telemetryJson || "{}");
        return { timestamp: new Date(r.timestamp), deviceCode: r.device?.code || "?", ...data };
      } catch { return null; }
    })
    .filter(Boolean)
    .filter(r => {
      if (dateFrom && r.timestamp < new Date(dateFrom)) return false;
      if (dateTo   && r.timestamp > new Date(dateTo + "T23:59:59")) return false;
      return true;
    })
    .sort((a, b) => b.timestamp - a.timestamp);

  // ── Estadísticas por dispositivo y propiedad ────────────────────────────────
  const stats = {};
  parsed.forEach(r => {
    const code = r.deviceCode;
    if (!stats[code]) stats[code] = {};
    Object.entries(r).forEach(([key, val]) => {
      if (key === "timestamp" || key === "deviceCode") return;
      const num = parseFloat(val);
      if (isNaN(num)) return;
      if (!stats[code][key]) stats[code][key] = { values: [] };
      stats[code][key].values.push(num);
    });
  });

  const computedStats = Object.entries(stats).map(([device, props]) => ({
    device,
    props: Object.entries(props).map(([prop, { values }]) => ({
      prop,
      min:  Math.min(...values).toFixed(2),
      max:  Math.max(...values).toFixed(2),
      avg:  (values.reduce((a, b) => a + b, 0) / values.length).toFixed(2),
      count: values.length
    }))
  }));

  // ── Filas para tabla / exportación ─────────────────────────────────────────
  const rows = parsed.slice(0, 500).map(r => {
    const { timestamp, deviceCode, ...data } = r;
    return Object.entries(data).map(([prop, val]) => ({
      fecha: timestamp.toLocaleString(),
      dispositivo: deviceCode,
      propiedad: prop,
      valor: String(val)
    }));
  }).flat();

  // ── Exportar CSV ───────────────────────────────────────────────────────────
  const exportCSV = () => {
    const header = ["Fecha/Hora", "Dispositivo", "Propiedad", "Valor"];
    const lines  = [
      header.join(","),
      ...rows.map(r => [
        `"${r.fecha}"`, r.dispositivo, r.propiedad, `"${r.valor}"`
      ].join(","))
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `smartcampus-telemetria-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Exportar PDF ───────────────────────────────────────────────────────────
  const exportPDF = () => {
    const doc = new jsPDF({ orientation: "landscape" });

    // Encabezado
    doc.setFontSize(16);
    doc.setTextColor(0, 108, 53);
    doc.text("SmartCampus UIS — Reporte de Telemetría", 14, 16);

    doc.setFontSize(10);
    doc.setTextColor(100);
    const filtro = selectedDevice === "all" ? "Todos los dispositivos" :
      devices.find(d => String(d.id) === String(selectedDevice))?.code || selectedDevice;
    doc.text(`Dispositivo: ${filtro}`, 14, 23);
    doc.text(`Generado: ${new Date().toLocaleString()}`, 14, 28);
    if (dateFrom || dateTo)
      doc.text(`Rango: ${dateFrom || "—"} → ${dateTo || "—"}`, 14, 33);

    let startY = dateFrom || dateTo ? 38 : 33;

    // Tabla de estadísticas
    if (computedStats.length > 0) {
      doc.setFontSize(12);
      doc.setTextColor(0);
      doc.text("Resumen estadístico", 14, startY + 4);

      const statsRows = computedStats.flatMap(({ device, props }) =>
        props.map(p => [device, p.prop, p.min, p.max, p.avg, String(p.count)])
      );

      autoTable(doc, {
        startY: startY + 8,
        head: [["Dispositivo", "Propiedad", "Mín", "Máx", "Promedio", "Registros"]],
        body: statsRows,
        theme: "grid",
        headStyles: { fillColor: [0, 108, 53], textColor: 255 },
        styles: { fontSize: 9 }
      });

      startY = doc.lastAutoTable.finalY + 10;
    }

    // Tabla de registros detallados
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text(`Registros detallados (máx. 500)`, 14, startY + 4);

    autoTable(doc, {
      startY: startY + 8,
      head: [["Fecha/Hora", "Dispositivo", "Propiedad", "Valor"]],
      body: rows.map(r => [r.fecha, r.dispositivo, r.propiedad, r.valor]),
      theme: "striped",
      headStyles: { fillColor: [0, 108, 53], textColor: 255 },
      styles: { fontSize: 8 },
      columnStyles: { 0: { cellWidth: 45 } }
    });

    doc.save(`smartcampus-reporte-${Date.now()}.pdf`);
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="analytics-panel">

      {/* Encabezado */}
      <div className="ap-header">
        <div>
          <h2>Panel de Analítica</h2>
          <p className="ap-subtitle">Estadísticas, resumen y exportación del historial de telemetría.</p>
        </div>
        <div className="ap-export-btns">
          <button className="btn-export btn-csv" onClick={exportCSV} disabled={rows.length === 0}>
            ⬇ Exportar CSV
          </button>
          <button className="btn-export btn-pdf" onClick={exportPDF} disabled={rows.length === 0}>
            ⬇ Exportar PDF
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="ap-filters">
        <div className="ap-filter-group">
          <label>Dispositivo</label>
          <select value={selectedDevice} onChange={e => setSelectedDevice(e.target.value)}>
            <option value="all">Todos</option>
            {(devices || []).map(d => (
              <option key={d.id} value={d.id}>{d.code}{d.name ? ` — ${d.name}` : ""}</option>
            ))}
          </select>
        </div>
        <div className="ap-filter-group">
          <label>Desde</label>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
        </div>
        <div className="ap-filter-group">
          <label>Hasta</label>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
        </div>
        <button className="btn-apply" onClick={loadRecords} disabled={loading}>
          {loading ? "⏳ Cargando..." : "🔄 Aplicar"}
        </button>
        {(dateFrom || dateTo) && (
          <button className="btn-clear" onClick={() => { setDateFrom(""); setDateTo(""); }}>
            ✕ Limpiar fechas
          </button>
        )}
      </div>

      {/* Contador */}
      <p className="ap-count">
        <strong>{parsed.length}</strong> registros encontrados
        {rows.length < parsed.length && <span> (mostrando primeros 500 en exportación)</span>}
      </p>

      {/* Tarjetas de estadísticas por dispositivo */}
      {loading ? (
        <p className="ap-loading">Cargando datos...</p>
      ) : computedStats.length === 0 ? (
        <p className="ap-empty">No hay datos para el filtro seleccionado.</p>
      ) : (
        computedStats.map(({ device, props }) => (
          <div key={device} className="ap-device-block">
            <h3 className="ap-device-title">{device}</h3>
            <div className="ap-stats-grid">
              {props.map(p => (
                <div key={p.prop} className="ap-stat-card">
                  <span className="ap-stat-prop">{p.prop.replace(/_/g, " ")}</span>
                  <div className="ap-stat-values">
                    <div className="ap-stat-item">
                      <span className="ap-stat-label">Mín</span>
                      <span className="ap-stat-num ap-min">{p.min}</span>
                    </div>
                    <div className="ap-stat-item">
                      <span className="ap-stat-label">Promedio</span>
                      <span className="ap-stat-num ap-avg">{p.avg}</span>
                    </div>
                    <div className="ap-stat-item">
                      <span className="ap-stat-label">Máx</span>
                      <span className="ap-stat-num ap-max">{p.max}</span>
                    </div>
                    <div className="ap-stat-item">
                      <span className="ap-stat-label">Registros</span>
                      <span className="ap-stat-num">{p.count}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}

    </div>
  );
}
