package com.vehiclemaintenance.api.service;

import java.util.ArrayList;
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
				selectValuesKeyComponent("reassignTarget", "توجيه لمسؤول آخر", "=assignableEmployees", true, "=action != \"reassign\""),
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
				textComponent("## بيانات الطلب الأساسية"),
				textfieldComponent("requestNumber", "رقم الطلب", false, true, null),
				textfieldComponent("requesterName", "اسم مقدم الطلب", false, true, null),
				textfieldComponent("employeeId", "الرقم الوظيفي", false, true, "=employeeId = null or employeeId = \"\""),
				textfieldComponent("department", "الإدارة", false, true, "=department = null or department = \"\""),
				textfieldComponent("mobileNumber", "رقم الجوال", false, true, "=mobileNumber = null or mobileNumber = \"\""),
				textfieldComponent("submittedAt", "تاريخ التقديم", false, true, "=submittedAt = null or submittedAt = \"\""),
				textfieldComponent("requestStatus", "حالة الطلب", false, true, null),
				textfieldComponent("currentOwnerName", "الجهة / المسؤول الحالي", false, true, "=currentOwnerName = null or currentOwnerName = \"\""),
				textComponent("---\n## بيانات المركبة"),
				textfieldComponent("vehiclePlate", "لوحة المركبة", false, true, null),
				textfieldComponent("vehicleNumber", "رقم المركبة", false, true, "=vehicleNumber = null or vehicleNumber = \"\""),
				textfieldComponent("vehicleCategory", "فئة المركبة", false, true, "=vehicleCategory = null or vehicleCategory = \"\""),
				textfieldComponent("vehicleName", "اسم المركبة", false, true, null),
				textfieldComponent("vehicleModel", "طراز المركبة", false, true, null),
				textfieldComponent("vehicleYear", "سنة الصنع", false, true, null),
				textfieldComponent("color", "اللون", false, true, "=color = null or color = \"\""),
				textfieldComponent("currentCondition", "حالة المركبة", false, true, "=currentCondition = null or currentCondition = \"\""),
				textComponent("---\n## تفاصيل الطلب والصيانة المطلوبة"),
				textfieldComponent("region", "المنطقة", false, true, null),
				textfieldComponent("requestedService", "الخدمة المطلوبة", false, true, null),
				textfieldComponent("issueCategory", "فئة المشكلة", false, true, "=issueCategory = null or issueCategory = \"\""),
				textfieldComponent("priority", "الأولوية", false, true, "=priority = null or priority = \"\""),
				textareaComponent("issueDescription", "وصف المشكلة", false, true, "=issueDescription = null or issueDescription = \"\""),
				textfieldComponent("batterySize", "مقاس البطارية", false, true, "=batterySize = null or batterySize = \"\""),
				textfieldComponent("tireSize", "مقاس الكفر", false, true, "=tireSize = null or tireSize = \"\""),
				textfieldComponent("tireCount", "عدد الكفرات المطلوبة", false, true, "=tireCount = null or tireCount = \"\""),
				textareaComponent("otherServiceDescription", "وصف الخدمة الأخرى", false, true, "=otherServiceDescription = null or otherServiceDescription = \"\""),
				textareaComponent("requestNotes", "ملاحظات الطلب", false, true, "=requestNotes = null or requestNotes = \"\""),
				textareaComponent("returnReason", "سبب الإرجاع السابق", false, true, "=returnReason = null or returnReason = \"\""),
				textareaComponent("faultDescription", "وصف العطل", false, true, "=faultDescription = null or faultDescription = \"\""),
				textComponent("---\n## بيانات التنفيذ"),
				textfieldComponent("assignedOfficerName", "مسؤول الصيانة", false, true, "=assignedOfficerName = null or assignedOfficerName = \"\""),
				textfieldComponent("specializedOfficerName", "المسؤول المختص", false, true, "=specializedOfficerName = null or specializedOfficerName = \"\""),
				textfieldComponent("startDate", "تاريخ بدء التنفيذ", false, true, "=startDate = null or startDate = \"\""),
				textfieldComponent("actualCompletion", "تاريخ الانتهاء", false, true, "=actualCompletion = null or actualCompletion = \"\""),
				textfieldComponent("vehicleEntryDate", "تاريخ دخول المركبة للصيانة", false, true, "=vehicleEntryDate = null or vehicleEntryDate = \"\""),
				textfieldComponent("maintenanceAppointmentDate", "تاريخ موعد الصيانة", false, true, "=maintenanceAppointmentDate = null or maintenanceAppointmentDate = \"\""),
				textfieldComponent("requiredItem", "الصنف المطلوب", false, true, "=requiredItem = null or requiredItem = \"\""),
				textfieldComponent("itemQuantity", "الكمية لكل صنف", false, true, "=itemQuantity = null or itemQuantity = \"\""),
				textfieldComponent("itemRequestReceivedDate", "تاريخ استلام طلب الأصناف", false, true, "=itemRequestReceivedDate = null or itemRequestReceivedDate = \"\""),
				textfieldComponent("itemsReceivedDate", "تاريخ استلام الأصناف", false, true, "=itemsReceivedDate = null or itemsReceivedDate = \"\""),
				textfieldComponent("warehouseKeeper", "أمين المستودع", false, true, "=warehouseKeeper = null or warehouseKeeper = \"\""),
				textfieldComponent("warehouseSectionManager", "مدير شعبة المستودعات", false, true, "=warehouseSectionManager = null or warehouseSectionManager = \"\""),
				textfieldComponent("orderNumber", "رقم الأمر", false, true, "=orderNumber = null or orderNumber = \"\""),
				textfieldComponent("vehicleReceiptDate", "تاريخ استلام المركبة", false, true, "=vehicleReceiptDate = null or vehicleReceiptDate = \"\""),
				textfieldComponent("vehicleReceiverName", "اسم مستلم المركبة", false, true, "=vehicleReceiverName = null or vehicleReceiverName = \"\""),
				textareaComponent("workDescription", "وصف الأعمال المنفذة", false, true, "=workDescription = null or workDescription = \"\""),
				textfieldComponent("scheduledDate", "الموعد المجدول", false, true, "=scheduledDate = null or scheduledDate = \"\""),
				textareaComponent("supplyItemsRequestedText", "الأصناف / قطع الغيار المطلوبة", false, true, "=supplyItemsRequestedText = null or supplyItemsRequestedText = \"\""),
				textComponent("---\n## نتيجة الصيانة والمرفقات"),
				textfieldComponent("maintenanceOutcome", "نتيجة الصيانة", false, true, null),
				textareaComponent("reportNotes", "ملاحظات تقرير الصيانة", false, true, "=reportNotes = null or reportNotes = \"\""),
				checkboxComponent("washingDone", "تم الغسيل", false, true, "=washingDone != true"),
				checkboxComponent("batteryChanged", "تم تغيير البطارية", false, true, "=batteryChanged != true"),
				checkboxComponent("oilChanged", "تم تغيير الزيت", false, true, "=oilChanged != true"),
				checkboxComponent("tiresChanged", "تم تغيير الكفرات", false, true, "=tiresChanged != true"),
				textfieldComponent("tiresChangedCount", "عدد الكفرات", false, true, "=tiresChanged != true"),
				checkboxComponent("otherActionDone", "أخرى", false, true, "=otherActionDone != true"),
				textfieldComponent("otherActionDescription", "تحديد (أخرى)", false, true, "=otherActionDone != true"),
				textareaComponent("finalDocumentsSummary", "المستندات النهائية", false, true, "=finalDocumentsSummary = null or finalDocumentsSummary = \"\""),
				textComponent("---\n## قرار الاعتماد النهائي"),
				radioComponent("action", "الإجراء", List.of(
					option("final_approve", "اعتماد نهائي"),
					option("return", "إرجاع")
				), true),
				textareaComponent("finalReturnReason", "سبب الإرجاع", true, false, "=action != \"return\""),
				textareaComponent("notes", "ملاحظات", false, false, "=action = null")
			);
			case "form_edit_resubmit" -> List.of(
				textComponent("---\n## تعديل وإعادة تقديم الطلب"),
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
			default -> List.of(textareaComponent("notes", "ملاحظات", false, false, null));
		});
		return schema;
	}

	public List<Map<String, Object>> buildReadonlyDisplaySection(String formId) {
		return switch (formId) {
			case "form_initial_review", "form_supply_maint_review", "form_maintenance_mgr_review" -> mergeSections(
				commonRequestSummarySection(),
				requestDetailsSummarySection(),
				returnHistorySummarySection()
			);
			case "form_maintenance_processing" -> mergeSections(
				commonRequestSummarySection(),
				requestDetailsSummarySection(),
				returnHistorySummarySection(),
				maintenanceExecutionSummarySection(),
				maintenanceResultSummarySection()
			);
			case "form_maintenance_outcome" -> mergeSections(
				commonRequestSummarySection(),
				requestDetailsSummarySection(),
				returnHistorySummarySection(),
				maintenanceExecutionSummarySection()
			);
			case "form_final_approval" -> mergeSections(
				commonRequestSummarySection(),
				requestDetailsSummarySection(),
				returnHistorySummarySection(),
				maintenanceExecutionSummarySection(),
				maintenanceResultSummarySection(),
				finalDocumentsSummarySection()
			);
			case "form_edit_resubmit" -> mergeSections(
				List.of(textComponent("## سبب الإرجاع السابق"), summaryField("سبب الإرجاع", "returnReason")),
				commonRequestSummarySection(),
				requestDetailsSummarySection()
			);
			default -> List.of();
		};
	}

	private List<Map<String, Object>> commonRequestSummarySection() {
		return List.of(
			textComponent("## البيانات المدخلة مسبقاً"),
			summaryField("رقم الطلب", "requestNumber"),
			summaryField("اسم مقدم الطلب", "requesterName"),
			summaryField("الرقم الوظيفي", "employeeId"),
			summaryField("الإدارة", "department"),
			summaryField("رقم الجوال", "mobileNumber"),
			summaryField("تاريخ التقديم", "submittedAt"),
			summaryField("حالة الطلب", "requestStatus"),
			summaryField("الجهة / المسؤول الحالي", "currentOwnerName"),
			textComponent("---\n## بيانات المركبة"),
			summaryField("لوحة المركبة", "vehiclePlate"),
			summaryField("رقم المركبة", "vehicleNumber"),
			summaryField("فئة المركبة", "vehicleCategory"),
			summaryField("اسم المركبة", "vehicleName"),
			summaryField("طراز المركبة", "vehicleModel"),
			summaryField("سنة الصنع", "vehicleYear"),
			summaryField("اللون", "color"),
			summaryField("حالة المركبة", "currentCondition")
		);
	}

	private List<Map<String, Object>> requestDetailsSummarySection() {
		return List.of(
			textComponent("---\n## تفاصيل الطلب"),
			summaryField("المنطقة", "region"),
			summaryField("الخدمة المطلوبة", "requestedService"),
			summaryField("فئة المشكلة", "issueCategory"),
			summaryField("الأولوية", "priority"),
			summaryField("وصف المشكلة", "issueDescription"),
			summaryField("مقاس البطارية", "batterySize"),
			summaryField("مقاس الكفر", "tireSize"),
			summaryField("عدد الكفرات المطلوبة", "tireCount"),
			summaryField("وصف الخدمة الأخرى", "otherServiceDescription"),
			summaryField("ملاحظات الطلب", "requestNotes"),
			summaryField("وصف العطل", "faultDescription")
		);
	}

	private List<Map<String, Object>> returnHistorySummarySection() {
		return List.of(
			textComponent("---\n## ملاحظات الإرجاع السابقة"),
			summaryField("سبب الإرجاع", "returnReason"),
			summaryField("سبب الإرجاع النهائي", "finalReturnReason")
		);
	}

	private List<Map<String, Object>> maintenanceExecutionSummarySection() {
		return List.of(
			textComponent("---\n## بيانات التنفيذ"),
			summaryField("مسؤول الصيانة", "assignedOfficerName"),
			summaryField("المسؤول المختص", "specializedOfficerName"),
			summaryField("تاريخ بدء التنفيذ", "startDate"),
			summaryField("تاريخ الانتهاء", "actualCompletion"),
			summaryField("تاريخ دخول المركبة للصيانة", "vehicleEntryDate"),
			summaryField("تاريخ موعد الصيانة", "maintenanceAppointmentDate"),
			summaryField("الصنف المطلوب", "requiredItem"),
			summaryField("الكمية لكل صنف", "itemQuantity"),
			summaryField("تاريخ استلام طلب الأصناف", "itemRequestReceivedDate"),
			summaryField("تاريخ استلام الأصناف", "itemsReceivedDate"),
			summaryField("أمين المستودع", "warehouseKeeper"),
			summaryField("مدير شعبة المستودعات", "warehouseSectionManager"),
			summaryField("رقم الأمر", "orderNumber"),
			summaryField("تاريخ استلام المركبة", "vehicleReceiptDate"),
			summaryField("اسم مستلم المركبة", "vehicleReceiverName"),
			summaryField("وصف الأعمال المنفذة", "workDescription"),
			summaryField("الموعد المجدول", "scheduledDate"),
			summaryField("الأصناف / قطع الغيار المطلوبة", "supplyItemsRequestedText")
		);
	}

	private List<Map<String, Object>> maintenanceResultSummarySection() {
		return List.of(
			textComponent("---\n## نتيجة الصيانة"),
			summaryField("نتيجة الصيانة", "maintenanceOutcome"),
			summaryField("ملاحظات تقرير الصيانة", "reportNotes"),
			summaryBoolean("تم الغسيل", "washingDone"),
			summaryBoolean("تم تغيير البطارية", "batteryChanged"),
			summaryBoolean("تم تغيير الزيت", "oilChanged"),
			summaryBoolean("تم تغيير الكفرات", "tiresChanged"),
			summaryField("عدد الكفرات", "tiresChangedCount"),
			summaryBoolean("أعمال إضافية أخرى", "otherActionDone"),
			summaryField("تحديد (أخرى)", "otherActionDescription")
		);
	}

	private List<Map<String, Object>> finalDocumentsSummarySection() {
		return List.of(
			textComponent("---\n## المستندات"),
			summaryField("المستندات النهائية", "finalDocumentsSummary")
		);
	}

	private Map<String, Object> summaryField(String label, String fieldKey) {
		return textComponent(label + ": {{" + fieldKey + "}}", "=" + fieldKey + " = null or " + fieldKey + " = \"\"");
	}

	private Map<String, Object> summaryBoolean(String label, String fieldKey) {
		return textComponent(label, "=" + fieldKey + " != true");
	}

	@SafeVarargs
	private final List<Map<String, Object>> mergeSections(List<Map<String, Object>>... sections) {
		List<Map<String, Object>> merged = new ArrayList<>();
		for (List<Map<String, Object>> section : sections) {
			merged.addAll(section);
		}
		return merged;
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