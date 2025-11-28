import { Component, Property } from '@wonderlandengine/api';

export class GameManager extends Component {
    static TypeName = 'GameManager';

    static Properties = {
        playerRoot: Property.object(),
        trustText: Property.object()   // <--- NEW
    };

    start() {
        /* Global state */
        this.trust = 0;

        /* Global constants */
        this.levelRequirements = [0, 10, 20, 30, 40, 50];

        /* Scene names placeholder */
        this.levelSceneNames = ["", "", "", "", "", ""];

        this.updateTrustText();   // Display "0" at start

        console.log("GameManager initialized");
    }

    /* Increase trust */
    addTrust(amount) {
        this.trust += amount;
        this.updateTrustText();
        console.log("Trust updated:", this.trust);
    }

    /* Getter */
    getTrust() {
        return this.trust;
    }

    /* Requirement getter */
    getRequirement(levelIndex) {
        return this.levelRequirements[levelIndex];
    }

    /* Update the UI text */
    updateTrustText() {
        if (!this.trustText) return;

        const txt = this.trustText.getComponent('text');
        if (!txt) {
            console.error("trustText object has no text component!");
            return;
        }

        txt.text = `Trust: ${this.trust}`;
    }

    loadLevelScene(levelIndex) {
        const sceneName = this.levelSceneNames[levelIndex];
        console.warn("Scene loading not implemented yet:", sceneName);
    }
}
    }

}
