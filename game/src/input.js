// Solara Nights — input.js
// Keyboard + mouse input, tracked per frame. WASD/arrows move, E steals or
// enters a car, mouse aims, click shoots, R reloads, P or Esc pauses.

export function createInput(canvas) {
  const input = {
    keys: new Set(),
    mouseX: 0,
    mouseY: 0,
    mouseDown: false,
    mouseClicked: false,
    pressed: new Set(),
  };

  window.addEventListener('keydown', (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault();
    const k = e.key.toLowerCase();
    if (!input.keys.has(k)) input.pressed.add(k);
    input.keys.add(k);
  });
  window.addEventListener('keyup', (e) => {
    input.keys.delete(e.key.toLowerCase());
  });
  window.addEventListener('blur', () => {
    input.keys.clear();
  });
  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    input.mouseX = e.clientX - rect.left;
    input.mouseY = e.clientY - rect.top;
  });
  canvas.addEventListener('mousedown', (e) => {
    if (e.button === 0) {
      input.mouseDown = true;
      input.mouseClicked = true;
    }
  });
  window.addEventListener('mouseup', () => {
    input.mouseDown = false;
  });
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  return input;
}

export function isDown(input, ...keys) {
  return keys.some((k) => input.keys.has(k));
}

// True while any movement key is held (WASD or arrows).
export function isMoving(input) {
  return isDown(input, 'w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright');
}

export function wasPressed(input, key) {
  return input.pressed.has(key);
}

export function endFrame(input) {
  input.pressed.clear();
  input.mouseClicked = false;
}
