package com.vehiclemaintenance.api.service;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.springframework.stereotype.Service;

@Service
public class CamundaFormSchemaService {

	private static final List<String> MANAGED_FORM_IDS = List.of(
		"form_submit_request",
		"form_initial_review",
		"form_supply_maint_review",
		"form_maintenance_mgr_review",
		"form_maintenance_processing",
		"form_maintenance_outcome",
		"form_final_approval",
		"form_edit_resubmit"
	);

	private final InMemoryDataService dataService;

	public CamundaFormSchemaService(InMemoryDataService dataService) {
		this.dataService = dataService;
	}

	public List<String> managedFormIds() {
		return MANAGED_FORM_IDS;
	}

	public String firstMaintenanceOfficerValue() {
		return maintenanceOfficerOptions().stream()
			.findFirst()
			.map(option -> option.get("value"))
			.orElse("");
	}

	public Map<String, Object> buildSchema(String formId, Map<String, Object> request) {
		LinkedHashMap<String, Object> schema = new LinkedHashMap<>();
		schema.put("executionPlatform", "Camunda Cloud");
		schema.put("executionPlatformVersion", "8.6.0");
		schema.put("exporter", Map.of("name", "vehicle-maintenance-portal", "version", "1.0.0"));
		schema.put("schemaVersion", 18);
		schema.put("id", formId);
		schema.put("components", switch (formId) {
			case "form_submit_request" -> List.of(
				textComponent("## طلب صيانة مركبة"),
				textfieldComponent("vehiclePlate", "لوحة المركبة", true, false, null),
				textfieldComponent("vehicleCategory", "فئة المركبة", false, false, "=vehiclePlate = null or vehiclePlate = \"\""),
				textfieldComponent("vehicleName", "اسم المركبة", false, false, "=vehiclePlate = null or vehiclePlate = \"\""),
				textfieldComponent("vehicleModel", "طراز المركبة", false, false, "=vehiclePlate = null or vehiclePlate = \"\""),
				textfieldComponent("vehicleYear", "سنة الصنع", false, false, "=vehiclePlate = null or vehiclePlate = \"\""),
				textfieldComponent("mobileNumber", "رقم الجوال", true, false, null),
				selectValuesKeyComponent("region", "المنطقة", "=regions", true, null),
				selectValuesKeyComponent("requestedService", "الخدمة المطلوبة", "=servicesTypes", true, null),
				textfieldComponent("batterySize", "مقاس البطارية", true, false, "=requestedService != \"battery_change\""),
				textfieldComponent("tireSize", "مقاس الكفر", true, false, "=requestedService != \"tire_change\""),
				textfieldComponent("tireCount", "عدد الكفرات", true, false, "=requestedService != \"tire_change\""),
				textfieldComponent("otherServiceDescription", "أخرى — وصف الخدمة المطلوبة", true, false, "=requestedService != \"other\""),
				checkboxComponent("acknowledgment", "إقرار بالتعهد — أتعهد بصحة البيانات المدخلة", true, false, null)
			);
			case "form_initial_review" -> List.of(
				textComponent("## تفاصيل الطلب"),
				textfieldComponent("vehiclePlate", "لوحة المركبة", false, true, null),
				textfieldComponent("vehicleName", "اسم المركبة", false, true, null),
				textfieldComponent("vehicleModel", "طراز المركبة", false, true, null),
				textfieldComponent("vehicleYear", "سنة الصنع", false, true, null),
				textfieldComponent("mobileNumber", "رقم الجوال", false, true, null),
				textfieldComponent("region", "المنطقة", false, true, null),
				textfieldComponent("requestedService", "الخدمة المطلوبة", false, true, null),
				textfieldComponent("batterySize", "مقاس البطارية", false, true, "=batterySize = null or batterySize = \"\""),
				textfieldComponent("tireSize", "مقاس الكفر", false, true, "=tireSize = null or tireSize = \"\""),
				textfieldComponent("tireCount", "عدد الكفرات", false, true, "=tireCount = null or tireCount = \"\""),
				textfieldComponent("otherServiceDescription", "وصف الخدمة الأخرى", false, true, "=otherServiceDescription = null or otherServiceDescription = \"\""),
				textComponent("---\n## قرار المراجعة"),
				radioComponent("action", "الإجراء", List.of(
					option("approve", "اعتماد"),
					option("reject", "رفض"),
					option("return", "إرجاع")
				), true),
				textareaComponent("rejectionReason", "سبب الرفض", true, false, "=action != \"reject\""),
				textareaComponent("notes", "ملاحظات", false, false, "=action = \"reject\" or action = null"),
				textareaComponent("returnReason", "سبب الإرجاع", true, false, "=action != \"return\"")
			);
			case "form_supply_maint_review" -> List.of(
				textComponent("## تفاصيل الطلب"),
				textfieldComponent("vehiclePlate", "لوحة المركبة", false, true, null),
				textfieldComponent("vehicleName", "اسم المركبة", false, true, null),
				textfieldComponent("vehicleModel", "طراز المركبة", false, true, null),
				textfieldComponent("vehicleYear", "سنة الصنع", false, true, null),
				textfieldComponent("mobileNumber", "رقم الجوال", false, true, null),
				textfieldComponent("region", "المنطقة", false, true, null),
				textfieldComponent("requestedService", "الخدمة المطلوبة", false, true, null),
				textfieldComponent("batterySize", "مقاس البطارية", false, true, "=batterySize = null or batterySize = \"\""),
				textfieldComponent("tireSize", "مقاس الكفر", false, true, "=tireSize = null or tireSize = \"\""),
				textfieldComponent("tireCount", "عدد الكفرات", false, true, "=tireCount = null or tireCount = \"\""),
				textfieldComponent("otherServiceDescription", "وصف الخدمة الأخرى", false, true, "=otherServiceDescription = null or otherServiceDescription = \"\""),
				textComponent("---\n## قرار المراجعة"),
				radioComponent("action", "الإجراء", List.of(
					option("approve", "اعتماد"),
					option("reject", "رفض")
				), true),
				textareaComponent("rejectionReason", "سبب الرفض", true, false, "=action != \"reject\""),
				textareaComponent("notes", "ملاحظات", false, false, "=action != \"approve\"")
			);
			case "form_maintenance_mgr_review" -> List.of(
				textComponent("## تفاصيل الطلب"),
				textfieldComponent("vehiclePlate", "لوحة المركبة", false, true, null),
				textfieldComponent("vehicleName", "اسم المركبة", false, true, null),
				textfieldComponent("vehicleModel", "طراز المركبة", false, true, null),
				textfieldComponent("vehicleYear", "سنة الصنع", false, true, null),
				textfieldComponent("mobileNumber", "رقم الجوال", false, true, null),
				textfieldComponent("region", "المنطقة", false, true, null),
				textfieldComponent("requestedService", "الخدمة المطلوبة", false, true, null),
				textfieldComponent("batterySize", "مقاس البطارية", false, true, "=batterySize = null or batterySize = \"\""),
				textfieldComponent("tireSize", "مقاس الكفر", false, true, "=tireSize = null or tireSize = \"\""),
				textfieldComponent("tireCount", "عدد الكفرات", false, true, "=tireCount = null or tireCount = \"\""),
				textfieldComponent("otherServiceDescription", "وصف الخدمة الأخرى", false, true, "=otherServiceDescription = null or otherServiceDescription = \"\""),
				textComponent("---\n## قرار المراجعة"),
				radioComponent("action", "الإجراء", List.of(
					option("route", "توجيه إلى مسؤول صيانة"),
					option("reject", "رفض")
				), true),
				selectValuesKeyComponent("assignedOfficer", "الموظف المختص", "=assignableEmployees", true, "=action != \"route\""),
				textareaComponent("rejectionReason", "سبب الرفض", true, false, "=action != \"reject\"")
			);
			case "form_maintenance_processing" -> List.of(
				textComponent("## تفاصيل الطلب"),
				textfieldComponent("vehiclePlate", "لوحة المركبة", false, true, null),
				textfieldComponent("vehicleName", "اسم المركبة", false, true, null),
				textfieldComponent("vehicleModel", "طراز المركبة", false, true, null),
				textfieldComponent("vehicleYear", "سنة الصنع", false, true, null),
				textfieldComponent("mobileNumber", "رقم الجوال", false, true, null),
				textfieldComponent("region", "المنطقة", false, true, null),
				textfieldComponent("requestedService", "الخدمة المطلوبة", false, true, null),
				textComponent("---\n## قرار المعالجة"),
				radioComponent("action", "الإجراء", List.of(
					option("execute", "تنفيذ"),
					option("reject", "رفض"),
					option("return", "إرجاع"),
					option("reassign", "إحالة لمسؤول صيانة آخر")
				), true),
				textareaComponent("rejectionReason", "سبب الرفض", true, false, "=action != \"reject\""),
				textareaComponent("notes", "ملاحظات", false, false, "=not(action = \"return\" or action = \"execute\")"),
				selectValuesKeyComponent("reassignTarget", "توجيه لمسؤول آخر", "=assignableRoles", true, "=action != \"reassign\""),
				textComponent("---\n## بيانات الصيانة", "=action != \"execute\""),
				datetimeComponent("vehicleEntryDate", "تاريخ دخول المركبة للصيانة", false, "=action != \"execute\""),
				datetimeComponent("maintenanceAppointmentDate", "تاريخ موعد الصيانة", false, "=action != \"execute\""),
				textareaComponent("faultDescription", "وصف العطل", false, false, "=action != \"execute\""),
				textfieldComponent("requiredItem", "الصنف المطلوب", false, false, "=action != \"execute\""),
				textfieldComponent("itemQuantity", "الكمية لكل صنف", false, false, "=action != \"execute\""),
				datetimeComponent("itemRequestReceivedDate", "تاريخ استلام طلب الأصناف", false, "=action != \"execute\""),
				datetimeComponent("itemsReceivedDate", "تاريخ استلام الأصناف", false, "=action != \"execute\""),
				textfieldComponent("warehouseKeeper", "أمين المستودع", false, false, "=action != \"execute\""),
				textfieldComponent("warehouseSectionManager", "مدير شعبة المستودعات", false, false, "=action != \"execute\""),
				textfieldComponent("orderNumber", "رقم الأمر", false, false, "=action != \"execute\""),
				datetimeComponent("vehicleReceiptDate", "تاريخ استلام المركبة", false, "=action != \"execute\""),
				textfieldComponent("vehicleReceiverName", "اسم مستلم المركبة", false, false, "=action != \"execute\""),
				textComponent("---\n## الأعمال المنفذة", "=action != \"execute\""),
				checkboxComponent("washingDone", "تم الغسيل", false, false, "=action != \"execute\""),
				checkboxComponent("batteryChanged", "تم تغيير البطارية", false, false, "=action != \"execute\""),
				checkboxComponent("oilChanged", "تم تغيير الزيت", false, false, "=action != \"execute\""),
				checkboxComponent("tiresChanged", "تم تغيير الكفرات", false, false, "=action != \"execute\""),
				textfieldComponent("tiresChangedCount", "عدد الكفرات", true, false, "=tiresChanged != true"),
				checkboxComponent("otherActionDone", "أخرى", false, false, "=action != \"execute\""),
				textfieldComponent("otherActionDescription", "تحديد (أخرى)", true, false, "=otherActionDone != true")
			);
			case "form_maintenance_outcome" -> List.of(
				textComponent("## تفاصيل الطلب"),
				textfieldComponent("vehiclePlate", "لوحة المركبة", false, true, null),
				textfieldComponent("vehicleName", "اسم المركبة", false, true, null),
				textfieldComponent("vehicleModel", "طراز المركبة", false, true, null),
				textfieldComponent("requestedService", "الخدمة المطلوبة", false, true, null),
				textareaComponent("faultDescription", "وصف العطل", false, true, "=faultDescription = null or faultDescription = \"\""),
				textComponent("---\n## نتيجة الصيانة"),
				radioComponent("maintenanceOutcome", "النتيجة", List.of(
					option("completed_with_report", "اكتملت الصيانة مع تقرير"),
					option("notify_appointment", "تحديد موعد للصيانة"),
					option("notify_spare_parts", "طلب أصناف / قطع غيار")
				), true),
				textareaComponent("notes", "ملاحظات", false, false, null)
			);
			case "form_final_approval" -> List.of(
				textComponent("## ملخص الطلب"),
				textfieldComponent("vehiclePlate", "لوحة المركبة", false, true, null),
				textfieldComponent("vehicleName", "اسم المركبة", false, true, null),
				textfieldComponent("vehicleModel", "طراز المركبة", false, true, null),
				textfieldComponent("vehicleYear", "سنة الصنع", false, true, null),
				textfieldComponent("region", "المنطقة", false, true, null),
				textfieldComponent("requestedService", "الخدمة المطلوبة", false, true, null),
				textareaComponent("faultDescription", "وصف العطل", false, true, "=faultDescription = null or faultDescription = \"\""),
				textComponent("---\n## نتيجة الصيانة"),
				textfieldComponent("maintenanceOutcome", "نتيجة الصيانة", false, true, null),
				checkboxComponent("washingDone", "تم الغسيل", false, true, "=washingDone != true"),
				checkboxComponent("batteryChanged", "تم تغيير البطارية", false, true, "=batteryChanged != true"),
				checkboxComponent("oilChanged", "تم تغيير الزيت", false, true, "=oilChanged != true"),
				checkboxComponent("tiresChanged", "تم تغيير الكفرات", false, true, "=tiresChanged != true"),
				textfieldComponent("tiresChangedCount", "عدد الكفرات", false, true, "=tiresChanged != true"),
				checkboxComponent("otherActionDone", "أخرى", false, true, "=otherActionDone != true"),
				textfieldComponent("otherActionDescription", "تحديد (أخرى)", false, true, "=otherActionDone != true"),
				textfieldComponent("requestStatus", "حالة الطلب", false, true, null),
				textComponent("---\n## قرار الاعتماد النهائي"),
				radioComponent("action", "الإجراء", List.of(
					option("final_approve", "اعتماد نهائي"),
					option("return", "إرجاع")
				), true),
				textareaComponent("finalReturnReason", "سبب الإرجاع", true, false, "=action != \"return\""),
				textareaComponent("notes", "ملاحظات", false, false, "=action = null")
			);
			case "form_edit_resubmit" -> List.of(
				textComponent("### سبب الإرجاع\n{{returnReason}}"),
				textComponent("---\n## تعديل وإعادة تقديم الطلب"),
				textfieldComponent("vehiclePlate", "لوحة المركبة", true, false, null),
				textfieldComponent("vehicleCategory", "فئة المركبة", false, true, "=vehiclePlate = null or vehiclePlate = \"\""),
				textfieldComponent("vehicleName", "اسم المركبة", false, true, "=vehiclePlate = null or vehiclePlate = \"\""),
				textfieldComponent("vehicleModel", "طراز المركبة", false, true, "=vehiclePlate = null or vehiclePlate = \"\""),
				textfieldComponent("vehicleYear", "سنة الصنع", false, true, "=vehiclePlate = null or vehiclePlate = \"\""),
				textfieldComponent("mobileNumber", "رقم الجوال", true, false, null),
				selectValuesKeyComponent("region", "المنطقة", "=regions", true, null),
				selectValuesKeyComponent("requestedService", "الخدمة المطلوبة", "=servicesTypes", true, null),
				textfieldComponent("batterySize", "مقاس البطارية", true, false, "=requestedService != \"battery_change\""),
				textfieldComponent("tireSize", "مقاس الكفر", true, false, "=requestedService != \"tire_change\""),
				textfieldComponent("tireCount", "عدد الكفرات", true, false, "=requestedService != \"tire_change\""),
				textfieldComponent("otherServiceDescription", "أخرى — وصف الخدمة المطلوبة", true, false, "=requestedService != \"other\""),
				checkboxComponent("acknowledgment", "إقرار بالتعهد — أتعهد بصحة البيانات المدخلة", true, false, null)
			);
			default -> List.of(textareaComponent("notes", "ملاحظات", false, false, null));
		});
		return schema;
	}

