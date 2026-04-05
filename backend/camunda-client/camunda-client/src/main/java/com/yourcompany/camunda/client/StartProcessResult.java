package com.yourcompany.camunda.client;
public class StartProcessResult {
    private final String bpmnProcessId;
    private final long processDefinitionKey;
    private final long processInstanceKey;
    private final int version;

    public StartProcessResult(String bpmnProcessId, long processDefinitionKey, long processInstanceKey, int version) {
        this.bpmnProcessId = bpmnProcessId;
        this.processDefinitionKey = processDefinitionKey;
        this.processInstanceKey = processInstanceKey;
        this.version = version;
    }

    public String getBpmnProcessId() { return bpmnProcessId; }
    public long getProcessDefinitionKey() { return processDefinitionKey; }
    public long getProcessInstanceKey() { return processInstanceKey; }
    public int getVersion() { return version; }
}