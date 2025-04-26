const canvas = document.getElementById('whiteboard');
const ctx = canvas.getContext('2d');
const pencilBtn = document.getElementById('pencil');
const eraserBtn = document.getElementById('eraser');
const undoBtn = document.getElementById('undo');
const redoBtn = document.getElementById('redo');
const colorPicker = document.getElementById('colorPicker');
const brushSize = document.getElementById('brushSize');
const brushStyle = document.getElementById('brushStyle');
const clearBtn = document.getElementById('clear');
const saveBtn = document.getElementById('save');

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
    drawLine(data.x0, data.y0, data.x1, data.y1, data.color, data.lineWidth, data.style);
  }
};

// Drawing functions
function drawLine(x0, y0, x1, y1, color, width, style) {
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  
  // Set line style
  switch(style) {
    case 'dashed':
      ctx.setLineDash([5, 5]);
      break;
    case 'dotted':
      ctx.setLineDash([2, 2]);
      break;
    default:
      ctx.setLineDash([]);
  }
  
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
    lineWidth: lineWidth,
    style: brushStyle.value
  }));
});

canvas.addEventListener('mouseup', () => {
  isDrawing = false;
});

// Touch event handlers
canvas.addEventListener('touchstart', (e) => {
  e.preventDefault();
  isDrawing = true;
  const rect = canvas.getBoundingClientRect();
  const touch = e.touches[0];
  const x = touch.clientX - rect.left;
  const y = touch.clientY - rect.top;
  ctx.beginPath();
  ctx.moveTo(x, y);
  undoStack.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
  redoStack = [];
});

canvas.addEventListener('touchmove', (e) => {
  e.preventDefault();
  if (!isDrawing) return;
  const rect = canvas.getBoundingClientRect();
  const touch = e.touches[0];
  const x = touch.clientX - rect.left;
  const y = touch.clientY - rect.top;
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
    lineWidth: lineWidth,
    style: brushStyle.value
  }));
});

canvas.addEventListener('touchend', (e) => {
  e.preventDefault();
  isDrawing = false;
});

// Tool selection
pencilBtn.addEventListener('click', () => {
  currentTool = 'pencil';
  lineWidth = parseInt(brushSize.value);
});

eraserBtn.addEventListener('click', () => {
  currentTool = 'eraser';
  lineWidth = 20;
});

colorPicker.addEventListener('change', (e) => {
  currentColor = e.target.value;
});

brushSize.addEventListener('change', (e) => {
  lineWidth = parseInt(e.target.value);
});

// Clear canvas
clearBtn.addEventListener('click', () => {
  undoStack.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  redoStack = [];
});

// Save drawing
saveBtn.addEventListener('click', () => {
  const link = document.createElement('a');
  link.download = 'whiteboard-drawing.png';
  link.href = canvas.toDataURL();
  link.click();
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

// Resize canvas to fit screen
function resizeCanvas() {
  const container = canvas.parentElement;
  const containerWidth = container.clientWidth;
  const containerHeight = window.innerHeight - 200; // Account for toolbar and header
  
  canvas.width = containerWidth;
  canvas.height = containerHeight;
  
  // Redraw the last state after resize
  if (undoStack.length > 0) {
    ctx.putImageData(undoStack[undoStack.length - 1], 0, 0);
  }
}

// Initial resize and window resize handler
resizeCanvas();
window.addEventListener('resize', resizeCanvas); 