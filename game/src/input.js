// Keyboard and mouse input. Held keys are a live set; one-shot presses are
// queued as bit flags and taken once by the loop, so a press between two frames
// is never lost and never counted twice.
export const ACTION_CONFIRM = 1;
export const ACTION_PAUSE = 2;
export const ACTION_ENTER = 4;
export const ACTION_WHEEL = 8;
export const ACTION_RADIO = 16;
export const ACTION_GARAGE = 32;
export const ACTION_JOB = 64;
export const ACTION_WEAPON1 = 128;
export const ACTION_WEAPON2 = 256;
export const ACTION_WEAPON3 = 512;

const CONFIRM = new Set(['Space', 'Enter']);
const PAUSE = new Set(['KeyP', 'Escape']);
const ENTER = new Set(['KeyE']);
const WHEEL = new Set(['Tab']);
const RADIO = new Set(['KeyQ']);
const GARAGE = new Set(['KeyG']);
const JOB = new Set(['KeyJ']);

export function createInput(canvas) {
  const keys = new Set();
  let actions = 0;
  let mouseDown = false;
  let mouseX = 0;
  let mouseY = 0;
  let dragDX = 0;
  let dragDY = 0;
  let dragging = false;

  window.addEventListener('keydown', (event) => {
    if (event.code === 'Tab') event.preventDefault();
    if (event.repeat) return;
    keys.add(event.code);
    if (CONFIRM.has(event.code)) actions |= ACTION_CONFIRM;
    else if (PAUSE.has(event.code)) actions |= ACTION_PAUSE;
    else if (ENTER.has(event.code)) actions |= ACTION_ENTER;
    else if (WHEEL.has(event.code)) actions |= ACTION_WHEEL;
    else if (RADIO.has(event.code)) actions |= ACTION_RADIO;
    else if (GARAGE.has(event.code)) actions |= ACTION_GARAGE;
    else if (JOB.has(event.code)) actions |= ACTION_JOB;
    else if (event.code === 'Digit1') actions |= ACTION_WEAPON1;
    else if (event.code === 'Digit2') actions |= ACTION_WEAPON2;
    else if (event.code === 'Digit3') actions |= ACTION_WEAPON3;
  });
  window.addEventListener('keyup', (event) => { keys.delete(event.code); });
  window.addEventListener('blur', () => { keys.clear(); mouseDown = false; dragging = false; });

  canvas.addEventListener('pointerdown', (event) => {
    mouseDown = true; dragging = true; mouseX = event.clientX; mouseY = event.clientY;
  });
  window.addEventListener('pointerup', () => { mouseDown = false; dragging = false; });
  window.addEventListener('pointermove', (event) => {
    if (!dragging) return;
    dragDX += event.clientX - mouseX;
    dragDY += event.clientY - mouseY;
    mouseX = event.clientX; mouseY = event.clientY;
  });

  return {
    held(code) { return keys.has(code); },
    forward() { return (keys.has('KeyW') || keys.has('ArrowUp') ? 1 : 0) - (keys.has('KeyS') || keys.has('ArrowDown') ? 1 : 0); },
    strafe() { return (keys.has('KeyD') || keys.has('ArrowRight') ? 1 : 0) - (keys.has('KeyA') || keys.has('ArrowLeft') ? 1 : 0); },
    sprint() { return keys.has('ShiftLeft') || keys.has('ShiftRight'); },
    nitro() { return keys.has('ShiftLeft') || keys.has('ShiftRight'); },
    brake() { return keys.has('Space'); },
    shooting() { return mouseDown; },
    takeDrag() { const d = { dx: dragDX, dy: dragDY }; dragDX = 0; dragDY = 0; return d; },
    takeActions() { const taken = actions; actions = 0; return taken; },
    pressAction(flag) { actions |= flag; },
  };
}

// Synthetic key presses for the deterministic shot scenes and play-tests:
// lets a script drive the game without a real keyboard.
export function pressKey(input, code) {
  window.dispatchEvent(new window.KeyboardEvent('keydown', { code, bubbles: true }));
  window.dispatchEvent(new window.KeyboardEvent('keyup', { code, bubbles: true }));
}
