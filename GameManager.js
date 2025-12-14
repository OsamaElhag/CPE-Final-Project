import { Component, Property } from '@wonderlandengine/api';

export class GameManagerTester extends Component {
    static TypeName = 'GameManagerTester';

    static Properties = {
        // UI object used to display the current trust value
        trustText: Property.object()
    };

    start() {
        console.log("GameManagerTester initialized");

        // Initialize persistent trust value if it does not already exist
        if (this.engine.gameTrust === undefined) {
            this.engine.gameTrust = 0;
        }

        // Mirror the global trust value locally
        this.trust = this.engine.gameTrust;

        // Trust thresholds required to unlock each level
        this.levelRequirements = [0, 10, 20, 30, 40, 50];

        // Scene file names corresponding to each level
        this.levelSceneNames = [
            "level1.bin",
            "level2.bin",
            "level3.bin",
            "level4.bin",
            "level5.bin",
            "level6.bin"
        ];

        // Update the trust UI when the game starts
        this.updateTrustText();
    }

    // Increase the trust value and persist it across scenes
    addTrust(amount) {
        this.trust += amount;

        // Store the updated value on the engine for persistence
        this.engine.gameTrust = this.trust;

        this.updateTrustText();
        console.log(`Trust updated: ${this.trust}`);
    }

    // Return the current trust value
    getTrust() {
        return this.trust;
    }

    // Return the trust requirement for a given level
    getRequirement(levelIndex) {
        return this.levelRequirements[levelIndex];
    }

    // Update the on-screen trust text
    updateTrustText() {
        if (!this.trustText) return;

        const txt = this.trustText.getComponent('text');
        if (!txt) {
            console.error("trustText object has no 'text' component!");
            return;
        }

        txt.text = `Trust: ${this.trust}`;
    }

    // Load the scene associated with a given level
    loadLevelScene(levelIndex) {
        const sceneName = this.levelSceneNames[levelIndex];

        if (!sceneName || sceneName.length === 0) {
            console.error("Scene name missing for level:", levelIndex);
            return;
        }

        console.log("Loading scene:", sceneName);

        try {
            this.engine.scene.load(sceneName);
        } catch (err) {
            console.error("Scene failed to load:", err);
        }
    }
}
