import { Component, Property } from '@wonderlandengine/api';

export class SpeechRecorder extends Component {
    static TypeName = 'SpeechRecorder';

    static Properties = {
        openAiKey: Property.string('API KEY'),
        language: Property.string('ar'),
        model: Property.string('whisper-1'),
        maxRecordSeconds: Property.float(3.0),
    };

    start() {
        this._mediaRecorder = null;
        this._chunks = [];
        this._active = false;
        this._onResultCallback = null;
        this._stream = null;
        this._timeout = null;
    }

    async startRecording(callback) {
        if (this._active) return;

        this._onResultCallback = callback;

        try {
            if (!this._stream) {
                this._stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            }

            this._chunks = [];
            this._mediaRecorder = new MediaRecorder(this._stream);

            this._mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) this._chunks.push(e.data);
            };

            this._mediaRecorder.onstop = () => this._processAudio();

            this._mediaRecorder.start();
            this._active = true;

            this._timeout = setTimeout(() => this.stopRecording(), this.maxRecordSeconds * 1000);

        } catch (err) {
            console.error('[SpeechRecorder] Mic error:', err);
            callback(null);
        }
    }

    stopRecording() {
        if (!this._active || !this._mediaRecorder) return;

        this._mediaRecorder.stop();
        this._active = false;

        if (this._timeout) clearTimeout(this._timeout);
    }

    async _processAudio() {
        const blob = new Blob(this._chunks, { type: 'audio/webm' });
        const form = new FormData();

        form.append('file', blob, 'speech.webm');
        form.append('model', this.model);
        form.append('language', this.language);

        try {
            const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
                method: "POST",
                headers: { Authorization: `Bearer ${this.openAiKey}` },
                body: form
            });

            const data = await res.json();
            const text = data.text ? data.text.trim() : null;

            if (this._onResultCallback) this._onResultCallback(text);

        } catch (err) {
            console.error('[SpeechRecorder] Whisper error:', err);
            if (this._onResultCallback) this._onResultCallback(null);
        }
    }
}