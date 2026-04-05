package com.vehiclemaintenance.api.service;

import io.camunda.zeebe.client.ZeebeClient;
import io.camunda.zeebe.client.api.response.ActivatedJob;
import io.camunda.zeebe.client.api.worker.JobClient;
import io.camunda.zeebe.client.api.worker.JobWorker;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

/**
 * Zeebe job workers for all BPMN service tasks.
 *
 * Job types handled:
 *   - notification-service  (12 tasks: notify, return-target, rejection/return notifications, etc.)
 *   - report-generation-service  (2 tasks: maintenance report, final report)
 *   - request-closure-service  (1 task: close request)
 *
 * Currently these are stub/pass-through workers that auto-complete the jobs
 * so the process can advance. Real logic (e-mail, PDF generation, status update)
 * can be added inside each handler method.
 */
@Component
@ConditionalOnProperty(name = "camunda.workflow.enabled", havingValue = "true")
public class ServiceTaskWorkers {

	private static final Logger log = LoggerFactory.getLogger(ServiceTaskWorkers.class);

	private final ZeebeClient zeebeClient;
	private final List<JobWorker> workers = new ArrayList<>();

	public ServiceTaskWorkers(ZeebeClient zeebeClient) {
		this.zeebeClient = zeebeClient;
	}

	@PostConstruct
	public void startWorkers() {
		workers.add(
			zeebeClient.newWorker()
				.jobType("notification-service")
				.handler(this::handleNotification)
				.open()
		);
		workers.add(
			zeebeClient.newWorker()
				.jobType("report-generation-service")
				.handler(this::handleReportGeneration)
				.open()
		);
		workers.add(
			zeebeClient.newWorker()
				.jobType("request-closure-service")
				.handler(this::handleRequestClosure)
				.open()
		);
		log.info("Registered Zeebe job workers for: notification-service, report-generation-service, request-closure-service");
	}

	@PreDestroy
	public void stopWorkers() {
		workers.forEach(JobWorker::close);
		log.info("Closed all Zeebe job workers");
	}

	// ── notification-service ───────────────────────────────────────────

	private void handleNotification(JobClient client, ActivatedJob job) {
		String elementId = job.getElementId();
		Map<String, Object> variables = job.getVariablesAsMap();
		log.info("notification-service [{}] – variables: {}", elementId, variables);

		// TODO: dispatch real notification (e-mail / SMS / in-app) based on elementId
		//   e.g. task_notify_admin_affairs          → notify admin affairs manager
		//        task_send_rejection_notification_*  → notify requester of rejection
		//        task_send_return_notification_*     → notify requester of return
		//        task_send_appointment_notification  → notify requester of appointment
		//        task_send_spare_parts_notification  → notify about spare parts

		client.newCompleteCommand(job.getKey()).send().join();
		log.debug("notification-service [{}] completed", elementId);
	}

	// ── report-generation-service ──────────────────────────────────────

	private void handleReportGeneration(JobClient client, ActivatedJob job) {
		String elementId = job.getElementId();
		Map<String, Object> variables = job.getVariablesAsMap();
		log.info("report-generation-service [{}] – variables: {}", elementId, variables);

		// TODO: generate PDF report based on elementId
		//   task_generate_maintenance_report → maintenance summary report
		//   task_generate_final_report       → final closure report

		client.newCompleteCommand(job.getKey()).send().join();
		log.debug("report-generation-service [{}] completed", elementId);
	}

	// ── request-closure-service ────────────────────────────────────────

	private void handleRequestClosure(JobClient client, ActivatedJob job) {
		String elementId = job.getElementId();
		Map<String, Object> variables = job.getVariablesAsMap();
		log.info("request-closure-service [{}] – variables: {}", elementId, variables);

		// TODO: mark the request as closed in the data store

		client.newCompleteCommand(job.getKey()).send().join();
		log.debug("request-closure-service [{}] completed", elementId);
	}
}
