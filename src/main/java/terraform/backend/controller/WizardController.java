package terraform.backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import terraform.backend.models.ObjectSelection;
import terraform.backend.services.WizardService;
import terraform.backend.models.WizardState;
import terraform.backend.state.WizardStateManager;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/wizard")
public class WizardController {

    private final WizardService wizardService;

    public WizardController(WizardService wizardService) {
        this.wizardService = wizardService;
    }

    // ---------------------------------------------------------
    // 1. Workspace selection
    // ---------------------------------------------------------
    @PostMapping("/workspace")
    public WizardState setWorkspace(@RequestBody Map<String, Object> body) {
        String workspace = (String) body.get("workspace");
        WizardState state = WizardStateManager.get();
        state.setWorkspace(workspace);

        wizardService.setWorkspace(workspace);

        return state;
    }

    // ---------------------------------------------------------
    // 2. Environment selection
    // ---------------------------------------------------------
    @PostMapping("/environment")
    public WizardState setEnvironment(@RequestBody Map<String, Object> body) {
        String environment = (String) body.get("environment");
        WizardState state = WizardStateManager.get();
        state.setEnvironment(environment);

        wizardService.setEnvironment(environment);

        return state;
    }

    // ---------------------------------------------------------
    // 3. Object type selection (UI state only)
    //    This is NOT used by WizardService anymore.
    // ---------------------------------------------------------
    @PostMapping("/object-types")
    public WizardState setObjectTypes(@RequestBody Map<String, Object> body) {
        WizardState state = WizardStateManager.get();
        state.setObjectTypes((List<String>) body.get("selected"));
        return state;
    }

    // ---------------------------------------------------------
    // 4. Preview generation (optional)
    //    Frontend sends a list of ObjectSelection objects.
    //    WizardService generates files in memory only.
    // ---------------------------------------------------------
    @PostMapping("/preview")
    public ResponseEntity<?> preview(@RequestBody List<ObjectSelection> selections) {
        wizardService.setSelections(selections);
        wizardService.generate(); // generates in memory
        return ResponseEntity.ok(Map.of(
                "files", wizardService.getGeneratedFiles(),
                "logs", wizardService.getLogs()
        ));
    }

    // ---------------------------------------------------------
    // 5. Final generation (write to workspace)
    //    Same as preview, but frontend confirms.
    // ---------------------------------------------------------
    @PostMapping("/generate")
    public ResponseEntity<?> generate(@RequestBody List<ObjectSelection> selections) {
        wizardService.setSelections(selections);
        wizardService.generate(); // writes to workspace
        return ResponseEntity.ok(Map.of(
                "files", wizardService.getGeneratedFiles(),
                "logs", wizardService.getLogs()
        ));
    }

    // ---------------------------------------------------------
    // 6. Reset wizard state
    // ---------------------------------------------------------
    @PostMapping("/reset")
    public WizardState reset() {
        WizardStateManager.reset();
        return WizardStateManager.get();
    }
}
