package com.yourcompany.camunda.client;
import javax.xml.namespace.NamespaceContext;


import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.yourcompany.camunda.auth.KeycloakTokenProvider;
import com.yourcompany.camunda.config.CamundaProperties;
import com.yourcompany.camunda.dto.*;
import com.yourcompany.camunda.util.XmlUtils;
import io.camunda.zeebe.client.ZeebeClient;
import org.springframework.web.reactive.function.client.ClientResponse;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.util.UriComponentsBuilder;
import reactor.core.publisher.Mono;

import javax.xml.xpath.*;
import org.w3c.dom.*;
import java.net.URI;
import java.util.*;

public class CamundaClientImpl implements CamundaClient {

    private static final TypeReference<Map<String, Object>> MAP_TYPE = new TypeReference<>() { };

    private final WebClient webClient;
    private final ZeebeClient zeebe;
    private final KeycloakTokenProvider tokenProvider;
    private final CamundaProperties props;
    private final ObjectMapper objectMapper;

    public CamundaClientImpl(WebClient webClient, ZeebeClient zeebe, KeycloakTokenProvider tokenProvider, CamundaProperties props) {
        this.webClient = webClient;
        this.zeebe = zeebe;
        this.tokenProvider = tokenProvider;
        this.props = props;
        this.objectMapper = new ObjectMapper();
    }

    @Override
    public StartProcessResult startProcess(String processKey, Object variables) {
        var resp = zeebe.newCreateInstanceCommand()
                .bpmnProcessId(processKey)
                .latestVersion()
                .variables(variables)
                .send()
                .join();

        return new StartProcessResult(resp.getBpmnProcessId(), resp.getProcessDefinitionKey(), resp.getProcessInstanceKey(), resp.getVersion());
    }

    @Override
    public void setProcessVariables(long processInstanceKey, Map<String, Object> variables) {
        zeebe.newSetVariablesCommand(processInstanceKey)
                .variables(variables)
                .send()
                .join();
    }

    @Override
    public boolean deleteProcessInstance(long processInstanceKey) {
        zeebe.newCancelInstanceCommand(processInstanceKey).send().join();
        return true;
    }

    @Override
    public List<UserTaskDto> getUserTasks(String assignee) {
        String token = tokenProvider.getToken();
        var resp = webClient.post()
                .uri(URI.create(props.getTasklistBaseUrl() + "/v1/tasks/search"))
                .headers(h -> h.setBearerAuth(token))
                .bodyValue(Map.of("assignee", assignee))
                .retrieve()
                .bodyToFlux(UserTaskDto.class)
                .collectList()
                .block();
            return resp == null ? List.of() : resp.stream().filter(this::isActiveTask).toList();
    }

    @Override
    public UserTaskDto getUserTaskByProcessInstance(String processInstanceKey, String candidateGroup) {
        String token = tokenProvider.getToken();
        Map<String,Object> payload = new HashMap<>();
        payload.put("processInstanceKey", processInstanceKey);
        if (candidateGroup != null) payload.put("candidateGroup", candidateGroup);

        var resp = webClient.post()
                .uri(URI.create(props.getTasklistBaseUrl() + "/v1/tasks/search"))
                .headers(h -> h.setBearerAuth(token))
                .bodyValue(payload)
                .retrieve()
                .bodyToFlux(UserTaskDto.class)
                .collectList()
                .block();
        if (resp == null || resp.isEmpty()) {
            return null;
        }

        return resp.stream().filter(this::isActiveTask).findFirst().orElse(null);
    }

    @Override
    public Map<String, Object> getTaskVariables(String taskId) {
        String token = tokenProvider.getToken();
        var resp = webClient.post()
                .uri(URI.create(props.getTasklistBaseUrl() + "/v1/tasks/" + taskId + "/variables/search"))
                .headers(h -> h.setBearerAuth(token))
                .bodyValue(Map.of())
                .retrieve()
                .bodyToMono(List.class)
                .block();

        if (resp == null || resp.isEmpty()) {
            return Map.of();
        }

        Map<String, Object> variables = new LinkedHashMap<>();
        for (Object item : resp) {
            if (!(item instanceof Map<?, ?> variableMap)) {
                continue;
            }

            Object name = variableMap.get("name");
            if (name == null) {
                continue;
            }

            variables.put(String.valueOf(name), fromTasklistValue(variableMap.get("value")));
        }

        return variables;
    }

