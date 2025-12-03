import { Component, Property } from '@wonderlandengine/api';

export class NPCDialogue extends Component {
    static TypeName = 'npc-dialogue';

    static Properties = {
        gameManagerObj: Property.object(),
        speechRecorderObj: Property.object(),
        controllerGroupId: Property.int(5),

        lineCount: Property.int(3),

        greet1Obj: Property.object(),
        retry1Obj: Property.object(),
        expected1: Property.string("مرحبا"),
        trust1: Property.int(5),

        greet2Obj: Property.object(),
        retry2Obj: Property.object(),
        expected2: Property.string("انا بخير"),
        trust2: Property.int(5),

        greet3Obj: Property.object(),
        retry3Obj: Property.object(),
        expected3: Property.string("كيف حالك"),
        trust3: Property.int(10),

        greetDuration: Property.float(2.0),
        retryDuration: Property.float(1.5),
        listenDuration: Property.float(3.0),
    };

    start() {
        this.col = this.object.getComponent('collision');
        if (!this.col) console.error("[NPCDialogue] NPC needs collision!");

        this._controllerMask = (1 << this.controllerGroupId);

        // Get GameManager
        this._gm = this.gameManagerObj
            ? this.gameManagerObj.getComponent('GameManagerTester')
            : null;

        if (!this._gm)
            console.warn("[NPCDialogue] No GameManager found!");

        // Load SpeechRecorder
        this._rec = this.speechRecorderObj
            ? this.speechRecorderObj.getComponent('SpeechRecorder')
            : null;

        if (!this._rec)
            console.error("[NPCDialogue] No SpeechRecorder found!");

        this._greetAudio = [
            this.greet1Obj?.getComponent('audio-source'),
            this.greet2Obj?.getComponent('audio-source'),
            this.greet3Obj?.getComponent('audio-source')
        ];

        this._retryAudio = [
            this.retry1Obj?.getComponent('audio-source'),
            this.retry2Obj?.getComponent('audio-source'),
            this.retry3Obj?.getComponent('audio-source')
        ];

        this._expected = [this.expected1, this.expected2, this.expected3];
        this._trust = [this.trust1, this.trust2, this.trust3];

        this._lineIndex = 0;
        this._state = "IDLE";
        this._completed = false;
    }

    update() {
        if (this._completed) return;
        if (!this.col) return;

        const overlaps = this.col.queryOverlaps();
        const touching = overlaps.some((o) => (o.group & this._controllerMask) !== 0);

        if (touching && this._state === "IDLE") {
            this._startLine();
        }
    }

    _startLine() {
        const i = this._lineIndex;
        this._state = "SPEAKING";

        const audio = this._greetAudio[i];
        if (audio) audio.play();

        setTimeout(() => this._beginListening(), this.greetDuration * 1000);
    }

    _beginListening() {
        this._state = "LISTENING";

        this._rec.startRecording((text) => this._onTranscript(text));

        setTimeout(() => {
            if (this._state === "LISTENING") {
                this._rec.stopRecording();
                this._state = "PROCESSING";
            }
        }, this.listenDuration * 1000);
    }

    _onTranscript(text) {
        this._state = "PROCESSING";

        const expected = this._expected[this._lineIndex];

        if (!text || !text.includes(expected)) {
            this._retry();
            return;
        }

        const reward = this._trust[this._lineIndex];
        if (reward && this._gm) this._gm.addTrust(reward);

        this._lineIndex++;

        if (this._lineIndex >= this.lineCount) {
            this._completeStage();
            return;
        }

        this._state = "IDLE";
    }

    _retry() {
        this._state = "RETRYING";

        const audio = this._retryAudio[this._lineIndex];
        if (audio) audio.play();

        setTimeout(() => this._beginListening(), this.retryDuration * 1000);
    }

    _completeStage() {
        this._completed = true;
        this._state = "IDLE";
        console.log("[NPCDialogue] Stage completed successfully!");
    }
}