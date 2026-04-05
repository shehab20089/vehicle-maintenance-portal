package com.vehiclemaintenance.api.config;

import com.yourcompany.camunda.auth.KeycloakTokenProvider;
import com.yourcompany.camunda.client.CamundaClient;
import com.yourcompany.camunda.client.CamundaClientImpl;
import com.yourcompany.camunda.config.CamundaProperties;
import com.yourcompany.camunda.service.CamundaService;
import io.camunda.zeebe.client.ZeebeClient;
import java.net.URI;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.WebClient;

@Configuration
@EnableConfigurationProperties(CamundaProperties.class)
@ConditionalOnProperty(name = "camunda.workflow.enabled", havingValue = "true")
public class CamundaSdkConfiguration {

	@Bean
	public WebClient webClient() {
		return WebClient.builder().build();
	}

	@Bean
	public KeycloakTokenProvider keycloakTokenProvider(WebClient webClient, CamundaProperties props) {
		return new KeycloakTokenProvider(
			webClient,
			props.getKeycloakTokenUrl(),
			props.getKeycloakClientId(),
			props.getKeycloakClientSecret()
		);
	}

	@Bean
	public ZeebeClient zeebeClient(@Value("${camunda.zeebe-grpc-address:127.0.0.1:26500}") String grpcAddress) {
		URI grpcUri = URI.create("http://" + grpcAddress);
		return ZeebeClient.newClientBuilder()
			.grpcAddress(grpcUri)
			.usePlaintext()
			.build();
	}

	@Bean
	public CamundaClient camundaClient(
		WebClient webClient,
		ZeebeClient zeebeClient,
		KeycloakTokenProvider tokenProvider,
		CamundaProperties properties
	) {
		return new CamundaClientImpl(webClient, zeebeClient, tokenProvider, properties);
	}

	@Bean
	public CamundaService camundaService(CamundaClient camundaClient) {
		return new CamundaService(camundaClient);
	}
}