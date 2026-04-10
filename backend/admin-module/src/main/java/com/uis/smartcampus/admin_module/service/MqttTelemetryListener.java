package com.uis.smartcampus.admin_module.service; 
import lombok.RequiredArgsConstructor; 
import org.springframework.integration.annotation.ServiceActivator; 
import org.springframework.messaging.Message; 
import org.springframework.stereotype.Component; 
import com.fasterxml.jackson.databind.ObjectMapper; 
import java.util.Map; 

@Component 
@RequiredArgsConstructor 
public class MqttTelemetryListener { 
    private final TelemetryService telemetryService; 
    
    @ServiceActivator(inputChannel = "mqttInputChannel") 
    public void handleMessage(Message<String> message) { 
        try { 
            String payload = message.getPayload(); 
            System.out.println("Payload RAW: " + payload);
            
            ObjectMapper mapper = new ObjectMapper(); 
            Map<String, Object> telemetryData = mapper.readValue(payload, Map.class);
            
            // Extraer deviceCode del payload
            String deviceCode = telemetryData.get("deviceCode").toString();
            
            // Remover deviceCode antes de procesar
            telemetryData.remove("deviceCode");
            
            telemetryService.processTelemetry(deviceCode, telemetryData); 
               
            System.out.println("MQTT recibido de: " + deviceCode); 
            System.out.println("Datos: " + telemetryData); 
        
        } catch (Exception e) { 
            e.printStackTrace(); 
        } 
    } 
}