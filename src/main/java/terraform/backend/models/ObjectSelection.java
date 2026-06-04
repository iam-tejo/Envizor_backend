package terraform.backend.models;

import java.util.List;
import java.util.Map;

public class ObjectSelection {

    // STANDARD | EXPORT | IMPORT | TRANSPORT
    private String operation;

    // For STANDARD / EXPORT / IMPORT
    private String type;              // Endpoint, Role, EmailTemplate, Analytics, etc.
    private String name;
    private Map<String, String> attributes; // STANDARD only

    // For IMPORT (single artefact)
    private String zipFileName;       // e.g. "WelcomeTemplate.zip"

    // For TRANSPORT (batch of artefacts)
    private List<TransportArtefact> artefacts;

    // Getters / setters

    public String getOperation() {
        return operation;
    }

    public void setOperation(String operation) {
        this.operation = operation;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Map<String, String> getAttributes() {
        return attributes;
    }

    public void setAttributes(Map<String, String> attributes) {
        this.attributes = attributes;
    }

    public String getZipFileName() {
        return zipFileName;
    }

    public void setZipFileName(String zipFileName) {
        this.zipFileName = zipFileName;
    }

    public List<TransportArtefact> getArtefacts() {
        return artefacts;
    }

    public void setArtefacts(List<TransportArtefact> artefacts) {
        this.artefacts = artefacts;
    }
}
