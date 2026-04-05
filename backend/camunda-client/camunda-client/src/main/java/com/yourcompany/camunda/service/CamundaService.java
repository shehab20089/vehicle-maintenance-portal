package com.yourcompany.camunda.service;

import com.yourcompany.camunda.client.CamundaClient;
import com.yourcompany.camunda.client.StartProcessResult;
import com.yourcompany.camunda.dto.UserTaskDto;
import com.yourcompany.camunda.dto.TimelineStepDto;
import com.yourcompany.camunda.dto.FormDto;
import com.yourcompany.camunda.dto.RequestStatus;
import com.yourcompany.camunda.dto.ReviewResponse;

import java.util.List;
import java.util.concurrent.CompletableFuture;

public class CamundaService {

    private final CamundaClient camundaClient;

    public CamundaService(CamundaClient camundaClient) {
        this.camundaClient = camundaClient;
    }

    public CompletableFuture<StartProcessResult> startProcess(String processKey, Object variables) {
        return CompletableFuture.supplyAsync(() -> camundaClient.startProcess(processKey, variables));
    }

    public CompletableFuture<ReviewResponse> review(
            String processKey,
            String firstStepActor,
            String processInstanceKey,
            String candidateGroup,
            Integer version,
            String returnedReason) {

        return CompletableFuture.supplyAsync(() -> {
            try {
                // 1️⃣ Fetch the pending user task for this role
                var task = camundaClient.getUserTaskByProcessInstance(processInstanceKey, candidateGroup);

                // 2️⃣ Retrieve timeline steps
                var timelineSteps = camundaClient.getTimelineSteps(processKey, firstStepActor, version);

                // 3️⃣ Build response
                ReviewResponse response = new ReviewResponse();
                response.setTaskId(task != null ? task.getId() : "");
                response.setReturnedReason(returnedReason);
                response.setTimelineSteps(timelineSteps);

                return response;
            } catch (Exception e) {
                throw new RuntimeException("Failed to review process", e);
            }
        });
    }


     public CompletableFuture<Boolean> accept(
            String processKey,
            String firstStepActor,
            Integer version,
            String taskId,
            Object variables) {

        return CompletableFuture.supplyAsync(() -> {
            try {
                // Step 1: get timeline
                List<TimelineStepDto> steps = camundaClient.getTimelineSteps(processKey, firstStepActor, version);

                // Step 2: complete task with Approved
                System.out.println("Decision: Approved");
                camundaClient.completeUserTask(taskId, variables);

                return true;
            } catch (Exception e) {
                throw new RuntimeException("Approval workflow failed", e);
            }
        });
    }

    public CompletableFuture<Boolean> reject(
            String processKey,
            String firstStepActor,
            Integer version,
            String taskId,
            Object variables) {

        return CompletableFuture.supplyAsync(() -> {
            try {
                List<TimelineStepDto> steps = camundaClient.getTimelineSteps(processKey, firstStepActor, version);

                System.out.println("Decision: Rejected");
                camundaClient.completeUserTask(taskId, variables);

                return true;
            } catch (Exception e) {
                throw new RuntimeException("Rejection workflow failed", e);
            }
        });
    }

    public CompletableFuture<Boolean> returnToPreviousStep(
            String processKey,
            String firstStepActor,
            Integer version,
            long processInstanceKey,
            String currentRole) {

        return CompletableFuture.supplyAsync(() -> {
            try {
                List<TimelineStepDto> steps = camundaClient.getTimelineSteps(processKey, firstStepActor, version);
                int currentIndex = -1;
                for (int index = 0; index < steps.size(); index++) {
                    TimelineStepDto step = steps.get(index);
                    if (step.getGroup() != null && step.getGroup().equals(currentRole) && isWorkflowTaskStep(step)) {
                        currentIndex = index;
                    }
                }

                if (currentIndex <= 0) {
                    throw new RuntimeException("PREVIOUS_WORKFLOW_STEP_NOT_FOUND");
                }

                TimelineStepDto previousElement = steps.get(currentIndex - 1);
                if (!isWorkflowTaskStep(previousElement)) {
                    throw new RuntimeException("PREVIOUS_WORKFLOW_STEP_NOT_FOUND");
                }
                return camundaClient.returnStep(processInstanceKey, previousElement.getId());
            } catch (Exception e) {
                throw new RuntimeException("Failed to return to previous step", e);
            }

        });
    }

