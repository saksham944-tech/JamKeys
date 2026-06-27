// Selecting elements
const instrumentSelect = document.getElementById("instrumentSelect");
const keysContainer = document.getElementById("keysContainer");
const instrumentTitle = document.getElementById("instrumentTitle");
const statusText = document.getElementById("statusText");

const recordBtn = document.getElementById("recordBtn");
const stopRecordBtn = document.getElementById("stopRecordBtn");
const playRecordBtn = document.getElementById("playRecordBtn");
const clearRecordBtn = document.getElementById("clearRecordBtn");

const trackNameInput = document.getElementById("trackNameInput");
const saveRecordingBtn = document.getElementById("saveRecordingBtn");
const recordingsList = document.getElementById("recordingsList");

const songSelect = document.getElementById("songSelect");
const startSongBtn = document.getElementById("startSongBtn");
const resetSongBtn = document.getElementById("resetSongBtn");
const songTitle = document.getElementById("songTitle");
const songInstruction = document.getElementById("songInstruction");
const songProgressBar = document.getElementById("songProgressBar");
const songProgressText = document.getElementById("songProgressText");

// Web Audio setup
const audioContext = new (window.AudioContext || window.webkitAudioContext)();
const pianoBuffers = {};
let pianoSoundsLoaded = false;

// Recording variables
let isRecording = false;
let recordedNotes = [];
let recordingStartTime = 0;

// Piano notes
// Simple note frequencies for harmonium, guitar, flute etc.
const simpleNoteFrequencies = {
  a: 261.63,
  s: 293.66,
  d: 329.63,
  f: 349.23,
  g: 392.00,
  h: 440.00,
  j: 493.88,
  k: 523.25
};

// White piano keys: 14 keys
const pianoWhiteKeys = [
  { key: "`", label: "`", note: "C4", file: "Piano.ff.C4.ogg" },
  { key: "1", label: "1", note: "D4", file: "Piano.ff.D4.ogg" },
  { key: "2", label: "2", note: "E4", file: "Piano.ff.E4.ogg" },
  { key: "3", label: "3", note: "F4", file: "Piano.ff.F4.ogg" },
  { key: "4", label: "4", note: "G4", file: "Piano.ff.G4.ogg" },
  { key: "5", label: "5", note: "A4", file: "Piano.ff.A4.ogg" },
  { key: "6", label: "6", note: "B4", file: "Piano.ff.B4.ogg" },

  { key: "7", label: "7", note: "C5", file: "Piano.ff.C5.ogg" },
  { key: "8", label: "8", note: "D5", file: "Piano.ff.D5.ogg" },
  { key: "9", label: "9", note: "E5", file: "Piano.ff.E5.ogg" },
  { key: "0", label: "0", note: "F5", file: "Piano.ff.F5.ogg" },
  { key: "-", label: "-", note: "G5", file: "Piano.ff.G5.ogg" },
  { key: "=", label: "=", note: "A5", file: "Piano.ff.A5.ogg" },
  { key: "backspace", label: "Backspace", note: "B5", file: "Piano.ff.B5.ogg" }
];

// Black piano keys: 10 keys
const pianoBlackKeys = [
  { key: "tab", label: "Tab", note: "Db4", file: "Piano.ff.Db4.ogg", afterWhiteIndex: 0 },
  { key: "q", label: "Q", note: "Eb4", file: "Piano.ff.Eb4.ogg", afterWhiteIndex: 1 },

  { key: "e", label: "E", note: "Gb4", file: "Piano.ff.Gb4.ogg", afterWhiteIndex: 3 },
  { key: "r", label: "R", note: "Ab4", file: "Piano.ff.Ab4.ogg", afterWhiteIndex: 4 },
  { key: "t", label: "T", note: "Bb4", file: "Piano.ff.Bb4.ogg", afterWhiteIndex: 5 },

  { key: "u", label: "U", note: "Db5", file: "Piano.ff.Db5.ogg", afterWhiteIndex: 7 },
  { key: "i", label: "I", note: "Eb5", file: "Piano.ff.Eb5.ogg", afterWhiteIndex: 8 },

  { key: "p", label: "P", note: "Gb5", file: "Piano.ff.Gb5.ogg", afterWhiteIndex: 10 },
  { key: "[", label: "[", note: "Ab5", file: "Piano.ff.Ab5.ogg", afterWhiteIndex: 11 },
  { key: "]", label: "]", note: "Bb5", file: "Piano.ff.Bb5.ogg", afterWhiteIndex: 12 }
];

// Combine all piano keys into one easy lookup object
const pianoKeyMap = {};

