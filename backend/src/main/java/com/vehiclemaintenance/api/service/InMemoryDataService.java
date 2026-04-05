package com.vehiclemaintenance.api.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Instant;
import java.time.Year;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.CopyOnWriteArrayList;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.beans.factory.annotation.Value;

@Service
public class InMemoryDataService {

	private static final TypeReference<List<LinkedHashMap<String, Object>>> LIST_OF_MAPS =
		new TypeReference<>() { };
	private static final TypeReference<LinkedHashMap<String, Object>> MAP_TYPE =
		new TypeReference<>() { };

	private final ObjectMapper objectMapper;
	private final List<LinkedHashMap<String, Object>> users = new CopyOnWriteArrayList<>();
	private final List<LinkedHashMap<String, Object>> requests = new CopyOnWriteArrayList<>();
	private final List<LinkedHashMap<String, Object>> notifications = new CopyOnWriteArrayList<>();
	private LinkedHashMap<String, Object> lookups = new LinkedHashMap<>();

	@Value("${app.storage-dir:${user.dir}/data}")
	private String storageDir;

	public InMemoryDataService(ObjectMapper objectMapper) {
		this.objectMapper = objectMapper;
	}

	@PostConstruct
	void loadSeedData() {
		users.clear();
		users.addAll(readListResource("seed/users.json"));

		requests.clear();
		requests.addAll(readListResourceOrFile("seed/requests.json", runtimeRequestsPath()));

		notifications.clear();
		notifications.addAll(readListResourceOrFile("seed/notifications.json", runtimeNotificationsPath()));

		lookups = readMapResource("seed/lookups.json");
	}