    @Override
    public void completeUserTask(String taskId, Object variables) {
        String token = tokenProvider.getToken();
        webClient.patch()
                .uri(URI.create(props.getTasklistBaseUrl() + "/v1/tasks/" + taskId + "/assign"))
                .headers(h -> h.setBearerAuth(token))
                .bodyValue(Map.of("assignee", props.getKeycloakClientId()))
                .retrieve()
                .toBodilessEntity()
                .block();

        webClient.patch()
                .uri(URI.create(props.getTasklistBaseUrl() + "/v1/tasks/" + taskId + "/complete"))
                .headers(h -> h.setBearerAuth(token))
                .bodyValue(Map.of("variables", toTasklistVariables(variables)))
                .retrieve()
                .toBodilessEntity()
                .block();
    }

    private List<Map<String, Object>> toTasklistVariables(Object variables) {
        Map<String, Object> variableMap = variables instanceof Map<?, ?> rawMap
                ? objectMapper.convertValue(rawMap, MAP_TYPE)
                : Map.of("payload", variables);

        List<Map<String, Object>> serializedVariables = new ArrayList<>();
        for (Map.Entry<String, Object> entry : variableMap.entrySet()) {
            serializedVariables.add(Map.of(
                    "name", entry.getKey(),
                    "value", toTasklistValue(entry.getValue())
            ));
        }
        return serializedVariables;
    }

    private String toTasklistValue(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException exception) {
            throw new RuntimeException("Failed to serialize task variable", exception);
        }
    }

    private Object fromTasklistValue(Object value) {
        if (!(value instanceof String rawValue)) {
            return value;
        }

        try {
            return objectMapper.readValue(rawValue, Object.class);
        } catch (JsonProcessingException exception) {
            return rawValue;
        }
    }

    private boolean isActiveTask(UserTaskDto task) {
        return task != null
                && task.getCompletionDate() == null
                && (task.getTaskState() == null || !"COMPLETED".equalsIgnoreCase(task.getTaskState()));
    }




    @Override