	private List<Map<String, String>> maintenanceOfficerOptions() {
		return dataService.getUsers(Optional.of("maintenance_officer")).stream()
			.map(user -> option(
				String.valueOf(user.getOrDefault("id", "")),
				String.valueOf(user.getOrDefault("name", ""))
			))
			.filter(option -> !option.get("value").isBlank())
			.toList();
	}

	private Map<String, String> option(String value, String label) {
		return Map.of("value", value, "label", label);
	}

	private Map<String, Object> selectComponent(String key, String label, List<Map<String, String>> values, boolean required, boolean readonly, String conditionalHide) {
		LinkedHashMap<String, Object> component = baseComponent(key, "select", label, readonly, conditionalHide);
		component.put("values", values);
		if (required) {
			component.put("validate", Map.of("required", true));
		}
		return component;
	}

	private Map<String, Object> selectValuesKeyComponent(String key, String label, String valuesKey, boolean required, String conditionalHide) {
		LinkedHashMap<String, Object> component = baseComponent(key, "select", label, false, conditionalHide);
		component.put("valuesKey", valuesKey);
		if (required) {
			component.put("validate", Map.of("required", true));
		}
		return component;
	}

	private Map<String, Object> radioComponent(String key, String label, List<Map<String, String>> values, boolean required) {
		LinkedHashMap<String, Object> component = baseComponent(key, "radio", label, false, null);
		component.put("values", values);
		if (required) {
			component.put("validate", Map.of("required", true));
		}
		return component;
	}

