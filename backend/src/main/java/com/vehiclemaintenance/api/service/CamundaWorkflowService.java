package com.vehiclemaintenance.api.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.yourcompany.camunda.client.CamundaClient;
import com.yourcompany.camunda.client.StartProcessResult;
import com.yourcompany.camunda.dto.FormDto;
import com.yourcompany.camunda.dto.UserTaskDto;
import com.yourcompany.camunda.service.CamundaService;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class CamundaWorkflowService {

	private static final Logger log = LoggerFactory.getLogger(CamundaWorkflowService.class);
	private static final TypeReference<LinkedHashMap<String, Object>> MAP_TYPE = new TypeReference<>() { };

	private final InMemoryDataService dataService;
	private final BpmnProcessMetadataService metadataService;
	private final CamundaFormSchemaService formSchemaService;
	private final ObjectMapper objectMapper;
	private final CamundaService camundaService;
	private final CamundaClient camundaClient;

	@Value("${camunda.workflow.enabled:false}")
	private boolean workflowEnabled;

	@Value("${camunda.process-id:Process_VehicleMaintenanceRequest}")
	private String processId;

	@Value("${camunda.first-step-actor:movement_officer}")
	private String firstStepActor;

	public CamundaWorkflowService(
		InMemoryDataService dataService,
		BpmnProcessMetadataService metadataService,
		CamundaFormSchemaService formSchemaService,
		ObjectMapper objectMapper,
		@Autowired(required = false) CamundaService camundaService,
		@Autowired(required = false) CamundaClient camundaClient
	) {
		this.dataService = dataService;
		this.metadataService = metadataService;
		this.formSchemaService = formSchemaService;
		this.objectMapper = objectMapper;
		this.camundaService = camundaService;
		this.camundaClient = camundaClient;
	}

	public boolean isEnabled() {
		return workflowEnabled && camundaService != null && camundaClient != null;
	}

	public void syncLegacyAction(
		String requestId,
		String action,
		String performedBy,
		String performedByRole,
		String notes,
		Map<String, Object> additionalData
	) {
		if (!isEnabled() || !SUPPORTED_LEGACY_ACTIONS.contains(action)) {
			return;
		}

		try {
			Map<String, Object> request = dataService.getRequestSnapshot(requestId);
			Map<String, Object> workflow = ensureStartedIfNeeded(requestId, request, action);
			Long processInstanceKey = asLong(workflow.get("processInstanceKey"));

			if (processInstanceKey == null) {
				return;
			}

			boolean justStarted = "submit".equals(action) || "resubmit".equals(action);
			UserTaskDto activeTask = justStarted
				? getActiveTaskWithRetry(processInstanceKey)
				: getActiveTask(processInstanceKey);
			if (activeTask == null) {
				return;
			}

			Map<String, Object> variables = buildLegacyVariables(action, request, performedBy, performedByRole, notes, additionalData);
			executeWorkflowAction(action, workflow, activeTask, variables);
			refreshWorkflowState(requestId, workflow, getActiveTaskWithRetry(processInstanceKey));
		} catch (Exception exception) {
			log.error("syncLegacyAction failed for request={} action={}", requestId, action, exception);
			throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "تعذر مزامنة الإجراء مع Camunda.", exception);
		}
	}

	public Map<String, Object> getWorkflowContext(String requestId, String role) {
		if (!isEnabled()) {
			return Map.of("enabled", false);
		}

		Map<String, Object> request = dataService.getRequestSnapshot(requestId);
		Map<String, Object> workflow = workflowMap(request);
		Long processInstanceKey = asLong(workflow.get("processInstanceKey"));

		if (processInstanceKey == null) {
			return Map.of(
				"enabled", true,
				"workflow", normalizeWorkflowMap(workflow)
			);
		}

		try {
			ReviewSnapshot reviewSnapshot = reviewSnapshot(processInstanceKey, role, workflow);
			UserTaskDto activeTask = reviewSnapshot.activeTask();
			String fallbackTaskName = String.valueOf(workflow.getOrDefault("currentTaskName", ""));
			Map<String, Object> refreshedWorkflow = refreshWorkflowState(requestId, workflow, activeTask);
			request = reconcileRequestSnapshot(requestId, request, activeTask, fallbackTaskName);
			LinkedHashMap<String, Object> response = new LinkedHashMap<>();
			response.put("enabled", true);
			response.put("workflow", normalizeWorkflowMap(refreshedWorkflow));

			if (activeTask == null) {
				return response;
			}

			BpmnProcessMetadataService.UserTaskMetadata metadata = metadataService.findByTaskName(activeTask.getName()).orElse(null);
			String taskRole = resolveTaskRole(metadata);
			response.put("task", Map.of(
				"id", activeTask.getId(),
				"name", activeTask.getName(),
				"role", taskRole,
				"candidateGroup", metadata == null ? "" : emptyToBlank(metadata.candidateGroup()),
				"formId", metadata == null ? "" : emptyToBlank(metadata.formId())
			));

			if (role != null && Objects.equals(role, taskRole) && metadata != null && !metadata.formId().isBlank()) {
				response.put("form", Map.of(
					"id", metadata.formId(),
					"schema", resolveFormSchema(metadata.formId(), refreshedWorkflow, request),
					"variables", resolveFormVariables(activeTask, request)
				));
			}

			response.put("timeline", reviewSnapshot.timeline());

			return response;
		} catch (Exception exception) {
			throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "تعذر تحميل سياق المهمة من Camunda.", exception);
		}
	}

	public Map<String, Object> getStartRequestForm() {
		String formId = "form_submit_request";
		Object schema = buildFallbackFormSchema(formId, Map.of());

		if (isEnabled() && camundaService != null) {
			try {
				FormDto formDto = camundaService.getStartFormByProcess(processId, null).join();
				if (formDto != null) {
					if (formDto.getId() != null && !formDto.getId().isBlank()) {
						formId = formDto.getId();
					}
					if (formDto.getSchema() != null && !formDto.getSchema().isBlank()) {
						schema = objectMapper.readValue(formDto.getSchema(), Object.class);
					}
				}
			} catch (Exception exception) {
				log.warn("Falling back to local start form schema for processId={}", processId, exception);
			}
		}

		return Map.of(
			"form", Map.of(
				"id", formId,
				"schema", schema,
				"variables", Map.of()
			)
		);
	}

	private Map<String, Object> resolveFormVariables(UserTaskDto activeTask, Map<String, Object> request) {
		LinkedHashMap<String, Object> variables = new LinkedHashMap<>(buildBaseVariables(request));
		String formId = metadataService.findByTaskName(activeTask.getName())
			.map(BpmnProcessMetadataService.UserTaskMetadata::formId)
			.orElse("");

		if (camundaClient == null || activeTask == null) {
			return applyDisplayLabels(formId, sanitizeFormVariables(formId, variables));
		}

		try {
			variables.putAll(camundaClient.getTaskVariables(activeTask.getId()));
		} catch (Exception exception) {
			log.warn("Falling back to request snapshot variables for task={}", activeTask.getId(), exception);
		}


		List<Map<String, Object>> maintenanceOfficers = maintenanceOfficerOptions();
		if (!maintenanceOfficers.isEmpty()) {
			variables.putIfAbsent("assignableEmployees", maintenanceOfficers);
			variables.putIfAbsent("assignableRoles", maintenanceOfficers);
		}

		return applyDisplayLabels(formId, sanitizeFormVariables(formId, variables));
	}

	private Map<String, Object> applyDisplayLabels(String formId, Map<String, Object> source) {
		LinkedHashMap<String, Object> labeled = new LinkedHashMap<>(source);

		if (READONLY_DETAIL_FORM_IDS.contains(formId)) {
			applyLookupLabel(labeled, "region", "regions");
			applyLookupLabel(labeled, "requestedService", "servicesTypes", "requestedServices");
			applyOutcomeLabel(labeled);
		}

		return labeled;
	}

	private void applyLookupLabel(Map<String, Object> target, String fieldKey, String... lookupKeys) {
		Object rawValue = target.get(fieldKey);
		if (rawValue == null || String.valueOf(rawValue).isBlank()) {
			return;
		}

		String label = lookupLabel(String.valueOf(rawValue), lookupKeys);
		if (!label.isBlank()) {
			target.put(fieldKey, label);
		}
	}

	private String lookupLabel(String value, String... lookupKeys) {
		Map<String, Object> lookups = dataService.getLookups();
		for (String lookupKey : lookupKeys) {
			Object entries = lookups.get(lookupKey);
			if (!(entries instanceof List<?> items)) {
				continue;
			}

			for (Object item : items) {
				if (!(item instanceof Map<?, ?> entry)) {
					continue;
				}

				Object entryValue = entry.get("value");
				if (entryValue != null && Objects.equals(String.valueOf(entryValue), value)) {
					Object label = entry.get("label");
					return label == null ? "" : String.valueOf(label);
				}
			}
		}

		return "";
	}

	private void applyOutcomeLabel(Map<String, Object> target) {
		Object rawValue = target.get("maintenanceOutcome");
		if (rawValue == null || String.valueOf(rawValue).isBlank()) {
			return;
		}

		String label = switch (String.valueOf(rawValue)) {
			case "completed_with_report" -> "تمت الصيانة مع التقرير";
			case "notify_appointment" -> "إشعار بموعد الصيانة";
			case "notify_spare_parts" -> "إشعار بقطع الغيار المطلوبة";
			default -> "";
		};

		if (!label.isBlank()) {
			target.put("maintenanceOutcome", label);
		}
	}

	private Map<String, Object> sanitizeFormVariables(String formId, Map<String, Object> source) {
		LinkedHashMap<String, Object> sanitized = new LinkedHashMap<>(source);
		for (String key : transientFormFields(formId)) {
			sanitized.remove(key);
		}
		return sanitized;
	}

	private List<String> transientFormFields(String formId) {
		return switch (formId) {
			case "form_initial_review" -> List.of("action", "notes", "rejectionReason", "returnReason");
			case "form_supply_maint_review" -> List.of("action", "notes", "rejectionReason");
			case "form_maintenance_mgr_review" -> List.of("action", "assignedOfficer", "rejectionReason");
			case "form_maintenance_processing" -> List.of(
				"action",
				"notes",
				"rejectionReason",
				"reassignTarget",
				"vehicleEntryDate",
				"maintenanceAppointmentDate",
				"faultDescription",
				"requiredItem",
				"itemQuantity",
				"itemRequestReceivedDate",
				"itemsReceivedDate",
				"warehouseKeeper",
				"warehouseSectionManager",
				"orderNumber",
				"vehicleReceiptDate",
				"vehicleReceiverName",
				"washingDone",
				"batteryChanged",
				"oilChanged",
				"tiresChanged",
				"tiresChangedCount",
				"otherActionDone",
				"otherActionDescription"
			);
			case "form_maintenance_outcome" -> List.of("maintenanceOutcome", "notes");
			case "form_final_approval" -> List.of("action", "notes", "finalReturnReason");
			default -> List.of();
		};
	}

	private List<Map<String, Object>> maintenanceOfficerOptions() {
		return dataService.getUsers(Optional.of("maintenance_officer")).stream()
			.map(user -> Map.<String, Object>of(
				"label", String.valueOf(user.getOrDefault("name", "")),
				"value", String.valueOf(user.getOrDefault("id", ""))
			))
			.filter(option -> !String.valueOf(option.get("value")).isBlank())
			.toList();
	}

	public Map<String, Object> submitWorkflowTask(
		String requestId,
		String performedBy,
		String performedByRole,
		Map<String, Object> variables
	) {
		if (!isEnabled()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "تكامل Camunda غير مفعل.");
		}

		Map<String, Object> request = dataService.getRequestSnapshot(requestId);
		Map<String, Object> workflow = workflowMap(request);
		Long processInstanceKey = asLong(workflow.get("processInstanceKey"));

		if (processInstanceKey == null) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "هذا الطلب غير مرتبط بعد بمسار Camunda.");
		}

		try {
			UserTaskDto activeTask = getActiveTask(processInstanceKey);
			if (activeTask == null) {
				throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "لا توجد مهمة نشطة لهذا الطلب.");
			}

			Map<String, Object> normalizedVariables = normalizeWorkflowSubmissionVariables(variables, request);

			String localAction = inferLocalAction(activeTask.getName(), normalizedVariables);
			executeWorkflowAction(localAction, workflow, activeTask, normalizedVariables);
			UserTaskDto nextActiveTask = getActiveTaskWithRetry(processInstanceKey);
			refreshWorkflowState(requestId, workflow, nextActiveTask);
			Map<String, Object> additionalData = buildLocalAdditionalData(localAction, normalizedVariables);

			LinkedHashMap<String, Object> payload = new LinkedHashMap<>();
			payload.put("action", localAction);
			payload.put("performedBy", performedBy);
			payload.put("performedByRole", performedByRole);
			payload.put("notes", extractNotes(normalizedVariables));
			payload.put("additionalData", additionalData);
			Map<String, Object> updatedRequest = dataService.applyAction(requestId, payload);
			return reconcileRequestSnapshot(requestId, updatedRequest, nextActiveTask, "");
		} catch (ResponseStatusException exception) {
			throw exception;
		} catch (Exception exception) {
			throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "تعذر إرسال النموذج إلى Camunda.", exception);
		}
	}

	private Map<String, Object> ensureStartedIfNeeded(String requestId, Map<String, Object> request, String action) {
		Map<String, Object> workflow = workflowMap(request);
		if (asLong(workflow.get("processInstanceKey")) != null || (!"submit".equals(action) && !"resubmit".equals(action))) {
			return workflow;
		}

		StartProcessResult startResult = camundaService.startProcess(processId, buildBaseVariables(request)).join();
		LinkedHashMap<String, Object> updatedWorkflow = new LinkedHashMap<>(workflow);
		updatedWorkflow.put("bpmnProcessId", startResult.getBpmnProcessId());
		updatedWorkflow.put("processDefinitionKey", startResult.getProcessDefinitionKey());
		updatedWorkflow.put("processInstanceKey", startResult.getProcessInstanceKey());
		updatedWorkflow.put("processVersion", startResult.getVersion());
		updatedWorkflow.put("startedAt", Instant.now().toString());
		dataService.updateWorkflow(requestId, updatedWorkflow);
		UserTaskDto firstTask = getActiveTaskWithRetry(startResult.getProcessInstanceKey());
		return refreshWorkflowState(requestId, updatedWorkflow, firstTask);
	}

	private Map<String, Object> refreshWorkflowState(String requestId, Map<String, Object> workflow) {
		Long processInstanceKey = asLong(workflow.get("processInstanceKey"));
		UserTaskDto activeTask = processInstanceKey == null ? null : getActiveTask(processInstanceKey);
		return refreshWorkflowState(requestId, workflow, activeTask);
	}

	private Map<String, Object> refreshWorkflowState(String requestId, Map<String, Object> workflow, UserTaskDto activeTask) {
		LinkedHashMap<String, Object> updatedWorkflow = new LinkedHashMap<>(workflow);

		if (activeTask == null) {
			updatedWorkflow.remove("currentTaskId");
			updatedWorkflow.remove("currentTaskName");
			updatedWorkflow.remove("currentTaskGroup");
			updatedWorkflow.remove("currentTaskRole");
			updatedWorkflow.remove("currentFormId");
			updatedWorkflow.put("completedAt", Instant.now().toString());
			dataService.updateWorkflow(requestId, updatedWorkflow);
			return updatedWorkflow;
		}

		Optional<BpmnProcessMetadataService.UserTaskMetadata> metadata = metadataService.findByTaskName(activeTask.getName());
		updatedWorkflow.put("currentTaskId", activeTask.getId());
		updatedWorkflow.put("currentTaskName", activeTask.getName());
		updatedWorkflow.put("currentTaskGroup", metadata.map(BpmnProcessMetadataService.UserTaskMetadata::candidateGroup).orElse(""));
		updatedWorkflow.put("currentTaskRole", metadata.map(this::resolveTaskRole).orElse(""));
		updatedWorkflow.put("currentFormId", metadata.map(BpmnProcessMetadataService.UserTaskMetadata::formId).orElse(""));
		dataService.updateWorkflow(requestId, updatedWorkflow);
		return updatedWorkflow;
	}

	private UserTaskDto getActiveTask(long processInstanceKey) {
		return camundaClient == null
			? null
			: camundaClient.getUserTaskByProcessInstance(String.valueOf(processInstanceKey), null);
	}

	private void executeWorkflowAction(
		String action,
		Map<String, Object> workflow,
		UserTaskDto activeTask,
		Map<String, Object> variables
	) {
		Long processInstanceKey = asLong(workflow.get("processInstanceKey"));
		Integer processVersion = asInteger(workflow.get("processVersion"));
		String formAction = String.valueOf(variables.getOrDefault("action", ""));
		String transferTargetGroup = resolveTransferTargetGroup(variables);
		if (processInstanceKey == null || activeTask == null) {
			return;
		}

		if (camundaClient != null && variables != null && !variables.isEmpty()) {
			camundaClient.setProcessVariables(processInstanceKey, variables);
		}

		if (RETURN_TO_FIRST_ACTIONS.contains(action)) {
			if (!transferTargetGroup.isBlank()) {
				camundaService.transferToRole(processId, firstStepActor, processVersion, processInstanceKey, transferTargetGroup).join();
				return;
			}
			camundaService.returnToFirstStep(processId, firstStepActor, processVersion, processInstanceKey).join();
			return;
		}

		if (RETURN_TO_PREVIOUS_ACTIONS.contains(action)) {
			if (!transferTargetGroup.isBlank()) {
				camundaService.transferToRole(processId, firstStepActor, processVersion, processInstanceKey, transferTargetGroup).join();
				return;
			}
			String currentTaskGroup = String.valueOf(workflow.getOrDefault("currentTaskGroup", ""));
			camundaService.returnToPreviousStep(processId, firstStepActor, processVersion, processInstanceKey, currentTaskGroup).join();
			return;
		}

		if (!transferTargetGroup.isBlank() && TRANSFER_ACTIONS.contains(formAction)) {
			camundaService.transferToRole(processId, firstStepActor, processVersion, processInstanceKey, transferTargetGroup).join();
			return;
		}

		if (REJECT_ACTIONS.contains(action)) {
			camundaService.reject(processId, firstStepActor, processVersion, activeTask.getId(), variables).join();
			return;
		}

		camundaService.accept(processId, firstStepActor, processVersion, activeTask.getId(), variables).join();
	}

	private ReviewSnapshot reviewSnapshot(long processInstanceKey, String role, Map<String, Object> workflow) {
		Integer processVersion = asInteger(workflow.get("processVersion"));
		String candidateGroup = denormalizeRole(role);
		var review = camundaService.review(
			processId,
			firstStepActor,
			String.valueOf(processInstanceKey),
			candidateGroup == null || candidateGroup.isBlank() ? null : candidateGroup,
			processVersion,
			String.valueOf(workflow.getOrDefault("returnedReason", ""))
		).join();

		UserTaskDto activeTask = getActiveTask(processInstanceKey);
		List<?> timeline = review.getTimelineSteps() == null ? List.of() : review.getTimelineSteps();
		return new ReviewSnapshot(activeTask, timeline);
	}

	private Object resolveFormSchema(String formId, Map<String, Object> workflow, Map<String, Object> request) {
		if (camundaService != null) {
			try {
				// Try the exact process definition version first
				FormDto formDto = camundaService.getFormByDefinition(
					formId,
					String.valueOf(workflow.get("processDefinitionKey")),
					asInteger(workflow.get("processVersion"))
				).join();
				if (formDto != null && formDto.getSchema() != null && !formDto.getSchema().isBlank()) {
					return objectMapper.readValue(formDto.getSchema(), Object.class);
				}

				// Form not found for this version – scan older deployments
				formDto = camundaService.getFormByDefinitionWithFallback(formId, processId).join();
				if (formDto != null && formDto.getSchema() != null && !formDto.getSchema().isBlank()) {
					return objectMapper.readValue(formDto.getSchema(), Object.class);
				}
			} catch (Exception exception) {
				log.warn("Falling back to local form schema for formId={}", formId, exception);
			}
		}

		return buildFallbackFormSchema(formId, request);
	}

	private Map<String, Object> buildFallbackFormSchema(String formId, Map<String, Object> request) {
		return formSchemaService.buildSchema(formId, request);
	}

	private Map<String, Object> normalizeWorkflowSubmissionVariables(Map<String, Object> variables, Map<String, Object> request) {
		LinkedHashMap<String, Object> normalized = new LinkedHashMap<>(variables == null ? Map.of() : variables);
		normalized.putIfAbsent("currentMaintenanceOfficer", String.valueOf(request.getOrDefault("currentMaintenanceOfficerId", "")));
		normalized.putIfAbsent("specialistUserId", String.valueOf(request.getOrDefault("specializedOfficerId", "")));

		if (normalized.get("supplyItemsRequested") instanceof String supplyItemsText) {
			List<String> items = new ArrayList<>();
			for (String item : supplyItemsText.split("[,،]")) {
				String trimmed = item.trim();
				if (!trimmed.isEmpty()) {
					items.add(trimmed);
				}
			}
			normalized.put("supplyItemsRequested", items);
		}

		String action = String.valueOf(normalized.getOrDefault("action", ""));
		if ("route".equals(action) && String.valueOf(normalized.getOrDefault("assignedOfficer", "")).isBlank()) {
			normalized.put("assignedOfficer", formSchemaService.firstMaintenanceOfficerValue());
		}
		if ("reassign".equals(action) && String.valueOf(normalized.getOrDefault("reassignTarget", "")).isBlank()) {
			normalized.put("reassignTarget", formSchemaService.firstMaintenanceOfficerValue());
		}
		if ("route".equals(action)) {
			normalized.put("currentMaintenanceOfficer", String.valueOf(normalized.getOrDefault("assignedOfficer", "")));
			normalized.put("specialistUserId", "");
		}
		if ("reassign".equals(action)) {
			normalized.put("specialistUserId", String.valueOf(normalized.getOrDefault("reassignTarget", "")));
		}

		String explicitTransferTarget = resolveTransferTargetGroup(normalized);
		if (!explicitTransferTarget.isBlank()) {
			normalized.put("transferTargetGroup", explicitTransferTarget);
			normalized.put("transferTargetRole", normalizeRole(explicitTransferTarget));
		}

		return normalized;
	}

	private UserTaskDto getActiveTaskWithRetry(long processInstanceKey) {
		if (camundaClient == null) return null;
		for (int attempt = 0; attempt < 10; attempt++) {
			UserTaskDto task = camundaClient.getUserTaskByProcessInstance(
				String.valueOf(processInstanceKey), null);
			if (task != null) return task;
			try {
				Thread.sleep(500);
			} catch (InterruptedException e) {
				Thread.currentThread().interrupt();
				return null;
			}
		}
		return null;
	}

	private Map<String, Object> buildBaseVariables(Map<String, Object> request) {
		LinkedHashMap<String, Object> variables = new LinkedHashMap<>();
		String mobileNumber = firstNonBlank(request.get("mobileNumber"), nestedValue(request, "requester", "phone"), request.get("phone"));
		String vehiclePlate = firstNonBlank(request.get("vehiclePlate"), nestedValue(request, "vehicle", "plateNumber"));
		String vehicleCategory = firstNonBlank(request.get("vehicleCategory"), nestedValue(request, "vehicle", "vehicleType"));
		String vehicleName = firstNonBlank(request.get("vehicleName"), nestedValue(request, "vehicle", "make"), nestedValue(request, "vehicle", "vehicleNumber"));
		String vehicleModel = firstNonBlank(request.get("vehicleModel"), nestedValue(request, "vehicle", "model"));
		Object vehicleYear = firstPresent(request.get("vehicleYear"), nestedValue(request, "vehicle", "year"));

		variables.put("requestId", request.get("id"));
		variables.put("requestNumber", request.get("requestNumber"));
		variables.put("requesterName", nestedValue(request, "requester", "name"));
		variables.put("employeeId", nestedValue(request, "requester", "employeeId"));
		variables.put("department", nestedValue(request, "requester", "department"));
		variables.put("phone", mobileNumber);
		variables.put("mobileNumber", mobileNumber);
		variables.put("vehicleNumber", nestedValue(request, "vehicle", "vehicleNumber"));
		variables.put("plateNumber", vehiclePlate);
		variables.put("vehiclePlate", vehiclePlate);
		variables.put("vehicleType", vehicleCategory);
		variables.put("vehicleCategory", vehicleCategory);
		variables.put("make", nestedValue(request, "vehicle", "make"));
		variables.put("vehicleName", vehicleName);
		variables.put("model", nestedValue(request, "vehicle", "model"));
		variables.put("vehicleModel", vehicleModel);
		variables.put("year", vehicleYear);
		variables.put("vehicleYear", vehicleYear);
		variables.put("color", nestedValue(request, "vehicle", "color"));
		variables.put("currentCondition", nestedValue(request, "vehicle", "currentCondition"));
		variables.put("issueCategory", request.getOrDefault("issueCategory", "general"));
		variables.put("issueDescription", request.getOrDefault("issueDescription", ""));
		variables.put("priority", request.getOrDefault("priority", "medium"));
		variables.put("notes", request.getOrDefault("notes", ""));
		variables.put("requestedService", request.getOrDefault("requestedService", ""));
		variables.put("region", request.getOrDefault("region", ""));
		variables.put("batterySize", request.getOrDefault("batterySize", ""));
		variables.put("tireSize", request.getOrDefault("tireSize", ""));
		variables.put("tireCount", request.getOrDefault("tireCount", ""));
		variables.put("otherServiceDescription", request.getOrDefault("otherServiceDescription", ""));
		variables.put("requestStatus", request.getOrDefault("requestStatus", request.getOrDefault("currentStage", request.getOrDefault("status", ""))));
		copyRequestField(variables, request, "rejectionReason");
		copyRequestField(variables, request, "returnReason");
		copyRequestField(variables, request, "finalReturnReason");
		copyRequestField(variables, request, "faultDescription");
		copyRequestField(variables, request, "requiredItem");
		copyRequestField(variables, request, "itemQuantity");
		copyRequestField(variables, request, "vehicleEntryDate");
		copyRequestField(variables, request, "maintenanceAppointmentDate");
		copyRequestField(variables, request, "itemRequestReceivedDate");
		copyRequestField(variables, request, "itemsReceivedDate");
		copyRequestField(variables, request, "warehouseKeeper");
		copyRequestField(variables, request, "warehouseSectionManager");
		copyRequestField(variables, request, "orderNumber");
		copyRequestField(variables, request, "vehicleReceiptDate");
		copyRequestField(variables, request, "vehicleReceiverName");
		copyRequestField(variables, request, "washingDone");
		copyRequestField(variables, request, "batteryChanged");
		copyRequestField(variables, request, "oilChanged");
		copyRequestField(variables, request, "tiresChanged");
		copyRequestField(variables, request, "tiresChangedCount");
		copyRequestField(variables, request, "otherActionDone");
		copyRequestField(variables, request, "otherActionDescription");
		variables.put("currentMaintenanceOfficer", request.getOrDefault("currentMaintenanceOfficerId", ""));
		variables.put("specialistUserId", request.getOrDefault("specializedOfficerId", ""));
		variables.put("submitterId", nestedValue(request, "requester", "employeeId"));
		return variables;
	}

	private Map<String, Object> buildLegacyVariables(
		String action,
		Map<String, Object> request,
		String performedBy,
		String performedByRole,
		String notes,
		Map<String, Object> additionalData
	) {
		LinkedHashMap<String, Object> variables = new LinkedHashMap<>(buildBaseVariables(request));
		variables.put("performedBy", performedBy);
		variables.put("performedByRole", performedByRole);
		if (notes != null && !notes.isBlank()) {
			variables.put("notes", notes);
			variables.put("returnedReason", notes);
		}

		switch (action) {
			case "transport_approve", "supply_approve" -> variables.put("action", "approve");
			case "transport_return", "maintenance_return", "specialized_return", "final_return" -> variables.put("action", "return");
			case "transport_reject", "supply_reject", "maintenance_director_reject", "maintenance_reject", "specialized_reject" -> variables.put("action", "reject");
			case "route_to_maintenance" -> {
				String assignedOfficerId = resolveMaintenanceOfficerId(resolveOfficerName(additionalData, false));
				variables.put("action", "route");
				variables.put("assignedOfficer", resolveOfficerName(additionalData, false));
				variables.put("currentMaintenanceOfficer", assignedOfficerId);
				variables.put("specialistUserId", "");
			}
			case "start_execution", "specialized_execute" -> variables.put("action", "execute");
			case "route_to_specialized" -> {
				String reassignTargetId = resolveMaintenanceOfficerId(resolveOfficerName(additionalData, true));
				variables.put("action", "reassign");
				variables.put("reassignTarget", resolveOfficerName(additionalData, true));
				variables.put("specialistUserId", reassignTargetId);
			}
			case "complete_execution" -> {
				variables.put("maintenanceOutcome", toCamundaOutcome(additionalData));
				mergeOutcomePayload(variables, additionalData);
			}
			case "final_approve" -> variables.put("action", "final_approve");
			case "submit", "resubmit" -> {
				// Submit/resubmit rely on the current form payload only.
			}
			default -> {
			}
		}

		return variables;
	}

	private String inferLocalAction(String taskName, Map<String, Object> variables) {
		String action = String.valueOf(variables.getOrDefault("action", ""));
		return switch (taskName) {
			case "تقديم طلب الصيانة" -> "submit";
			case "تعديل وإعادة تقديم الطلب" -> "resubmit";
			case "مراجعة رئيس قسم النقل والصيانة" -> switch (action) {
				case "approve" -> "transport_approve";
				case "return" -> "transport_return";
				case "reject" -> "transport_reject";
				default -> throw unsupportedFormAction(taskName, action);
			};
			case "مراجعة مدير التموين والصيانة" -> switch (action) {
				case "approve" -> "supply_approve";
				case "reject" -> "supply_reject";
				default -> throw unsupportedFormAction(taskName, action);
			};
			case "مراجعة مدير الصيانة" -> switch (action) {
				case "route" -> "route_to_maintenance";
				case "reject" -> "maintenance_director_reject";
				default -> throw unsupportedFormAction(taskName, action);
			};
			case "معالجة مسؤول الصيانة" -> switch (action) {
				case "execute" -> "start_execution";
				case "return" -> "maintenance_return";
				case "reject" -> "maintenance_reject";
				case "reassign" -> "route_to_specialized";
				default -> throw unsupportedFormAction(taskName, action);
			};
			case "معالجة المسؤول المختص" -> switch (action) {
				case "execute" -> "specialized_execute";
				case "return" -> "specialized_return";
				case "reject" -> "specialized_reject";
				case "reassign" -> "route_to_specialized";
				default -> throw unsupportedFormAction(taskName, action);
			};
			case "تحديد نتيجة الصيانة" -> "complete_execution";
			case "الاعتماد النهائي — رئيس قسم النقل والصيانة" -> switch (action) {
				case "final_approve" -> "final_approve";
				case "return" -> "final_return";
				default -> throw unsupportedFormAction(taskName, action);
			};
			default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "لا يمكن ربط المهمة الحالية بإجراء الواجهة.");
		};
	}

	private Map<String, Object> buildLocalAdditionalData(String localAction, Map<String, Object> variables) {
		LinkedHashMap<String, Object> additionalData = new LinkedHashMap<>();
		copyPersistedWorkflowFields(variables, additionalData);
		String transferTargetGroup = resolveTransferTargetGroup(variables);
		if ("route_to_maintenance".equals(localAction)) {
			String assignedOfficerId = String.valueOf(variables.getOrDefault("assignedOfficer", ""));
			additionalData.put("maintenanceExecution", Map.of(
				"assignedOfficer", resolveMaintenanceOfficerName(assignedOfficerId),
				"assignedOfficerRole", "maintenance_officer"
			));
			if (!assignedOfficerId.isBlank()) {
				additionalData.put("currentMaintenanceOfficerId", assignedOfficerId);
			}
		}
		if ("route_to_specialized".equals(localAction)) {
			String reassignTargetId = String.valueOf(variables.getOrDefault("reassignTarget", ""));
			additionalData.put("maintenanceExecution", Map.of(
				"specializedOfficer", resolveMaintenanceOfficerName(reassignTargetId)
			));
			if (!reassignTargetId.isBlank()) {
				additionalData.put("specializedOfficerId", reassignTargetId);
			}
		}
		if (RETURN_ACTIONS.contains(localAction) && !transferTargetGroup.isBlank()) {
			additionalData.put("pendingReturnToRole", normalizeRole(transferTargetGroup));
		}
		if (!transferTargetGroup.isBlank()) {
			additionalData.put("transferTargetGroup", transferTargetGroup);
			additionalData.put("transferTargetRole", normalizeRole(transferTargetGroup));
		}
		if ("complete_execution".equals(localAction)) {
			String outcomeType = fromCamundaOutcome(String.valueOf(variables.getOrDefault("maintenanceOutcome", "completed_with_report")));
			additionalData.put("maintenanceOutcome", Map.of(
				"outcomeType", outcomeType,
				"outcomeLabel", outcomeLabel(outcomeType),
				"reportNotes", extractNotes(variables),
				"scheduledDate", String.valueOf(variables.getOrDefault("scheduledDate", "")),
				"supplyItemsRequested", variables.getOrDefault("supplyItemsRequested", List.of())
			));
		}
		return additionalData;
	}

	private void copyPersistedWorkflowFields(Map<String, Object> variables, Map<String, Object> target) {
		for (String key : PERSISTED_WORKFLOW_FIELDS) {
			if (variables.containsKey(key)) {
				target.put(key, variables.get(key));
			}
		}
	}

	private String resolveMaintenanceOfficerName(String selectedValue) {
		if (selectedValue == null || selectedValue.isBlank()) {
			return "";
		}

		return dataService.getUsers(Optional.of("maintenance_officer")).stream()
			.filter(user -> Objects.equals(String.valueOf(user.getOrDefault("id", "")), selectedValue)
				|| Objects.equals(String.valueOf(user.getOrDefault("name", "")), selectedValue))
			.map(user -> String.valueOf(user.getOrDefault("name", selectedValue)))
			.findFirst()
			.orElse(selectedValue);
	}

	private String resolveMaintenanceOfficerId(String selectedValue) {
		if (selectedValue == null || selectedValue.isBlank()) {
			return "";
		}

		return dataService.getUsers(Optional.of("maintenance_officer")).stream()
			.filter(user -> Objects.equals(String.valueOf(user.getOrDefault("id", "")), selectedValue)
				|| Objects.equals(String.valueOf(user.getOrDefault("name", "")), selectedValue))
			.map(user -> String.valueOf(user.getOrDefault("id", selectedValue)))
			.findFirst()
			.orElse(selectedValue);
	}

	private Map<String, Object> workflowMap(Map<String, Object> request) {
		if (!(request.get("workflow") instanceof Map<?, ?> workflowMap)) {
			return new LinkedHashMap<>();
		}
		return objectMapper.convertValue(workflowMap, MAP_TYPE);
	}

	private Map<String, Object> normalizeWorkflowMap(Map<String, Object> workflow) {
		LinkedHashMap<String, Object> normalized = new LinkedHashMap<>(workflow);
		if (normalized.get("currentTaskGroup") != null) {
			normalized.put("currentTaskRole", normalizeRole(String.valueOf(normalized.get("currentTaskGroup"))));
		}
		return normalized;
	}

	private Map<String, Object> reconcileRequestSnapshot(
		String requestId,
		Map<String, Object> request,
		UserTaskDto activeTask,
		String fallbackTaskName
	) {
		String taskName = activeTask != null ? activeTask.getName() : fallbackTaskName;
		if (taskName == null || taskName.isBlank()) {
			return request;
		}

		String localStatus = inferLocalStatus(taskName);
		if (localStatus.isBlank()) {
			return request;
		}

		String ownerRole = inferWorkflowOwnerRole(activeTask, taskName);
		String ownerName = inferWorkflowOwnerName(activeTask, request, localStatus);
		return dataService.reconcileWorkflowPosition(requestId, localStatus, ownerRole, ownerName);
	}

	private String inferLocalStatus(String taskName) {
		return switch (taskName) {
			case "تقديم طلب الصيانة" -> "draft";
			case "تعديل وإعادة تقديم الطلب" -> "returned_by_transport";
			case "مراجعة رئيس قسم النقل والصيانة" -> "under_transport_review";
			case "مراجعة مدير التموين والصيانة" -> "under_supply_review";
			case "مراجعة مدير الصيانة" -> "under_maintenance_director_review";
			case "معالجة مسؤول الصيانة" -> "routed_to_maintenance";
			case "معالجة المسؤول المختص" -> "routed_to_specialized";
			case "تحديد نتيجة الصيانة" -> "in_execution";
			case "الاعتماد النهائي — رئيس قسم النقل والصيانة" -> "under_final_review";
			default -> "";
		};
	}

	private String inferWorkflowOwnerRole(UserTaskDto activeTask, String taskName) {
		String effectiveTaskName = activeTask != null ? activeTask.getName() : taskName;
		if (effectiveTaskName == null || effectiveTaskName.isBlank()) {
			return "";
		}

		return metadataService.findByTaskName(effectiveTaskName)
			.map(this::resolveTaskRole)
			.orElse("");
	}

	private String inferWorkflowOwnerName(UserTaskDto activeTask, Map<String, Object> request, String localStatus) {
		if (activeTask != null && activeTask.getAssignee() != null && !activeTask.getAssignee().isBlank()) {
			try {
				Object name = dataService.getUserById(activeTask.getAssignee()).get("name");
				if (name != null && !String.valueOf(name).isBlank()) {
					return String.valueOf(name);
				}
			} catch (ResponseStatusException exception) {
				log.debug("Unable to resolve workflow assignee={} for request={}", activeTask.getAssignee(), request.get("id"));
			}
		}

		if ("routed_to_specialized".equals(localStatus) || "in_execution".equals(localStatus)) {
			Object specializedOfficerId = request.get("specializedOfficerId");
			if (specializedOfficerId != null && !String.valueOf(specializedOfficerId).isBlank()) {
				try {
					Object name = dataService.getUserById(String.valueOf(specializedOfficerId)).get("name");
					if (name != null && !String.valueOf(name).isBlank()) {
						return String.valueOf(name);
					}
				} catch (ResponseStatusException exception) {
					log.debug("Unable to resolve specialist officer={} for request={}", specializedOfficerId, request.get("id"));
				}
			}
		}

		if (!(request.get("maintenanceExecution") instanceof Map<?, ?> executionMap)) {
			return "";
		}

		Object officerName = "routed_to_specialized".equals(localStatus) || "in_execution".equals(localStatus)
			? executionMap.get("specializedOfficer")
			: executionMap.get("assignedOfficer");
		return officerName == null ? "" : String.valueOf(officerName);
	}

	private String resolveTaskRole(BpmnProcessMetadataService.UserTaskMetadata metadata) {
		if (metadata == null) {
			return "";
		}
		if (metadata.candidateGroup() != null && !metadata.candidateGroup().isBlank()) {
			return normalizeRole(metadata.candidateGroup());
		}
		if (metadata.assigneeExpression() != null && metadata.assigneeExpression().contains("currentMaintenanceOfficer")) {
			return "maintenance_officer";
		}
		if (metadata.assigneeExpression() != null && metadata.assigneeExpression().contains("specialistUserId")) {
			return "maintenance_officer";
		}
		if (metadata.assigneeExpression() != null && metadata.assigneeExpression().contains("submitterId")) {
			return "traffic_officer";
		}
		return "";
	}

	private String resolveOfficerName(Map<String, Object> additionalData, boolean specialized) {
		if (!(additionalData.get("maintenanceExecution") instanceof Map<?, ?> executionMap)) {
			return String.valueOf(additionalData.getOrDefault(specialized ? "reassignTarget" : "assignedOfficer", ""));
		}

		Object value = specialized ? executionMap.get("specializedOfficer") : executionMap.get("assignedOfficer");
		return value == null ? "" : String.valueOf(value);
	}

	private void mergeOutcomePayload(Map<String, Object> variables, Map<String, Object> additionalData) {
		if (!(additionalData.get("maintenanceOutcome") instanceof Map<?, ?> outcomeMap)) {
			return;
		}

		Object scheduledDate = outcomeMap.get("scheduledDate");
		if (scheduledDate != null && !String.valueOf(scheduledDate).isBlank()) {
			variables.put("scheduledDate", scheduledDate);
		}

		Object supplyItems = outcomeMap.get("supplyItemsRequested");
		if (supplyItems != null) {
			variables.put("supplyItemsRequested", supplyItems);
		}
	}

	private String toCamundaOutcome(Map<String, Object> additionalData) {
		if (!(additionalData.get("maintenanceOutcome") instanceof Map<?, ?> outcomeMap)) {
			return "completed_with_report";
		}

		Object outcomeValue = outcomeMap.get("outcomeType");
		String outcomeType = outcomeValue == null ? "maintenance_completed" : String.valueOf(outcomeValue);
		return switch (outcomeType) {
			case "maintenance_scheduled" -> "notify_appointment";
			case "supply_items_requested" -> "notify_spare_parts";
			default -> "completed_with_report";
		};
	}

	private String fromCamundaOutcome(String camundaOutcome) {
		return switch (camundaOutcome) {
			case "notify_appointment" -> "maintenance_scheduled";
			case "notify_spare_parts" -> "supply_items_requested";
			default -> "maintenance_completed";
		};
	}

	private String outcomeLabel(String outcomeType) {
		return switch (outcomeType) {
			case "maintenance_scheduled" -> "تحديد موعد للصيانة";
			case "supply_items_requested" -> "طلب أصناف / قطع غيار";
			default -> "اكتملت الصيانة مع تقرير";
		};
	}

	private String extractNotes(Map<String, Object> variables) {
		Object value = variables.get("notes");
		if (value == null || String.valueOf(value).isBlank()) {
			value = variables.get("returnedReason");
		}
		if (value == null || String.valueOf(value).isBlank()) {
			value = variables.get("rejectionReason");
		}
		if (value == null || String.valueOf(value).isBlank()) {
			value = variables.get("returnReason");
		}
		if (value == null || String.valueOf(value).isBlank()) {
			value = variables.get("finalReturnReason");
		}
		if (value == null || String.valueOf(value).isBlank()) {
			value = variables.get("reportNotes");
		}
		return value == null ? null : String.valueOf(value);
	}

	private void copyRequestField(Map<String, Object> variables, Map<String, Object> request, String key) {
		if (request.containsKey(key)) {
			variables.put(key, request.get(key));
		}
	}

	private String firstNonBlank(Object... values) {
		for (Object value : values) {
			if (value != null && !String.valueOf(value).isBlank()) {
				return String.valueOf(value);
			}
		}
		return "";
	}

	private Object firstPresent(Object... values) {
		for (Object value : values) {
			if (value == null) {
				continue;
			}
			if (value instanceof String stringValue && stringValue.isBlank()) {
				continue;
			}
			return value;
		}
		return "";
	}

	private String resolveTransferTargetGroup(Map<String, Object> variables) {
		if (variables == null || variables.isEmpty()) {
			return "";
		}

		for (String key : List.of("targetCandidateGroup", "transferTargetGroup", "returnTargetGroup")) {
			Object value = variables.get(key);
			if (value != null && !String.valueOf(value).isBlank()) {
				return String.valueOf(value).trim();
			}
		}

		for (String key : List.of("targetRole", "transferTargetRole", "returnTargetRole")) {
			Object value = variables.get(key);
			if (value != null && !String.valueOf(value).isBlank()) {
				return denormalizeRole(String.valueOf(value).trim());
			}
		}

		return "";
	}

	private String normalizeRole(String role) {
		return switch (role) {
			case "movement_officer" -> "traffic_officer";
			case "transport_maintenance_section_mgr" -> "transport_maintenance_director";
			case "supply_maintenance_mgr" -> "supply_maintenance_director";
			case "maintenance_mgr" -> "maintenance_director";
			default -> role;
		};
	}

	private String denormalizeRole(String role) {
		return switch (role) {
			case "traffic_officer" -> "movement_officer";
			case "transport_maintenance_director" -> "transport_maintenance_section_mgr";
			case "supply_maintenance_director" -> "supply_maintenance_mgr";
			case "maintenance_director" -> "maintenance_mgr";
			default -> role;
		};
	}

	private Long asLong(Object value) {
		if (value instanceof Number number) {
			return number.longValue();
		}
		if (value == null || String.valueOf(value).isBlank()) {
			return null;
		}
		return Long.parseLong(String.valueOf(value));
	}

	private Integer asInteger(Object value) {
		if (value instanceof Number number) {
			return number.intValue();
		}
		if (value == null || String.valueOf(value).isBlank()) {
			return null;
		}
		return Integer.parseInt(String.valueOf(value));
	}

	private Object nestedValue(Map<String, Object> source, String key, String nestedKey) {
		if (!(source.get(key) instanceof Map<?, ?> nestedMap)) {
			return "";
		}
		Object value = nestedMap.get(nestedKey);
		return value == null ? "" : value;
	}

	private String emptyToBlank(String value) {
		return value == null ? "" : value;
	}

	private ResponseStatusException unsupportedFormAction(String taskName, String action) {
		return new ResponseStatusException(
			HttpStatus.BAD_REQUEST,
			"قيمة الإجراء " + action + " غير مدعومة للمهمة " + taskName
		);
	}

	private static final Set<String> SUPPORTED_LEGACY_ACTIONS = Set.of(
		"submit",
		"resubmit",
		"transport_approve",
		"transport_return",
		"transport_reject",
		"supply_approve",
		"supply_reject",
		"route_to_maintenance",
		"maintenance_director_reject",
		"start_execution",
		"maintenance_return",
		"maintenance_reject",
		"route_to_specialized",
		"specialized_execute",
		"specialized_return",
		"specialized_reject",
		"complete_execution",
		"final_approve",
		"final_return"
	);

	private static final Set<String> REJECT_ACTIONS = Set.of(
		"transport_reject",
		"supply_reject",
		"maintenance_director_reject",
		"maintenance_reject",
		"specialized_reject"
	);

	private static final Set<String> RETURN_TO_PREVIOUS_ACTIONS = Set.of(
		"transport_return"
	);

	private static final Set<String> RETURN_ACTIONS = Set.of(
		"transport_return",
		"maintenance_return",
		"specialized_return",
		"final_return"
	);

	private static final Set<String> RETURN_TO_FIRST_ACTIONS = Set.of(
		"maintenance_return",
		"specialized_return",
		"final_return"
	);

	private static final Set<String> TRANSFER_ACTIONS = Set.of(
		"return",
		"transfer",
		"delegate",
		"reassign"
	);

	private static final Set<String> READONLY_DETAIL_FORM_IDS = Set.of(
		"form_initial_review",
		"form_supply_maint_review",
		"form_maintenance_mgr_review",
		"form_maintenance_processing",
		"form_maintenance_outcome",
		"form_final_approval"
	);

	private static final List<String> PERSISTED_WORKFLOW_FIELDS = List.of(
		"mobileNumber",
		"vehiclePlate",
		"vehicleCategory",
		"vehicleName",
		"vehicleModel",
		"vehicleYear",
		"requestedService",
		"region",
		"batterySize",
		"tireSize",
		"tireCount",
		"otherServiceDescription",
		"rejectionReason",
		"returnReason",
		"finalReturnReason",
		"faultDescription",
		"requiredItem",
		"itemQuantity",
		"vehicleEntryDate",
		"maintenanceAppointmentDate",
		"itemRequestReceivedDate",
		"itemsReceivedDate",
		"warehouseKeeper",
		"warehouseSectionManager",
		"orderNumber",
		"vehicleReceiptDate",
		"vehicleReceiverName",
		"washingDone",
		"batteryChanged",
		"oilChanged",
		"tiresChanged",
		"tiresChangedCount",
		"otherActionDone",
		"otherActionDescription"
	);

	private record ReviewSnapshot(UserTaskDto activeTask, List<?> timeline) {
	}
}