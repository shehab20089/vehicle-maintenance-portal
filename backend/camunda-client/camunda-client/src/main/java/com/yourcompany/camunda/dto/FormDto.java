package com.yourcompany.camunda.dto;

public class FormDto {
    private String id;
    private String schema;

    public String getId() {
        return id;
    }

    public void setId(String id) {   // <-- match the field name
        this.id = id;
    }

    public String getSchema() {
        return schema;
    }

    public void setSchema(String schema) {
        this.schema = schema;
    }
}
