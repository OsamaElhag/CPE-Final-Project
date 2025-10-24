import {Component, Property} from '@wonderlandengine/api';

/**
 * Talk_On_Touch
 */
export class TalkOnTouch extends Component {
    static TypeName = 'Talk_On_Touch';
    /* Properties that are configurable in the editor */
    static Properties = {
        param: { type: WL.Type.Float, default: 1.0 },
        audioObj: { type: WL.Type.Object, default: null },
        controllerGroupId: { type: WL.Type.Int, default: 4 },
        cooldownMs: { type: WL.Type.Int, default: 800 },
        playOnce: { type: WL.Type.Bool, default: false },
    };

    start() {
    this.audio = (this.audioObj || this.object).getComponent('audio-source');
    this.col = this.object.getComponent('collision');

    if (!this.col) console.warn('[Talk_On_Touch] NPC needs a Collision component');
    if (!this.audio) console.warn('[Talk_On_Touch] Missing audio-source on NPC');

    this._lastPlay = -Infinity;
    this._playedOnce = false;
    this._controllerMask = (1 << (this.controllerGroupId | 0));
    }

    update(dt) {
    if (!this.col || !this.audio) return;
    if (this.playOnce && this._playedOnce) return;

    const now = performance.now();
    if (now - this._lastPlay < this.cooldownMs) return;

    const overlaps = this.col.queryOverlaps();
    const touchingController = overlaps.some((o) => (o.group & this._controllerMask) !== 0);

    if (touchingController) {
      if (this.audio.isPlaying) this.audio.stop();
      this.audio.play();
      this._lastPlay = now;
      if (this.playOnce) this._playedOnce = true;
    }
}}
