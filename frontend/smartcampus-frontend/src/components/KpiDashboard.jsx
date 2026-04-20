import { useEffect, useState, useCallback } from "react";
import { getDeviceStats } from "../services/kpiService";
import "./KpiDashboard.css";

function StatCard({ label, value, sub, colorClass, icon }) {
  return (
    <div className={`kpi-card ${colorClass || ""}`}>
      <div className="kpi-icon">{icon}</div>
      <div className="kpi-body">
        <span className="kpi-value">{value ?? "—"}</span>
        <span className="kpi-label">{label}</span>
        {sub && <span className="kpi-sub">{sub}</span>}
      </div>
    </div>
  );
}

function StatusBar({ online, lowBattery, warning, offline, error, maintenance, total }) {
  if (!total) return null;
  const pct = (n) => ((n / total) * 100).toFixed(1);
  return (
    <div className="kpi-statusbar-wrap">
      <div className="kpi-statusbar">
        {online      > 0 && <div className="bar-online"      style={{ width: `${pct(online)}%`      }} title={`Online: ${online}`}           />}
        {lowBattery  > 0 && <div className="bar-lowbattery"  style={{ width: `${pct(lowBattery)}%`  }} title={`Batería baja: ${lowBattery}`}  />}
        {warning     > 0 && <div className="bar-warning"     style={{ width: `${pct(warning)}%`     }} title={`Advertencia: ${warning}`}      />}
        {error       > 0 && <div className="bar-error"       style={{ width: `${pct(error)}%`       }} title={`Error: ${error}`}              />}
        {maintenance > 0 && <div className="bar-maintenance" style={{ width: `${pct(maintenance)}%` }} title={`Mantenimiento: ${maintenance}`} />}
        {offline     > 0 && <div className="bar-offline"     style={{ width: `${pct(offline)}%`     }} title={`Offline: ${offline}`}          />}
      </div>
      <div className="kpi-statusbar-legend">
        {online      > 0 && <span className="leg-online">Online {online}</span>}
        {lowBattery  > 0 && <span className="leg-lowbattery">Bat. baja {lowBattery}</span>}
        {warning     > 0 && <span className="leg-warning">Advertencia {warning}</span>}
        {error       > 0 && <span className="leg-error">Error {error}</span>}
        {maintenance > 0 && <span className="leg-maintenance">Mantenimiento {maintenance}</span>}
        {offline     > 0 && <span className="leg-offline">Offline {offline}</span>}
      </div>
    </div>
  );
}

