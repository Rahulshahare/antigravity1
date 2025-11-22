/**
 * Wishing Well: The Descent
 * Main Game Logic
 */

class Particle {
    constructor(game, x, y, color) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.color = color;
        this.size = Math.random() * 3 + 2;
        this.speedX = Math.random() * 6 - 3;
        this.speedY = Math.random() * 6 - 3;
        this.life = 1.0; // Opacity
        this.decay = Math.random() * 0.03 + 0.02;
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.life -= this.decay;
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

class WellEnvironment {
    constructor(game) {
        this.game = game;
        this.wallWidth = 50;
        this.brickHeight = 60;
        this.scrollOffset = 0;
    }

    update(deltaTime) {
        // Scroll speed matches depth increase/decrease
        let speed = 0.1;
        if (this.game.state === 'RETURNING') speed = -0.2; // Faster ascent

        this.scrollOffset += deltaTime * speed;
    }

    draw(ctx) {
        const wallColor = '#2d2d3a';
        const brickColor = '#1a1a24';

        // Left Wall
        ctx.fillStyle = wallColor;
        ctx.fillRect(0, 0, this.wallWidth, this.game.height);

        // Right Wall
        ctx.fillStyle = wallColor;
        ctx.fillRect(this.game.width - this.wallWidth, 0, this.wallWidth, this.game.height);

        // Draw Bricks Pattern
        ctx.fillStyle = brickColor;
        const startY = -(this.scrollOffset % this.brickHeight);
        // Handle negative modulo for ascent
        const offset = (this.scrollOffset % this.brickHeight + this.brickHeight) % this.brickHeight;

        for (let y = -offset; y < this.game.height; y += this.brickHeight) {
            // Left Bricks
            ctx.fillRect(5, y + 5, this.wallWidth - 10, this.brickHeight - 10);
            // Right Bricks
            ctx.fillRect(this.game.width - this.wallWidth + 5, y + 5, this.wallWidth - 10, this.brickHeight - 10);
        }

        // Dark Vignette
        const gradient = ctx.createRadialGradient(
            this.game.width / 2, this.game.height / 2, 100,
            this.game.width / 2, this.game.height / 2, this.game.width
        );
        gradient.addColorStop(0, 'rgba(0,0,0,0)');
        gradient.addColorStop(1, 'rgba(0,0,0,0.6)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.game.width, this.game.height);
    }
}

class Bucket {
    constructor(game) {
        this.game = game;
        this.width = 60;
        this.height = 50;
        this.x = game.width / 2;
        this.y = game.height * 0.2;
        this.velocity = { x: 0, y: 0 };
    }

    update(deltaTime) {
        // Smooth follow mouse
        let targetX = this.game.mouseX;

        // Clamp to walls
        targetX = Math.max(50 + this.width / 2, Math.min(this.game.width - 50 - this.width / 2, targetX));

        // Simple lerp for smoothness
        this.x += (targetX - this.x) * 0.1;
    }

