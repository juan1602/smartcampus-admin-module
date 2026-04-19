package com.uis.smartcampus.admin_module.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SwaggerConfig {

    @Bean
    public OpenAPI openAPI() {
        final String securitySchemeName = "Bearer Auth";

        return new OpenAPI()
                .info(new Info()
                        .title("SmartCampus UIS — API")
                        .version("1.0.0")
                        .description(
                            "API REST del sistema de gestión de dispositivos IoT y Digital Twins " +
                            "del proyecto de grado SmartCampus UIS. " +
                            "Autenticación mediante JWT — usar el endpoint /auth/login para obtener el token."
                        )
                        .contact(new Contact()
                                .name("Equipo SmartCampus UIS")
                                .email("smartcampus.uis@gmail.com")
                        )
                )
                .addSecurityItem(new SecurityRequirement().addList(securitySchemeName))
                .components(new Components()
                        .addSecuritySchemes(securitySchemeName, new SecurityScheme()
                                .name(securitySchemeName)
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")
                        )
                );
    }
}
