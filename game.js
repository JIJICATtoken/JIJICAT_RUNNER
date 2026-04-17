// ==========================================
// JIJICAT RUNNER - Main Game Script
// ==========================================

// Canvas Setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Responsive Canvas
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// ==========================================
// GAME STATES & CONFIG
// ==========================================

const GAME_STATES = {
    MENU: 'menu',
    PLAYING: 'playing',
    GAME_OVER: 'gameOver',
    LEADERBOARD: 'leaderboard'
};

const CONFIG = {
    INITIAL_SPEED: 8,
    MAX_SPEED: 20,
    SPEED_INCREMENT: 0.0015,
    LANE_WIDTH: canvas.width / 3,
    LANES: 3,
    GRAVITY: 0.6,
    JUMP_STRENGTH: 15,
    SLIDE_DURATION: 500,
    COMBO_TIMEOUT: 3000,
    DIFFICULTY_INCREASE: 0.98,
    SPAWN_RATE_BASE: 1000,
    SPAWN_RATE_MIN: 400
};

// ==========================================
// GAME STATE
// ==========================================

let gameState = {
    current: GAME_STATES.MENU,
    score: 0,
    distance: 0,
    coins: 0,
    totalCoins: localStorage.getItem('totalCoins') ? parseInt(localStorage.getItem('totalCoins')) : 0,
    bestScore: localStorage.getItem('bestScore') ? parseInt(localStorage.getItem('bestScore')) : 0,
    combo: 0,
    comboMultiplier: 1.0,
    speedMultiplier: 1.0,
    gameTime: 0,
    isPaused: false
};

// ==========================================
// PLAYER CLASS
// ==========================================

class Player {
    constructor() {
        this.lane = 1;
        this.x = CONFIG.LANE_WIDTH * this.lane + CONFIG.LANE_WIDTH / 2;
        this.y = canvas.height - 150;
        this.width = 40;
        this.height = 50;
        
        this.velocityY = 0;
        this.isJumping = false;
        this.isSliding = false;
        this.slidingTimer = 0;
        
        this.trailPoints = [];
        this.invulnerable = false;
        this.invulnerableTimer = 0;
        
        this.animationFrame = 0;
        this.animationSpeed = 0.1;
    }
    
    update() {
        // Gravity
        if (this.isJumping) {
            this.velocityY += CONFIG.GRAVITY;
            this.y += this.velocityY;
            
            // Land
            if (this.y >= canvas.height - 150) {
                this.y = canvas.height - 150;
                this.velocityY = 0;
                this.isJumping = false;
            }
        }
        
        // Sliding
        if (this.isSliding) {
            this.slidingTimer--;
            if (this.slidingTimer <= 0) {
                this.isSliding = false;
            }
        }
        
        // Invulnerability
        if (this.invulnerable) {
            this.invulnerableTimer--;
            if (this.invulnerableTimer <= 0) {
                this.invulnerable = false;
            }
        }
        
        // Trail
        this.trailPoints.push({
            x: this.x,
            y: this.y,
            life: 255
        });
        
        if (this.trailPoints.length > 15) {
            this.trailPoints.shift();
        }
        
        this.trailPoints.forEach(point => {
            point.life -= 15;
        });
        
        // Animation
        this.animationFrame += this.animationSpeed;
        if (this.animationFrame > 4) {
            this.animationFrame = 0;
        }
    }
    
