// External web references for design & interaction inspiration.
// https://seunghyuk.com/ is referenced for canvas particle visual aesthetic.
// https://kaiblamey.com/?ref=siteinspire is referenced for hover-swap text interaction.
// This portfolio site demonstrates hovering elements to reveal alternate content.
// I adapted this idea for my detail screen so users can hover over the image to switch between definition and coping practice text.

// Get canvas and 2D drawing context. Syntax learned from W3Schools Canvas tutorials
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
let width, height, cx, cy;

// I chose mental health as my theme because it is an easy concept to communicate visually.
// This assignment required one core interaction, and I selected hover as my primary action.
// The whole prototype is designed for desktop browsers, as hover behaviour does not work well on touch mobile devices.
// Three scene states: start welcome screen / mood tree overview / single mood detail view
// I chose multiple states instead of one static screen to build a progressive browsing flow after hover
let sceneState = "start";
let activeMood = null;
let startIconScale = 1;
let iconBounceTimer = 0;
let mouseOnIcon = false;
let hoverTimer = 0;

// 400ms hover delay added after testing. Stops accidental triggers when cursor brushes past the button
// I tested shorter and longer timings, and 400ms felt balanced without making the interaction feel laggy.
const HOVER_DELAY = 400;
// Store button coordinates for later hover collision detection
let backBtn = { x: 70, y: 0, w: 80, h: 32, hovered: false };
let detailBackBtn = { x: 40, y: 40, w: 80, h: 32, hovered: false };
let starParticles = [];
let moodTextHitboxes = [];