    public CompletableFuture<Boolean> returnToFirstStep(
            String processKey,
            String firstStepActor,
            Integer version,
            long processInstanceKey) {

        return CompletableFuture.supplyAsync(() -> {
            try {
            List<TimelineStepDto> timelineSteps = camundaClient.getTimelineSteps(processKey, firstStepActor, version);

            TimelineStepDto firstStep = timelineSteps.stream()
                .filter(s -> s.getGroup() != null && s.getGroup().equals(firstStepActor))
                .filter(this::isWorkflowTaskStep)
                    .findFirst()
                    .orElseThrow(() -> new RuntimeException("FIRST_WORKFLOW_STEP_NOT_FOUND"));

            return camundaClient.returnStep(processInstanceKey, firstStep.getId());
            } catch (Exception e) {
                throw new RuntimeException("Failed to return to first step", e);
            }
        });
    }

    public CompletableFuture<Boolean> transferToRole(
            String processKey,
            String firstStepActor,
            Integer version,
            long processInstanceKey,
            String targetRole) {

        return CompletableFuture.supplyAsync(() -> {
            try {
                List<TimelineStepDto> steps = camundaClient.getTimelineSteps(processKey, firstStepActor, version);

                TimelineStepDto targetElement = steps.stream()
                        .filter(step -> step.getGroup() != null && step.getGroup().equals(targetRole))
                        .filter(this::isWorkflowTaskStep)
                        .findFirst()
                        .orElseThrow(() -> new RuntimeException("TARGET_ROLE_NOT_FOUND"));

                return camundaClient.returnStep(processInstanceKey, targetElement.getId());
            } catch (Exception e) {
                throw new RuntimeException("Transfer workflow failed", e);
            }
        });
    }

    private boolean isWorkflowTaskStep(TimelineStepDto step) {
        if (step == null || step.getId() == null || step.getId().isBlank()) {
            return false;
        }

        String group = step.getGroup();
        return group == null || !step.getId().equals(group);
    }


    public CompletableFuture<List<UserTaskDto>> getUserTasks(String assignee) {
        return CompletableFuture.supplyAsync(() -> camundaClient.getUserTasks(assignee));
    }

    public CompletableFuture<Void> completeUserTask(String taskId, Object variables) {
        return CompletableFuture.runAsync(() -> camundaClient.completeUserTask(taskId, variables));
    }

    public CompletableFuture<List<TimelineStepDto>> getTimelineSteps(String bpmnProcessId, String firstStepActor, Integer version) {
    return CompletableFuture.supplyAsync(() -> {
        try {
            return camundaClient.getTimelineSteps(bpmnProcessId, firstStepActor, version);
        } catch (Exception e) {
            throw new RuntimeException("Failed to get timeline steps", e);
        }
    });
}


    public CompletableFuture<FormDto> getFormByDefinition(String formId, String processDefinitionKey, Integer version) {
        return CompletableFuture.supplyAsync(() -> camundaClient.getFormByDefinition(formId, processDefinitionKey, version));
    }

    public CompletableFuture<FormDto> getFormByDefinitionWithFallback(String formId, String bpmnProcessId) {
        return CompletableFuture.supplyAsync(() -> camundaClient.getFormByDefinitionWithFallback(formId, bpmnProcessId));
    }

    public CompletableFuture<FormDto> getStartFormByProcess(String bpmnProcessId, Integer version) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                return camundaClient.getStartFormByProcess(bpmnProcessId, version);
            } catch (Exception e) {
                throw new RuntimeException("Failed to get start form", e);
            }
        });
    }

    public CompletableFuture<Boolean> returnToPreviousStep(long processInstanceKey, String previousElementId) {
        return CompletableFuture.supplyAsync(() -> camundaClient.returnToPreviousStep(processInstanceKey, previousElementId));
    }
}