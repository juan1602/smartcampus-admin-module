package com.uis.smartcampus.admin_module.mqtt;

import java.nio.charset.StandardCharsets;

import org.eclipse.paho.client.mqttv3.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.uis.smartcampus.admin_module.model.Device;
import com.uis.smartcampus.admin_module.model.DigitalTwin;
import com.uis.smartcampus.admin_module.repository.DeviceRepository;
import com.uis.smartcampus.admin_module.repository.DigitalTwinRepository;
import com.uis.smartcampus.admin_module.service.DigitalTwinService;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class MqttSubscriberService {

    @Value("${mqtt.broker}")
    private String broker;

    @Value("${mqtt.clientId}")
    private String clientId;

    @Value("${mqtt.topic}")
    private String topic;

    private final DeviceRepository deviceRepository;
    private final DigitalTwinRepository digitalTwinRepository;
    private final DigitalTwinService digitalTwinService;

    private final ObjectMapper mapper = new ObjectMapper();

    @PostConstruct
    public void start() throws MqttException {
        MqttClient client = new MqttClient(broker, clientId);

        MqttConnectOptions options = new MqttConnectOptions();
        options.setAutomaticReconnect(true);
        options.setCleanSession(true);

        client.connect(options);

        client.subscribe(topic, (receivedTopic, message) -> {
            String payload = new String(message.getPayload(), StandardCharsets.UTF_8);

            String deviceCode = extractDeviceCode(receivedTopic);
            System.out.println("[MQTT] topic=" + receivedTopic + " deviceCode=" + deviceCode + " payload=" + payload);

            // 1) Buscar el Device por code
            Device device = deviceRepository.findByCode(deviceCode).orElse(null);
            if (device == null) {
                System.out.println("[MQTT] Device no existe con code=" + deviceCode);
                return;
            }

            // 2) Buscar DigitalTwin por deviceId
            DigitalTwin twin = digitalTwinRepository.findByDeviceId(device.getId()).orElse(null);
            if (twin == null) {
                System.out.println("[MQTT] DigitalTwin no existe para deviceId=" + device.getId() + " (deviceCode="
                        + deviceCode + ")");
                return;
            }

            // 3) Parsear JSON y actualizar campos del twin
            try {
                JsonNode json = mapper.readTree(payload);

                twin.setTelemetryJson(payload);
                twin.setStatus("ONLINE"); // si tu status es String, ok

                if (json.has("temperature")) {
                    twin.setTemperature(json.get("temperature").asDouble());
                }
                if (json.has("batteryLevel")) {
                    twin.setBatteryLevel(json.get("batteryLevel").asDouble());
                }

                // 4) Guardar usando tu DigitalTwinService (mantienes tu flujo)
                digitalTwinService.save(twin);

                System.out.println("[MQTT] Twin actualizado OK para deviceCode=" + deviceCode);
            } catch (Exception e) {
                System.out.println("[MQTT] Error parseando/guardando payload: " + e.getMessage());
            }
        });

        System.out.println("[MQTT] Conectado a " + broker + " | Suscrito a " + topic);
    }

    private String extractDeviceCode(String t) {
        // Esperado: smartcampus/devices/{CODE}/telemetry
        String[] parts = t.split("/");
        return (parts.length >= 3) ? parts[2] : "UNKNOWN";
    }
}