public List<TimelineStepDto> getTimelineSteps(String bpmnProcessId, String firstStepActor, Integer version) throws Exception {
    String token = tokenProvider.getToken();
    // if (token == null) throw new UnauthorizedAccessException();

    // Step 1: Paginated search for process definitions
    List<Map<String,Object>> allItems = new ArrayList<>();
    List<String> searchAfter = null;
    int pageCount = 0;
    final int maxPages = 50;

    while (true) {
        pageCount++;
        if (pageCount > maxPages) break;

        Map<String,Object> filter = new HashMap<>();
        filter.put("bpmnProcessId", bpmnProcessId);
        if (version != null) filter.put("version", version);

        Map<String,Object> searchPayload = new HashMap<>();
        searchPayload.put("filter", filter);
        searchPayload.put("size", 10);
        searchPayload.put("sort", List.of(Map.of("field","version","order","DESC")));
        if (searchAfter != null) searchPayload.put("searchAfter", searchAfter);

        Map<?,?> searchBody = webClient.post()
                .uri(URI.create(props.getOperateBaseUrl() + "/v1/process-definitions/search"))
                .headers(h -> h.setBearerAuth(token))
                .bodyValue(searchPayload)
                .retrieve()
                .bodyToMono(Map.class)
                .block();

        if (searchBody == null) break;
        List<?> items = (List<?>) searchBody.get("items");
        if (items == null || items.isEmpty()) break;

        for (Object o : items) allItems.add((Map<String,Object>) o);

        if (searchBody.containsKey("sortValues")) {
            List<?> sortValues = (List<?>) searchBody.get("sortValues");
            List<String> newSearchAfter = sortValues.stream().map(String::valueOf).toList();
            if (searchAfter != null && searchAfter.equals(newSearchAfter)) break;
            searchAfter = newSearchAfter;
        } else break;
    }

    if (allItems.isEmpty()) return List.of();

    Map<String,Object> latest = allItems.stream()
            .filter(m -> bpmnProcessId.equals(String.valueOf(m.get("bpmnProcessId"))))
            .max(Comparator.comparingInt(m -> ((Number)m.get("version")).intValue()))
            .orElse(null);

    if (latest == null) return List.of();
    long latestKey = ((Number)latest.get("key")).longValue();

    // Step 2: Get BPMN XML
    String xml = webClient.get()
            .uri(URI.create(props.getOperateBaseUrl() + "/v1/process-definitions/" + latestKey + "/xml"))
            .headers(h -> h.setBearerAuth(token))
            .retrieve()
            .bodyToMono(String.class)
            .block();
    if (xml == null || xml.isBlank()) return List.of();

    Document doc = XmlUtils.parse(xml);
    XPath xpath = XPathFactory.newInstance().newXPath();
    xpath.setNamespaceContext(new CamundaNamespaceContext());

    // Step 3: Build flows
    NodeList seqList = (NodeList) xpath.evaluate("//bpmn:sequenceFlow", doc, XPathConstants.NODESET);
    Map<String,List<String>> flows = new HashMap<>();
    for (int i=0;i<seqList.getLength();i++) {
        Element f = (Element) seqList.item(i);
        flows.computeIfAbsent(f.getAttribute("sourceRef"), k->new ArrayList<>()).add(f.getAttribute("targetRef"));
    }

    // Step 4: Collect user tasks with labels and groups
    NodeList userTasks = (NodeList) xpath.evaluate("//bpmn:userTask", doc, XPathConstants.NODESET);
    Map<String,TimelineStepDto> taskMap = new HashMap<>();
    for (int i=0;i<userTasks.getLength();i++) {
        Element t = (Element) userTasks.item(i);
        String id = t.getAttribute("id");
        String name = t.getAttribute("name");

        String group = extractGroupFromUserTask(t);
        String[] labels = extractLabelsFromUserTask(t, name);

        TimelineStepDto step = new TimelineStepDto();
        step.setId(id);
        step.setGroup(group);
        step.setTitle(name);
        step.setTitleEn(labels[0] + " Approval");
        step.setTitleAr("موافقة " + labels[1]);
        taskMap.put(id, step);
    }

    // Step 5: BFS traversal
    String startId = xpath.evaluate("//bpmn:startEvent/@id", doc);
    List<TimelineStepDto> ordered = new ArrayList<>();
    if (startId != null && flows.containsKey(startId)) {
        Queue<String> q = new ArrayDeque<>(flows.get(startId));
        Set<String> visited = new HashSet<>();
        while (!q.isEmpty()) {
            String cur = q.poll();
            if (!visited.add(cur)) continue;
            if (taskMap.containsKey(cur)) ordered.add(taskMap.get(cur));
            if (flows.containsKey(cur)) flows.get(cur).forEach(tgt -> { if (!visited.contains(tgt)) q.add(tgt); });
        }
    }

    // Step 6: Prepend Student step
    String arabicFirstStep = switch (firstStepActor) {
        case "Student" -> "الطالب";
        case "Supervisor" -> "المشرف";
        case "Department Head" -> "رئيس القسم";
        default -> firstStepActor;
    };

    TimelineStepDto student = new TimelineStepDto();
    student.setId(firstStepActor);
    student.setGroup(firstStepActor);
    student.setTitle(firstStepActor + " Request Submission");
    student.setTitleEn(firstStepActor + " Request Submission");
    student.setTitleAr("تقديم طلب " + arabicFirstStep);
    student.setStatus(RequestStatus.Started.toString());
    student.setTag(RequestStatus.Started.toString());
    ordered.add(0, student);

    if (ordered.size() > 1) {
        ordered.get(1).setStatus(RequestStatus.Pending.toString());
        ordered.get(1).setTag(RequestStatus.Pending.toString());
    }

    return ordered;
}

