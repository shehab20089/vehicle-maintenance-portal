package com.vehiclemaintenance.api.service;

import jakarta.annotation.PostConstruct;
import java.io.InputStream;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.xpath.XPathConstants;
import javax.xml.xpath.XPathFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.w3c.dom.Element;
import org.w3c.dom.NodeList;

@Service
public class BpmnProcessMetadataService {

	private final Map<String, UserTaskMetadata> taskByName = new LinkedHashMap<>();

	@Value("${camunda.bpmn-resource:vehicle-maintenance-request.bpmn}")
	private String bpmnResource;

	@PostConstruct
	void load() {
		taskByName.clear();

		try (InputStream inputStream = new ClassPathResource(bpmnResource).getInputStream()) {
			var documentBuilderFactory = DocumentBuilderFactory.newInstance();
			documentBuilderFactory.setNamespaceAware(true);
			var document = documentBuilderFactory.newDocumentBuilder().parse(inputStream);
			var xpath = XPathFactory.newInstance().newXPath();

			NodeList userTasks = (NodeList) xpath.evaluate(
				"//*[local-name()='process']/*[local-name()='userTask']",
				document,
				XPathConstants.NODESET
			);

			for (int index = 0; index < userTasks.getLength(); index++) {
				Element task = (Element) userTasks.item(index);
				String taskId = task.getAttribute("id");
				String taskName = task.getAttribute("name");
				String formId = xpath.evaluate(
					"./*[local-name()='extensionElements']/*[local-name()='formDefinition']/@formId",
					task
				);
				String candidateGroup = xpath.evaluate(
					"./*[local-name()='extensionElements']/*[local-name()='assignmentDefinition']/@candidateGroups",
					task
				);
				String assigneeExpression = xpath.evaluate(
					"./*[local-name()='extensionElements']/*[local-name()='assignmentDefinition']/@assignee",
					task
				);

				taskByName.put(taskName, new UserTaskMetadata(taskId, taskName, formId, candidateGroup, assigneeExpression));
			}
		} catch (Exception exception) {
			throw new IllegalStateException("Unable to load BPMN metadata from resource: " + bpmnResource, exception);
		}
	}

	public Optional<UserTaskMetadata> findByTaskName(String taskName) {
		return Optional.ofNullable(taskByName.get(taskName));
	}

	public record UserTaskMetadata(
		String id,
		String name,
		String formId,
		String candidateGroup,
		String assigneeExpression
	) {
	}
}