package com.vehiclemaintenance.api.service;

import static org.junit.jupiter.api.Assertions.assertEquals;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.nio.file.Path;
import java.util.LinkedHashMap;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.test.util.ReflectionTestUtils;

class InMemoryDataServiceTest {

	@TempDir
	Path tempDir;

	@Test
	void routeToSpecializedUsesLatestSelectedOfficer() {
		InMemoryDataService service = new InMemoryDataService(new ObjectMapper());
		ReflectionTestUtils.setField(service, "storageDir", tempDir.toString());
		service.loadSeedData();

		service.applyAction("req-005", payloadForSpecialist("فيصل بن علي الزهراني", "u6"));
		Map<String, Object> updatedRequest = service.applyAction("req-005", payloadForSpecialist("أحمد بن سعد الغامدي", "u7"));

		@SuppressWarnings("unchecked")
		Map<String, Object> maintenanceExecution = (Map<String, Object>) updatedRequest.get("maintenanceExecution");

		assertEquals("u7", updatedRequest.get("specializedOfficerId"));
		assertEquals("أحمد بن سعد الغامدي", maintenanceExecution.get("specializedOfficer"));
		assertEquals("أحمد بن سعد الغامدي", updatedRequest.get("currentOwnerName"));
	}

	private Map<String, Object> payloadForSpecialist(String officerName, String officerId) {
		LinkedHashMap<String, Object> payload = new LinkedHashMap<>();
		payload.put("action", "route_to_specialized");
		payload.put("performedBy", "فيصل بن علي الزهراني");
		payload.put("performedByRole", "maintenance_officer");
		payload.put("additionalData", Map.of(
			"specializedOfficerId", officerId,
			"maintenanceExecution", Map.of("specializedOfficer", officerName)
		));
		return payload;
	}
}