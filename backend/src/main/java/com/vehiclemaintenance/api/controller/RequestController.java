package com.vehiclemaintenance.api.controller;

import com.vehiclemaintenance.api.service.CamundaWorkflowService;
import com.vehiclemaintenance.api.service.InMemoryDataService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/requests")
public class RequestController {

	private final InMemoryDataService dataService;
	private final CamundaWorkflowService workflowService;

	public RequestController(InMemoryDataService dataService, CamundaWorkflowService workflowService) {
		this.dataService = dataService;
		this.workflowService = workflowService;
	}

	@GetMapping
	public List<Map<String, Object>> getRequests() {
		return dataService.getRequests();
	}

	@GetMapping("/start-form")
	public Map<String, Object> getStartForm() {
		return workflowService.getStartRequestForm();
	}

	@GetMapping("/{requestId}")
	public Map<String, Object> getRequest(@PathVariable String requestId) {
		return dataService.getRequestById(requestId);
	}

	@PostMapping
	public Map<String, Object> createRequest(@RequestBody Map<String, Object> payload) {
		return dataService.createRequest(payload);
	}

	@PostMapping("/{requestId}/actions")
	public Map<String, Object> applyAction(
		@PathVariable String requestId,
		@Valid @RequestBody ActionRequest request
	) {
		Map<String, Object> additionalData = request.additionalData() == null ? Map.of() : request.additionalData();
		workflowService.syncLegacyAction(
			requestId,
			request.action(),
			request.performedBy(),
			request.performedByRole(),
			request.notes(),
			additionalData
		);

		Map<String, Object> payload = new java.util.LinkedHashMap<>();
		payload.put("action", request.action());
		payload.put("performedBy", request.performedBy());
		payload.put("performedByRole", request.performedByRole());
		payload.put("notes", request.notes());
		payload.put("additionalData", additionalData);
		return dataService.applyAction(requestId, payload);
	}

	@GetMapping("/{requestId}/workflow-context")
	public Map<String, Object> getWorkflowContext(@PathVariable String requestId, String role) {
		return workflowService.getWorkflowContext(requestId, role);
	}

	@PostMapping("/{requestId}/workflow/submit")
	public Map<String, Object> submitWorkflowTask(
		@PathVariable String requestId,
		@Valid @RequestBody WorkflowSubmitRequest request
	) {
		return workflowService.submitWorkflowTask(
			requestId,
			request.performedBy(),
			request.performedByRole(),
			request.variables() == null ? Map.of() : request.variables()
		);
	}

	@PostMapping("/{requestId}/comments")
	public Map<String, Object> addComment(
		@PathVariable String requestId,
		@Valid @RequestBody CommentRequest request
	) {
		return dataService.addComment(requestId, Map.of(
			"text", request.text(),
			"author", request.author(),
			"authorRole", request.authorRole()
		));
	}

	public record ActionRequest(
		@NotBlank(message = "الإجراء مطلوب") String action,
		@NotBlank(message = "اسم المنفذ مطلوب") String performedBy,
		@NotBlank(message = "دور المنفذ مطلوب") String performedByRole,
		String notes,
		Map<String, Object> additionalData
	) {
	}

	public record CommentRequest(
		@NotBlank(message = "التعليق مطلوب") String text,
		@NotBlank(message = "اسم الكاتب مطلوب") String author,
		@NotBlank(message = "دور الكاتب مطلوب") String authorRole
	) {
	}

	public record WorkflowSubmitRequest(
		@NotBlank(message = "اسم المنفذ مطلوب") String performedBy,
		@NotBlank(message = "دور المنفذ مطلوب") String performedByRole,
		Map<String, Object> variables
	) {
	}
}