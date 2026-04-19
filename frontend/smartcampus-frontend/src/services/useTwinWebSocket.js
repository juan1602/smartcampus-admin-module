import { useEffect, useRef } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

const WS_URL = (import.meta.env.VITE_API_URL || "http://localhost:8090/api") + "/ws";

/**
 * Se conecta al WebSocket del backend y llama a onTwinUpdate(message)
 * cada vez que llega una actualización de Digital Twin.
 *
 * message = { deviceCode, twinId, telemetryJson, lastUpdate }
 */
export function useTwinWebSocket(onTwinUpdate, onUnknownDevice) {
  const clientRef = useRef(null);

  useEffect(() => {
    const client = new Client({
      webSocketFactory: () => new SockJS(WS_URL),
      reconnectDelay: 5000,
      onConnect: () => {
        console.log("🔌 WebSocket conectado");
        client.subscribe("/topic/twins", (frame) => {
          try {
            const message = JSON.parse(frame.body);
            onTwinUpdate(message);
          } catch (e) {
            console.error("Error parseando mensaje WebSocket:", e);
          }
        });
        client.subscribe("/topic/unknown-devices", (frame) => {
          try {
            const message = JSON.parse(frame.body);
            if (onUnknownDevice) onUnknownDevice(message);
          } catch (e) {
            console.error("Error parseando mensaje WebSocket:", e);
          }
        });
      },
      onDisconnect: () => console.log("🔌 WebSocket desconectado"),
      onStompError: (frame) => console.error("STOMP error:", frame),
    });

    client.activate();
    clientRef.current = client;

    return () => { client.deactivate(); };
  }, []);
}
