package terraform.backend.models;

import java.util.ArrayList;
import java.util.List;

public class WizardState {

    private String workspace;
    private String environment;
    private List<String> objectTypes = new ArrayList<>();
    private boolean discoveryComplete = false;
    private boolean hybridComplete = false;

    public String getWorkspace() { return workspace; }
    public void setWorkspace(String workspace) { this.workspace = workspace; }

    public String getEnvironment() { return environment; }
    public void setEnvironment(String environment) { this.environment = environment; }

    public List<String> getObjectTypes() { return objectTypes; }
    public void setObjectTypes(List<String> objectTypes) { this.objectTypes = objectTypes; }

    public boolean isDiscoveryComplete() { return discoveryComplete; }
    public void setDiscoveryComplete(boolean discoveryComplete) { this.discoveryComplete = discoveryComplete; }

    public boolean isHybridComplete() { return hybridComplete; }
    public void setHybridComplete(boolean hybridComplete) { this.hybridComplete = hybridComplete; }
}
