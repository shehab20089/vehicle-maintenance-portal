package com.yourcompany.camunda.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "camunda")
public class CamundaProperties {

    private String operateBaseUrl;
    private String tasklistBaseUrl;
    private String zeebeGateway;
    private String zeebeGateway2;
    private String keycloakTokenUrl;
    private String keycloakClientId;
    private String keycloakClientSecret;

    public String getOperateBaseUrl() { return operateBaseUrl; }
    public void setOperateBaseUrl(String operateBaseUrl) { this.operateBaseUrl = operateBaseUrl; }

    public String getTasklistBaseUrl() { return tasklistBaseUrl; }
    public void setTasklistBaseUrl(String tasklistBaseUrl) { this.tasklistBaseUrl = tasklistBaseUrl; }

    public String getZeebeGateway2() { return zeebeGateway2; }
    public void setZeebeGateway2(String zeebeGateway2) { this.zeebeGateway2 = zeebeGateway2; }

    public String getZeebeGateway() { return zeebeGateway; }
    public void setZeebeGateway(String zeebeGateway) { this.zeebeGateway = zeebeGateway; }

    public String getKeycloakTokenUrl() { return keycloakTokenUrl; }
    public void setKeycloakTokenUrl(String keycloakTokenUrl) { this.keycloakTokenUrl = keycloakTokenUrl; }

    public String getKeycloakClientId() { return keycloakClientId; }
    public void setKeycloakClientId(String keycloakClientId) { this.keycloakClientId = keycloakClientId; }

    public String getKeycloakClientSecret() { return keycloakClientSecret; }
    public void setKeycloakClientSecret(String keycloakClientSecret) { this.keycloakClientSecret = keycloakClientSecret; }
}
