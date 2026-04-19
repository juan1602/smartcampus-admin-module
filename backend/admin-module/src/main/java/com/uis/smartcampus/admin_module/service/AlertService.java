package com.uis.smartcampus.admin_module.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
public class AlertService {

    private final JavaMailSender mailSender;

    @Value("${alert.mail.recipient}")
    private String recipient;

    @Value("${alert.threshold.temperature}")
    private double tempThreshold;

    @Value("${alert.threshold.battery}")
    private double batteryThreshold;

    @Value("${alert.cooldown.minutes}")
    private int cooldownMinutes;

    @Value("${spring.mail.username}")
    private String sender;

    // Cooldown: evita spam — una alerta por clave cada N minutos
    private final Map<String, LocalDateTime> lastAlertTime = new ConcurrentHashMap<>();

    /**
     * Revisa los datos de telemetría y envía correo si se supera algún umbral.
     * Llamar después de filtrar y validar los datos.
     */
    public void checkAndAlert(String deviceCode, Map<String, Object> data) {

        Object tempObj = data.get("temperature");
        if (tempObj != null) {
            try {
                double temp = Double.parseDouble(tempObj.toString());
                if (temp > tempThreshold) {
                    sendAlertIfCooldownPassed(
                        deviceCode + "_temperature",
                        "[SmartCampus] ALERTA - Temperatura crítica en " + deviceCode,
                        String.format(
                            "El dispositivo '%s' reportó una temperatura de %.1f°C, superando el umbral de %.0f°C.%n%n" +
                            "Fecha y hora: %s%n%n-- SmartCampus UIS - Sistema de Alertas --",
                            deviceCode, temp, tempThreshold, LocalDateTime.now()
                        )
                    );
                }
            } catch (NumberFormatException ignored) {}
        }

        Object batObj = data.get("battery_level");
        if (batObj != null) {
            try {
                double battery = Double.parseDouble(batObj.toString());
                if (battery < batteryThreshold) {
                    sendAlertIfCooldownPassed(
                        deviceCode + "_battery",
                        "[SmartCampus] ALERTA - Batería baja en " + deviceCode,
                        String.format(
                            "El dispositivo '%s' reportó un nivel de batería de %.1f%%, por debajo del umbral de %.0f%%.%n%n" +
                            "Fecha y hora: %s%n%n-- SmartCampus UIS - Sistema de Alertas --",
                            deviceCode, battery, batteryThreshold, LocalDateTime.now()
                        )
                    );
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