    draw(ctx) {
        // Draw Rope
        ctx.beginPath();
        ctx.moveTo(this.game.width / 2, 0);
        ctx.lineTo(this.x, this.y);
        ctx.strokeStyle = '#8b4513';
        ctx.lineWidth = 4;
        ctx.stroke();

        // Draw Bucket Body
        ctx.fillStyle = '#5d4037';
        ctx.beginPath();
        ctx.moveTo(this.x - this.width / 2, this.y);
        ctx.lineTo(this.x + this.width / 2, this.y);
        ctx.lineTo(this.x + this.width / 3, this.y + this.height);
        ctx.lineTo(this.x - this.width / 3, this.y + this.height);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#3e2723';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw Rim
        ctx.fillStyle = '#3e2723';
        ctx.beginPath();
        ctx.ellipse(this.x, this.y, this.width / 2, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        // Gold fill level (visual only)
        if (this.game.score > 0) {
            ctx.fillStyle = '#ffd700';
            ctx.beginPath();
            ctx.ellipse(this.x, this.y + 5, this.width / 2 - 5, 6, 0, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

class Coin {
    constructor(game) {
        this.game = game;
        this.radius = 12;
        this.x = Math.random() * (game.width - 120) + 60;
        this.y = game.height + 50;

        this.speedY = - (2 + Math.random() * 3);
        this.rotation = Math.random() * Math.PI;
        this.rotSpeed = 0.1;
        this.markedForDeletion = false;
        this.value = 10;
    }

    update(deltaTime) {
        this.y += this.speedY;
        this.rotation += this.rotSpeed;

        // Remove if off top of screen
        if (this.y < -50) this.markedForDeletion = true;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        // Gold Coin
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#ffd700';
        ctx.fill();
        ctx.strokeStyle = '#b8860b';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Shine
        ctx.beginPath();
        ctx.arc(-4, -4, 3, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.fill();

        ctx.restore();
    }
}

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');

        // Game State
        this.state = 'MENU'; // MENU, PLAYING, RETURNING, GAMEOVER
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.lastTime = 0;

        // Game Objects
        this.bucket = null;
        this.environment = null;
        this.coins = [];
        this.particles = [];
        this.score = 0;
        this.depth = 0;
        this.coinTimer = 0;
        this.coinInterval = 1000;

        // Input
        this.mouseX = this.width / 2;

        this.resize();
        window.addEventListener('resize', () => this.resize());
        window.addEventListener('mousemove', (e) => this.mouseX = e.clientX);
        window.addEventListener('touchmove', (e) => {
            e.preventDefault();
            this.mouseX = e.touches[0].clientX;
        }, { passive: false });

        // UI Elements
        this.ui = {
            startScreen: document.getElementById('start-screen'),
            gameOverScreen: document.getElementById('game-over-screen'),
            hud: document.getElementById('hud'),
            scoreDisplay: document.getElementById('score-display'),
            depthDisplay: document.getElementById('depth-display'),
            finalScore: document.getElementById('final-score'),
            finalDepth: document.getElementById('final-depth'),
            startBtn: document.getElementById('start-btn'),
            restartBtn: document.getElementById('restart-btn'),
            pullUpBtn: document.getElementById('pull-up-btn')
        };

        this.ui.startBtn.addEventListener('click', () => this.start());
        this.ui.restartBtn.addEventListener('click', () => this.start());
        this.ui.pullUpBtn.addEventListener('click', () => this.pullUp());

        // Start Loop
        requestAnimationFrame((ts) => this.loop(ts));
    }

    resize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        if (this.bucket) this.bucket.y = this.height * 0.2;
    }

    start() {
        this.state = 'PLAYING';
        this.score = 0;
        this.depth = 0;
        this.coins = [];
        this.particles = [];
        this.bucket = new Bucket(this);
        this.environment = new WellEnvironment(this);
        this.coinInterval = 1000;

        // Reset UI
        this.ui.startScreen.classList.add('hidden');
        this.ui.startScreen.classList.remove('active');
        this.ui.gameOverScreen.classList.add('hidden');
        this.ui.gameOverScreen.classList.remove('active');
        this.ui.hud.classList.remove('hidden');
        this.ui.pullUpBtn.style.display = 'block'; // Show pull up button
    }

    pullUp() {
        if (this.state === 'PLAYING') {
            this.state = 'RETURNING';
            this.ui.pullUpBtn.style.display = 'none'; // Hide button during return
        }
    }

    gameOver() {
        this.state = 'GAMEOVER';
        this.ui.hud.classList.add('hidden');
        this.ui.gameOverScreen.classList.remove('hidden');
        this.ui.gameOverScreen.classList.add('active');
        this.ui.finalScore.textContent = this.score;
        this.ui.finalDepth.textContent = Math.floor(this.depth) + 'm';
    }

    checkCollision(bucket, coin) {
        let dx = coin.x - bucket.x;
        let dy = coin.y - bucket.y;
        if (Math.abs(dx) < bucket.width / 2 && Math.abs(dy) < 20) {
            return true;
        }
        return false;
    }

    createParticles(x, y, color) {
        for (let i = 0; i < 8; i++) {
            this.particles.push(new Particle(this, x, y, color));
        }
    }

    update(deltaTime) {
        if (this.state !== 'PLAYING' && this.state !== 'RETURNING') return;

        // Update Depth
        if (this.state === 'PLAYING') {
            this.depth += deltaTime * 0.01;
        } else if (this.state === 'RETURNING') {
            this.depth -= deltaTime * 0.02; // Return faster
            if (this.depth <= 0) {
                this.depth = 0;
                this.gameOver();
            }
        }

        this.environment.update(deltaTime);
        this.bucket.update(deltaTime);

        // Spawn Coins only when playing
        if (this.state === 'PLAYING') {
            if (this.coinTimer > this.coinInterval) {
                this.coins.push(new Coin(this));
                this.coinTimer = 0;
                if (this.coinInterval > 200) this.coinInterval -= 5;
            } else {
                this.coinTimer += deltaTime;
            }
        }

        // Update Coins
        this.coins.forEach(coin => {
            coin.update(deltaTime);
            if (this.state === 'PLAYING' && this.checkCollision(this.bucket, coin)) {
                coin.markedForDeletion = true;
                this.score += coin.value;
                this.createParticles(coin.x, coin.y, '#ffd700');
            }
        });
        this.coins = this.coins.filter(c => !c.markedForDeletion);

        // Update Particles
        this.particles.forEach(p => p.update());
        this.particles = this.particles.filter(p => p.life > 0);

        // Update UI
        this.ui.scoreDisplay.textContent = this.score;
        this.ui.depthDisplay.textContent = Math.floor(this.depth) + 'm';
    }

    draw() {
        // Clear Screen
        this.ctx.fillStyle = '#0a0a12';
        this.ctx.fillRect(0, 0, this.width, this.height);

        if (this.state === 'PLAYING' || this.state === 'RETURNING') {
            this.environment.draw(this.ctx);
            this.coins.forEach(coin => coin.draw(this.ctx));
            this.bucket.draw(this.ctx);
            this.particles.forEach(p => p.draw(this.ctx));
        }
    }

    loop(timestamp) {
        const deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;

        this.update(deltaTime);
        this.draw();

        requestAnimationFrame((ts) => this.loop(ts));
    }
}

// Initialize Game
window.onload = () => {
    const game = new Game();
};
