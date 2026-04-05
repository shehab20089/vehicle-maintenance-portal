package com.yourcompany.camunda.auth;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import reactor.core.publisher.Mono;

public class KeycloakTokenProvider {
    private final WebClient webClient;
    private final String tokenUrl;
    private final String clientId;
    private final String clientSecret;

    public KeycloakTokenProvider(WebClient webClient, String tokenUrl, String clientId, String clientSecret) {
        this.webClient = webClient;
        this.tokenUrl = tokenUrl;
        this.clientId = clientId;
        this.clientSecret = clientSecret;
    }

    public String getToken() {
        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("grant_type", "client_credentials");
        form.add("client_id", clientId);
        form.add("client_secret", clientSecret);

        TokenResponse tr = webClient.post()
            .uri(tokenUrl)
            .contentType(MediaType.APPLICATION_FORM_URLENCODED) // clearer than header(...)
            .body(BodyInserters.fromFormData(form))
            .exchangeToMono(resp -> {
                if (resp.statusCode().is2xxSuccessful()) {
                    return resp.bodyToMono(TokenResponse.class);
                } else {
                    return resp.bodyToMono(String.class)
                        .defaultIfEmpty("<empty body>")
                        .flatMap(body -> Mono.error(new RuntimeException(
                            "Failed to obtain token: " + resp.statusCode() + " -> " + body)));
                }
            })
            .block(java.time.Duration.ofSeconds(5));

        if (tr == null || tr.getAccessToken() == null || tr.getAccessToken().isBlank()) {
            throw new RuntimeException("Keycloak token response did not contain an access_token");
        }
        return tr.getAccessToken();
    }

    @com.fasterxml.jackson.annotation.JsonIgnoreProperties(ignoreUnknown = true)
    private static class TokenResponse {
        @com.fasterxml.jackson.annotation.JsonProperty("access_token")
        private String accessToken;
        @com.fasterxml.jackson.annotation.JsonProperty("token_type")
        private String tokenType;
        @com.fasterxml.jackson.annotation.JsonProperty("expires_in")
        private int expiresIn;
        @com.fasterxml.jackson.annotation.JsonProperty("refresh_expires_in")
        private int refreshExpiresIn;
        private String scope;

        public String getAccessToken() { return accessToken; }
        public void setAccessToken(String accessToken) { this.accessToken = accessToken; }
        public String getTokenType() { return tokenType; }
        public void setTokenType(String tokenType) { this.tokenType = tokenType; }
        public int getExpiresIn() { return expiresIn; }
        public void setExpiresIn(int expiresIn) { this.expiresIn = expiresIn; }
        public int getRefreshExpiresIn() { return refreshExpiresIn; }
        public void setRefreshExpiresIn(int refreshExpiresIn) { this.refreshExpiresIn = refreshExpiresIn; }
        public String getScope() { return scope; }
        public void setScope(String scope) { this.scope = scope; }
    }
}
