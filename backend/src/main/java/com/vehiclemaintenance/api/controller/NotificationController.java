package com.vehiclemaintenance.api.controller;

import com.vehiclemaintenance.api.service.InMemoryDataService;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

	private final InMemoryDataService dataService;

	public NotificationController(InMemoryDataService dataService) {
		this.dataService = dataService;
	}

	@GetMapping
	public List<Map<String, Object>> getNotifications() {
		return dataService.getNotifications();
	}

	@PatchMapping("/{notificationId}/read")
	public Map<String, Object> markAsRead(@PathVariable String notificationId) {
		return dataService.markNotificationAsRead(notificationId);
	}

	@PostMapping("/read-all")
	public Map<String, Object> markAllAsRead() {
		return dataService.markAllNotificationsAsRead();
	}
}