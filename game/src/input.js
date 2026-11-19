// Aruna Bay — input: keyboard state, mouse orbit (drag or pointer lock),
// wheel zoom, and edge-triggered key presses (E, M, P, R, Space).

export function createInput() {
  return {
    keys: {},
    pressed: {}, // edge-triggered: true for one frame after keydown
    mouseDX: 0,
    mouseDY: 0,
    mouseDown: false,
    clicked: false, // left click this frame (shoot)
    dragging: false,
    lastX: 0,
    lastY: 0,
  };
}

export function bindInput(input, canvas, callbacks) {
  window.addEventListener('keydown', (e) => {
    const k = e.key.toLowerCase();
    if ([' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) {
      e.preventDefault();
    }
    if (!input.keys[k]) input.pressed[k] = true;
    input.keys[k] = true;
    if (callbacks.onKey) callbacks.onKey(k, true);
  });
  window.addEventListener('keyup', (e) => {
    const k = e.key.toLowerCase();
    input.keys[k] = false;
    if (callbacks.onKey) callbacks.onKey(k, false);
  });
  canvas.addEventListener('mousedown', (e) => {
    if (e.button === 0) {
      input.mouseDown = true;
      input.dragging = true;
      input.lastX = e.clientX;
      input.lastY = e.clientY;
      input.clicked = true;
    }
  });
  window.addEventListener('mouseup', (e) => {
    if (e.button === 0) {
      input.mouseDown = false;
      input.dragging = false;
    }
  });
  window.addEventListener('mousemove', (e) => {
    if (!input.dragging) return;
    input.mouseDX += e.clientX - input.lastX;
    input.mouseDY += e.clientY - input.lastY;
    input.lastX = e.clientX;
    input.lastY = e.clientY;
  });
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    if (callbacks.onWheel) callbacks.onWheel(e.deltaY);
  }, { passive: false });
  // click on the canvas starts audio (browsers need a gesture)
  canvas.addEventListener('click', () => {
    if (callbacks.onFirstGesture) callbacks.onFirstGesture();
  });
  // arrow keys also drive
  window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp') input.keys['w'] = true;
    if (e.key === 'ArrowDown') input.keys['s'] = true;
    if (e.key === 'ArrowLeft') input.keys['a'] = true;
    if (e.key === 'ArrowRight') input.keys['d'] = true;
  });
  window.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowUp') input.keys['w'] = false;
    if (e.key === 'ArrowDown') input.keys['s'] = false;
    if (e.key === 'ArrowLeft') input.keys['a'] = false;
    if (e.key === 'ArrowRight') input.keys['d'] = false;
  });
}

// True while any movement key is held (used for the "press W" hint).
export function anyMoveKey(input) {
  return !!(input.keys['w'] || input.keys['a'] || input.keys['s'] || input.keys['d']);
}

// Consume one-frame edge state at the end of the frame.
export function endFrameInput(input) {
  input.pressed = {};
  input.mouseDX = 0;
  input.mouseDY = 0;
  input.clicked = false;
}

// Driving input derived from the key state.
export function drivingInput(input) {
  let throttle = 0;
  if (input.keys['w']) throttle += 1;
  if (input.keys['s']) throttle -= 0.7;
  if (input.keys[' ']) throttle = -1; // space = handbrake / reverse brake
  let steer = 0;
  if (input.keys['a']) steer -= 1;
  if (input.keys['d']) steer += 1;
  return { throttle, steer };
}
