package com.uis.smartcampus.admin_module.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.integration.mqtt.support.MqttHeaders;
import org.springframework.integration.support.MessageBuilder;
import org.springframework.messaging.MessageChannel;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class MqttPublisherService {

    @Qualifier("mqttOutboundChannel")
    private final MessageChannel mqttOutboundChannel;

    private final ObjectMapper mapper = new ObjectMapper();

    /**
     * Publica un ACK en smartcampus/ack con el deviceCode y los datos procesados.
     * Node-RED recibe este mensaje y debe responder en smartcampus/confirm.
     */
    public void publishAck(String deviceCode, Map<String, Object> filteredData) {
        try {
            Map<String, Object> ackPayload = new HashMap<>();
            ackPayload.put("deviceCode", deviceCode);
            ackPayload.put("data", filteredData);

            String json = mapper.writeValueAsString(ackPayload);

            mqttOutboundChannel.send(
                MessageBuilder.withPayload(json)
                    .setHeader(MqttHeaders.TOPIC, "smartcampus/ack")
                    .setHeader(MqttHeaders.QOS, 1)
                    .build()
            );

            System.out.println("📤 ACK publicado para dispositivo: " + deviceCode);

        } catch (Exception e) {
            System.err.println("❌ Error publicando ACK para " + deviceCode + ": " + e.getMessage());
        }
    }
}
