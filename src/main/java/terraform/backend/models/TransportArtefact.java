package terraform.backend.models;

public class TransportArtefact {

    private String type;        // EmailTemplate, Analytics, SavRole, TechnicalRule, etc.
    private String name;        // Logical name
    private String zipFileName; // e.g. "WelcomeTemplate.zip"

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

    public String getZipFileName() {
        return zipFileName;
    }

    public void setZipFileName(String zipFileName) {
        this.zipFileName = zipFileName;
    }
}
