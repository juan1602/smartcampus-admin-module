package com.uis.smartcampus.admin_module.service;

import com.uis.smartcampus.admin_module.model.AlertRule;
import com.uis.smartcampus.admin_module.repository.AlertRuleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
public class AlertService {

    private final JavaMailSender mailSender;
    private final AlertRuleRepository alertRuleRepository;

    @Value("${alert.mail.recipient}")
    private String recipient;

    @Value("${alert.cooldown.minutes}")
    private int cooldownMinutes;

    @Value("${spring.mail.username}")
    private String sender;

    // Cooldown: evita spam — una alerta por clave cada N minutos
    private final Map<String, LocalDateTime> lastAlertTime = new ConcurrentHashMap<>();

    /**
     * Revisa los datos de telemetría contra las reglas activas en BD
     * y envía correo si alguna se cumple.
     */
    public void checkAndAlert(String deviceCode, Map<String, Object> data) {
        List<AlertRule> activeRules = alertRuleRepository.findByActiveTrue();

        for (AlertRule rule : activeRules) {
            Object raw = data.get(rule.getProperty().toLowerCase());
            if (raw == null) continue;

            try {
                double value = Double.parseDouble(raw.toString());
                boolean triggered = switch (rule.getOperator()) {
                    case "GREATER_THAN" -> value > rule.getThreshold();
                    case "LESS_THAN"    -> value < rule.getThreshold();
                    default             -> false;
                };

                if (triggered) {
                    String cooldownKey = deviceCode + "_" + rule.getId();
                    String label = rule.getLabel() != null ? rule.getLabel() : rule.getProperty();
                    String subject = "[SmartCampus] ALERTA - " + label + " en " + deviceCode;
                    String body = String.format(
                        "El dispositivo '%s' activó la regla: %s%n" +
                        "Valor reportado: %.2f | Umbral: %s %.2f%n%n" +
                        "Fecha y hora: %s%n%n-- SmartCampus UIS - Sistema de Alertas --",
                        deviceCode, label, value,
                        rule.getOperator().equals("GREATER_THAN") ? ">" : "<",
                        rule.getThreshold(), LocalDateTime.now()
                    );
                    sendAlertIfCooldownPassed(cooldownKey, subject, body);
                }
            } catch (NumberFormatException ignored) {}
        }
    }

    private void sendAlertIfCooldownPassed(String cooldownKey, String subject, String body) {
        LocalDateTime last = lastAlertTime.get(cooldownKey);
        if (last != null && last.plusMinutes(cooldownMinutes).isAfter(LocalDateTime.now())) {
            System.out.println("⏳ Alerta suprimida por cooldown: " + cooldownKey);
            return;
        }
        lastAlertTime.put(cooldownKey, LocalDateTime.now());
        sendEmail(subject, body);
    }

    private void sendEmail(String subject, String body) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(sender);
            message.setTo(recipient);
            message.setSubject(subject);
            message.setText(body);
            mailSender.send(message);
            System.out.println("✅ Correo de alerta enviado: " + subject);
        } catch (Exception e) {
            System.err.println("❌ Error al enviar correo de alerta: " + e.getMessage());
        }
    }
}
