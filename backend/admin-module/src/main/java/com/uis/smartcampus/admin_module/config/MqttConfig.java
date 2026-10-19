package com.uis.smartcampus.admin_module.config;

import org.eclipse.paho.client.mqttv3.MqttConnectOptions;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.integration.annotation.ServiceActivator;
import org.springframework.integration.channel.DirectChannel;
import org.springframework.integration.mqtt.inbound.MqttPahoMessageDrivenChannelAdapter;
import org.springframework.integration.mqtt.core.DefaultMqttPahoClientFactory;
import org.springframework.integration.mqtt.outbound.MqttPahoMessageHandler;
import org.springframework.integration.mqtt.support.DefaultPahoMessageConverter;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.MessageHandler;

@Configuration
public class MqttConfig {

    @Value("${mqtt.broker-url}")
    private String brokerUrl;

    @Value("${mqtt.username:}")
    private String username;

    @Value("${mqtt.password:}")
    private String password;

    @Bean
    public DefaultMqttPahoClientFactory mqttClientFactory() {
        DefaultMqttPahoClientFactory factory = new DefaultMqttPahoClientFactory();
        MqttConnectOptions options = new MqttConnectOptions();
        options.setServerURIs(new String[]{brokerUrl});
        if (!username.isBlank()) {
            options.setUserName(username);
            options.setPassword(password.toCharArray());
        }
        options.setAutomaticReconnect(true);
        options.setCleanSession(true);
        factory.setConnectionOptions(options);
        return factory;
    }

    // ── Canal inbound: smartcampus/telemetry ───────────────────────────────────

    @Bean
    public MessageChannel mqttInputChannel() {
        return new DirectChannel();
    }

    @Bean
    public MqttPahoMessageDrivenChannelAdapter inbound() {
        MqttPahoMessageDrivenChannelAdapter adapter =
                new MqttPahoMessageDrivenChannelAdapter(
                        "smartcampus-telemetry-client",
                        mqttClientFactory(),
                        "smartcampus/telemetry"
                );
        adapter.setCompletionTimeout(5000);
        adapter.setConverter(new DefaultPahoMessageConverter());
        adapter.setQos(1);
        adapter.setOutputChannel(mqttInputChannel());
        return adapter;
    }

    // ── Canal inbound: smartcampus/confirm ────────────────────────────────────

    @Bean
    public MessageChannel mqttConfirmChannel() {
        return new DirectChannel();
    }

    @Bean
    public MqttPahoMessageDrivenChannelAdapter confirmInbound() {
        MqttPahoMessageDrivenChannelAdapter adapter =
                new MqttPahoMessageDrivenChannelAdapter(
                        "smartcampus-confirm-client",
                        mqttClientFactory(),
                        "smartcampus/confirm"
                );
        adapter.setCompletionTimeout(5000);
        adapter.setConverter(new DefaultPahoMessageConverter());
        adapter.setQos(1);
        adapter.setOutputChannel(mqttConfirmChannel());
        return adapter;
    }

    // ── Canal outbound: smartcampus/ack ───────────────────────────────────────

    @Bean
    public MessageChannel mqttOutboundChannel() {
        return new DirectChannel();
    }

    @Bean
    @ServiceActivator(inputChannel = "mqttOutboundChannel")
    public MessageHandler mqttOutboundHandler() {
        MqttPahoMessageHandler handler = new MqttPahoMessageHandler(
                "smartcampus-publisher-client",
                mqttClientFactory()
        );
        handler.setAsync(true);
        handler.setDefaultTopic("smartcampus/ack");
        handler.setDefaultQos(1);
        return handler;
    }
}