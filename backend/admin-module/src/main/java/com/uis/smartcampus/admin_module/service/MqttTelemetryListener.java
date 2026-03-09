package com.uis.smartcampus.admin_module.service;

import lombok.RequiredArgsConstructor;
import org.springframework.integration.annotation.ServiceActivator;
import org.springframework.messaging.Message;
import org.springframework.stereotype.Component;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.dataformat.yaml.YAMLMapper;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class MqttTelemetryListener {

    private final TelemetryService telemetryService;

    @ServiceActivator(inputChannel = "mqttInputChannel")
    public void handleMessage(Message<String> message) {

    try {
        System.out.println("🔥 MENSAJE RECIBIDO 🔥");
        System.out.println("Topic: " + message.getHeaders().get("mqtt_receivedTopic"));
        System.out.println("Payload RAW: " + message.getPayload());
        String topic = message.getHeaders().get("mqtt_receivedTopic").toString();
        String payload = message.getPayload();

        System.out.println("Topic: " + topic);
        System.out.println("Payload RAW: " + payload);

        String deviceCode = topic.split("/")[1];

        ObjectMapper mapper = new ObjectMapper();
        Map<String, Object> telemetryData =
                mapper.readValue(payload, Map.class);

        telemetryService.processTelemetry(deviceCode, telemetryData);

        System.out.println("MQTT recibido de: " + deviceCode);
        System.out.println("Datos parseados: " + telemetryData);

    } catch (Exception e) {
        e.printStackTrace();
    }
}
}