// Helpers
private String extractGroupFromUserTask(Element t) {
    // Prefer zeebe:assignmentDefinition
    NodeList assignDefs = t.getElementsByTagNameNS("http://camunda.org/schema/zeebe/1.0", "assignmentDefinition");
    if (assignDefs != null && assignDefs.getLength() > 0) {
        Element ad = (Element) assignDefs.item(0);
        String candidateGroups = ad.getAttribute("candidateGroups");
        if (candidateGroups != null && !candidateGroups.isBlank()) return candidateGroups.split(",")[0].trim();
    }
    // Fallback to camunda attributes
    String candidateGroupsAttr = t.getAttribute("camunda:candidateGroups");
    if (candidateGroupsAttr != null && !candidateGroupsAttr.isBlank()) return candidateGroupsAttr.split(",")[0].trim();
    String assignee = t.getAttribute("camunda:assignee");
    if (assignee != null && !assignee.isBlank()) return assignee.trim();
    return t.getAttribute("name") != null ? t.getAttribute("name") : t.getAttribute("id");
}

private String[] extractLabelsFromUserTask(Element t, String fallbackName) {
    String labelEn = fallbackName;
    String labelAr = "";
    NodeList propNodes = t.getElementsByTagNameNS("http://camunda.org/schema/zeebe/1.0", "property");
    for (int i=0;i<propNodes.getLength();i++) {
        Element p = (Element) propNodes.item(i);
        String name = p.getAttribute("name");
        String value = p.getAttribute("value");
        if ("labelEn".equals(name) && value!=null && !value.isBlank()) labelEn = value;
        if ("labelAr".equals(name) && value!=null && !value.isBlank()) labelAr = value;
    }
    return new String[]{labelEn,labelAr};
}



    @Override
    public FormDto getFormByDefinition(String formId, String processDefinitionKey, Integer version) {
        String token = tokenProvider.getToken();
        UriComponentsBuilder uriBuilder = UriComponentsBuilder
                .fromHttpUrl(props.getTasklistBaseUrl())
                .path("/v1/forms/{formId}");

        if (processDefinitionKey != null && !processDefinitionKey.isBlank()) {
            uriBuilder.queryParam("processDefinitionKey", processDefinitionKey);
        }

        if (version != null) {
            uriBuilder.queryParam("version", version);
        }

        URI url = uriBuilder.buildAndExpand(formId).toUri();

        return webClient.get()
                .uri(url)
                .headers(h -> h.setBearerAuth(token))
                .exchangeToMono(this::mapFormResponse)
                .block();
    }

    private Mono<FormDto> mapFormResponse(ClientResponse response) {
        if (response.statusCode().value() == 404) {
            return Mono.empty();
        }

        if (response.statusCode().isError()) {
            return response.createException().flatMap(Mono::error);
        }

        return response.bodyToMono(FormDto.class);
    }

    @Override
    public FormDto getStartFormByProcess(String bpmnProcessId, Integer version) throws Exception {
        List<ProcessDefinitionRef> definitions = findProcessDefinitions(bpmnProcessId, version);
        if (definitions.isEmpty()) {
            return null;
        }

        // Use the latest definition to extract the formId from the BPMN XML
        ProcessDefinitionRef latest = definitions.get(0);
        String xml = fetchProcessDefinitionXml(latest.key());
        if (xml == null || xml.isBlank()) {
            return null;
        }

        Document doc = XmlUtils.parse(xml);
        XPath xpath = XPathFactory.newInstance().newXPath();
        String formId = resolveInitialUserTaskFormId(doc, xpath);

        if (formId == null || formId.isBlank()) {
            return null;
        }

        // Try each process definition version (newest first) until we find a deployed form
        for (ProcessDefinitionRef def : definitions) {
            FormDto form = getFormByDefinition(formId, String.valueOf(def.key()), def.version());
            if (form != null) {
                return form;
            }
        }

        return null;
    }

    private String resolveInitialUserTaskFormId(Document doc, XPath xpath) throws XPathExpressionException {
        String startEventId = xpath.evaluate("//*[local-name()='startEvent']/@id", doc);
        if (startEventId == null || startEventId.isBlank()) {
            return "";
        }

        String firstTargetId = xpath.evaluate(
                "//*[local-name()='sequenceFlow'][@sourceRef='" + startEventId + "']/@targetRef",
                doc
        );

        if (firstTargetId != null && !firstTargetId.isBlank()) {
            String directFormId = xpath.evaluate(
                    "//*[@id='" + firstTargetId + "']/*[local-name()='extensionElements']/*[local-name()='formDefinition']/@formId",
                    doc
            );
            if (directFormId != null && !directFormId.isBlank()) {
                return directFormId;
            }
        }

        return xpath.evaluate(
                "(//*[local-name()='userTask']/*[local-name()='extensionElements']/*[local-name()='formDefinition']/@formId)[1]",
                doc
        );
    }

    @Override
    public List<FormComponentDto> getStartEventForm(String bpmnProcessId, Integer version) throws Exception {
        return List.of();
    }

    @Override
    public FormDto getFormByDefinitionWithFallback(String formId, String bpmnProcessId) {
        List<ProcessDefinitionRef> defs = findProcessDefinitions(bpmnProcessId, null);
        for (ProcessDefinitionRef def : defs) {
            FormDto form = getFormByDefinition(formId, String.valueOf(def.key()), def.version());
            if (form != null) {
                return form;
            }
        }
        return null;
    }

    private ProcessDefinitionRef findLatestProcessDefinition(String bpmnProcessId, Integer version) {
        List<ProcessDefinitionRef> defs = findProcessDefinitions(bpmnProcessId, version);
        return defs.isEmpty() ? null : defs.get(0);
    }

    private List<ProcessDefinitionRef> findProcessDefinitions(String bpmnProcessId, Integer version) {
        String token = tokenProvider.getToken();
        List<Map<String, Object>> allItems = new ArrayList<>();
        List<String> searchAfter = null;
        int pageCount = 0;
        final int maxPages = 50;

        while (true) {
            pageCount++;
            if (pageCount > maxPages) {
                break;
            }

            Map<String, Object> filter = new HashMap<>();
            filter.put("bpmnProcessId", bpmnProcessId);
            if (version != null) {
                filter.put("version", version);
            }

            Map<String, Object> searchPayload = new HashMap<>();
            searchPayload.put("filter", filter);
            searchPayload.put("size", 10);
            searchPayload.put("sort", List.of(Map.of("field", "version", "order", "DESC")));
            if (searchAfter != null) {
                searchPayload.put("searchAfter", searchAfter);
            }

            Map<?, ?> searchBody = webClient.post()
                    .uri(URI.create(props.getOperateBaseUrl() + "/v1/process-definitions/search"))
                    .headers(h -> h.setBearerAuth(token))
                    .bodyValue(searchPayload)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();

            if (searchBody == null) {
                break;
            }

            List<?> items = (List<?>) searchBody.get("items");
            if (items == null || items.isEmpty()) {
                break;
            }

            for (Object item : items) {
                allItems.add((Map<String, Object>) item);
            }

            if (searchBody.containsKey("sortValues")) {
                List<?> sortValues = (List<?>) searchBody.get("sortValues");
                List<String> newSearchAfter = sortValues.stream().map(String::valueOf).toList();
                if (searchAfter != null && searchAfter.equals(newSearchAfter)) {
                    break;
                }
                searchAfter = newSearchAfter;
            } else {
                break;
            }
        }

        if (allItems.isEmpty()) {
            return List.of();
        }

        return allItems.stream()
                .filter(item -> bpmnProcessId.equals(String.valueOf(item.get("bpmnProcessId"))))
                .sorted(Comparator.comparingInt((Map<String, Object> item) -> ((Number) item.get("version")).intValue()).reversed())
                .map(item -> new ProcessDefinitionRef(
                        ((Number) item.get("key")).longValue(),
                        ((Number) item.get("version")).intValue()
                ))
                .toList();
    }

    private String fetchProcessDefinitionXml(long processDefinitionKey) {
        String token = tokenProvider.getToken();
        return webClient.get()
                .uri(URI.create(props.getOperateBaseUrl() + "/v1/process-definitions/" + processDefinitionKey + "/xml"))
                .headers(h -> h.setBearerAuth(token))
                .retrieve()
                .bodyToMono(String.class)
                .block();
    }

    private record ProcessDefinitionRef(long key, int version) {
    }

    @Override
    public boolean returnToPreviousStep(long processInstanceKey, String previousElementId) {
        String token = tokenProvider.getToken();
        Map<String,Object> searchPayload = Map.of("filter", Map.of("processInstanceKey", processInstanceKey, "state", "ACTIVE"));
        var searchRes = webClient.post()
                .uri(URI.create(props.getOperateBaseUrl() + "/v1/flownode-instances/search"))
                .headers(h -> h.setBearerAuth(token))
                .bodyValue(searchPayload)
                .retrieve()
                .bodyToMono(Map.class)
                .block();

        List<?> items = (List<?>) ((Map<?,?>)searchRes).get("items");
        if (items == null || items.isEmpty()) return false;
        long currentNodeKey = ((Number)((Map<?,?>)items.get(0)).get("key")).longValue();

        var modifyPayload = Map.of(
                "activateInstructions", List.of(Map.of("ancestorElementInstanceKey", -1, "elementId", previousElementId)),
                "terminateInstructions", List.of(Map.of("elementInstanceKey", currentNodeKey)),
                "operationReference", 1
        );

        webClient.post()
                .uri(URI.create(props.getZeebeGateway2() + "/v2/process-instances/" + processInstanceKey + "/modification"))
                .headers(h -> h.setBearerAuth(token))
                .bodyValue(modifyPayload)
                .retrieve()
                .toBodilessEntity()
                .block();

        return true;
    }

    private static class CamundaNamespaceContext implements NamespaceContext {
        public String getNamespaceURI(String prefix) {
            return switch (prefix) {
                case "bpmn" -> "http://www.omg.org/spec/BPMN/20100524/MODEL";
                case "zeebe" -> "http://camunda.org/schema/zeebe/1.0";
                default -> "";
            };
        }
        public String getPrefix(String uri) { return null; }
        public java.util.Iterator<String> getPrefixes(String uri) { return Collections.emptyIterator(); }
    }

    @Override
    public boolean returnStep(long processInstanceKey, String elementId) {
        String token = tokenProvider.getToken();

        // Step 1: Search active flow node instances in Operate
        Map<String, Object> searchPayload = Map.of(
                "filter", Map.of("processInstanceKey", processInstanceKey, "state", "ACTIVE"));

        var searchRes = webClient.post()
                .uri(URI.create(props.getOperateBaseUrl() + "/v1/flownode-instances/search"))
                .headers(h -> h.setBearerAuth(token))
                .bodyValue(searchPayload)
                .retrieve()
                .bodyToMono(Map.class)
                .block();

        List<?> items = (List<?>) ((Map<?, ?>) searchRes).get("items");
        if (items == null || items.isEmpty())
            return false;

        long currentNodeKey = ((Number) ((Map<?, ?>) items.get(0)).get("key")).longValue();

        // Step 2: Call modification API on Zeebe
        var modifyPayload = Map.of(
                "activateInstructions", List.of(Map.of(
                        "ancestorElementInstanceKey", -1,
                        "elementId", elementId)),
                "terminateInstructions", List.of(Map.of(
                        "elementInstanceKey", currentNodeKey)),
                "operationReference", 1);

        webClient.post()
                .uri(URI.create(
                        props.getZeebeGateway2() + "/v2/process-instances/" + processInstanceKey + "/modification"))
                .headers(h -> h.setBearerAuth(token))
                .bodyValue(modifyPayload)
                .retrieve()
                .toBodilessEntity()
                .block();

        return true;
    }

}