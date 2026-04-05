package com.vehiclemaintenance.api.controller;

import com.vehiclemaintenance.api.service.InMemoryDataService;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
public class UserController {

	private final InMemoryDataService dataService;

	public UserController(InMemoryDataService dataService) {
		this.dataService = dataService;
	}

	@GetMapping
	public List<Map<String, Object>> getUsers(@RequestParam Optional<String> role) {
		return dataService.getUsers(role);
	}

	@GetMapping("/{userId}")
	public Map<String, Object> getUser(@PathVariable String userId) {
		return dataService.getUserById(userId);
	}
}