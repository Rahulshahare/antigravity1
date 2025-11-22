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
        this.life = 1.0;
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
        let speed = 0.1;
        if (this.game.state === 'RETURNING') speed = -0.2;
        this.scrollOffset += deltaTime * speed;
    }

    draw(ctx) {
        const wallColor = '#2d2d3a';
        const brickColor = '#1a1a24';

        ctx.fillStyle = wallColor;
        ctx.fillRect(0, 0, this.wallWidth, this.game.height);
        ctx.fillRect(this.game.width - this.wallWidth, 0, this.wallWidth, this.game.height);

        ctx.fillStyle = brickColor;
        const offset = (this.scrollOffset % this.brickHeight + this.brickHeight) % this.brickHeight;

        for (let y = -offset; y < this.game.height; y += this.brickHeight) {
            ctx.fillRect(5, y + 5, this.wallWidth - 10, this.brickHeight - 10);
            ctx.fillRect(this.game.width - this.wallWidth + 5, y + 5, this.wallWidth - 10, this.brickHeight - 10);
        }

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
        this.health = 3;
        this.currentLoad = 0;
    }

    update(deltaTime) {
        let targetX = this.game.mouseX;
        targetX = Math.max(50 + this.width / 2, Math.min(this.game.width - 50 - this.width / 2, targetX));
        this.x += (targetX - this.x) * 0.1;
    }

    draw(ctx) {
        // Rope
        ctx.beginPath();
        ctx.moveTo(this.game.width / 2, 0);
        ctx.lineTo(this.x, this.y);
        ctx.strokeStyle = '#8b4513';
        ctx.lineWidth = 4;
        ctx.stroke();

        // Bucket
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

        // Rim
        ctx.fillStyle = '#3e2723';
        ctx.beginPath();
        ctx.ellipse(this.x, this.y, this.width / 2, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        // Gold Fill
        if (this.currentLoad > 0) {
            ctx.fillStyle = '#ffd700';
            ctx.beginPath();
            // Fill height based on load percentage
            const fillRatio = Math.min(1, this.currentLoad / this.game.shop.getCapacity());
            const fillHeight = fillRatio * 6;
            ctx.ellipse(this.x, this.y + 5, this.width / 2 - 5, fillHeight, 0, 0, Math.PI * 2);
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
        if (this.y < -50) this.markedForDeletion = true;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#ffd700';
        ctx.fill();
        ctx.strokeStyle = '#b8860b';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(-4, -4, 3, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.fill();

        ctx.restore();
    }
}

class Obstacle {
    constructor(game) {
        this.game = game;
        this.size = 25;
        this.x = Math.random() * (game.width - 120) + 60;
        this.y = game.height + 50;
        this.speedY = - (3 + Math.random() * 4); // Faster than coins
        this.rotation = Math.random() * Math.PI;
        this.rotSpeed = 0.05;
        this.markedForDeletion = false;
    }

    update(deltaTime) {
        this.y += this.speedY;
        this.rotation += this.rotSpeed;
        if (this.y < -50) this.markedForDeletion = true;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        // Rock Shape
        ctx.fillStyle = '#555';
        ctx.beginPath();
        ctx.moveTo(-this.size / 2, -this.size / 2);
        ctx.lineTo(this.size / 2, -this.size / 3);
        ctx.lineTo(this.size / 3, this.size / 2);
        ctx.lineTo(-this.size / 2, this.size / 3);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.restore();
    }
}

class Shop {
    constructor(game) {
        this.game = game;
        this.totalGold = parseInt(localStorage.getItem('ww_totalGold')) || 0;
        this.capLevel = parseInt(localStorage.getItem('ww_capLevel')) || 1;
        this.depthLevel = parseInt(localStorage.getItem('ww_depthLevel')) || 1;

        this.updateUI();
    }

    getCapacity() { return this.capLevel * 10; }
    getMaxDepth() { return this.depthLevel * 50; }
    getCapCost() { return this.capLevel * 100; }
    getDepthCost() { return this.depthLevel * 100; }

    save() {
        localStorage.setItem('ww_totalGold', this.totalGold);
        localStorage.setItem('ww_capLevel', this.capLevel);
        localStorage.setItem('ww_depthLevel', this.depthLevel);
        this.updateUI();
    }

    buyCapacity() {
        const cost = this.getCapCost();
        if (this.totalGold >= cost) {
            this.totalGold -= cost;
            this.capLevel++;
            this.save();
        }
    }

    buyDepth() {
        const cost = this.getDepthCost();
        if (this.totalGold >= cost) {
            this.totalGold -= cost;
            this.depthLevel++;
            this.save();
        }
    }

    updateUI() {
        document.getElementById('bank-gold').textContent = this.totalGold;
        document.getElementById('shop-cap-current').textContent = this.getCapacity();
        document.getElementById('cost-cap').textContent = this.getCapCost();
        document.getElementById('shop-depth-current').textContent = this.getMaxDepth() + 'm';
        document.getElementById('cost-depth').textContent = this.getDepthCost();

        document.getElementById('btn-buy-cap').disabled = this.totalGold < this.getCapCost();
        document.getElementById('btn-buy-depth').disabled = this.totalGold < this.getDepthCost();
    }
}

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');

        this.state = 'MENU';
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.lastTime = 0;

        this.bucket = null;
        this.environment = null;
        this.coins = [];
        this.obstacles = [];
        this.particles = [];
        this.score = 0;
        this.depth = 0;
        this.coinTimer = 0;
        this.obstacleTimer = 0;

        this.shop = new Shop(this);

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
            shopScreen: document.getElementById('shop-screen'),
            gameOverScreen: document.getElementById('game-over-screen'),
            hud: document.getElementById('hud'),
            scoreDisplay: document.getElementById('score-display'),
            depthDisplay: document.getElementById('depth-display'),
            capacityDisplay: document.getElementById('capacity-display'),
            healthDisplay: document.getElementById('health-display'),
            finalScore: document.getElementById('final-score'),
            finalDepth: document.getElementById('final-depth'),
            startBtn: document.getElementById('start-btn'),
            restartBtn: document.getElementById('restart-btn'),
            pullUpBtn: document.getElementById('pull-up-btn'),
            openShopBtn: document.getElementById('open-shop-btn'),
            closeShopBtn: document.getElementById('btn-close-shop'),
            buyCapBtn: document.getElementById('btn-buy-cap'),
            buyDepthBtn: document.getElementById('btn-buy-depth')
        };

        this.bindEvents();
        requestAnimationFrame((ts) => this.loop(ts));
    }

    bindEvents() {
        this.ui.startBtn.addEventListener('click', () => this.start());
        this.ui.restartBtn.addEventListener('click', () => this.start());
        this.ui.pullUpBtn.addEventListener('click', () => this.pullUp());

        this.ui.openShopBtn.addEventListener('click', () => {
            this.ui.startScreen.classList.add('hidden');
            this.ui.startScreen.classList.remove('active');
            this.ui.shopScreen.classList.remove('hidden');
            this.ui.shopScreen.classList.add('active');
            this.shop.updateUI();
        });

        this.ui.closeShopBtn.addEventListener('click', () => {
            this.ui.shopScreen.classList.add('hidden');
            this.ui.shopScreen.classList.remove('active');
            this.ui.startScreen.classList.remove('hidden');
            this.ui.startScreen.classList.add('active');
        });

        this.ui.buyCapBtn.addEventListener('click', () => this.shop.buyCapacity());
        this.ui.buyDepthBtn.addEventListener('click', () => this.shop.buyDepth());
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
        this.obstacles = [];
        this.particles = [];
        this.bucket = new Bucket(this);
        this.environment = new WellEnvironment(this);

        this.ui.startScreen.classList.add('hidden');
        this.ui.startScreen.classList.remove('active');
        this.ui.gameOverScreen.classList.add('hidden');
        this.ui.gameOverScreen.classList.remove('active');
        this.ui.hud.classList.remove('hidden');
        this.ui.pullUpBtn.style.display = 'block';

        this.updateHUD();
    }

    pullUp() {
        if (this.state === 'PLAYING') {
            this.state = 'RETURNING';
            this.ui.pullUpBtn.style.display = 'none';
        }
    }

    gameOver(success) {
        this.state = 'GAMEOVER';
        this.ui.hud.classList.add('hidden');
        this.ui.gameOverScreen.classList.remove('hidden');
        this.ui.gameOverScreen.classList.add('active');

        if (success) {
            this.shop.totalGold += this.score;
            this.shop.save();
            document.getElementById('game-over-title').textContent = "Well Done!";
        } else {
            document.getElementById('game-over-title').textContent = "Bucket Lost!";
            this.score = 0; // Lose loot
        }

        this.ui.finalScore.textContent = this.score;
        this.ui.finalDepth.textContent = Math.floor(this.depth) + 'm';
    }

    checkCollision(bucket, obj) {
        let dx = obj.x - bucket.x;
        let dy = obj.y - bucket.y;
        // Hitbox slightly larger for obstacles
        if (Math.abs(dx) < bucket.width / 2 && Math.abs(dy) < 25) {
            return true;
        }
        return false;
    }

    createParticles(x, y, color) {
        for (let i = 0; i < 8; i++) {
            this.particles.push(new Particle(this, x, y, color));
        }
    }

    updateHUD() {
        this.ui.scoreDisplay.textContent = this.score;
        this.ui.depthDisplay.textContent = Math.floor(this.depth) + 'm';
        this.ui.capacityDisplay.textContent = `${this.bucket.currentLoad}/${this.shop.getCapacity()}`;
        this.ui.healthDisplay.textContent = '❤️'.repeat(this.bucket.health);
    }

    update(deltaTime) {
        if (this.state !== 'PLAYING' && this.state !== 'RETURNING') return;

        if (this.state === 'PLAYING') {
            this.depth += deltaTime * 0.01;
            if (this.depth >= this.shop.getMaxDepth()) {
                this.pullUp(); // Auto pull up at max depth
            }
        } else if (this.state === 'RETURNING') {
            this.depth -= deltaTime * 0.02;
            if (this.depth <= 0) {
                this.depth = 0;
                this.gameOver(true);
            }
        }

        this.environment.update(deltaTime);
        this.bucket.update(deltaTime);

        // Spawning
        if (this.state === 'PLAYING') {
            // Coins
            this.coinTimer += deltaTime;
            if (this.coinTimer > 1000) {
                this.coins.push(new Coin(this));
                this.coinTimer = 0;
            }

            // Obstacles
            this.obstacleTimer += deltaTime;
            if (this.obstacleTimer > 2000) { // Every 2s
                this.obstacles.push(new Obstacle(this));
                this.obstacleTimer = 0;
            }
        }

        // Update Coins
        this.coins.forEach(coin => {
            coin.update(deltaTime);
            if (this.state === 'PLAYING' && !coin.markedForDeletion && this.checkCollision(this.bucket, coin)) {
                if (this.bucket.currentLoad < this.shop.getCapacity()) {
                    coin.markedForDeletion = true;
                    this.score += coin.value;
                    this.bucket.currentLoad++;
                    this.createParticles(coin.x, coin.y, '#ffd700');
                }
            }
        });
        this.coins = this.coins.filter(c => !c.markedForDeletion);

        // Update Obstacles
        this.obstacles.forEach(obs => {
            obs.update(deltaTime);
            if (this.state === 'PLAYING' && !obs.markedForDeletion && this.checkCollision(this.bucket, obs)) {
                obs.markedForDeletion = true;
                this.bucket.health--;
                this.createParticles(obs.x, obs.y, '#555');
                if (this.bucket.health <= 0) {
                    this.gameOver(false);
                }
            }
        });
        this.obstacles = this.obstacles.filter(o => !o.markedForDeletion);

        // Particles
        this.particles.forEach(p => p.update());
        this.particles = this.particles.filter(p => p.life > 0);

        this.updateHUD();
    }

    draw() {
        this.ctx.fillStyle = '#0a0a12';
        this.ctx.fillRect(0, 0, this.width, this.height);

        if (this.state === 'PLAYING' || this.state === 'RETURNING') {
            this.environment.draw(this.ctx);
            this.coins.forEach(coin => coin.draw(this.ctx));
            this.obstacles.forEach(obs => obs.draw(this.ctx));
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

window.onload = () => {
    const game = new Game();
};
