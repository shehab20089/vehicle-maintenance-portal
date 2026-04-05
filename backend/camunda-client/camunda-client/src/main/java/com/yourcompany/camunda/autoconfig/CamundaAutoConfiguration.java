package com.yourcompany.camunda.autoconfig;

import com.yourcompany.camunda.auth.KeycloakTokenProvider;
import com.yourcompany.camunda.client.CamundaClient;
import com.yourcompany.camunda.client.CamundaClientImpl;
import com.yourcompany.camunda.config.CamundaProperties;
import com.yourcompany.camunda.service.CamundaService;
import io.camunda.zeebe.client.ZeebeClient;

import java.net.URI;

import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.WebClient;

@Configuration
@EnableConfigurationProperties(CamundaProperties.class)
public class CamundaAutoConfiguration {

    @Bean
    @ConditionalOnMissingBean
    public WebClient webClient() {
        return WebClient.builder().build();
    }

    @Bean
    @ConditionalOnMissingBean
    public KeycloakTokenProvider keycloakTokenProvider(WebClient webClient, CamundaProperties props) {
        return new KeycloakTokenProvider(
            webClient,
            props.getKeycloakTokenUrl() != null ? props.getKeycloakTokenUrl() : "",
            props.getKeycloakClientId() != null ? props.getKeycloakClientId() : "",
            props.getKeycloakClientSecret() != null ? props.getKeycloakClientSecret() : ""
        );
    }

    @Bean
    @ConditionalOnMissingBean
    public ZeebeClient zeebeClient(CamundaProperties props) {
        // props.getZeebeGateway2() should be like "127.0.0.1:26500"
        URI grpcUri = URI.create(props.getZeebeGateway());
        return ZeebeClient.newClientBuilder()
                .grpcAddress(grpcUri)
                .usePlaintext() // disable TLS for local dev
                .build();
    }

    @Bean
    @ConditionalOnMissingBean
    public CamundaClient camundaClient(WebClient webClient, ZeebeClient zeebe,
                                       KeycloakTokenProvider tokenProvider, CamundaProperties props) {
        return new CamundaClientImpl(webClient, zeebe, tokenProvider, props);
    }

    @Bean
    @ConditionalOnMissingBean
    public CamundaService camundaService(CamundaClient camundaClient) {
        return new CamundaService(camundaClient);
    }
}