	private Map<String, Object> textComponent(String text) {
		return textComponent(text, null);
	}

	private Map<String, Object> textComponent(String text, String conditionalHide) {
		String key = "text_" + Math.abs((text + String.valueOf(conditionalHide)).hashCode());
		LinkedHashMap<String, Object> component = baseComponent(key, "text", "", false, conditionalHide);
		component.put("text", text);
		return component;
	}

	private Map<String, Object> textareaComponent(String key, String label, boolean required, boolean readonly, String conditionalHide) {
		LinkedHashMap<String, Object> component = baseComponent(key, "textarea", label, readonly, conditionalHide);
		if (required) {
			component.put("validate", Map.of("required", true));
		}
		return component;
	}

	private Map<String, Object> checkboxComponent(String key, String label, boolean required, boolean readonly, String conditionalHide) {
		LinkedHashMap<String, Object> component = baseComponent(key, "checkbox", label, readonly, conditionalHide);
		if (required) {
			component.put("validate", Map.of("required", true));
		}
		return component;
	}

	private Map<String, Object> datetimeComponent(String key, String label, boolean required, String conditionalHide) {
		LinkedHashMap<String, Object> component = baseComponent(key, "datetime", label, false, conditionalHide);
		component.put("subtype", "date");
		component.put("dateLabel", label);
		if (required) {
			component.put("validate", Map.of("required", true));
		}
		return component;
	}

	private Map<String, Object> textfieldComponent(String key, String label, boolean required, boolean readonly, String conditionalHide) {
		LinkedHashMap<String, Object> component = baseComponent(key, "textfield", label, readonly, conditionalHide);
		if (required) {
			component.put("validate", Map.of("required", true));
		}
		return component;
	}

	private LinkedHashMap<String, Object> baseComponent(String key, String type, String label, boolean readonly, String conditionalHide) {
		LinkedHashMap<String, Object> component = new LinkedHashMap<>();
		component.put("id", key);
		component.put("key", key);
		component.put("type", type);
		component.put("label", label);
		if (readonly) {
			component.put("readonly", true);
		}
		if (conditionalHide != null && !conditionalHide.isBlank()) {
			component.put("conditional", Map.of("hide", conditionalHide));
		}
		return component;
	}
}