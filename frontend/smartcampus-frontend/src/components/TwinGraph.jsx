import { useCallback, useMemo, useState } from "react";
import ReactFlow, { Background, Controls, MiniMap, useNodesState } from "reactflow";
import "reactflow/dist/style.css";
import "./TwinGraph.css";

function statusColor(status) {
  if (status === "ONLINE") return "#22c55e";
  if (status === "ERROR") return "#ef4444";
  return "#6b7280";
}

function TwinNode({ data }) {
  const telemetryEntries = Object.entries(data.telemetry || {});
  return (
    <div className={`twin-node ${data.live ? "twin-node--live" : ""}`} onClick={data.onSelect}>
      <div className="twin-node__header">
        <span className="twin-node__name">{data.label}</span>
        <span className="twin-node__status" style={{ background: statusColor(data.status) }}>
          {data.status}
        </span>
      </div>
      <div className="twin-node__device">{data.deviceCode}</div>
      <div className="twin-node__type">{data.deviceType}</div>
      {telemetryEntries.length > 0 && (
        <div className="twin-node__telemetry">
          {telemetryEntries.slice(0, 3).map(([k, v]) => (
            <div key={k} className="twin-node__metric">
              <span className="twin-node__metric-key">{k}</span>
              <span className="twin-node__metric-val">{String(v)}</span>
            </div>
          ))}
          {telemetryEntries.length > 3 && (
            <div className="twin-node__more">+{telemetryEntries.length - 3} más</div>
          )}
        </div>
      )}
      {data.live && <div className="twin-node__live-dot" />}
    </div>
  );
}

const nodeTypes = { twinNode: TwinNode };

const COLS = 4;
const H_GAP = 280;
const V_GAP = 220;

export default function TwinGraph({ twins = [], liveTwinIds = new Set() }) {
  const [selected, setSelected] = useState(null);

  const initialNodes = useMemo(() => {
    return twins.map((twin, i) => {
      const telemetry = twin.telemetryJson ? (() => {
        try { return JSON.parse(twin.telemetryJson); } catch { return {}; }
      })() : {};

      const col = i % COLS;
      const row = Math.floor(i / COLS);

      return {
        id: String(twin.id),
        type: "twinNode",
        position: { x: col * H_GAP, y: row * V_GAP },
        draggable: true,
        data: {
          label: twin.name || `Twin ${twin.id}`,
          deviceCode: twin.device?.code || "—",
          deviceName: twin.device?.name || "—",
          deviceType: twin.device?.type || "—",
          deviceNamespace: twin.device?.namespace || "—",
          deviceLocation: twin.device?.location || "—",
          status: twin.device?.status || "OFFLINE",
          telemetry,
          lastUpdate: twin.lastUpdate,
          live: liveTwinIds.has(twin.id),
          onSelect: () => setSelected({ twin, telemetry }),
        },
      };
    });
  }, [twins, liveTwinIds]);

  const [nodes, , onNodesChange] = useNodesState(initialNodes);

  const closePanel = useCallback(() => setSelected(null), []);

  if (twins.length === 0) {
    return (
      <div className="twin-graph-empty">
        <p>No hay gemelos digitales registrados.</p>
      </div>
    );
  }

  return (
    <div className="twin-graph-wrapper">
      <div className="twin-graph-canvas">
        <ReactFlow
          nodes={nodes}
          edges={[]}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.3}
          maxZoom={2}
        >
          <Background color="#3a3a3a" gap={20} />
          <Controls showInteractiveChangeButton={false} />
          <MiniMap
            nodeColor={(n) => statusColor(n.data?.status)}
            style={{ background: "#262626", border: "1px solid #3a3a3a" }}
          />
        </ReactFlow>
      </div>

      {selected && (
        <div className="twin-graph-panel">
          <div className="twin-graph-panel__header">
            <h3>{selected.twin.name || `Twin ${selected.twin.id}`}</h3>
            <button className="twin-graph-panel__close" onClick={closePanel}>✕</button>
          </div>

          <div className="twin-graph-panel__section">
            <p className="twin-graph-panel__label">Dispositivo</p>
            <p className="twin-graph-panel__value">{selected.twin.device?.code} — {selected.twin.device?.name}</p>
          </div>
          <div className="twin-graph-panel__section">
            <p className="twin-graph-panel__label">Tipo</p>
            <p className="twin-graph-panel__value">{selected.twin.device?.type}</p>
          </div>
          <div className="twin-graph-panel__section">
            <p className="twin-graph-panel__label">Namespace</p>
            <p className="twin-graph-panel__value">{selected.twin.device?.namespace || "—"}</p>
          </div>
          <div className="twin-graph-panel__section">
            <p className="twin-graph-panel__label">Ubicación</p>
            <p className="twin-graph-panel__value">{selected.twin.device?.location || "—"}</p>
          </div>
          <div className="twin-graph-panel__section">
            <p className="twin-graph-panel__label">Estado</p>
            <span
              className="twin-graph-panel__badge"
              style={{ background: statusColor(selected.twin.device?.status) }}
            >
              {selected.twin.device?.status || "OFFLINE"}
            </span>
          </div>
          <div className="twin-graph-panel__section">
            <p className="twin-graph-panel__label">Última actualización</p>
            <p className="twin-graph-panel__value">
              {selected.twin.lastUpdate
                ? new Date(selected.twin.lastUpdate).toLocaleString()
                : "Sin datos"}
            </p>
          </div>

          <div className="twin-graph-panel__telemetry-title">Telemetría actual</div>
          {Object.entries(selected.telemetry).length === 0 ? (
            <p className="twin-graph-panel__empty">Sin telemetría registrada</p>
          ) : (
            <div className="twin-graph-panel__telemetry">
              {Object.entries(selected.telemetry).map(([k, v]) => (
                <div key={k} className="twin-graph-panel__metric">
                  <span className="twin-graph-panel__metric-key">{k}</span>
                  <span className="twin-graph-panel__metric-val">{String(v)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
