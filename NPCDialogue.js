import { Component, Property } from '@wonderlandengine/api';

/*
NPCDialogue
Handles a structured spoken dialogue interaction with an NPC.
The NPC plays audio prompts, listens to the player’s spoken response
via SpeechRecorder, and advances the dialogue if the response matches
the expected phrase.
*/
export class NPCDialogue extends Component {
    static TypeName = 'npcdialogue';

    static Properties = {
        /* References to other scene objects */
        gameManagerObj: Property.object(),
        speechRecorderObj: Property.object(),
        sayHintObj: Property.object(),

        /* Controller collision group used to trigger interaction */
        controllerGroupId: Property.int(5),

        /* Total number of dialogue lines */
        lineCount: Property.int(10),

        /* Greeting audio objects (one per dialogue line) */
        greet1Obj: Property.object(), greet2Obj: Property.object(),
        greet3Obj: Property.object(), greet4Obj: Property.object(),
        greet5Obj: Property.object(), greet6Obj: Property.object(),
        greet7Obj: Property.object(), greet8Obj: Property.object(),
        greet9Obj: Property.object(), greet10Obj: Property.object(),

        /* Retry audio objects (played on incorrect response) */
        retry1Obj: Property.object(), retry2Obj: Property.object(),
        retry3Obj: Property.object(), retry4Obj: Property.object(),
        retry5Obj: Property.object(), retry6Obj: Property.object(),
        retry7Obj: Property.object(), retry8Obj: Property.object(),
        retry9Obj: Property.object(), retry10Obj: Property.object(),

        /* Expected Arabic phrases for validation */
        expected1: Property.string("مرحبا"),
        expected2: Property.string("نعم"),
        expected3: Property.string("انا كويس"),
        expected4: Property.string("شكرا"),
        expected5: Property.string("لو سمحت"),
        expected6: Property.string("السوق"),
        expected7: Property.string("شكرا"),
        expected8: Property.string("نعم فهمت"),
        expected9: Property.string("نعم"),
        expected10: Property.string("مع السلامة"),

        /* Hint text shown to the player before speaking */
        say1: Property.string("Marhaba (Hello)"),
        say2: Property.string("Na'am (yes)"),
        say3: Property.string("Ana Kwais (I am well)"),
        say4: Property.string("ٍShukran (Thank You)"),
        say5: Property.string("Low Samahit (Excuse Me)"),
        say6: Property.string("AlSooq (the Market)"),
        say7: Property.string("Shukran (Thank you)"),
        say8: Property.string("Na'am Fahimt (Yes, I understand)"),
        say9: Property.string("Na'am (yes)"),
        say10: Property.string("Ma'a Alsalama (Goodbye)"),

        /* Timing parameters */
        listenDuration: Property.float(7.0),
        postAudioDelay: Property.float(0.25),
    };

    start() {
        /* Collision component is required for detecting interaction */
        this.col = this.object.getComponent('collision');
        if (!this.col) {
            console.error('[NPCDialogue] Collision required');
            return;
        }

        /* Retrieve dependent components */
        this._gm = this.gameManagerObj?.getComponent('GameManagerTester') ?? null;
        this._rec = this.speechRecorderObj?.getComponent('SpeechRecorder') ?? null;
        this._hint = this.sayHintObj?.getComponent('say-hint') ?? null;

        this._controllerMask = (1 << this.controllerGroupId);

        /* Convert greeting objects to audio-source components */
        this._greetAudio = [
            this.greet1Obj, this.greet2Obj, this.greet3Obj, this.greet4Obj,
            this.greet5Obj, this.greet6Obj, this.greet7Obj, this.greet8Obj,
            this.greet9Obj, this.greet10Obj
        ].map(o => o?.getComponent('audio-source'));

        /* Convert retry objects to audio-source components */
        this._retryAudio = [
            this.retry1Obj, this.retry2Obj, this.retry3Obj, this.retry4Obj,
            this.retry5Obj, this.retry6Obj, this.retry7Obj, this.retry8Obj,
            this.retry9Obj, this.retry10Obj
        ].map(o => o?.getComponent('audio-source'));

        /* Store expected phrases in an array */
        this._expected = [
            this.expected1, this.expected2, this.expected3, this.expected4,
            this.expected5, this.expected6, this.expected7, this.expected8,
            this.expected9, this.expected10
        ];

        /* Store hint text in an array */
        this._say = [
            this.say1, this.say2, this.say3, this.say4,
            this.say5, this.say6, this.say7, this.say8,
            this.say9, this.say10
        ];

        /* Dialogue state variables */
        this._lineIndex = 0;
        this._state = 'IDLE';
        this._completed = false;

        /* Retry tracking */
        this._handledTranscript = false;
        this._retryCount = 0;
        this._maxRetries = 10;

        /* Timer references */
        this._audioTimeout = null;
        this._listenTimeout = null;
    }

    update() {
        /* Interaction only occurs when idle and not completed */
        if (this._completed || this._state !== 'IDLE') return;

        const touching = this.col.queryOverlaps()
            .some(o => (o.group & this._controllerMask) !== 0);

        if (touching) this._startLine();
    }

    _startLine() {
        /* Begin the current dialogue line */
        this._clearTimers();
        this._state = 'SPEAKING';
        this._retryCount = 0;

        const audio = this._greetAudio[this._lineIndex];
        if (audio) audio.play();

        this._scheduleListenAfterAudio(audio);
    }

    _retry() {
        /* Retry the current line if the response is incorrect */
        this._clearTimers();
        this._retryCount++;

        if (this._retryCount > this._maxRetries) {
            this._lineIndex++;
            this._state = 'IDLE';
            return;
        }

        this._state = 'RETRYING';

        const audio = this._retryAudio[this._lineIndex];
        if (audio) audio.play();

        this._scheduleListenAfterAudio(audio);
    }

    _scheduleListenAfterAudio(audio) {
        /* Start listening after audio playback completes */
        const duration = audio?.buffer?.duration ?? 0;
        this._audioTimeout = setTimeout(
            () => this._beginListening(),
            (duration + this.postAudioDelay) * 1000
        );
    }

    _beginListening() {
        /* Begin recording and speech recognition */
        this._clearTimers();
        if (!this._rec) return;

        this._state = 'LISTENING';
        this._handledTranscript = false;

        if (this._hint) {
            this._hint.show(this._say[this._lineIndex]);
        }

        this._rec.startRecording(text => {
            if (this._handledTranscript) return;
            this._handledTranscript = true;
            this._onTranscript(text);
        });

        /* Timeout if no speech is detected */
        this._listenTimeout = setTimeout(() => {
            if (!this._handledTranscript) {
                this._handledTranscript = true;
                this._rec.stopRecording();
                this._retry();
            }
        }, this.listenDuration * 1000);
    }

    _onTranscript(text) {
        /* Handle the speech recognition result */
        this._clearTimers();
        if (this._hint) this._hint.hide();

        const expected = this._expected[this._lineIndex];

        if (expected && text !== expected) {
            this._retry();
            return;
        }

        /* Correct response advances dialogue and rewards trust */
        this._gm?.addTrust(1);
        this._lineIndex++;

        if (this._lineIndex >= this.lineCount) {
            this._completed = true;
        }

        this._state = 'IDLE';
    }

    _clearTimers() {
        /* Cancel active timeouts */
        if (this._audioTimeout) {
            clearTimeout(this._audioTimeout);
            this._audioTimeout = null;
        }
        if (this._listenTimeout) {
            clearTimeout(this._listenTimeout);
            this._listenTimeout = null;
        }
    }
}
