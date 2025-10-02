"use client";

import React from "react";
import styles from "../editor/editor.module.css";

export default function AnimationInspector({ selected, onChange }) {
  if (!selected) {
    return (
      <div className={styles.propertiesContent}>
        <div className={styles.propertyGroup}>
          <h4>Inspector</h4>
          <div className={styles.transformInputs}>Select a clip or keyframe</div>
        </div>
      </div>
    );
  }

  if (selected.type === "movement") {
    const { position = [0,0,0], rotation = [0,0,0], scale = [1,1,1], easing = "linear", time = 0 } = selected;
    return (
      <div className={styles.propertiesContent}>
        <div className={styles.propertyGroup}>
          <h4>Movement Keyframe</h4>
          <div className={styles.transformInputs}>
            <Row label="Time (s)">
              <Number value={time} onChange={(v) => onChange({ ...selected, time: v })} />
            </Row>
            <Row label="Position">
              <Number value={position[0]} onChange={(v) => onChange({ ...selected, position: [v, position[1], position[2]] })} />
              <Number value={position[1]} onChange={(v) => onChange({ ...selected, position: [position[0], v, position[2]] })} />
              <Number value={position[2]} onChange={(v) => onChange({ ...selected, position: [position[0], position[1], v] })} />
            </Row>
            <Row label="Rotation">
              <Number value={rotation[0]} onChange={(v) => onChange({ ...selected, rotation: [v, rotation[1], rotation[2]] })} />
              <Number value={rotation[1]} onChange={(v) => onChange({ ...selected, rotation: [rotation[0], v, rotation[2]] })} />
              <Number value={rotation[2]} onChange={(v) => onChange({ ...selected, rotation: [rotation[0], rotation[1], v] })} />
            </Row>
            <Row label="Scale">
              <Number value={scale[0]} onChange={(v) => onChange({ ...selected, scale: [v, scale[1], scale[2]] })} />
              <Number value={scale[1]} onChange={(v) => onChange({ ...selected, scale: [scale[0], v, scale[2]] })} />
              <Number value={scale[2]} onChange={(v) => onChange({ ...selected, scale: [scale[0], scale[1], v] })} />
            </Row>
            <Row label="Easing">
              <select className={styles.snapInput} value={easing} onChange={(e) => onChange({ ...selected, easing: e.target.value })}>
                <option value="linear">linear</option>
                <option value="ease-in">ease-in</option>
                <option value="ease-out">ease-out</option>
                <option value="ease-in-out">ease-in-out</option>
              </select>
            </Row>
          </div>
        </div>
      </div>
    );
  }

  if (selected.type === "audio") {
    const { clip = "", startTime = 0, endTime = 0, volume = 1, loop = false } = selected;
    return (
      <div className={styles.propertiesContent}>
        <div className={styles.propertyGroup}>
          <h4>Audio Clip</h4>
          <div className={styles.transformInputs}>
            <Row label="File">
              <input className={styles.snapInput} value={clip} onChange={(e) => onChange({ ...selected, clip: e.target.value })} />
            </Row>
            <Row label="Start/End (s)">
              <Number value={startTime} onChange={(v) => onChange({ ...selected, startTime: v })} />
              <Number value={endTime} onChange={(v) => onChange({ ...selected, endTime: v })} />
            </Row>
            <Row label="Volume">
              <input type="range" min={0} max={1} step={0.01} value={volume} onChange={(e) => onChange({ ...selected, volume: Number(e.target.value) })} />
              <span>{(volume * 100).toFixed(0)}%</span>
            </Row>
            <Row label="Loop">
              <input type="checkbox" checked={loop} onChange={(e) => onChange({ ...selected, loop: e.target.checked })} />
            </Row>
          </div>
        </div>
      </div>
    );
  }

  if (selected.type === "video") {
    const { opacity = 1, blendMode = "normal", playbackRate = 1 } = selected;
    return (
      <div className={styles.propertiesContent}>
        <div className={styles.propertyGroup}>
          <h4>Video/Overlay</h4>
          <div className={styles.transformInputs}>
            <Row label="Opacity">
              <input type="range" min={0} max={1} step={0.01} value={opacity} onChange={(e) => onChange({ ...selected, opacity: Number(e.target.value) })} />
              <span>{(opacity * 100).toFixed(0)}%</span>
            </Row>
            <Row label="Blend Mode">
              <select className={styles.snapInput} value={blendMode} onChange={(e) => onChange({ ...selected, blendMode: e.target.value })}>
                <option value="normal">normal</option>
                <option value="screen">screen</option>
                <option value="multiply">multiply</option>
                <option value="overlay">overlay</option>
              </select>
            </Row>
            <Row label="Playback Rate">
              <Number value={playbackRate} onChange={(v) => onChange({ ...selected, playbackRate: v })} />
            </Row>
          </div>
        </div>
      </div>
    );
  }

  if (selected.type === "effect") {
    const { effect = "bloom", intensity = 0.5, duration = 1 } = selected;
    return (
      <div className={styles.propertiesContent}>
        <div className={styles.propertyGroup}>
          <h4>Effect</h4>
          <div className={styles.transformInputs}>
            <Row label="Type">
              <select className={styles.snapInput} value={effect} onChange={(e) => onChange({ ...selected, effect: e.target.value })}>
                <option value="bloom">bloom</option>
                <option value="glow">glow</option>
                <option value="shake">shake</option>
              </select>
            </Row>
            <Row label="Intensity">
              <input type="range" min={0} max={1} step={0.01} value={intensity} onChange={(e) => onChange({ ...selected, intensity: Number(e.target.value) })} />
              <span>{(intensity * 100).toFixed(0)}%</span>
            </Row>
            <Row label="Duration (s)">
              <Number value={duration} onChange={(v) => onChange({ ...selected, duration: v })} />
            </Row>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

function Row({ label, children }) {
  return (
    <div className={styles.inputRow}>
      <label>{label}</label>
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>{children}</div>
    </div>
  );
}

function Number({ value, onChange }) {
  return (
    <input
      type="number"
      className={styles.snapInput}
      value={Number(value ?? 0)}
      onChange={(e) => onChange(Number(e.target.value))}
    />
  );
}



