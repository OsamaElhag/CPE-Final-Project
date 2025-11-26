import { Component, Property } from '@wonderlandengine/api';

export class MenuManager extends Component {
    static TypeName = 'MenuManager';

    static Properties = {
        player: Property.object(),
        trustText: Property.object(),

        level1Button: Property.object(),
        level2Button: Property.object(),
        level3Button: Property.object(),
        level4Button: Property.object(),
        level5Button: Property.object(),
        level6Button: Property.object(),

        level1Start: Property.object(),
        level2Start: Property.object(),
        level3Start: Property.object(),
        level4Start: Property.object(),
        level5Start: Property.object(),
        level6Start: Property.object(),

        controllerGroupId: Property.int(4), // default controller group
        lockedFlashTime: Property.float(0.5), // seconds
    };

    start() {
        this.trust = 0;

        // Trust requirement per level
        this.levelRequirements = [0, 10, 20, 30, 40, 50];

        // Arrays of buttons and start positions
        this.levelButtons = [
            this.level1Button,
            this.level2Button,
            this.level3Button,
            this.level4Button,
            this.level5Button,
            this.level6Button
        ];

        this.levelStarts = [
            this.level1Start,
            this.level2Start,
            this.level3Start,
            this.level4Start,
            this.level5Start,
            this.level6Start
        ];

        // Controller mask
        this._controllerMask = (1 << this.controllerGroupId);

        // Initialize button visuals
        this.updateButtonColors();
    }

    update() {
        for (let i = 0; i < this.levelButtons.length; i++) {
            const btn = this.levelButtons[i];
            if (!btn) continue;

            const col = btn.getComponent('collision');
            if (!col) continue;

            const overlaps = col.queryOverlaps();
            const touchingController = overlaps.some(
                (o) => (o.group & this._controllerMask) !== 0
            );

            if (touchingController) {
                this.tryTeleport(i, btn);
            }
        }
    }

    tryTeleport(levelIndex, btn) {
        const requiredTrust = this.levelRequirements[levelIndex];

        if (this.trust >= requiredTrust) {
            // Teleport player
            const startObj = this.levelStarts[levelIndex];
            if (startObj && this.player) {
                this.player.transform.position = startObj.transform.position;
                this.player.transform.rotation = startObj.transform.rotation;
            }
        } else {
            // Visual feedback for locked level
            const textComp = btn.getComponent('text');
            if (textComp) {
                const originalColor = [...textComp.color];
                textComp.color = [1, 0, 0, 1]; // flash red
                setTimeout(() => {
                    textComp.color = originalColor; // revert to original (gray)
                }, this.lockedFlashTime * 1000);
            }
        }
    }

    updateButtonColors() {
        for (let i = 0; i < this.levelButtons.length; i++) {
            const btn = this.levelButtons[i];
            if (!btn) continue;

            const textComp = btn.getComponent('text');
            if (!textComp) continue;

            if (this.trust >= this.levelRequirements[i]) {
                textComp.color = [1, 1, 1, 1]; // white = unlocked
            } else {
                textComp.color = [0.5, 0.5, 0.5, 1]; // gray = locked
            }
        }

        // Update trust display
        if (this.trustText) {
            const textComp = this.trustText.getComponent('text');
            if (textComp) {
                textComp.text = `Trust: ${this.trust}`;
            }
        }
    }

    // Call this function when player gains trust (e.g., from NPCs)
    addTrust(amount) {
        this.trust += amount;
        this.updateButtonColors();
    }
}