package com.vehiclemaintenance.api.controller;

import com.vehiclemaintenance.api.service.InMemoryDataService;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

	private final InMemoryDataService dataService;

	public DashboardController(InMemoryDataService dataService) {
		this.dataService = dataService;
	}

	@GetMapping("/stats")
	public Map<String, Object> getStats() {
		return dataService.getDashboardStats();
	}
}