[...pianoWhiteKeys, ...pianoBlackKeys].forEach(function(pianoKey) {
  pianoKeyMap[pianoKey.key] = pianoKey;
});

async function preloadPianoSounds() {
  statusText.textContent = "Loading piano sounds...";

  try {
    const uniqueFiles = [...new Set(
      Object.values(pianoKeyMap).map(function(pianoKey) {
        return pianoKey.file;
      })
    )];

    await Promise.all(
      uniqueFiles.map(async function(file) {
        const response = await fetch(`sounds/piano/${file}`);

        if (!response.ok) {
          throw new Error(`Could not load ${file}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

        pianoBuffers[file] = audioBuffer;
      })
    );

    pianoSoundsLoaded = true;
    statusText.textContent = "Piano sounds loaded. Ready to play!";
  } catch (error) {
    console.error(error);
    statusText.textContent = "Error loading piano sounds. Check file names/folder.";
  }
}

async function preloadHarmoniumSounds() {
  try {
    const uniqueFiles = [...new Set(
      Object.values(harmoniumKeyMap).map(function(harmoniumKey) {
        return harmoniumKey.file;
      })
    )];

    await Promise.all(
      uniqueFiles.map(async function(file) {
        const response = await fetch(`sounds/harmonium/${file}`);

        if (!response.ok) {
          console.warn(`Harmonium file missing: ${file}`);
          return;
        }

        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

        harmoniumBuffers[file] = audioBuffer;
      })
    );

    harmoniumSoundsLoaded = true;
    console.log("Harmonium sounds loaded.");
  } catch (error) {
    console.warn("Harmonium sounds not loaded. Using generated fallback sounds.", error);
  }
}

async function preloadDrumSounds() {
  try {
    const uniqueFiles = [...new Set(
      Object.values(drumPieces).map(function(piece) {
        return piece.file;
      })
    )];

    await Promise.all(
      uniqueFiles.map(async function(file) {
        const response = await fetch(`sounds/drums/${file}`);

        if (!response.ok) {
          console.warn(`Drum file missing: ${file}`);
          return;
        }

        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

        drumBuffers[file] = audioBuffer;
      })
    );

    drumSoundsLoaded = true;
    console.log("Drum sounds loaded.");
  } catch (error) {
    console.warn("Drum sounds not loaded. Using generated fallback sounds.", error);
  }
}

// Drum sounds using generated noise/frequency
const drumPieces = {
  a: {
    name: "Kick",
    file: "kick-01.wav",
    className: "kick-drum drum",
    label: "A"
  },
  s: {
    name: "Snare",
    file: "snare-01.wav",
    className: "snare-drum drum",
    label: "S"
  },
  d: {
    name: "Closed Hi-Hat",
    file: "hihat-closed.wav",
    className: "hihat-closed cymbal",
    label: "D"
  },
  f: {
    name: "Open Hi-Hat",
    file: "hihat-open.wav",
    className: "hihat-open cymbal",
    label: "F"
  },
  g: {
    name: "Rack Tom 1",
    file: "tom-01.wav",
    className: "rack-tom-1 drum",
    label: "G"
  },
  h: {
    name: "Rack Tom 2",
    file: "tom-02.wav",
    className: "rack-tom-2 drum",
    label: "H"
  },
  j: {
    name: "Floor Tom",
    file: "tom-03.wav",
    className: "floor-tom drum",
    label: "J"
  },
  k: {
    name: "Crash",
    file: "crash-01.wav",
    className: "crash-cymbal cymbal",
    label: "K"
  },
  l: {
    name: "Ride",
    file: "ride-01.wav",
    className: "ride-cymbal cymbal",
    label: "L"
  }
};

const drumBuffers = {};
let drumSoundsLoaded = false;

// Tabla sounds
const tablaKeys = {
  a: "Dha",
  s: "Tin",
  d: "Na",
  f: "Ge",
  g: "Dhin",
  h: "Ta",
  j: "Tun",
  k: "Ke"
};

const harmoniumWhiteKeys = [
  { key: "a", label: "A", sargam: "Sa", file: "Sa.wav" },
  { key: "s", label: "S", sargam: "Re", file: "Re.wav" },
  { key: "d", label: "D", sargam: "Ga", file: "Ga.wav" },
  { key: "f", label: "F", sargam: "Ma", file: "Ma.wav" },
  { key: "g", label: "G", sargam: "Pa", file: "Pa.wav" },
  { key: "h", label: "H", sargam: "Dha", file: "Dha.wav" },
  { key: "j", label: "J", sargam: "Ni", file: "Ni.wav" },
  { key: "k", label: "K", sargam: "Sa'", file: "SaHigh.wav" }
];

const harmoniumBlackKeys = [
  { key: "w", label: "W", sargam: "komal Re", file: "komalRe.wav", afterWhiteIndex: 0 },
  { key: "e", label: "E", sargam: "komal Ga", file: "komalGa.wav", afterWhiteIndex: 1 },
  { key: "t", label: "T", sargam: "tivra Ma", file: "tivraMa.wav", afterWhiteIndex: 3 },
  { key: "y", label: "Y", sargam: "komal Dha", file: "komalDha.wav", afterWhiteIndex: 4 },
  { key: "u", label: "U", sargam: "komal Ni", file: "komalNi.wav", afterWhiteIndex: 5 }
];

const harmoniumKeyMap = {};

[...harmoniumWhiteKeys, ...harmoniumBlackKeys].forEach(function(harmoniumKey) {
  harmoniumKeyMap[harmoniumKey.key] = harmoniumKey;
});

const harmoniumBuffers = {};
let harmoniumSoundsLoaded = false;

let activeHarmoniumSource = null;
let activeHarmoniumGain = null;
let activeHarmoniumStopTimer = null;

const songs = {
  twinkle: {
    title: "Twinkle Twinkle Little Star",
    instrument: "piano",
    notes: ["`", "`", "4", "4", "5", "5", "4", "3", "3", "2", "2", "1", "1", "`"]
  },

  birthday: {
    title: "Happy Birthday",
    instrument: "piano",
    notes: ["`", "`", "1", "`", "3", "2", "`", "`", "1", "`", "4", "3"]
  },

  saReGaMa: {
    title: "Sa Re Ga Ma Practice",
    instrument: "harmonium",
    notes: ["a", "s", "d", "f", "g", "h", "j", "k", "k", "j", "h", "g", "f", "d", "s", "a"]
  }
};

let isLearningMode = false;
let currentSong = null;
let currentNoteIndex = 0;

// Scroll to studio
function scrollToStudio() {
  document.getElementById("studio").scrollIntoView({ behavior: "smooth" });
}

// Play piano sound
function playPianoNote(key) {
  const pianoKey = pianoKeyMap[key];

  if (!pianoKey) return;

  const audioBuffer = pianoBuffers[pianoKey.file];

  if (!audioBuffer) {
    statusText.textContent = "Sound still loading...";
    return;
  }

  const source = audioContext.createBufferSource();
  const gainNode = audioContext.createGain();

  source.buffer = audioBuffer;
  gainNode.gain.value = 0.9;

  source.connect(gainNode);
  gainNode.connect(audioContext.destination);

  source.start(0);
}

function renderPiano() {
  keysContainer.className = "piano";
  keysContainer.innerHTML = "";

  pianoWhiteKeys.forEach(function(pianoKey) {
    const whiteKey = document.createElement("div");
    whiteKey.classList.add("white-key", "piano-key");
    whiteKey.dataset.key = pianoKey.key;

    whiteKey.innerHTML = `
      <span class="note-name">${pianoKey.note}</span>
      <span class="keyboard-key">${pianoKey.label}</span>
    `;

    keysContainer.appendChild(whiteKey);
  });

  pianoBlackKeys.forEach(function(pianoKey) {
    const blackKey = document.createElement("div");
    blackKey.classList.add("black-key", "piano-key");
    blackKey.dataset.key = pianoKey.key;

    const leftPosition = ((pianoKey.afterWhiteIndex + 1) * 64) - 21;
    blackKey.style.setProperty("--left", `${leftPosition}px`);

    blackKey.innerHTML = `
      <span>${pianoKey.note}</span>
      <small>${pianoKey.label}</small>
    `;

    keysContainer.appendChild(blackKey);
  });
}

function renderHarmonium() {
  keysContainer.className = "harmonium";

  const holes = Array.from({ length: 26 }, function() {
    return `<div class="reed-hole"></div>`;
  }).join("");

  keysContainer.innerHTML = `
    <div class="harmonium-top-panel">
      <div class="harmonium-grill">
        ${holes}
      </div>
    </div>

    <div class="harmonium-keyboard"></div>

    <div class="harmonium-bellows"></div>

    <div class="harmonium-body-panel">
      <div class="harmonium-knobs">
        <div class="harmonium-knob"></div>
        <div class="harmonium-knob"></div>
        <div class="harmonium-knob"></div>
        <div class="harmonium-knob"></div>
        <div class="harmonium-knob"></div>
        <div class="harmonium-knob"></div>
        <div class="harmonium-knob"></div>
        <div class="harmonium-knob"></div>
        <div class="harmonium-knob"></div>
      </div>

      <div class="harmonium-brand">JAMKEYS</div>
    </div>

    <div class="harmonium-thread"></div>
  `;

  const keyboard = keysContainer.querySelector(".harmonium-keyboard");

  harmoniumWhiteKeys.forEach(function(harmoniumKey) {
    const whiteKey = document.createElement("button");
    whiteKey.classList.add("harmonium-key", "harmonium-white");
    whiteKey.dataset.key = harmoniumKey.key;

    whiteKey.innerHTML = `
      <span class="sargam-name">${harmoniumKey.sargam}</span>
      <span class="keyboard-name">${harmoniumKey.label}</span>
    `;

    keyboard.appendChild(whiteKey);
  });

  harmoniumBlackKeys.forEach(function(harmoniumKey) {
    const blackKey = document.createElement("button");
    blackKey.classList.add("harmonium-key", "harmonium-black");
    blackKey.dataset.key = harmoniumKey.key;

    const leftPosition = ((harmoniumKey.afterWhiteIndex + 1) * 81.25) - 24;
    blackKey.style.setProperty("--left", `${leftPosition}px`);

    blackKey.innerHTML = `
      <span class="sargam-name">${harmoniumKey.sargam}</span>
      <span class="keyboard-name">${harmoniumKey.label}</span>
    `;

    keyboard.appendChild(blackKey);
  });
}

function renderDrums() {
  keysContainer.className = "drum-kit";

  keysContainer.innerHTML = `
    <div class="stand hihat-stand"></div>
    <div class="stand crash-stand"></div>
    <div class="stand ride-stand"></div>
    <div class="stand snare-stand"></div>
    <div class="stand floor-stand"></div>

    <button class="drum-piece ${drumPieces.f.className}" data-key="f">
      <div class="drum-label">Open Hat<br><span>F</span></div>
    </button>

    <button class="drum-piece ${drumPieces.d.className}" data-key="d">
      <div class="drum-label">Closed Hat<br><span>D</span></div>
    </button>

    <button class="drum-piece ${drumPieces.k.className}" data-key="k">
      <div class="drum-label">Crash<br><span>K</span></div>
    </button>

    <button class="drum-piece ${drumPieces.l.className}" data-key="l">
      <div class="drum-label">Ride<br><span>L</span></div>
    </button>

    <button class="drum-piece ${drumPieces.g.className}" data-key="g">
      <div class="drum-label">Tom 1<br><span>G</span></div>
    </button>

    <button class="drum-piece ${drumPieces.h.className}" data-key="h">
      <div class="drum-label">Tom 2<br><span>H</span></div>
    </button>

    <button class="drum-piece ${drumPieces.s.className}" data-key="s">
      <div class="drum-label">Snare<br><span>S</span></div>
    </button>

    <button class="drum-piece ${drumPieces.j.className}" data-key="j">
      <div class="drum-label">Floor Tom<br><span>J</span></div>
    </button>

    <button class="drum-piece ${drumPieces.a.className}" data-key="a">
      <div class="drum-label">Kick<br><span>A</span></div>
    </button>

    <div class="kick-pedal"></div>
  `;
}

function playRealDrumSound(key) {
  const drumPiece = drumPieces[key];

  if (!drumPiece) return;

  const audioBuffer = drumBuffers[drumPiece.file];

  // If real file is missing, use old generated drum sound
  if (!audioBuffer) {
    playDrumSound(drumPiece.name);
    return;
  }

  const source = audioContext.createBufferSource();
  const gainNode = audioContext.createGain();

  source.buffer = audioBuffer;
  gainNode.gain.value = 0.95;

  source.connect(gainNode);
  gainNode.connect(audioContext.destination);

  source.start(0);
}

// Play drum sound
function playDrumSound(type) {
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  if (type === "Kick") {
    oscillator.frequency.setValueAtTime(120, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(40, audioContext.currentTime + 0.2);
    gainNode.gain.setValueAtTime(0.8, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.3);
  } else if (type === "Snare") {
    oscillator.frequency.setValueAtTime(220, audioContext.currentTime);
    gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.2);
  } else if (type === "Hi-Hat") {
    oscillator.frequency.setValueAtTime(8000, audioContext.currentTime);
    gainNode.gain.setValueAtTime(0.25, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.08);
  } else {
    oscillator.frequency.setValueAtTime(300, audioContext.currentTime);
    gainNode.gain.setValueAtTime(0.4, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.2);
  }

  oscillator.type = "square";

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.start();
  oscillator.stop(audioContext.currentTime + 0.3);
}

// Play harmonium sound
function playHarmoniumNote(frequency) {
  const oscillator1 = audioContext.createOscillator();
  const oscillator2 = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator1.type = "sawtooth";
  oscillator2.type = "square";

  oscillator1.frequency.setValueAtTime(frequency, audioContext.currentTime);
  oscillator2.frequency.setValueAtTime(frequency * 1.01, audioContext.currentTime);

  gainNode.gain.setValueAtTime(0.25, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 1.2);

  oscillator1.connect(gainNode);
  oscillator2.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator1.start();
  oscillator2.start();

  oscillator1.stop(audioContext.currentTime + 1.2);
  oscillator2.stop(audioContext.currentTime + 1.2);
}

function stopActiveHarmoniumNote() {
  if (activeHarmoniumStopTimer) {
    clearTimeout(activeHarmoniumStopTimer);
    activeHarmoniumStopTimer = null;
  }

  if (activeHarmoniumSource && activeHarmoniumGain) {
    try {
      const now = audioContext.currentTime;

      // tiny fade out to avoid click sound
      activeHarmoniumGain.gain.cancelScheduledValues(now);
      activeHarmoniumGain.gain.setValueAtTime(activeHarmoniumGain.gain.value, now);
      activeHarmoniumGain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

      activeHarmoniumSource.stop(now + 0.04);
    } catch (error) {
      // Ignore if source already stopped
    }
  }

  activeHarmoniumSource = null;
  activeHarmoniumGain = null;
}

function playRealHarmoniumSound(key) {
  const harmoniumKey = harmoniumKeyMap[key];

  if (!harmoniumKey) return;

  // Stop previous harmonium note first
  stopActiveHarmoniumNote();

  const audioBuffer = harmoniumBuffers[harmoniumKey.file];

  // Fallback if real file is missing
  if (!audioBuffer) {
    const frequency = simpleNoteFrequencies[key];

    if (frequency) {
      playHarmoniumNote(frequency);
    }

    return;
  }

  const source = audioContext.createBufferSource();
  const gainNode = audioContext.createGain();

  source.buffer = audioBuffer;

  const now = audioContext.currentTime;

  // quick attack
  gainNode.gain.setValueAtTime(0.001, now);
  gainNode.gain.exponentialRampToValueAtTime(0.95, now + 0.02);

  source.connect(gainNode);
  gainNode.connect(audioContext.destination);

  source.start(now);

  activeHarmoniumSource = source;
  activeHarmoniumGain = gainNode;

  // Maximum note length = 3 seconds
  activeHarmoniumStopTimer = setTimeout(function() {
    stopActiveHarmoniumNote();
  }, 3000);
}

// Play guitar sound
function playGuitarNote(frequency) {
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.type = "triangle";
  oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);

  gainNode.gain.setValueAtTime(0.6, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.9);

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.start();
  oscillator.stop(audioContext.currentTime + 0.9);
}

// Play tabla sound
function playTablaSound(type) {
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.type = "sine";

  if (type === "Dha") {
    oscillator.frequency.setValueAtTime(160, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(80, audioContext.currentTime + 0.25);
    gainNode.gain.setValueAtTime(0.8, audioContext.currentTime);
  } else if (type === "Tin") {
    oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
    gainNode.gain.setValueAtTime(0.45, audioContext.currentTime);
  } else if (type === "Na") {
    oscillator.frequency.setValueAtTime(420, audioContext.currentTime);
    gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
  } else if (type === "Ge") {
    oscillator.frequency.setValueAtTime(110, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(60, audioContext.currentTime + 0.3);
    gainNode.gain.setValueAtTime(0.75, audioContext.currentTime);
  } else {
    oscillator.frequency.setValueAtTime(300, audioContext.currentTime);
    gainNode.gain.setValueAtTime(0.4, audioContext.currentTime);
  }

  gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.35);

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.start();
  oscillator.stop(audioContext.currentTime + 0.35);
}

// Play flute sound
function playFluteNote(frequency) {
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);

  gainNode.gain.setValueAtTime(0.05, audioContext.currentTime);
  gainNode.gain.linearRampToValueAtTime(0.35, audioContext.currentTime + 0.08);
  gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 1.1);

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.start();
  oscillator.stop(audioContext.currentTime + 1.1);
}

// Main play function
function playKey(key) {
  const selectedInstrument = instrumentSelect.value;

  if (selectedInstrument === "piano") {
    const pianoKey = pianoKeyMap[key];

    if (!pianoKey) return;

    playPianoNote(key);
    statusText.textContent = `Playing Piano: ${pianoKey.note} (${pianoKey.label})`;
  }

  if (selectedInstrument === "drums") {
    const drumPiece = drumPieces[key];

    if (!drumPiece) return;

    playRealDrumSound(key);
    statusText.textContent = `Playing Drum: ${drumPiece.name}`;
  }

  if (selectedInstrument === "harmonium") {
    const harmoniumKey = harmoniumKeyMap[key];

    if (!harmoniumKey) return;

    playRealHarmoniumSound(key);
    statusText.textContent = `Playing Harmonium: ${harmoniumKey.sargam} (${harmoniumKey.label})`;
  }

  if (selectedInstrument === "guitar") {
    const frequency = simpleNoteFrequencies[key];

    if (!frequency) return;

    playGuitarNote(frequency);
    statusText.textContent = `Playing Guitar Note: ${key.toUpperCase()}`;
  }

  if (selectedInstrument === "tabla") {
    const tablaType = tablaKeys[key];

    if (!tablaType) return;

    playTablaSound(tablaType);
    statusText.textContent = `Playing Tabla: ${tablaType}`;
  }

  if (selectedInstrument === "flute") {
    const frequency = simpleNoteFrequencies[key];

    if (!frequency) return;

    playFluteNote(frequency);
    statusText.textContent = `Playing Flute Note: ${key.toUpperCase()}`;
  }

  animateKey(key);

  if (isRecording) {
    recordedNotes.push({
      key: key,
      instrument: selectedInstrument,
      time: Date.now() - recordingStartTime
    });
  }
}

// Animate pressed key
function animateKey(key) {
  const button = document.querySelector(`[data-key="${key}"]`);

  if (!button) return;

  button.classList.add("active");

  if (instrumentSelect.value === "harmonium") {
    const bellows = document.querySelector(".harmonium-bellows");

    if (bellows) {
      bellows.classList.add("pump");

      setTimeout(() => {
        bellows.classList.remove("pump");
      }, 180);
    }
  }

  setTimeout(() => {
    button.classList.remove("active");
  }, 180);
}

// Keyboard press event
document.addEventListener("keydown", function(event) {
  let key = event.key.toLowerCase();

  // Do not play music while typing track name
  if (document.activeElement === trackNameInput) {
    return;
  }

  // Remove focus from dropdowns so letters do not auto-select options
  if (document.activeElement === instrumentSelect || document.activeElement === songSelect) {
    document.activeElement.blur();
  }

  if (isPlayableKey(key)) {
    event.preventDefault();

    if (audioContext.state === "suspended") {
      audioContext.resume();
    }

    playKey(key);

    if (isLearningMode) {
      checkLearningKey(key);
    }
  }
});

function isPlayableKey(key) {
  const selectedInstrument = instrumentSelect.value;

  if (selectedInstrument === "piano") {
    return Boolean(pianoKeyMap[key]);
  }

  if (selectedInstrument === "drums") {
    return Boolean(drumPieces[key]);
  }

  if (selectedInstrument === "tabla") {
    return Boolean(tablaKeys[key]);
  }

  if (selectedInstrument === "harmonium") {
    return Boolean(harmoniumKeyMap[key]);
  }

  if (
    selectedInstrument === "guitar" ||
    selectedInstrument === "flute"
  ) {
    return Boolean(simpleNoteFrequencies[key]);
  }

  return false;
}

// Mouse click event
keysContainer.addEventListener("click", function(event) {
  const keyElement = event.target.closest("[data-key]");

  if (!keyElement) return;

  if (audioContext.state === "suspended") {
    audioContext.resume();
  }

  const key = keyElement.dataset.key;
  playKey(key);
});

// Change instrument UI
instrumentSelect.addEventListener("change", function() {
  const selectedInstrument = instrumentSelect.value;
  stopActiveHarmoniumNote();

  instrumentSelect.blur();

  if (selectedInstrument === "piano") {
    instrumentTitle.textContent = "Piano Mode";
    renderPiano();
  }

  if (selectedInstrument === "drums") {
    instrumentTitle.textContent = "Drums Mode";
    renderDrums();
  }

  if (selectedInstrument === "harmonium") {
    instrumentTitle.textContent = "Harmonium Mode";
    renderHarmonium();
  }

  if (selectedInstrument === "guitar") {
    instrumentTitle.textContent = "Guitar Mode";
    keysContainer.className = "keys";
    keysContainer.innerHTML = `
      <button class="music-key" data-key="a">A<br><span>E</span></button>
      <button class="music-key" data-key="s">S<br><span>A</span></button>
      <button class="music-key" data-key="d">D<br><span>D</span></button>
      <button class="music-key" data-key="f">F<br><span>G</span></button>
      <button class="music-key" data-key="g">G<br><span>B</span></button>
      <button class="music-key" data-key="h">H<br><span>E+</span></button>
      <button class="music-key" data-key="j">J<br><span>Strum</span></button>
      <button class="music-key" data-key="k">K<br><span>Pick</span></button>
    `;
  }

  if (selectedInstrument === "tabla") {
    instrumentTitle.textContent = "Tabla Mode";
    keysContainer.className = "keys";
    keysContainer.innerHTML = `
      <button class="music-key" data-key="a">A<br><span>Dha</span></button>
      <button class="music-key" data-key="s">S<br><span>Tin</span></button>
      <button class="music-key" data-key="d">D<br><span>Na</span></button>
      <button class="music-key" data-key="f">F<br><span>Ge</span></button>
      <button class="music-key" data-key="g">G<br><span>Dhin</span></button>
      <button class="music-key" data-key="h">H<br><span>Ta</span></button>
      <button class="music-key" data-key="j">J<br><span>Tun</span></button>
      <button class="music-key" data-key="k">K<br><span>Ke</span></button>
    `;
  }

  if (selectedInstrument === "flute") {
    instrumentTitle.textContent = "Flute Mode";
    keysContainer.className = "keys";
    keysContainer.innerHTML = `
      <button class="music-key" data-key="a">A<br><span>Sa</span></button>
      <button class="music-key" data-key="s">S<br><span>Re</span></button>
      <button class="music-key" data-key="d">D<br><span>Ga</span></button>
      <button class="music-key" data-key="f">F<br><span>Ma</span></button>
      <button class="music-key" data-key="g">G<br><span>Pa</span></button>
      <button class="music-key" data-key="h">H<br><span>Dha</span></button>
      <button class="music-key" data-key="j">J<br><span>Ni</span></button>
      <button class="music-key" data-key="k">K<br><span>Sa+</span></button>
    `;
  }

  statusText.textContent = `Switched to ${selectedInstrument} mode.`;
});

// Start recording
recordBtn.addEventListener("click", function() {
  recordedNotes = [];
  isRecording = true;
  recordingStartTime = Date.now();
  statusText.textContent = "Recording started...";
});

// Stop recording
stopRecordBtn.addEventListener("click", function() {
  isRecording = false;
  statusText.textContent = `Recording stopped. Notes recorded: ${recordedNotes.length}`;
});

// Play recording
playRecordBtn.addEventListener("click", function() {
  if (recordedNotes.length === 0) {
    statusText.textContent = "No recording found.";
    return;
  }

  statusText.textContent = "Playing recording...";

  recordedNotes.forEach(function(note) {
    setTimeout(function() {
      instrumentSelect.value = note.instrument;
      instrumentSelect.dispatchEvent(new Event("change"));
      playKey(note.key);
    }, note.time);
  });
});

// Clear recording
clearRecordBtn.addEventListener("click", function() {
  recordedNotes = [];
  statusText.textContent = "Recording cleared.";
});

// Get saved recordings from localStorage
function getSavedRecordings() {
  const recordings = localStorage.getItem("jamkeysRecordings");

  if (recordings) {
    return JSON.parse(recordings);
  }

  return [];
}

// Save recordings to localStorage
function saveRecordingsToStorage(recordings) {
  localStorage.setItem("jamkeysRecordings", JSON.stringify(recordings));
}

// Save current recording
saveRecordingBtn.addEventListener("click", function() {
  const trackName = trackNameInput.value.trim();

  if (recordedNotes.length === 0) {
    statusText.textContent = "Record something first before saving.";
    return;
  }

  if (trackName === "") {
    statusText.textContent = "Please enter a track name.";
    return;
  }

  const savedRecordings = getSavedRecordings();

  const newRecording = {
    id: Date.now(),
    name: trackName,
    notes: recordedNotes,
    createdAt: new Date().toLocaleString(),
    totalNotes: recordedNotes.length
  };

  savedRecordings.push(newRecording);
  saveRecordingsToStorage(savedRecordings);

  trackNameInput.value = "";
  statusText.textContent = `"${trackName}" saved successfully.`;

  displaySavedRecordings();
});

// Display saved recordings on page
function displaySavedRecordings() {
  const savedRecordings = getSavedRecordings();

  recordingsList.innerHTML = "";

  if (savedRecordings.length === 0) {
    recordingsList.innerHTML = `
      <p>No recordings saved yet. Record your first track!</p>
    `;
    return;
  }

  savedRecordings.forEach(function(recording) {
    const recordingCard = document.createElement("div");
    recordingCard.classList.add("recording-card");

    recordingCard.innerHTML = `
      <div class="recording-info">
        <h3>${recording.name}</h3>
        <p>Created: ${recording.createdAt}</p>
        <p>Total Notes: ${recording.totalNotes}</p>
      </div>

      <div class="recording-actions">
        <button onclick="playSavedRecording(${recording.id})">Play</button>
        <button class="delete-btn" onclick="deleteSavedRecording(${recording.id})">Delete</button>
      </div>
    `;

    recordingsList.appendChild(recordingCard);
  });
}

// Play saved recording
function playSavedRecording(recordingId) {
  const savedRecordings = getSavedRecordings();

  const selectedRecording = savedRecordings.find(function(recording) {
    return recording.id === recordingId;
  });

  if (!selectedRecording) {
    statusText.textContent = "Recording not found.";
    return;
  }

  statusText.textContent = `Playing saved track: ${selectedRecording.name}`;

  selectedRecording.notes.forEach(function(note) {
    setTimeout(function() {
      instrumentSelect.value = note.instrument;
      instrumentSelect.dispatchEvent(new Event("change"));
      playKey(note.key);
    }, note.time);
  });
}

// Delete saved recording
function deleteSavedRecording(recordingId) {
  let savedRecordings = getSavedRecordings();

  savedRecordings = savedRecordings.filter(function(recording) {
    return recording.id !== recordingId;
  });

  saveRecordingsToStorage(savedRecordings);
  displaySavedRecordings();

  statusText.textContent = "Recording deleted.";
}

// Load saved recordings when page opens
displaySavedRecordings();

function startSelectedSong() {
  const selectedSongKey = songSelect.value;

  if (selectedSongKey === "") {
    songInstruction.textContent = "Please choose a song first.";
    return;
  }

  currentSong = songs[selectedSongKey];
  currentNoteIndex = 0;
  isLearningMode = true;

  instrumentSelect.value = currentSong.instrument;
  instrumentSelect.dispatchEvent(new Event("change"));

  songTitle.textContent = currentSong.title;
  updateSongInstruction();

  statusText.textContent = `Learning mode started: ${currentSong.title}`;
}

function updateSongInstruction() {
  if (!currentSong) return;

  const nextKey = currentSong.notes[currentNoteIndex];

  songInstruction.classList.remove("correct-note", "wrong-note");
  songInstruction.textContent = `Press: ${nextKey.toUpperCase()}`;

  const progressPercent = (currentNoteIndex / currentSong.notes.length) * 100;
  songProgressBar.style.width = `${progressPercent}%`;
  songProgressText.textContent = `Progress: ${currentNoteIndex} / ${currentSong.notes.length}`;
}

function checkLearningKey(pressedKey) {
  if (!isLearningMode || !currentSong) return;

  const correctKey = currentSong.notes[currentNoteIndex];

  if (pressedKey === correctKey) {
    songInstruction.classList.remove("wrong-note");
    songInstruction.classList.add("correct-note");
    songInstruction.textContent = `Correct! ${pressedKey.toUpperCase()}`;

    currentNoteIndex++;

    if (currentNoteIndex >= currentSong.notes.length) {
      songProgressBar.style.width = "100%";
      songProgressText.textContent = `Progress: ${currentSong.notes.length} / ${currentSong.notes.length}`;
      songInstruction.textContent = "Song completed! Great job.";
      isLearningMode = false;
      currentSong = null;
      statusText.textContent = "Song completed successfully.";
      return;
    }

    setTimeout(updateSongInstruction, 250);
  } else {
    songInstruction.classList.remove("correct-note");
    songInstruction.classList.add("wrong-note");
    songInstruction.textContent = `Wrong key! Press: ${correctKey.toUpperCase()}`;
  }
}

function resetSongMode() {
  isLearningMode = false;
  currentSong = null;
  currentNoteIndex = 0;

  songTitle.textContent = "No song selected";
  songInstruction.classList.remove("correct-note", "wrong-note");
  songInstruction.textContent = "Select a song to begin.";
  songProgressBar.style.width = "0%";
  songProgressText.textContent = "Progress: 0 / 0";

  statusText.textContent = "Learning mode reset.";
}

startSongBtn.addEventListener("click", startSelectedSong);
resetSongBtn.addEventListener("click", resetSongMode);
renderPiano();
preloadPianoSounds();
preloadDrumSounds();
preloadHarmoniumSounds()