    draw() {
        // Glowing trail
        this.trailPoints.forEach(point => {
            if (point.life > 0) {
                ctx.fillStyle = `rgba(255, 215, 0, ${point.life / 255 * 0.3})`;
                ctx.fillRect(point.x - this.width / 2, point.y - this.height / 2, this.width, this.height);
            }
        });
        
        // Invulnerability flash
        if (this.invulnerable && Math.floor(this.invulnerableTimer / 10) % 2 === 0) {
            return;
        }
        
        // Character body
        ctx.save();
        
        // Draw cat body with glow
        const glow = this.invulnerable ? '#00ff00' : '#ffd700';
        ctx.shadowColor = glow;
        ctx.shadowBlur = 20;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        
        // Body
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(this.x, this.y, this.width / 2, this.height / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Eyes (glowing)
        ctx.fillStyle = '#ffff00';
        ctx.beginPath();
        ctx.arc(this.x - 10, this.y - 5, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(this.x + 10, this.y - 5, 6, 0, Math.PI * 2);
        ctx.fill();
        
        // Pupils
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(this.x - 10, this.y - 5, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(this.x + 10, this.y - 5, 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Ears
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(this.x - 12, this.y - 20);
        ctx.lineTo(this.x - 18, this.y - 35);
        ctx.lineTo(this.x - 8, this.y - 20);
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(this.x + 12, this.y - 20);
        ctx.lineTo(this.x + 8, this.y - 20);
        ctx.lineTo(this.x + 18, this.y - 35);
        ctx.fill();
        
        // Inner ear (red/pink)
        ctx.fillStyle = '#ff69b4';
        ctx.beginPath();
        ctx.moveTo(this.x - 10, this.y - 22);
        ctx.lineTo(this.x - 14, this.y - 30);
        ctx.lineTo(this.x - 7, this.y - 22);
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(this.x + 10, this.y - 22);
        ctx.lineTo(this.x + 7, this.y - 22);
        ctx.lineTo(this.x + 14, this.y - 30);
        ctx.fill();
        
        // Crown
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.moveTo(this.x - 15, this.y - 22);
        ctx.lineTo(this.x - 12, this.y - 40);
        ctx.lineTo(this.x - 5, this.y - 35);
        ctx.lineTo(this.x, this.y - 42);
        ctx.lineTo(this.x + 5, this.y - 35);
        ctx.lineTo(this.x + 12, this.y - 40);
        ctx.lineTo(this.x + 15, this.y - 22);
        ctx.fill();
        
        // Crown gems
        ctx.fillStyle = '#ff0000';
        ctx.beginPath();
        ctx.arc(this.x - 12, this.y - 40, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#00ffff';
        ctx.beginPath();
        ctx.arc(this.x, this.y - 42, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ff0000';
        ctx.beginPath();
        ctx.arc(this.x + 12, this.y - 40, 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Royal outfit (chest plate)
        ctx.fillStyle = '#4a4a4a';
        ctx.fillRect(this.x - 18, this.y + 5, 36, 20);
        
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(this.x - 16, this.y + 7, 32, 3);
        ctx.fillRect(this.x - 16, this.y + 18, 32, 3);
        
        ctx.restore();
    }
    
    jump() {
        if (!this.isJumping && !this.isSliding) {
            this.velocityY = -CONFIG.JUMP_STRENGTH;
            this.isJumping = true;
        }
    }
    
    slide() {
        if (!this.isJumping && !this.isSliding) {
            this.isSliding = true;
            this.slidingTimer = CONFIG.SLIDE_DURATION;
        }
    }
    
    changeLane(direction) {
        let newLane = this.lane + direction;
        if (newLane >= 0 && newLane < CONFIG.LANES) {
            this.lane = newLane;
            this.x = CONFIG.LANE_WIDTH * this.lane + CONFIG.LANE_WIDTH / 2;
        }
    }
    
    checkCollision(obstacle) {
        if (this.invulnerable) return false;
        
        const playerHalfWidth = this.width / 2;
        const playerHalfHeight = this.isSliding ? this.height / 3 : this.height / 2;
        
        const playerRect = {
            left: this.x - playerHalfWidth,
            right: this.x + playerHalfWidth,
            top: this.y - playerHalfHeight,
            bottom: this.y + playerHalfHeight
        };
        
        const obsRect = {
            left: obstacle.x,
            right: obstacle.x + obstacle.width,
            top: obstacle.y,
            bottom: obstacle.y + obstacle.height
        };
        
        return !(playerRect.right < obsRect.left || 
                 playerRect.left > obsRect.right || 
                 playerRect.bottom < obsRect.top || 
                 playerRect.top > obsRect.bottom);
    }
}

// ==========================================
// OBSTACLE CLASSES
// ==========================================

class Obstacle {
    constructor(x, type = 'fire') {
        this.x = x;
        this.y = 0;
        this.width = CONFIG.LANE_WIDTH - 10;
        this.height = 30;
        this.type = type;
        this.speed = gameState.speedMultiplier;
    }
    
    update() {
        this.y += this.speed;
    }
    
    draw() {
        ctx.save();
        ctx.shadowBlur = 15;
        
        if (this.type === 'fire') {
            ctx.shadowColor = '#ff6600';
            ctx.fillStyle = '#ff4400';
            ctx.fillRect(this.x + 2, this.y, this.width - 4, this.height);
            
            // Flame effect
            ctx.fillStyle = '#ffaa00';
            ctx.beginPath();
            ctx.moveTo(this.x + 10, this.y);
            ctx.quadraticCurveTo(this.x + 15, this.y - 10, this.x + 20, this.y);
            ctx.fill();
            
            ctx.beginPath();
            ctx.moveTo(this.x + 40, this.y);
            ctx.quadraticCurveTo(this.x + 45, this.y - 10, this.x + 50, this.y);
            ctx.fill();
        } else if (this.type === 'laser') {
            ctx.shadowColor = '#00ff00';
            ctx.fillStyle = 'rgba(0, 255, 0, 0.8)';
            ctx.fillRect(this.x + 2, this.y, this.width - 4, this.height);
            
            // Laser glow
            ctx.strokeStyle = '#00ffff';
            ctx.lineWidth = 3;
            ctx.strokeRect(this.x + 2, this.y, this.width - 4, this.height);
        } else if (this.type === 'gap') {
            ctx.shadowColor = '#ff00ff';
            ctx.fillStyle = 'rgba(255, 0, 255, 0.3)';
            ctx.fillRect(this.x + 2, this.y, this.width - 4, this.height);
            
            ctx.strokeStyle = '#ff00ff';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.strokeRect(this.x + 2, this.y, this.width - 4, this.height);
            ctx.setLineDash([]);
        }
        
        ctx.restore();
    }
}

class Collectible {
    constructor(x) {
        this.x = x;
        this.y = 0;
        this.width = 20;
        this.height = 20;
        this.speed = gameState.speedMultiplier;
        this.rotation = 0;
        this.type = 'coin'; // coin, magnet, shield, speedboost
        
        // Random power-up chance (10%)
        if (Math.random() < 0.1) {
            const powerups = ['magnet', 'shield', 'speedboost'];
            this.type = powerups[Math.floor(Math.random() * powerups.length)];
        }
    }
    
    update() {
        this.y += this.speed;
        this.rotation += 0.1;
    }
    
    draw() {
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.rotate(this.rotation);
        
        if (this.type === 'coin') {
            ctx.shadowColor = '#ffd700';
            ctx.shadowBlur = 15;
            ctx.fillStyle = '#ffd700';
            ctx.beginPath();
            ctx.arc(0, 0, 10, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#ffed4e';
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('$', 0, 0);
        } else if (this.type === 'magnet') {
            ctx.shadowColor = '#00ffff';
            ctx.shadowBlur = 15;
            ctx.fillStyle = '#00ffff';
            ctx.fillRect(-8, -8, 16, 16);
            
            ctx.fillStyle = '#0099ff';
            ctx.fillRect(-5, -8, 3, 16);
            ctx.fillRect(2, -8, 3, 16);
        } else if (this.type === 'shield') {
            ctx.shadowColor = '#00ff00';
            ctx.shadowBlur = 15;
            ctx.strokeStyle = '#00ff00';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, 10, 0, Math.PI * 2);
            ctx.stroke();
            
            ctx.fillStyle = 'rgba(0, 255, 0, 0.3)';
            ctx.beginPath();
            ctx.arc(0, 0, 8, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.type === 'speedboost') {
            ctx.shadowColor = '#ff00ff';
            ctx.shadowBlur = 15;
            ctx.fillStyle = '#ff00ff';
            ctx.beginPath();
            ctx.moveTo(0, -10);
            ctx.lineTo(10, 0);
            ctx.lineTo(0, 10);
            ctx.lineTo(-10, 0);
            ctx.fill();
        }
        
        ctx.restore();
    }
}

// ==========================================
// PARTICLE SYSTEM
// ==========================================

class Particle {
    constructor(x, y, type = 'coin') {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 8;
        this.vy = -Math.random() * 8 - 2;
        this.life = 1;
        this.type = type;
    }
    
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.2; // gravity
        this.life -= 0.02;
    }
    
    draw() {
        ctx.save();
        ctx.globalAlpha = this.life;
        
        if (this.type === 'coin') {
            ctx.fillStyle = '#ffd700';
            ctx.beginPath();
            ctx.arc(this.x, this.y, 5, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.type === 'shield') {
            ctx.strokeStyle = '#00ff00';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(this.x, this.y, 5, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        ctx.restore();
    }
}

// ==========================================
// BACKGROUND GRID
// ==========================================

class Grid {
    constructor() {
        this.offset = 0;
        this.speed = CONFIG.INITIAL_SPEED;
    }
    
    update() {
        this.speed = gameState.speedMultiplier;
        this.offset += this.speed;
        if (this.offset > 50) {
            this.offset -= 50;
        }
    }
    
    draw() {
        ctx.strokeStyle = 'rgba(0, 212, 255, 0.2)';
        ctx.lineWidth = 1;
        
        // Horizontal lines
        for (let y = -this.offset; y < canvas.height; y += 50) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
        }
        
        // Vertical lines
        for (let x = 0; x < canvas.width; x += 50) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
        }
        
        // Glow points at intersections
        ctx.fillStyle = 'rgba(0, 212, 255, 0.4)';
        for (let y = -this.offset; y < canvas.height; y += 50) {
            for (let x = 0; x < canvas.width; x += 50) {
                ctx.beginPath();
                ctx.arc(x, y, 2, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }
}

// ==========================================
// GAME OBJECTS
// ==========================================

let player = new Player();
let grid = new Grid();
let obstacles = [];
let collectibles = [];
let particles = [];
let lastSpawnTime = 0;
let lastComboTime = 0;
let activePowerups = {
    magnet: false,
    shield: false,
    speedboost: false
};

// ==========================================
// INPUT HANDLING
// ==========================================

const keys = {};

document.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    
    if (e.key === 'ArrowUp' || e.key === 'w') player.jump();
    if (e.key === 'ArrowDown' || e.key === 's') player.slide();
    if (e.key === 'ArrowLeft' || e.key === 'a') player.changeLane(-1);
    if (e.key === 'ArrowRight' || e.key === 'd') player.changeLane(1);
});

document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// Touch/Swipe Controls
let touchStartX = 0;
let touchStartY = 0;

document.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
});

document.addEventListener('touchmove', (e) => {
    if (gameState.current !== GAME_STATES.PLAYING) return;
    
    const touchEndX = e.touches[0].clientX;
    const touchEndY = e.touches[0].clientY;
    
    const diffX = touchEndX - touchStartX;
    const diffY = touchEndY - touchStartY;
    
    const threshold = 30;
    
    if (Math.abs(diffY) > Math.abs(diffX)) {
        if (diffY < -threshold) {
            player.jump();
            touchStartY = touchEndY;
        } else if (diffY > threshold) {
            player.slide();
            touchStartY = touchEndY;
        }
    } else {
        if (diffX < -threshold) {
            player.changeLane(1);
            touchStartX = touchEndX;
        } else if (diffX > threshold) {
            player.changeLane(-1);
            touchStartX = touchEndX;
        }
    }
});

// ==========================================
// GAME LOGIC
// ==========================================

function spawnObstacle() {
    const lane = Math.floor(Math.random() * CONFIG.LANES);
    const x = CONFIG.LANE_WIDTH * lane;
    const types = ['fire', 'laser', 'gap'];
    const type = types[Math.floor(Math.random() * types.length)];
    obstacles.push(new Obstacle(x, type));
}

function spawnCollectible() {
    const lane = Math.floor(Math.random() * CONFIG.LANES);
    const x = CONFIG.LANE_WIDTH * lane + CONFIG.LANE_WIDTH / 2 - 10;
    collectibles.push(new Collectible(x));
}

function updateGame() {
    if (gameState.current !== GAME_STATES.PLAYING) return;
    
    // Update speed
    gameState.speedMultiplier += CONFIG.SPEED_INCREMENT;
    gameState.speedMultiplier = Math.min(gameState.speedMultiplier, CONFIG.MAX_SPEED);
    
    // Update player
    player.update();
    grid.update();
    
    // Update distance and score
    gameState.distance += gameState.speedMultiplier / 10;
    gameState.score += Math.floor(gameState.speedMultiplier * gameState.comboMultiplier);
    gameState.gameTime++;
    
    // Combo timeout
    if (gameState.gameTime - lastComboTime > CONFIG.COMBO_TIMEOUT) {
        gameState.combo = 0;
        gameState.comboMultiplier = 1.0;
    }
    
    // Spawn obstacles
    const spawnRate = Math.max(
        CONFIG.SPAWN_RATE_MIN,
        CONFIG.SPAWN_RATE_BASE - (gameState.distance / 10)
    );
    
    if (gameState.gameTime - lastSpawnTime > spawnRate) {
        if (Math.random() < 0.7) {
            spawnObstacle();
        } else {
            spawnCollectible();
        }
        lastSpawnTime = gameState.gameTime;
    }
    
    // Update obstacles
    obstacles.forEach((obs, index) => {
        obs.update();
        
        // Check collision
        if (player.checkCollision(obs)) {
            if (activePowerups.shield) {
                activePowerups.shield = false;
                obstacles.splice(index, 1);
            } else {
                gameOver();
            }
        }
        
        // Remove if off screen
        if (obs.y > canvas.height) {
            obstacles.splice(index, 1);
        }
    });
    
    // Update collectibles
    collectibles.forEach((col, index) => {
        col.update();
        
        // Magnet effect
        if (activePowerups.magnet) {
            const dist = Math.hypot(col.x - player.x, col.y - player.y);
            if (dist < 100) {
                const angle = Math.atan2(player.y - col.y, player.x - col.x);
                col.x += Math.cos(angle) * 5;
                col.y += Math.sin(angle) * 5;
            }
        }
        
        // Check collection
        if (play
