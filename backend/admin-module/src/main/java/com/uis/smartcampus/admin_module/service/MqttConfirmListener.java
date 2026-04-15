package com.uis.smartcampus.admin_module.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.integration.annotation.ServiceActivator;
import org.springframework.messaging.Message;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
@RequiredArgsConstructor
public class MqttConfirmListener {

    private final TelemetryService telemetryService;
    private final ObjectMapper mapper = new ObjectMapper();

    /**
     * Recibe la confirmación de Node-RED en smartcampus/confirm.
     * Payload esperado: {"deviceCode": "SENSOR-01", "data": {...}}
     * Solo aquí se actualiza el Digital Twin.
     */
    @ServiceActivator(inputChannel = "mqttConfirmChannel")
    public void handleConfirm(Message<String> message) {
        try {
            String payload = message.getPayload();
            System.out.println("📨 Confirmación recibida: " + payload);

            Map<String, Object> body = mapper.readValue(
                    payload,
                    new TypeReference<Map<String, Object>>() {}
            );

            String deviceCode = body.get("deviceCode").toString();

            @SuppressWarnings("unchecked")
            Map<String, Object> data = (Map<String, Object>) body.get("data");

            if (deviceCode == null || data == null) {
                System.err.println("❌ Confirmación inválida: falta deviceCode o data");
                return;
            }

            telemetryService.applyConfirmedTelemetry(deviceCode, data);

        } catch (Exception e) {
            System.err.println("❌ Error procesando confirmación MQTT: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