function BreakdownTable({ title, data }) {
  if (!data || Object.keys(data).length === 0) return null;
  const total = Object.values(data).reduce((a, b) => a + b, 0);
  return (
    <div className="kpi-breakdown">
      <h4 className="kpi-breakdown-title">{title}</h4>
      <table className="kpi-breakdown-table">
        <tbody>
          {Object.entries(data).map(([key, count]) => (
            <tr key={key}>
              <td>{key}</td>
              <td className="bd-count">{count}</td>
              <td className="bd-bar-cell">
                <div className="bd-bar" style={{ width: `${(count / total) * 100}%` }} />
              </td>
              <td className="bd-pct">{((count / total) * 100).toFixed(0)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function KpiDashboard({ liveTwinIds }) {
  const [stats, setStats]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(null);

  const load = useCallback(async () => {
    try {
      const res = await getDeviceStats();
      setStats(res.data);
      setLastRefresh(new Date());
    } catch {
      // silencioso, mantiene datos anteriores
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000); // refresca cada 30s
    return () => clearInterval(interval);
  }, [load]);

  // Refresca cuando cambia un twin en vivo
  useEffect(() => {
    if (liveTwinIds && liveTwinIds.size > 0) load();
  }, [liveTwinIds, load]);

  const formatTime = (iso) => {
    if (!iso) return "—";
    const d = new Date(iso);
    return d.toLocaleString("es-CO", { dateStyle: "short", timeStyle: "medium" });
  };

  const timeSince = (iso) => {
    if (!iso) return null;
    const diff = Math.floor((Date.now() - new Date(iso)) / 1000);
    if (diff < 60) return `hace ${diff}s`;
    if (diff < 3600) return `hace ${Math.floor(diff / 60)}min`;
    if (diff < 86400) return `hace ${Math.floor(diff / 3600)}h`;
    return `hace ${Math.floor(diff / 86400)}d`;
  };

  return (
    <div className="kpi-dashboard">

      <div className="kpi-header">
        <div>
          <h2>Dashboard</h2>
          <p className="kpi-subtitle">
            Métricas de administración de dispositivos y gemelos digitales
          </p>
        </div>
        <button className="btn-refresh" onClick={load} disabled={loading}>
          {loading ? "Actualizando…" : "↻ Actualizar"}
        </button>
      </div>

      {lastRefresh && (
        <p className="kpi-refresh-time">
          Última actualización: {lastRefresh.toLocaleTimeString("es-CO")}
        </p>
      )}

      {loading && !stats ? (
        <p className="kpi-loading">Cargando métricas…</p>
      ) : stats ? (
        <>
          {/* Tarjetas principales */}
          <div className="kpi-grid">
            <StatCard
              label="Dispositivos registrados"
              value={stats.totalDevices}
              colorClass="card-blue"
              icon="🖥️"
            />
            <StatCard
              label="Activos ahora"
              value={stats.activeCount}
              sub={stats.totalDevices ? `${((stats.activeCount / stats.totalDevices) * 100).toFixed(0)}% del total` : null}
              colorClass="card-green"
              icon="🟢"
            />
            <StatCard
              label="Batería baja / Alerta"
              value={(stats.lowBatteryCount ?? 0) + (stats.warningCount ?? 0)}
              sub="requieren atención"
              colorClass={(stats.lowBatteryCount + stats.warningCount) > 0 ? "card-orange" : "card-gray"}
              icon="🔋"
            />
            <StatCard
              label="Offline"
              value={stats.offlineCount}
              colorClass={stats.offlineCount > 0 ? "card-gray" : "card-gray"}
              icon="⚫"
            />
            <StatCard
              label="Con error"
              value={stats.errorCount}
              colorClass={stats.errorCount > 0 ? "card-red" : "card-gray"}
              icon="🔴"
            />
            <StatCard
              label="Gemelos digitales"
              value={stats.totalTwins}
              sub="sincronizados"
              colorClass="card-purple"
              icon="♊"
            />
            <StatCard
              label="Propiedades registradas"
              value={stats.totalProperties}
              sub="en el catálogo"
              colorClass="card-orange"
              icon="🏷️"
            />
          </div>

          {/* Barra de estado */}
          <div className="kpi-section">
            <h3 className="kpi-section-title">Estado de la flota</h3>
            <StatusBar
              online={stats.onlineCount}
              lowBattery={stats.lowBatteryCount ?? 0}
              warning={stats.warningCount ?? 0}
              offline={stats.offlineCount}
              error={stats.errorCount}
              maintenance={stats.maintenanceCount ?? 0}
              total={stats.totalDevices}
            />
          </div>

          {/* Último dispositivo visto */}
          {stats.lastSeenDevice && (
            <div className="kpi-section">
              <h3 className="kpi-section-title">Último dispositivo activo</h3>
              <div className="kpi-last-seen">
                <div className="ls-main">
                  <span className="ls-name">{stats.lastSeenDevice.name}</span>
                  <span className="ls-code">{stats.lastSeenDevice.code}</span>
                </div>
                <div className="ls-meta">
                  <span
                    className={`ls-status ${stats.lastSeenDevice.status?.toLowerCase()}`}
                  >
                    {stats.lastSeenDevice.status}
                  </span>
                  <span className="ls-time">
                    {formatTime(stats.lastSeenDevice.lastSeen)}{" "}
                    <em>({timeSince(stats.lastSeenDevice.lastSeen)})</em>
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Tablas de distribución */}
          <div className="kpi-breakdowns">
            <BreakdownTable title="Dispositivos por tipo" data={stats.byType} />
            <BreakdownTable title="Dispositivos por namespace" data={stats.byNamespace} />
          </div>
        </>
      ) : null}
    </div>
  );
}
