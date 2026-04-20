package com.uis.smartcampus.admin_module.service;

import com.uis.smartcampus.admin_module.model.AlertRule;
import com.uis.smartcampus.admin_module.repository.AlertRuleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AlertService {

    private final AlertRuleRepository alertRuleRepository;
    private final SimpMessagingTemplate wsTemplate;

    // Cooldown: evitar notificaciones repetidas (clave: deviceCode + ruleId)
    private final Map<String, LocalDateTime> lastNotified = new HashMap<>();
    private static final int COOLDOWN_MINUTES = 2;

    public void checkAndAlert(String deviceCode, Map<String, Object> data) {
        List<AlertRule> rules = alertRuleRepository.findByActiveTrue();

        for (AlertRule rule : rules) {
            String property = rule.getProperty().toLowerCase();
            if (!data.containsKey(property)) continue;

            try {
                double value = Double.parseDouble(data.get(property).toString());
                boolean triggered = switch (rule.getOperator()) {
                    case "GREATER_THAN" -> value > rule.getThreshold();
                    case "LESS_THAN"    -> value < rule.getThreshold();
                    default             -> false;
                };

                if (!triggered) continue;

                String cooldownKey = deviceCode + "_" + rule.getId();
                LocalDateTime lastTime = lastNotified.get(cooldownKey);

                if (lastTime != null && lastTime.plusMinutes(COOLDOWN_MINUTES).isAfter(LocalDateTime.now())) {
                    continue; // aún en cooldown
                }

                lastNotified.put(cooldownKey, LocalDateTime.now());

                // Notificar al frontend via WebSocket
                Map<String, Object> alert = new HashMap<>();
                alert.put("deviceCode", deviceCode);
                alert.put("property",   rule.getProperty());
                alert.put("value",      value);
                alert.put("threshold",  rule.getThreshold());
                alert.put("operator",   rule.getOperator());
                alert.put("label",      rule.getLabel());

                wsTemplate.convertAndSend("/topic/alerts", alert);
                System.out.println("⚠️ Alerta enviada para " + deviceCode + " — " + rule.getLabel());

            } catch (NumberFormatException e) {
                System.err.println("❌ No se pudo parsear valor de " + property + " para alerta");
            }
        }
    }
}
