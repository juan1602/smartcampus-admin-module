package com.uis.smartcampus.admin_module.service;

import lombok.RequiredArgsConstructor;
import org.springframework.integration.annotation.ServiceActivator;
import org.springframework.messaging.Message;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class MqttTelemetryListener {

    private final TelemetryService telemetryService;

    @ServiceActivator(inputChannel = "mqttInputChannel")
    public void handleMessage(Message<String> message) {

        String topic = message.getHeaders().get("mqtt_receivedTopic").toString();
        String payload = message.getPayload();

        // Extraer código del device del topic
        // devices/SENSOR-01/telemetry
        String deviceCode = topic.split("/")[1];

        telemetryService.processTelemetry(deviceCode, payload);

        System.out.println("MQTT recibido de: " + deviceCode);
        System.out.println("Payload: " + payload);
    }
}