// System sans-serif font stack only. No external font files, avoids copyright and GitHub Pages loading issues
const FONT_FAMILY = "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
// Mood dataset
// Design concept: each mood maps to a unique particle movement metaphor. Hover switches movement to visualise the feeling
// I matched movement characteristics to each emotion: slow circular motion for calm, chaotic jitter for anxiety.
const moodData = {
"Calm": {
color: "#7dd3fc",
definition: "A peaceful, quiet state of mind without agitation.",
practice: "Slow breathing, walking in nature, quiet reading.",
imgSrc: "c157c30664160776766ac5561c21755d.png"
},
"Joy": {
color: "#fcd34d",
definition: "A light, warm feeling of happiness and contentment.",
practice: "Spend time with loved ones, enjoy small moments.",
imgSrc: "dc594826dc02c77bb20624da3b5410a7.png"
},
"Fatigue": {
color: "#94a3b8",
definition: "A heavy feeling of low energy and mental exhaustion.",
practice: "Rest, sleep, reduce unnecessary tasks.",
imgSrc: "1e2924630d4b5d686b6b2aaf5120f574.png"
},
"Anxiety": {
color: "#f87171",
definition: "Restless, tense worry about uncertain future events.",
practice: "Grounding exercises, talk to someone, journaling.",
imgSrc: "df336c103f38946b9b9dc3ba1169b5a3.png"
},
"Stress": {
color: "#c084fc",
definition: "Tight pressure from overwhelming responsibilities and demands.",
practice: "Take short breaks, simplify your schedule.",
imgSrc: "c81efe7a39d1cd6d15712831da27d8a1.png"
}
};
// Preload mood images
// Limitation note: static GitHub Pages hosting will fail to render images if file paths break, this is a scaling risk for future expansion
const moodImages = {};
Object.keys(moodData).forEach(name => {
const img = new Image();
img.src = moodData[name].imgSrc;
moodImages[name] = img;
});
// Tree structure to store all branch data
const tree = {
trunk: { x: 0, y: 0 },
branches: []
};
// Particle class. Base particle structure learned from YouTube canvas particle tutorial
// I rewrote the update function separately to split hover / non-hover behaviour, this is the core hover interaction for the assignment
// I used easing multipliers to make movement transition smooth instead of instantly snapping.
class Particle {
constructor(x, y, targetX, targetY, color) {
this.x = x;
this.y = y;
this.targetX = targetX;
this.targetY = targetY;
this.color = color;
this.size = 1.1 + Math.random() * 0.9;
this.vx = 0;
this.vy = 0;
this.alpha = 0.55 + Math.random() * 0.35;
this.mode = "tree";
this.angle = Math.random() * Math.PI * 2;
this.phase = Math.random() * 1000;
}
update(branch) {
const dx = this.targetX - this.x;
const dy = this.targetY - this.y;
if (branch.hovered) {
this.mode = "mood";
// Hover trigger: particles switch to emotion-specific movement to give visual feedback
// Each case has unique speed and pattern to visually differentiate the five moods.
switch (branch.name) {
case "Calm":
this.angle += 0.008;
const r = 14;
this.targetX = branch.endX + Math.cos(this.angle) * r;
this.targetY = branch.endY + Math.sin(this.angle) * r;
this.vx += (this.targetX - this.x) * 0.015;
this.vy += (this.targetY - this.y) * 0.015;
this.vx *= 0.92;
this.vy *= 0.92;
this.x += this.vx;
this.y += this.vy;
this.alpha = 0.55;
break;
case "Joy":
this.targetX = branch.endX + Math.sin((Date.now() + this.phase) * 0.004) * 18;
this.targetY = branch.endY + Math.cos((Date.now() + this.phase) * 0.004) * 18;
this.vx += (this.targetX - this.x) * 0.02;
this.vy += (this.targetY - this.y) * 0.02;
this.vx *= 0.9;
this.vy *= 0.9;
this.x += this.vx;
this.y += this.vy;
this.alpha = 0.75;
break;
case "Fatigue":
this.targetX += (Math.random() * 2 - 1) * 0.25;
this.targetY += 0.15;
this.vx += (this.targetX - this.x) * 0.004;
this.vy += (this.targetY - this.y) * 0.004;
this.vx *= 0.97;
this.vy *= 0.97;
this.x += this.vx;
this.y += this.vy;
this.alpha = 0.35;
break;
case "Anxiety":
this.targetX = branch.endX + Math.sin((Date.now() + this.phase) * 0.025) * 22;
this.targetY = branch.endY + Math.cos((Date.now() + this.phase) * 0.022) * 22;
this.vx += (this.targetX - this.x) * 0.035;
this.vy += (this.targetY - this.y) * 0.035;
this.vx *= 0.86;
this.vy *= 0.86;
this.x += this.vx;
this.y += this.vy;
this.alpha = 0.7;
break;
case "Stress":
this.targetX = branch.endX + Math.sin((Date.now() + this.phase) * 0.01) * 14;
this.targetY = branch.endY + Math.cos((Date.now() + this.phase) * 0.013) * 14;
this.vx += (this.targetX - this.x) * 0.022;
this.vy += (this.targetY - this.y) * 0.022;
this.vx *= 0.88;
this.vy *= 0.88;
this.x += this.vx;
this.y += this.vy;
this.alpha = 0.6;
break;
}
} else {
// When cursor leaves, particles snap back to branch shape, creating clear before/after hover feedback
// I wanted the return movement to feel gentle, not abrupt.
this.mode = "tree";
this.vx += dx * 0.04;
this.vy += dy * 0.04;
this.vx *= 0.88;
this.vy *= 0.88;
this.x += this.vx;
this.y += this.vy;
this.alpha = 0.55;
}
}
draw() {
ctx.save();
ctx.globalAlpha = this.alpha;
ctx.fillStyle = this.color;
ctx.shadowBlur = 8;
ctx.shadowColor = this.color;
ctx.beginPath();
ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
ctx.fill();
ctx.restore();
}
}
// Background star particles, fill empty dark space and strengthen quiet, meditative atmosphere
// Stars move slowly so they do not distract attention away from the main mood tree interaction.
class StarParticle {
constructor() {
this.x = Math.random() * width;
this.y = Math.random() * height;
this.size = Math.random() * 0.6 + 0.1;
this.speedX = (Math.random() - 0.5) * 0.12;
this.speedY = (Math.random() - 0.5) * 0.12;
this.alpha = Math.random() * 0.3 + 0.05;
}
update() {
this.x += this.speedX;
this.y += this.speedY;
// Wrap particles around screen edges. Avoids constantly creating new particles for performance
if (this.x < 0) this.x = width;
if (this.x > width) this.x = 0;
if (this.y < 0) this.y = height;
if (this.y > height) this.y = 0;
}
draw() {
ctx.save();
ctx.globalAlpha = this.alpha;
ctx.fillStyle = "#ffffff";
ctx.beginPath();
ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
ctx.fill();
ctx.restore();
}
}
function createBranch(name, endX, endY, color) {
return {
name,
startX: cx,
startY: cy - 90,
endX,
endY,
color,
hovered: false,
particles: []
};
}
function buildTree() {
tree.trunk.x = cx;
tree.trunk.y = cy - 90;
tree.branches = [
createBranch("Calm", cx - 180, cy + 40, "#7dd3fc"),
createBranch("Joy", cx, cy + 10, "#fcd34d"),
createBranch("Fatigue", cx + 180, cy + 40, "#94a3b8"),
createBranch("Anxiety", cx - 90, cy + 130, "#f87171"),
createBranch("Stress", cx + 90, cy + 130, "#c084fc")
];
}
function initBranches() {
tree.branches.forEach(branch => {
branch.particles = [];
const steps = 90;
for (let i = 0; i < steps; i++) {
const t = i / steps;
const x = branch.startX + (branch.endX - branch.startX) * t;
const y = branch.startY + (branch.endY - branch.startY) * t;
const offset = 1.2;
const px = x + (Math.random() - 0.5) * offset;
const py = y + (Math.random() - 0.5) * offset;
branch.particles.push(new Particle(px, py, x, y, branch.color));
}
});
}
function initStars() {
starParticles = [];
for (let i = 0; i < 80; i++) {
starParticles.push(new StarParticle());
}
}
// Mousemove event listener. Learned from W3Schools, this is the foundation for all hover detection
let mx = 0, my = 0;
canvas.addEventListener("mousemove", (e) => {
mx = e.clientX;
my = e.clientY;
if (sceneState === "start") {
const dist = Math.hypot(mx - cx, my - cy);
mouseOnIcon = dist < 130;
if (mouseOnIcon) {
iconBounceTimer += 0.12;
startIconScale = 1 + Math.sin(iconBounceTimer) * 0.08;
hoverTimer += 16;
if (hoverTimer >= HOVER_DELAY) {
sceneState = "tree";
hoverTimer = 0;
}
} else {
startIconScale += (1 - startIconScale) * 0.08;
hoverTimer = 0;
}
} else if (sceneState === "tree") {
// Check if cursor position falls inside the back button boundary
backBtn.hovered = (
mx > backBtn.x &&
mx < backBtn.x + backBtn.w &&
my > backBtn.y &&
my < backBtn.y + backBtn.h
);
tree.branches.forEach(branch => {
const dist = Math.hypot(mx - branch.endX, my - branch.endY);
branch.hovered = dist < 50;
});
} else if (sceneState === "detail") {
detailBackBtn.hovered = (
mx > detailBackBtn.x &&
mx < detailBackBtn.x + detailBackBtn.w &&
my > detailBackBtn.y &&
my < detailBackBtn.y + detailBackBtn.h
);
}
});
// Click event for confirmation. Hover acts as preview, click confirms selection, creates low-pressure interaction
canvas.addEventListener("click", () => {
if (sceneState === "tree") {
if (backBtn.hovered) {
sceneState = "start";
hoverTimer = 0;
return;
}
for (let box of moodTextHitboxes) {
if (mx > box.x && mx < box.x + box.w && my > box.y && my < box.y + box.h) {
activeMood = box.name;
sceneState = "detail";
return;
}
}
for (let b of tree.branches) {
const dist = Math.hypot(mx - b.endX, my - b.endY);
if (dist < 50) {
activeMood = b.name;
sceneState = "detail";
break;
}
}
} else if (sceneState === "detail") {
if (detailBackBtn.hovered) {
sceneState = "tree";
}
}
});
// Debug shortcut I added for testing. Press R to reset all scene states quickly
// I kept this shortcut because I was constantly reloading during parameter testing.
// window.addEventListener("keydown", (e) => {
// if (e.key.toLowerCase() === "r") {
// sceneState = "start";
// hoverTimer = 0;
// }
// });

