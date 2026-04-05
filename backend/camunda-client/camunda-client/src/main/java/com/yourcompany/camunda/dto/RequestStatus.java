package com.yourcompany.camunda.dto;

public enum RequestStatus {
    Started(0),
    Pending(1),
    Approved(2),
    Rejected(3),
    Returned(4);

    private final int code;

    RequestStatus(int code) {
        this.code = code;
    }

    public int getCode() {
        return code;
    }
}
