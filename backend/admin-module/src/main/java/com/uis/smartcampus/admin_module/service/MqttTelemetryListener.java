package com.uis.smartcampus.admin_module.service;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.integration.annotation.ServiceActivator;
import org.springframework.messaging.Message;
import org.springframework.stereotype.Component;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class MqttTelemetryListener {
    private final TelemetryService telemetryService;

    @ServiceActivator(inputChannel = "mqttInputChannel")
    public void handleMessage(Message<String> message) {
        try {
            String payload = message.getPayload();
            log.debug("Payload RAW: {}", payload);

            ObjectMapper mapper = new ObjectMapper();
            Map<String, Object> telemetryData = mapper.readValue(payload, Map.class);

            // Extraer deviceCode del payload
            String deviceCode = telemetryData.get("deviceCode").toString();

            // Remover deviceCode antes de procesar
            telemetryData.remove("deviceCode");

            telemetryService.processTelemetry(deviceCode, telemetryData);

            log.debug("MQTT recibido de: {}", deviceCode);
            log.debug("Datos: {}", telemetryData);

        } catch (Exception e) {
            log.error("Error procesando mensaje de telemetría MQTT", e);
        }
    }