// Helper rounded rectangle function. Native canvas does not support rounded rect, arcTo technique learned from canvas reference guides
function roundRect(ctx, x, y, w, h, r) {
ctx.beginPath();
ctx.moveTo(x + r, y);
ctx.arcTo(x + w, y, x + w, y + h, r);
ctx.arcTo(x + w, y + h, x, y + h, r);
ctx.arcTo(x, y + h, x, y, r);
ctx.arcTo(x, y, x + w, y, r);
ctx.closePath();
}
function drawStartScreen() {
ctx.clearRect(0, 0, width, height);
starParticles.forEach(s => { s.update(); s.draw(); });
ctx.save();
ctx.translate(cx, cy);
ctx.scale(startIconScale, startIconScale);
ctx.fillStyle = "rgba(255,255,255,0.12)";
ctx.shadowBlur = 18;
ctx.shadowColor = "rgba(255,255,255,0.3)";
roundRect(ctx, -120, -45, 240, 90, 22);
ctx.fill();
ctx.fillStyle = "#ffffff";
ctx.font = `500 18px ${FONT_FAMILY}`;
ctx.letterSpacing = 0.4;
ctx.textAlign = "center";
ctx.textBaseline = "middle";
ctx.fillText("How are you feeling today?", 0, 0);
ctx.restore();
}
function drawTreeGlow() {
ctx.save();
ctx.globalAlpha = 0.35;
ctx.fillStyle = "#cbd5e1";
ctx.shadowBlur = 24;
ctx.shadowColor = "rgba(255,255,255,0.25)";
ctx.beginPath();
ctx.arc(tree.trunk.x, tree.trunk.y, 10, 0, Math.PI * 2);
ctx.fill();
ctx.restore();
tree.branches.forEach(branch => {
ctx.save();
ctx.globalAlpha = 0.25;
ctx.strokeStyle = branch.color;
ctx.lineWidth = 1;
ctx.shadowBlur = 12;
ctx.shadowColor = branch.color;
ctx.beginPath();
ctx.moveTo(branch.startX, branch.startY);
ctx.lineTo(branch.endX, branch.endY);
ctx.stroke();
ctx.restore();
});
}
function drawLabels() {
moodTextHitboxes = [];
tree.branches.forEach(branch => {
ctx.save();
// Text brightens on hover, gives clear visual feedback of cursor position
ctx.globalAlpha = branch.hovered ? 1 : 0.55;
ctx.fillStyle = branch.color;
ctx.font = `400 14px ${FONT_FAMILY}`;
ctx.letterSpacing = 0.6;
ctx.textAlign = "center";
ctx.shadowBlur = 10;
ctx.shadowColor = branch.color;
const textY = branch.endY + 42;
ctx.fillText(branch.name, branch.endX, textY);
moodTextHitboxes.push({
name: branch.name,
x: branch.endX - 30,
y: textY - 11,
w: 60,
h: 22
});
ctx.restore();
});
}
function drawBackButton() {
ctx.save();
// Consistent hover feedback style: brighter fill + glow for all interactive buttons
if (backBtn.hovered) {
ctx.fillStyle = "rgba(255,255,255,0.22)";
ctx.shadowBlur = 14;
ctx.shadowColor = "rgba(255,255,255,0.45)";
} else {
ctx.fillStyle = "rgba(255,255,255,0.08)";
ctx.shadowBlur = 0;
}
roundRect(ctx, backBtn.x, backBtn.y, backBtn.w, backBtn.h, 10);
ctx.fill();
ctx.fillStyle = "#fff";
ctx.font = `400 14px ${FONT_FAMILY}`;
ctx.letterSpacing = 0.3;
ctx.textAlign = "center";
ctx.textBaseline = "middle";
ctx.fillText("← Back", backBtn.x + backBtn.w / 2, backBtn.y + backBtn.h / 2);
ctx.restore();
}
function drawTreeScreen() {
ctx.clearRect(0, 0, width, height);
starParticles.forEach(s => { s.update(); s.draw(); });
drawTreeGlow();
drawLabels();
tree.branches.forEach(branch => {
branch.particles.forEach(p => {
p.update(branch);
p.draw();
});
});
drawBackButton();
}
function drawDetailScreen() {
ctx.clearRect(0, 0, width, height);
starParticles.forEach(s => { s.update(); s.draw(); });
const mood = moodData[activeMood];
const img = moodImages[activeMood];
const targetW = 420;
let imgW = targetW;
let imgH = (img.height && img.width) ? (img.height / img.width) * imgW : 300;
const imgX = cx - imgW / 2;
const imgY = cy - imgH / 2;
const mouseOverImage = (
mx > imgX &&
mx < imgX + imgW &&
my > imgY &&
my < imgY + imgH
);
if (img.complete && img.width > 0) {
ctx.drawImage(img, imgX, imgY, imgW, imgH);
} else {
ctx.fillStyle = "rgba(255,255,255,0.1)";
roundRect(ctx, imgX, imgY, targetW, 300, 12);
ctx.fill();
ctx.fillStyle = "#fff";
ctx.textAlign = "center";
ctx.font = `400 15px ${FONT_FAMILY}`;
ctx.fillText("Image loading...", cx, cy);
}
ctx.save();
ctx.fillStyle = mood.color;
ctx.font = `500 28px ${FONT_FAMILY}`;
ctx.letterSpacing = 0.8;
ctx.textAlign = "center";
ctx.fillText(activeMood, cx, imgY - 30);
ctx.restore();
ctx.save();
ctx.textAlign = "center";
ctx.textBaseline = "top";
const textStartY = imgY + imgH + 35;
ctx.fillStyle = "rgba(255,255,255,0.45)";
ctx.font = `400 13px ${FONT_FAMILY}`;
ctx.letterSpacing = 0.5;
ctx.fillText("Definition", cx, textStartY);
ctx.fillStyle = "#ffffff";
ctx.font = `400 16px ${FONT_FAMILY}`;
ctx.letterSpacing = 0.3;
ctx.fillText(mood.definition, cx, textStartY + 20);
// Secondary hover interaction: coping tips only appear when hovering the image. Keeps hover as the core interaction throughout the prototype
if (mouseOverImage) {
ctx.fillStyle = "rgba(255,255,255,0.45)";
ctx.font = `400 13px ${FONT_FAMILY}`;
ctx.letterSpacing = 0.5;
ctx.fillText("Coping Practice", cx, textStartY + 55);
ctx.fillStyle = mood.color;
ctx.font = `400 16px ${FONT_FAMILY}`;
ctx.letterSpacing = 0.3;
ctx.fillText(mood.practice, cx, textStartY + 75);
}
ctx.restore();
ctx.save();
if (detailBackBtn.hovered) {
ctx.fillStyle = "rgba(255,255,255,0.22)";
ctx.shadowBlur = 14;
ctx.shadowColor = "rgba(255,255,255,0.45)";
} else {
ctx.fillStyle = "rgba(255,255,255,0.08)";
ctx.shadowBlur = 0;
}
roundRect(ctx, detailBackBtn.x, detailBackBtn.y, detailBackBtn.w, detailBackBtn.h, 10);
ctx.fill();
ctx.fillStyle = "#fff";
ctx.font = `400 14px ${FONT_FAMILY}`;
ctx.letterSpacing = 0.3;
ctx.textAlign = "center";
ctx.textBaseline = "middle";
ctx.fillText("← Back", detailBackBtn.x + detailBackBtn.w / 2, detailBackBtn.y + detailBackBtn.h / 2);
ctx.restore();
}
// Main animation loop using requestAnimationFrame. Learned from W3Schools animation guides, smoother than setInterval
function draw() {
if (sceneState === "start") {
drawStartScreen();
} else if (sceneState === "tree") {
drawTreeScreen();
} else if (sceneState === "detail") {
drawDetailScreen();
}
requestAnimationFrame(draw);
}
// Window resize listener, added after testing. Without this, canvas distorts when viewport size changes
function resize() {
width = window.innerWidth;
height = window.innerHeight;
canvas.width = width;
canvas.height = height;
cx = width / 2;
cy = height / 2;
backBtn.y = height - 40;
detailBackBtn.y = 40;
buildTree();
initBranches();
initStars();
}
window.addEventListener("resize", resize);
resize();
draw();
