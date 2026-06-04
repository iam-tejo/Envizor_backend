package terraform.backend.state;

import terraform.backend.models.WizardState;

public class WizardStateManager {

    private static final WizardState STATE = new WizardState();

    public static WizardState get() {
        return STATE;
    }

    public static void reset() {
        STATE.setWorkspace(null);
        STATE.setEnvironment(null);
        STATE.getObjectTypes().clear();
        STATE.setDiscoveryComplete(false);
        STATE.setHybridComplete(false);
    }
}
