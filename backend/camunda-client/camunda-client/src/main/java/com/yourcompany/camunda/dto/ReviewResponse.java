package com.yourcompany.camunda.dto;

import java.util.List;

public class ReviewResponse {
    private String taskId;
    private String returnedReason;
    private List<TimelineStepDto> timelineSteps;

    public String getTaskId() { return taskId; }
    public void setTaskId(String taskId) { this.taskId = taskId; }

    public String getReturnedReason() { return returnedReason; }
    public void setReturnedReason(String returnedReason) { this.returnedReason = returnedReason; }

    public List<TimelineStepDto> getTimelineSteps() { return timelineSteps; }
    public void setTimelineSteps(List<TimelineStepDto> timelineSteps) { this.timelineSteps = timelineSteps; }
}
