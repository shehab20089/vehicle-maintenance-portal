package com.vehiclemaintenance.api.controller;

import com.vehiclemaintenance.api.service.InMemoryDataService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

	private final InMemoryDataService dataService;

	public AuthController(InMemoryDataService dataService) {
		this.dataService = dataService;
	}

	@PostMapping("/login")
	public Map<String, Object> login(@Valid @RequestBody LoginRequest request) {
		return dataService.authenticate(request.employeeId(), request.password());
	}

	@GetMapping("/health")
	public Map<String, Object> health() {
		return dataService.getHealth();
	}

	public record LoginRequest(
		@NotBlank(message = "رقم الموظف مطلوب") String employeeId,
		@NotBlank(message = "كلمة المرور مطلوبة") String password
	) {
	}
}