	public Map<String, Object> authenticate(String employeeId, String password) {
		Map<String, Object> user = users.stream()
			.filter(item -> Objects.equals(item.get("employeeId"), employeeId))
			.findFirst()
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "بيانات الدخول غير صحيحة"));

		if (!Objects.equals(user.get("password"), password)) {
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "بيانات الدخول غير صحيحة");
		}

		return Map.of(
			"token", "demo-" + employeeId,
			"user", sanitizeUser(user)
		);
	}

	public List<Map<String, Object>> getUsers(Optional<String> role) {
		return users.stream()
			.filter(user -> role.map(value -> Objects.equals(normalizeRole(String.valueOf(user.get("role"))), value)).orElse(true))
			.map(this::sanitizeUser)
			.toList();
	}

	public Map<String, Object> getUserById(String userId) {
		return users.stream()
			.filter(user -> Objects.equals(user.get("id"), userId))
			.findFirst()
			.map(this::sanitizeUser)
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "المستخدم غير موجود"));
	}

	public Map<String, Object> getLookups() {
		return deepCopyMap(lookups);
	}

	public List<Map<String, Object>> getRequests() {
		return requests.stream()
			.sorted(Comparator.comparing(item -> String.valueOf(item.getOrDefault("updatedAt", "")), Comparator.reverseOrder()))
			.map(this::normalizeRequest)
			.toList();
	}

	public Map<String, Object> getRequestById(String requestId) {
		return normalizeRequest(findRequest(requestId));
	}

	public Map<String, Object> createRequest(Map<String, Object> payload) {
		String now = Instant.now().toString();
		String requestId = "req-" + String.format("%03d", requests.size() + 1);
		String requestNumber = "MR-" + Year.now().getValue() + "-" + (3000 + requests.size() + 1);

		LinkedHashMap<String, Object> request = new LinkedHashMap<>();
		request.put("id", requestId);
		request.put("requestNumber", requestNumber);
		request.put("requester", payload.getOrDefault("requester", Map.of()));
		request.put("vehicle", payload.getOrDefault("vehicle", Map.of()));
		request.put("issueCategory", payload.getOrDefault("issueCategory", "general"));
		request.put("issueDescription", payload.getOrDefault("issueDescription", ""));
		request.put("priority", payload.getOrDefault("priority", "medium"));
		request.put("mobileNumber", payload.getOrDefault("mobileNumber", nestedString(payload, "requester", "phone")));
		request.put("vehiclePlate", payload.getOrDefault("vehiclePlate", nestedString(payload, "vehicle", "plateNumber")));
		request.put("vehicleCategory", payload.getOrDefault("vehicleCategory", nestedString(payload, "vehicle", "vehicleType")));
		request.put("vehicleName", payload.getOrDefault("vehicleName", nestedString(payload, "vehicle", "make")));
		request.put("vehicleModel", payload.getOrDefault("vehicleModel", nestedString(payload, "vehicle", "model")));
		request.put("vehicleYear", payload.getOrDefault("vehicleYear", payload.getOrDefault("year", "")));
		request.put("requestedService", payload.getOrDefault("requestedService", ""));
		request.put("region", payload.getOrDefault("region", ""));
		request.put("batterySize", payload.getOrDefault("batterySize", ""));
		request.put("tireSize", payload.getOrDefault("tireSize", ""));
		request.put("tireCount", payload.getOrDefault("tireCount", ""));
		request.put("otherServiceDescription", payload.getOrDefault("otherServiceDescription", ""));
		request.put("status", "draft");
		request.put("currentStage", "مسودة");
		request.put("currentOwnerRole", "traffic_officer");
		request.put("currentOwnerName", nestedString(payload, "requester", "name"));
		request.put("createdAt", now);
		request.put("updatedAt", now);
		request.put("attachments", payload.getOrDefault("attachments", new ArrayList<>()));
		request.put("comments", new ArrayList<>());
		request.put("timeline", new ArrayList<>(List.of(Map.of(
			"id", "tl-" + requestId + "-1",
			"action", "إنشاء الطلب",
			"description", "تم إنشاء طلب الصيانة",
			"performedBy", nestedString(payload, "requester", "name"),
			"performedByRole", "traffic_officer",
			"timestamp", now,
			"toStatus", "draft"
		))));
		request.put("finalDocuments", new ArrayList<>());
		request.put("notes", payload.get("notes"));

		requests.add(request);
		persistRequests();
		return normalizeRequest(request);
	}

	@SuppressWarnings("unchecked")
	public Map<String, Object> applyAction(String requestId, Map<String, Object> payload) {
		LinkedHashMap<String, Object> request = findRequest(requestId);
		String currentStatus = normalizeStatus(String.valueOf(request.getOrDefault("status", "")));
		String action = String.valueOf(payload.getOrDefault("action", ""));
		String performedBy = String.valueOf(payload.getOrDefault("performedBy", "النظام"));
		String performedByRole = normalizeRole(String.valueOf(payload.getOrDefault("performedByRole", "traffic_officer")));
		String notes = payload.get("notes") == null ? null : String.valueOf(payload.get("notes"));
		Map<String, Object> additionalData = payload.get("additionalData") instanceof Map<?, ?> map
			? (Map<String, Object>) map
			: Map.of();

		String now = Instant.now().toString();
		String previousStatus = currentStatus;
		String pendingReturnToRole = normalizeRole(String.valueOf(request.getOrDefault("pendingReturnToRole", request.getOrDefault("returnTargetRole", ""))));
		String explicitReturnTargetRole = normalizeRole(String.valueOf(additionalData.getOrDefault(
			"pendingReturnToRole",
			additionalData.getOrDefault("returnTargetRole", additionalData.getOrDefault("transferTargetRole", ""))
		)));
		String nextStatus = resolveNextStatus(currentStatus, action);
		String finalStatus = nextStatus;

		if (Set.of("transport_return", "maintenance_return", "specialized_return").contains(action)) {
			request.put("pendingReturnToRole", explicitReturnTargetRole.isBlank() ? performedByRole : explicitReturnTargetRole);
		}

		if ("final_return".equals(action)) {
			// Final return always goes back to the maintenance officer for rework,
			// not to the transport/maintenance director who performed the return.
			request.put("pendingReturnToRole", explicitReturnTargetRole.isBlank() ? "maintenance_officer" : explicitReturnTargetRole);
		}

		if ("close".equals(action)) {
			request.remove("pendingReturnToRole");
			request.remove("returnTargetRole");
		}

		if ("submit".equals(action)) {
			finalStatus = "under_transport_review";
		}

		if ("resubmit".equals(action)) {
			finalStatus = getReturnTargetStatus(pendingReturnToRole);
			request.remove("pendingReturnToRole");
			request.remove("returnTargetRole");
		}

		if ("route_to_maintenance".equals(action)) {
			String assignedOfficer = resolveOfficerName(additionalData, request, false);
			String assignedOfficerId = resolveOfficerId(additionalData, request, false);
			if (!assignedOfficerId.isBlank()) {
				request.put("currentMaintenanceOfficerId", assignedOfficerId);
			}
			mergeMap(request, "maintenanceExecution", Map.of(
				"assignedOfficer", assignedOfficer,
				"assignedOfficerRole", "maintenance_officer"
			));
		}

		if ("route_to_specialized".equals(action)) {
			String specializedOfficer = resolveOfficerName(additionalData, request, true);
			mergeMap(request, "maintenanceExecution", Map.of("specializedOfficer", specializedOfficer));
		}

		if (!additionalData.isEmpty()) {
			additionalData.forEach((key, value) -> {
				if (value instanceof Map<?, ?> mapValue && request.get(key) instanceof Map<?, ?>) {
					mergeMap(request, key, (Map<String, Object>) mapValue);
				} else {
					request.put(key, value);
				}
			});
		}

		List<Object> timeline = (List<Object>) request.computeIfAbsent("timeline", ignored -> new ArrayList<>());
		LinkedHashMap<String, Object> timelineEntry = new LinkedHashMap<>();
		timelineEntry.put("id", "tl-" + requestId + "-" + (timeline.size() + 1));
		timelineEntry.put("action", actionLabel(action));
		timelineEntry.put("description", "تم تنفيذ الإجراء بواسطة " + performedBy);
		timelineEntry.put("performedBy", performedBy);
		timelineEntry.put("performedByRole", performedByRole);
		timelineEntry.put("timestamp", now);
		timelineEntry.put("fromStatus", previousStatus);
		timelineEntry.put("toStatus", nextStatus);
		timelineEntry.put("notes", notes);
		timeline.add(timelineEntry);

		if ("submit".equals(action)) {
			timeline.add(Map.of(
				"id", "tl-" + requestId + "-" + (timeline.size() + 1),
				"action", actionLabel("notify_admin"),
				"description", "تم إشعار مدير الشؤون الإدارية تلقائياً بتقديم الطلب",
				"performedBy", "النظام",
				"performedByRole", "admin_director",
				"timestamp", now,
				"fromStatus", "submitted",
				"toStatus", "admin_notified"
			));
			timeline.add(Map.of(
				"id", "tl-" + requestId + "-" + (timeline.size() + 1),
				"action", actionLabel("route_to_transport"),
				"description", "تم تحويل الطلب تلقائياً إلى مدير شعبة النقل والصيانة",
				"performedBy", "النظام",
				"performedByRole", "admin_director",
				"timestamp", now,
				"fromStatus", "admin_notified",
				"toStatus", "under_transport_review"
			));
		}

		if ("complete_execution".equals(action)) {
			timeline.add(Map.of(
				"id", "tl-" + requestId + "-" + (timeline.size() + 1),
				"action", actionLabel("send_to_final_review"),
				"description", "تمت إحالة الطلب تلقائياً إلى المراجعة النهائية",
				"performedBy", "النظام",
				"performedByRole", "maintenance_officer",
				"timestamp", now,
				"fromStatus", "execution_complete",
				"toStatus", "under_final_review"
			));
			finalStatus = "under_final_review";
		}

		String nextOwnerRole = resolveNextOwnerRole(finalStatus);
		String nextOwnerName = resolveNextOwnerName(request, nextOwnerRole, additionalData, finalStatus);

		request.put("status", finalStatus);
		request.put("currentStage", stageLabel(finalStatus));
		request.put("currentOwnerRole", nextOwnerRole);
		request.put("currentOwnerName", nextOwnerName);
		request.put("updatedAt", now);

		if (Set.of("submit", "resubmit").contains(action)) {
			request.put("submittedAt", now);
		}

		persistRequests();

		return normalizeRequest(request);
	}

	@SuppressWarnings("unchecked")
	public Map<String, Object> addComment(String requestId, Map<String, Object> payload) {
		LinkedHashMap<String, Object> request = findRequest(requestId);
		List<Object> comments = (List<Object>) request.computeIfAbsent("comments", ignored -> new ArrayList<>());
		String now = Instant.now().toString();
		comments.add(Map.of(
			"id", "c-" + requestId + "-" + (comments.size() + 1),
			"text", String.valueOf(payload.getOrDefault("text", "")),
			"author", String.valueOf(payload.getOrDefault("author", "")),
			"authorRole", normalizeRole(String.valueOf(payload.getOrDefault("authorRole", "traffic_officer"))),
			"createdAt", now
		));
		request.put("updatedAt", now);
		persistRequests();
		return normalizeRequest(request);
	}

	public List<Map<String, Object>> getNotifications() {
		return notifications.stream()
			.sorted(Comparator.comparing(item -> String.valueOf(item.getOrDefault("createdAt", "")), Comparator.reverseOrder()))
			.map(this::normalizeNotification)
			.toList();
	}

	public Map<String, Object> markNotificationAsRead(String notificationId) {
		LinkedHashMap<String, Object> notification = notifications.stream()
			.filter(item -> Objects.equals(item.get("id"), notificationId))
			.findFirst()
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "الإشعار غير موجود"));
		notification.put("read", true);
		persistNotifications();
		return normalizeNotification(notification);
	}

	public Map<String, Object> markAllNotificationsAsRead() {
		notifications.forEach(notification -> notification.put("read", true));
		persistNotifications();
		return Map.of("updated", notifications.size());
	}

	public Map<String, Object> getDashboardStats() {
		long total = requests.size();
		long pendingMyAction = requests.stream().map(this::normalizeRequest).filter(request -> Set.of(
			"under_transport_review",
			"under_supply_review",
			"under_maintenance_director_review",
			"routed_to_maintenance",
			"routed_to_specialized",
			"under_final_review"
		).contains(request.get("status"))).count();
		long returned = requests.stream().map(this::normalizeRequest).filter(request -> Set.of(
			"returned_by_transport",
			"returned_by_maintenance",
			"returned_by_specialized",
			"returned_from_final"
		).contains(request.get("status"))).count();
		long inMaintenance = requests.stream().map(this::normalizeRequest).filter(request -> Set.of(
			"in_execution",
			"execution_complete"
		).contains(request.get("status"))).count();
		long completed = requests.stream().map(this::normalizeRequest).filter(request -> Set.of(
			"approved_final",
			"closed"
		).contains(request.get("status"))).count();
		long rejected = requests.stream().map(this::normalizeRequest).filter(request -> Set.of(
			"rejected_by_transport",
			"rejected_by_supply",
			"rejected_by_maintenance_director",
			"rejected_by_maintenance",
			"rejected_by_specialized"
		).contains(request.get("status"))).count();

		return Map.of(
			"total", total,
			"pendingMyAction", pendingMyAction,
			"returned", returned,
			"inMaintenance", inMaintenance,
			"completed", completed,
			"rejected", rejected
		);
	}

	public Map<String, Object> getHealth() {
		return Map.of(
			"status", "UP",
			"service", "vehicle-maintenance-api",
			"users", users.size(),
			"requests", requests.size(),
			"notifications", notifications.size()
		);
	}

	public Map<String, Object> getRequestSnapshot(String requestId) {
		return deepCopyMap(findRequest(requestId));
	}

	public Map<String, Object> updateWorkflow(String requestId, Map<String, Object> workflow) {
		LinkedHashMap<String, Object> request = findRequest(requestId);
		if (workflow == null || workflow.isEmpty()) {
			request.remove("workflow");
		} else {
			request.put("workflow", deepCopyMap(workflow));
		}
		request.put("updatedAt", Instant.now().toString());
		persistRequests();
		return normalizeRequest(request);
	}

	public Map<String, Object> reconcileWorkflowPosition(
		String requestId,
		String status,
		String ownerRole,
		String ownerName
	) {
		LinkedHashMap<String, Object> request = findRequest(requestId);
		String normalizedStatus = normalizeStatus(status);
		String resolvedOwnerRole = ownerRole == null || ownerRole.isBlank()
			? resolveNextOwnerRole(normalizedStatus)
			: normalizeRole(ownerRole);
		String resolvedOwnerName = ownerName == null || ownerName.isBlank()
			? resolveNextOwnerName(request, resolvedOwnerRole, Map.of(), normalizedStatus)
			: ownerName;

		boolean changed = !normalizedStatus.equals(normalizeStatus(String.valueOf(request.getOrDefault("status", ""))))
			|| !resolvedOwnerRole.equals(normalizeRole(String.valueOf(request.getOrDefault("currentOwnerRole", ""))))
			|| !resolvedOwnerName.equals(String.valueOf(request.getOrDefault("currentOwnerName", "")));

		if (!changed) {
			return normalizeRequest(request);
		}

		request.put("status", normalizedStatus);
		request.put("currentStage", stageLabel(normalizedStatus));
		request.put("currentOwnerRole", resolvedOwnerRole);
		request.put("currentOwnerName", resolvedOwnerName);
		request.put("updatedAt", Instant.now().toString());
		persistRequests();
		return normalizeRequest(request);
	}

	private List<LinkedHashMap<String, Object>> readListResourceOrFile(String resourcePath, Path runtimePath) {
		if (Files.exists(runtimePath)) {
			return readListFile(runtimePath);
		}
		return readListResource(resourcePath);
	}

	private List<LinkedHashMap<String, Object>> readListResource(String path) {
		try (InputStream inputStream = new ClassPathResource(path).getInputStream()) {
			return objectMapper.readValue(inputStream, LIST_OF_MAPS);
		} catch (IOException exception) {
			throw new IllegalStateException("Unable to load seed resource: " + path, exception);
		}
	}

	private List<LinkedHashMap<String, Object>> readListFile(Path path) {
		try {
			return objectMapper.readValue(path.toFile(), LIST_OF_MAPS);
		} catch (IOException exception) {
			throw new IllegalStateException("Unable to load runtime data file: " + path, exception);
		}
	}

	private LinkedHashMap<String, Object> readMapResource(String path) {
		try (InputStream inputStream = new ClassPathResource(path).getInputStream()) {
			return objectMapper.readValue(inputStream, MAP_TYPE);
		} catch (IOException exception) {
			throw new IllegalStateException("Unable to load seed resource: " + path, exception);
		}
	}

	private LinkedHashMap<String, Object> findRequest(String requestId) {
		return requests.stream()
			.filter(request -> Objects.equals(request.get("id"), requestId))
			.findFirst()
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "الطلب غير موجود"));
	}

	private Map<String, Object> sanitizeUser(Map<String, Object> user) {
		LinkedHashMap<String, Object> copy = deepCopyMap(user);
		copy.remove("password");
		copy.remove("groupId");
		copy.put("role", normalizeRole(String.valueOf(copy.getOrDefault("role", ""))));
		return copy;
	}

	private LinkedHashMap<String, Object> deepCopyMap(Map<String, Object> source) {
		return objectMapper.convertValue(source, MAP_TYPE);
	}

	private Path runtimeRequestsPath() {
		return runtimePath("requests.json");
	}

	private Path runtimeNotificationsPath() {
		return runtimePath("notifications.json");
	}

	private Path runtimePath(String fileName) {
		return Paths.get(storageDir).resolve(fileName).toAbsolutePath().normalize();
	}

	private void ensureStorageDirectory() {
		try {
			Files.createDirectories(Paths.get(storageDir));
		} catch (IOException exception) {
			throw new UncheckedIOException("Unable to create storage directory: " + storageDir, exception);
		}
	}

	private void persistRequests() {
		persistList(runtimeRequestsPath(), requests);
	}

	private void persistNotifications() {
		persistList(runtimeNotificationsPath(), notifications);
	}

	private void persistList(Path path, List<LinkedHashMap<String, Object>> data) {
		ensureStorageDirectory();
		try {
			objectMapper.writerWithDefaultPrettyPrinter().writeValue(path.toFile(), data);
		} catch (IOException exception) {
			throw new UncheckedIOException("Unable to persist runtime data file: " + path, exception);
		}
	}

	private String nestedString(Map<String, Object> source, String key, String nestedKey) {
		if (!(source.get(key) instanceof Map<?, ?> nestedMap)) {
			return "";
		}

		Object value = nestedMap.get(nestedKey);
		return value == null ? "" : String.valueOf(value);
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

	private void mergeMap(LinkedHashMap<String, Object> request, String key, Map<String, Object> incoming) {
		LinkedHashMap<String, Object> target = request.get(key) instanceof Map<?, ?> map
			? objectMapper.convertValue(map, MAP_TYPE)
			: new LinkedHashMap<>();
		target.putAll(incoming);
		request.put(key, target);
	}

	private String resolveNextStatus(String currentStatus, String action) {
		return switch (action) {
			case "submit" -> "submitted";
			case "resubmit" -> currentStatus;
			case "transport_approve" -> "under_supply_review";
			case "transport_return" -> "returned_by_transport";
			case "transport_reject" -> "rejected_by_transport";
			case "supply_approve" -> "under_maintenance_director_review";
			case "supply_reject" -> "rejected_by_supply";
			case "route_to_maintenance" -> "routed_to_maintenance";
			case "maintenance_director_reject" -> "rejected_by_maintenance_director";
			case "start_execution", "specialized_execute" -> "in_execution";
			case "maintenance_return" -> "returned_by_maintenance";
			case "maintenance_reject" -> "rejected_by_maintenance";
			case "route_to_specialized" -> "routed_to_specialized";
			case "specialized_return" -> "returned_by_specialized";
			case "specialized_reject" -> "rejected_by_specialized";
			case "complete_execution" -> "execution_complete";
			case "final_approve" -> "approved_final";
			case "final_return" -> "returned_from_final";
			case "close" -> "closed";
			default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "إجراء غير مدعوم: " + action);
		};
	}

	private String resolveNextOwnerRole(String nextStatus) {
		return switch (nextStatus) {
			case "draft", "returned_by_transport", "rejected_by_transport", "rejected_by_supply", "rejected_by_maintenance_director", "rejected_by_maintenance", "rejected_by_specialized", "returned_by_maintenance", "returned_by_specialized", "returned_from_final", "approved_final", "closed" -> "traffic_officer";
			case "submitted", "admin_notified" -> "admin_director";
			case "under_transport_review", "under_final_review" -> "transport_maintenance_director";
			case "under_supply_review" -> "supply_maintenance_director";
			case "under_maintenance_director_review" -> "maintenance_director";
			case "routed_to_maintenance", "routed_to_specialized", "in_execution", "execution_complete" -> "maintenance_officer";
			default -> "traffic_officer";
		};
	}

	private String resolveNextOwnerName(Map<String, Object> request, String nextOwnerRole, Map<String, Object> additionalData, String nextStatus) {
		if ("traffic_officer".equals(nextOwnerRole)) {
			return nestedString(request, "requester", "name");
		}

		if ("maintenance_officer".equals(nextOwnerRole)) {
			return resolveOfficerName(additionalData, request, "routed_to_specialized".equals(nextStatus));
		}

		return users.stream()
			.filter(user -> Objects.equals(normalizeRole(String.valueOf(user.get("role"))), nextOwnerRole))
			.map(user -> String.valueOf(user.get("name")))
			.findFirst()
			.orElse("");
	}

	private String actionLabel(String action) {
		return switch (action) {
			case "submit" -> "تقديم الطلب";
			case "resubmit" -> "إعادة تقديم الطلب";
			case "notify_admin" -> "إشعار مدير الشؤون الإدارية";
			case "route_to_transport" -> "إحالة لمدير شعبة النقل والصيانة";
			case "transport_approve" -> "قبول وإحالة لمدير الإمداد والصيانة";
			case "transport_return" -> "إرجاع الطلب للاستكمال";
			case "transport_reject" -> "رفض الطلب";
			case "supply_approve" -> "قبول وإحالة لمدير الصيانة";
			case "supply_reject" -> "رفض الطلب";
			case "route_to_maintenance" -> "توجيه إلى مسؤول الصيانة";
			case "maintenance_director_reject" -> "رفض الطلب";
			case "start_execution", "specialized_execute" -> "تنفيذ";
			case "maintenance_return", "specialized_return" -> "إرجاع الطلب";
			case "maintenance_reject", "specialized_reject" -> "رفض الطلب";
			case "route_to_specialized" -> "توجيه إلى مسؤول صيانة آخر مختص";
			case "complete_execution" -> "إتمام التنفيذ وتقديم النتيجة";
			case "send_to_final_review" -> "إحالة للمراجعة النهائية";
			case "final_approve" -> "اعتماد نهائي";
			case "final_return" -> "إرجاع للمراجعة";
			case "close" -> "إغلاق الطلب";
			default -> action;
		};
	}

	private String stageLabel(String status) {
		return switch (status) {
			case "draft" -> "مسودة";
			case "submitted" -> "تم التقديم";
			case "admin_notified" -> "تم إشعار الشؤون الإدارية";
			case "under_transport_review" -> "مراجعة شعبة النقل والصيانة";
			case "returned_by_transport" -> "معاد من شعبة النقل والصيانة";
			case "rejected_by_transport" -> "مرفوض من شعبة النقل والصيانة";
			case "under_supply_review" -> "مراجعة الإمداد والصيانة";
			case "rejected_by_supply" -> "مرفوض من الإمداد والصيانة";
			case "under_maintenance_director_review" -> "مراجعة مدير الصيانة";
			case "rejected_by_maintenance_director" -> "مرفوض من مدير الصيانة";
			case "routed_to_maintenance" -> "محول لمسؤول الصيانة";
			case "returned_by_maintenance" -> "معاد من مسؤول الصيانة";
			case "rejected_by_maintenance" -> "مرفوض من مسؤول الصيانة";
			case "routed_to_specialized" -> "محول لمسؤول صيانة مختص";
			case "returned_by_specialized" -> "معاد من مسؤول الصيانة المختص";
			case "rejected_by_specialized" -> "مرفوض من مسؤول الصيانة المختص";
			case "in_execution" -> "تحت التنفيذ";
			case "execution_complete" -> "اكتمل التنفيذ";
			case "under_final_review" -> "المراجعة النهائية";
			case "returned_from_final" -> "معاد من المراجعة النهائية";
			case "approved_final" -> "تم الاعتماد النهائي";
			case "closed" -> "مغلق";
			default -> status;
		};
	}

	private Map<String, Object> normalizeRequest(Map<String, Object> source) {
		LinkedHashMap<String, Object> copy = deepCopyMap(source);
		String normalizedStatus = normalizeStatus(String.valueOf(copy.getOrDefault("status", "")));
		String normalizedOwnerRole = resolveNextOwnerRole(normalizedStatus);

		copy.put("status", normalizedStatus);
		copy.put("currentStage", stageLabel(normalizedStatus));
		copy.put("currentOwnerRole", normalizedOwnerRole);
		copy.put("currentOwnerName", resolveNextOwnerName(copy, normalizedOwnerRole, Map.of(), normalizedStatus));

		if (copy.get("pendingReturnToRole") == null && copy.get("returnTargetRole") != null) {
			copy.put("pendingReturnToRole", normalizeRole(String.valueOf(copy.get("returnTargetRole"))));
		}

		if (copy.get("requester") instanceof Map<?, ?> requesterMap) {
			LinkedHashMap<String, Object> requester = objectMapper.convertValue(requesterMap, MAP_TYPE);
			String requesterName = String.valueOf(requester.getOrDefault("name", ""));
			findUserByName(requesterName).ifPresent(user -> requester.put("employeeId", user.get("employeeId")));
			copy.put("requester", requester);
		}

		copy.put("mobileNumber", firstNonBlank(copy.get("mobileNumber"), nestedString(copy, "requester", "phone")));
		copy.put("vehiclePlate", firstNonBlank(copy.get("vehiclePlate"), nestedString(copy, "vehicle", "plateNumber")));
		copy.put("vehicleCategory", firstNonBlank(copy.get("vehicleCategory"), nestedString(copy, "vehicle", "vehicleType")));
		copy.put("vehicleName", firstNonBlank(copy.get("vehicleName"), nestedString(copy, "vehicle", "make"), nestedString(copy, "vehicle", "vehicleNumber")));
		copy.put("vehicleModel", firstNonBlank(copy.get("vehicleModel"), nestedString(copy, "vehicle", "model")));
		copy.put("vehicleYear", firstPresent(copy.get("vehicleYear"), copy.get("year"), nestedString(copy, "vehicle", "year")));
		copy.put("requestedService", firstNonBlank(copy.get("requestedService")));
		copy.put("region", firstNonBlank(copy.get("region")));
		copy.put("requestStatus", firstNonBlank(copy.get("requestStatus"), stageLabel(normalizedStatus)));

		if (copy.get("maintenanceExecution") instanceof Map<?, ?> executionMap) {
			LinkedHashMap<String, Object> execution = objectMapper.convertValue(executionMap, MAP_TYPE);
			if (execution.get("assignedOfficer") != null) {
				execution.put("assignedOfficer", resolveOfficerName(Map.of("maintenanceExecution", execution), copy, false));
			}
			if (execution.get("assignedOfficerRole") != null) {
				execution.put("assignedOfficerRole", normalizeRole(String.valueOf(execution.get("assignedOfficerRole"))));
			}
			if (execution.get("specializedOfficer") != null) {
				execution.put("specializedOfficer", resolveOfficerName(Map.of("maintenanceExecution", execution), copy, true));
			}
			copy.put("maintenanceExecution", execution);
		}

		if (copy.get("workflow") instanceof Map<?, ?> workflowMap) {
			LinkedHashMap<String, Object> workflow = objectMapper.convertValue(workflowMap, MAP_TYPE);
			if (workflow.get("currentTaskGroup") != null) {
				workflow.put("currentTaskRole", normalizeRole(String.valueOf(workflow.get("currentTaskGroup"))));
			} else if (workflow.get("currentTaskRole") != null) {
				workflow.put("currentTaskRole", normalizeRole(String.valueOf(workflow.get("currentTaskRole"))));
			}
			copy.put("workflow", workflow);
		}

		if (copy.get("comments") instanceof List<?> commentList) {
			List<Object> comments = new ArrayList<>();
			for (Object item : commentList) {
				if (!(item instanceof Map<?, ?> commentMap)) {
					comments.add(item);
					continue;
				}
				LinkedHashMap<String, Object> comment = objectMapper.convertValue(commentMap, MAP_TYPE);
				String role = normalizeRole(String.valueOf(comment.getOrDefault("authorRole", "")));
				comment.put("authorRole", role);
				comment.put("author", resolveActorName(String.valueOf(comment.getOrDefault("author", "")), role, null));
				comments.add(comment);
			}
			copy.put("comments", comments);
		}

		if (copy.get("timeline") instanceof List<?> timelineList) {
			List<Object> timeline = new ArrayList<>();
			for (Object item : timelineList) {
				if (!(item instanceof Map<?, ?> entryMap)) {
					timeline.add(item);
					continue;
				}
				LinkedHashMap<String, Object> entry = objectMapper.convertValue(entryMap, MAP_TYPE);
				String role = normalizeRole(String.valueOf(entry.getOrDefault("performedByRole", "")));
				entry.put("performedByRole", role);
				entry.put("performedBy", resolveActorName(String.valueOf(entry.getOrDefault("performedBy", "")), role, null));
				if (entry.get("fromStatus") != null) {
					entry.put("fromStatus", normalizeStatus(String.valueOf(entry.get("fromStatus"))));
				}
				if (entry.get("toStatus") != null) {
					entry.put("toStatus", normalizeStatus(String.valueOf(entry.get("toStatus"))));
				}
				timeline.add(entry);
			}
			copy.put("timeline", timeline);
		}

		return copy;
	}

	private Map<String, Object> normalizeNotification(Map<String, Object> source) {
		LinkedHashMap<String, Object> copy = deepCopyMap(source);
		copy.put("type", normalizeNotificationType(String.valueOf(copy.getOrDefault("type", ""))));
		return copy;
	}

	private String normalizeRole(String role) {
		return switch (role) {
			case "movement_officer" -> "traffic_officer";
			case "admin_affairs_manager" -> "admin_director";
			case "transport_maintenance_section_mgr" -> "transport_maintenance_director";
			case "supply_maintenance_mgr" -> "supply_maintenance_director";
			case "maintenance_mgr" -> "maintenance_director";
			default -> role;
		};
	}

	private String normalizeStatus(String status) {
		return switch (status) {
			case "under_initial_review" -> "under_transport_review";
			case "returned_for_edit" -> "returned_by_transport";
			case "rejected" -> "rejected_by_transport";
			case "under_supply_maintenance_review" -> "under_supply_review";
			case "under_maintenance_manager_review" -> "under_maintenance_director_review";
			case "routed_to_maintenance_officer" -> "routed_to_maintenance";
			case "under_maintenance_processing" -> "in_execution";
			case "routed_to_another_maintenance_officer" -> "routed_to_specialized";
			case "pending_final_approval" -> "under_final_review";
			case "returned_to_maintenance_processing" -> "returned_from_final";
			case "completed" -> "approved_final";
			default -> status;
		};
	}

	private String normalizeNotificationType(String type) {
		return switch (type) {
			case "request_completed" -> "final_result_available";
			default -> type;
		};
	}

	private String getReturnTargetStatus(String pendingReturnToRole) {
		return switch (pendingReturnToRole) {
			case "maintenance_officer" -> "routed_to_maintenance";
			case "transport_maintenance_director" -> "under_transport_review";
			default -> "under_transport_review";
		};
	}

	private String resolveOfficerName(Map<String, Object> additionalData, Map<String, Object> request, boolean specialized) {
		String explicitName = nestedOfficerName(additionalData, specialized);
		if (!explicitName.isBlank()) {
			return resolveActorName(explicitName, "maintenance_officer", resolveOfficerId(additionalData, request, specialized));
		}

		String officerId = resolveOfficerId(additionalData, request, specialized);
		if (!officerId.isBlank()) {
			return findUserById(officerId)
				.map(user -> String.valueOf(user.get("name")))
				.orElse(resolveActorName("", "maintenance_officer", officerId));
		}

		if (request.get("maintenanceExecution") instanceof Map<?, ?> executionMap) {
			Object value = specialized ? executionMap.get("specializedOfficer") : executionMap.get("assignedOfficer");
			if (value != null) {
				return resolveActorName(String.valueOf(value), "maintenance_officer", null);
			}
		}

		List<Map<String, Object>> officers = users.stream()
			.filter(user -> Objects.equals(normalizeRole(String.valueOf(user.get("role"))), "maintenance_officer"))
			.map(this::sanitizeUser)
			.toList();

		if (officers.isEmpty()) {
			return "";
		}

		return specialized && officers.size() > 1
			? String.valueOf(officers.get(1).get("name"))
			: String.valueOf(officers.get(0).get("name"));
	}

	private String resolveOfficerId(Map<String, Object> additionalData, Map<String, Object> request, boolean specialized) {
		if (additionalData.get("currentMaintenanceOfficerId") != null) {
			return String.valueOf(additionalData.get("currentMaintenanceOfficerId"));
		}

		if (additionalData.get("officerId") != null) {
			return String.valueOf(additionalData.get("officerId"));
		}

		if (specialized) {
			return String.valueOf(request.getOrDefault("specializedOfficerId", ""));
		}

		return String.valueOf(request.getOrDefault("currentMaintenanceOfficerId", ""));
	}

	private String nestedOfficerName(Map<String, Object> additionalData, boolean specialized) {
		if (!(additionalData.get("maintenanceExecution") instanceof Map<?, ?> executionMap)) {
			return "";
		}

		Object value = specialized ? executionMap.get("specializedOfficer") : executionMap.get("assignedOfficer");
		return value == null ? "" : String.valueOf(value);
	}

	private String resolveActorName(String legacyName, String normalizedRole, String userId) {
		if (userId != null && !userId.isBlank()) {
			Optional<Map<String, Object>> matchedUser = findUserById(userId);
			if (matchedUser.isPresent()) {
				return String.valueOf(matchedUser.get().get("name"));
			}
		}

		if (legacyName == null || legacyName.isBlank() || "النظام".equals(legacyName)) {
			return legacyName == null ? "" : legacyName;
		}

		if ("maintenance_officer".equals(normalizedRole)) {
			return switch (legacyName) {
				case "أحمد محمد" -> "فيصل بن علي الزهراني";
				case "خالد عبدالله", "سعد إبراهيم" -> "أحمد بن سعد الغامدي";
				default -> legacyName;
			};
		}

		return users.stream()
			.filter(user -> Objects.equals(normalizeRole(String.valueOf(user.get("role"))), normalizedRole))
			.map(user -> String.valueOf(user.get("name")))
			.findFirst()
			.orElse(legacyName);
	}

	private Optional<Map<String, Object>> findUserById(String userId) {
		return users.stream()
			.filter(user -> Objects.equals(user.get("id"), userId))
			.map(user -> (Map<String, Object>) sanitizeUser(user))
			.findFirst();
	}

	private Optional<Map<String, Object>> findUserByName(String name) {
		return users.stream()
			.filter(user -> Objects.equals(user.get("name"), name))
			.map(user -> (Map<String, Object>) sanitizeUser(user))
			.findFirst();
	}
}