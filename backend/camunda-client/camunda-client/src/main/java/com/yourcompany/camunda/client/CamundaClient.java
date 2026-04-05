package com.yourcompany.camunda.client;

import com.yourcompany.camunda.dto.*;
import java.util.List;
import java.util.Map;

public interface CamundaClient {
    StartProcessResult startProcess(String processKey, Object variables);
    void setProcessVariables(long processInstanceKey, Map<String, Object> variables);
    boolean deleteProcessInstance(long processInstanceKey);
    List<UserTaskDto> getUserTasks(String assignee);
    UserTaskDto getUserTaskByProcessInstance(String processInstanceKey, String candidateGroup);
    Map<String, Object> getTaskVariables(String taskId);
    FormDto getStartFormByProcess(String bpmnProcessId, Integer version) throws Exception;
    void completeUserTask(String taskId, Object variables);
    List<TimelineStepDto> getTimelineSteps(String bpmnProcessId, String firstStepActor, Integer version) throws Exception;
    FormDto getFormByDefinition(String formId, String processDefinitionKey, Integer version);
    FormDto getFormByDefinitionWithFallback(String formId, String bpmnProcessId);
    List<FormComponentDto> getStartEventForm(String bpmnProcessId, Integer version) throws Exception;
    boolean returnToPreviousStep(long processInstanceKey, String previousElementId);
    boolean returnStep(long processInstanceKey, String targetElementId);
}