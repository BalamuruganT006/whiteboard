const canvas = document.getElementById('whiteboard');
const ctx = canvas.getContext('2d');
const pencilBtn = document.getElementById('pencil');
const eraserBtn = document.getElementById('eraser');
const undoBtn = document.getElementById('undo');
const redoBtn = document.getElementById('redo');
const colorPicker = document.getElementById('colorPicker');

let isDrawing = false;
let currentTool = 'pencil';
let currentColor = '#000000';
let lineWidth = 2;
let undoStack = [];
let redoStack = [];

// WebSocket connection (replace with your server URL)
const socket = new WebSocket('ws://localhost:8080');

socket.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type === 'draw') {
    drawLine(data.x0, data.y0, data.x1, data.y1, data.color, data.lineWidth);
  }
};

// Drawing functions
function drawLine(x0, y0, x1, y1, color, width) {
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.stroke();
}

// Event listeners for drawing
canvas.addEventListener('mousedown', (e) => {
  isDrawing = true;
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  ctx.beginPath();
  ctx.moveTo(x, y);
  undoStack.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
  redoStack = [];
});

canvas.addEventListener('mousemove', (e) => {
  if (!isDrawing) return;
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  ctx.lineTo(x, y);
  ctx.strokeStyle = currentTool === 'eraser' ? 'white' : currentColor;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';
  ctx.stroke();
  socket.send(JSON.stringify({
    type: 'draw',
    x0: x,
    y0: y,
    x1: x,
    y1: y,
    color: currentTool === 'eraser' ? 'white' : currentColor,
    lineWidth: lineWidth
  }));
});

canvas.addEventListener('mouseup', () => {
  isDrawing = false;
});

// Tool selection
pencilBtn.addEventListener('click', () => {
  currentTool = 'pencil';
  lineWidth = 2;
});

eraserBtn.addEventListener('click', () => {
  currentTool = 'eraser';
  lineWidth = 20;
});

colorPicker.addEventListener('change', (e) => {
  currentColor = e.target.value;
});

// Undo/Redo
undoBtn.addEventListener('click', () => {
  if (undoStack.length > 0) {
    redoStack.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
    ctx.putImageData(undoStack.pop(), 0, 0);
  }
});

redoBtn.addEventListener('click', () => {
  if (redoStack.length > 0) {
    undoStack.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
    ctx.putImageData(redoStack.pop(), 0, 0);
  }
}); 