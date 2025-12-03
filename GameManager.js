import { Component, Property } from '@wonderlandengine/api';

export class GameManager extends Component {
    static TypeName = 'GameManager';

    static Properties = {
        trustText: Property.object()
    };

    start() {
        console.log("GameManager initialized");

        /* ------------------------------------------
           PERSISTENT TRUST INITIALIZATION
        ------------------------------------------- */

        // If trust was never set before, initialize once
        if (this.engine.gameTrust === undefined) {
            this.engine.gameTrust = 0;
        }

        // Local reference mirrors global engine trust
        this.trust = this.engine.gameTrust;

        /* ------------------------------------------ */

        /* Trust requirements per level */
        this.levelRequirements = [0, 10, 20, 30, 40, 50];

        /* Scene filenames (optional, can be selected in wonderland isntead) */
        this.levelSceneNames = [
            "level1.bin",
            "level2.bin",
            "level3.bin",
            "level4.bin",
            "level5.bin",
            "level6.bin"
        ];

        // Update UI at start
        this.updateTrustText();
    }

    /* ------------------------------------------
       TRUST MANIPULATION
    ------------------------------------------- */

    addTrust(amount) {
        this.trust += amount;

        /* Update global value so it persists across scenes */
        this.engine.gameTrust = this.trust;

        this.updateTrustText();

        console.log(`Trust updated: ${this.trust}`);
    }

    getTrust() {
        return this.trust;
    }

    /* ------------------------------------------
       LEVEL REQUIREMENTS
    ------------------------------------------- */

    getRequirement(levelIndex) {
        return this.levelRequirements[levelIndex];
    }

    /* ------------------------------------------
       UPDATE UI TEXT
    ------------------------------------------- */

    updateTrustText() {
        if (!this.trustText) return;

        const txt = this.trustText.getComponent('text');
        if (!txt) {
            console.error("trustText object has no 'text' component!");
            return;
        }

        txt.text = `Trust: ${this.trust}`;
    }

    /* ------------------------------------------
       SCENE LOADING SUPPORT
    ------------------------------------------- */

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
            console.error("Scene FAILED to load:", err);
        }
    }
}
