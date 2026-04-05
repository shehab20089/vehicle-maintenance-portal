package com.vehiclemaintenance.api.controller;

import com.vehiclemaintenance.api.service.InMemoryDataService;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/lookups")
public class LookupController {

	private final InMemoryDataService dataService;

	public LookupController(InMemoryDataService dataService) {
		this.dataService = dataService;
	}

	@GetMapping
	public Map<String, Object> getLookups() {
		return dataService.getLookups();
	}
}