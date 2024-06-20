// new.js
const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");

canvas.width = innerWidth;
canvas.height = innerHeight;

const originX = canvas.width / 2;
const originY = canvas.height / 2;

const floorY = canvas.height - 100;

const SPRITE_HEIGHT = 100;
const SPRITE_WIDTH = 100;

const hpBar = document.getElementById('hpBar');
const pauseButton = document.getElementById('pauseButton');
const restartButton = document.getElementById('restartButton');
const scoreEl = document.getElementById('score');
const bestEl = document.getElementById('best');

class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.score = 0
        this.width = SPRITE_WIDTH;
        this.height = SPRITE_HEIGHT;
        this.velocityX = 0;
        this.velocityY = 0;
        this.gravity = 0.5;
        this.jumpStrength = -10;
        this.onGround = false;
        this.facingRight = true; 
        this.jumpCount = 0;
        this.maxJumps = 2;
        this.hitpoints = 100;
        this.alive = true;  
        this.bestScore = 0;

        this.animations = {
            idle: [],
            moveLeft: [],
            moveRight: [],
            jump: [],
            hurt: [],
            die: []
        };
        this.currentAnimation = 'idle';
        this.currentFrame = 0;
        this.frameDelay = 5;
        this.frameCounter = 0;

        this.loadFrames('idle', 5, './assets/sprites/2/1_IDLE_00');
        this.loadFrames('moveLeft', 5, './assets/sprites/2/2_WALK_00');
        this.loadFrames('moveRight', 5, './assets/sprites/2/2_WALK_00');
        this.loadFrames('jump', 5, './assets/sprites/2/5_JUMP_00');
        this.loadFrames('hurt', 5, './assets/sprites/2/7_HURT_00');
        this.loadFrames('die', 5, './assets/sprites/2/8_DIE_00');
    }

    loadFrames(animation, count, path) {
        for (let i = 0; i < count; i++) {
            const img = new Image();
            img.src = `${path}${i}.png`;
            this.animations[animation].push(img);
        }
    }

    update() {
        if (!this.onGround) {
            this.velocityY += this.gravity;
        } else {
            this.velocityY = 0;
            this.jumpCount = 0;
        }
        this.x += this.velocityX;
        this.y += this.velocityY;

        if (this.y >= floorY - this.height) {
            this.y = floorY - this.height;
            this.onGround = true;
        } else {
            this.onGround = false;
        }

        this.frameCounter++;
        if (this.frameCounter >= this.frameDelay) {
            this.currentFrame = (this.currentFrame + 1) % this.animations[this.currentAnimation].length;
            this.frameCounter = 0;
        }

        if (this.hitpoints <= 0 && this.alive) {
            this.die();
        }

        this.updateHpBar();
    }

    updateHpBar() {
        const hpPercent = Math.max(0, (this.hitpoints / 100) * 100);
        hpBar.style.width = `${hpPercent}%`;
        if (hpPercent > 75) {
            hpBar.style.backgroundColor = 'lime';
        } else if (hpPercent > 50) {
            hpBar.style.backgroundColor = 'yellow';
        } else if (hpPercent > 25) {
            hpBar.style.backgroundColor = 'orange';
        } else {
            hpBar.style.backgroundColor = 'red';
        }
    }

    draw() {
        const img = this.animations[this.currentAnimation][this.currentFrame];
        if (img.complete && img.naturalHeight !== 0) {
            ctx.save();
            if (!this.facingRight) {
                ctx.scale(-1, 1); 
                ctx.drawImage(img, -this.x - this.width, this.y, this.width, this.height);
            } else {
                ctx.drawImage(img, this.x, this.y, this.width, this.height);
            }
            ctx.restore(); 
        }
    }

    setAnimation(animation) {
        if (this.currentAnimation !== animation) {
            this.currentAnimation = animation;
            this.currentFrame = 0;
            this.frameCounter = 0;
        }
    }

    moveLeft() {
        if (this.alive) {
            this.velocityX = -5;
            this.facingRight = false;
            this.setAnimation('moveLeft');
        }
    }

    moveRight() {
        if (this.alive) {
            this.velocityX = 5;
            this.facingRight = true;
            this.setAnimation('moveRight');
        }
    }

    jump() {
        if (this.alive && this.jumpCount < this.maxJumps) {
            this.velocityY = this.jumpStrength;
            this.setAnimation('jump');
            this.onGround = false;
            this.jumpCount++;
        }
    }

    hurt() {
        if (this.alive) {
            this.setAnimation('hurt');
            this.hitpoints -= 10;
            if (this.hitpoints <= 0) {
                this.die();
            }
        }
    }

     die() {
        this.setAnimation('die');
        this.alive = false;
        this.deathTime = Date.now();
    }
    isDeathAnimationComplete() {
        
        const deathAnimationDuration = this.animations['die'].length * this.frameDelay * (1000 / 60);  
        return (Date.now() - this.deathTime) >= deathAnimationDuration;
    }

    stop() {
        if (this.alive) {
            this.velocityX = 0;
            if (this.onGround) {
                this.setAnimation('idle');
            }
        }
    }
}

class Projectile {
    constructor(x, y, targetX, targetY) {
        this.x = x;
        this.y = y;
        this.radius = 20;
        this.gravity = 0.3;

        this.animations = {
            shoot: { img: null, frameWidth: 0, frameHeight: 0, frames: 6 },
            hitOrc: { img: null, frameWidth: 0, frameHeight: 0, frames: 6 },
            hitFloor: { img: null, frameWidth: 0, frameHeight: 0, frames: 6 }
        };
        this.currentAnimation = 'shoot';
        this.currentFrame = 0;
        this.frameDelay = 5;
        this.frameCounter = 0;

        this.loadFrames('shoot', './assets/sprites/projectile/bullet.png', 6);
        this.loadFrames('hitOrc',  './assets/sprites/projectile/bullet.png', 6);
        this.loadFrames('hitFloor',  './assets/sprites/projectile/bullet.png', 6);

        const angle = Math.atan2(targetY - y, targetX - x);
        this.velocityX = Math.cos(angle) * 17;
        this.velocityY = Math.sin(angle) * 17;
    }

    loadFrames(animation, imgSrc, frames) {
        const img = new Image();
        img.src = imgSrc;
        img.onload = () => {
            this.animations[animation].img = img;
            this.animations[animation].frameWidth = img.width / frames;
            this.animations[animation].frameHeight = img.height;
        };
    }

    update() {
        if (this.currentAnimation === 'shoot') {
            this.velocityY += this.gravity; 
            this.x += this.velocityX;
            this.y += this.velocityY;
        }

        
        this.frameCounter++;
        if (this.frameCounter >= this.frameDelay) {
            this.currentFrame = (this.currentFrame + 1) % this.animations[this.currentAnimation].frames;
            this.frameCounter = 0;
        }
    }

    draw() {
        const animation = this.animations[this.currentAnimation];
        const frameX = this.currentFrame * animation.frameWidth;
        if (animation.img) {
            ctx.drawImage(
                animation.img,
                frameX, 0,
                animation.frameWidth, animation.frameHeight,
                this.x, this.y,
                this.radius * 2, this.radius * 2
            );
        }
    }

    setAnimation(animation) {
        if (this.currentAnimation !== animation) {
            this.currentAnimation = animation;
            this.currentFrame = 0;
            this.frameCounter = 0;
        }
    }
}


class regularOrc {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = SPRITE_WIDTH;
        this.height = SPRITE_HEIGHT;
        this.velocityX = 0;
        this.speed = 1; 
        this.hitpoints = 20; 
        this.alive = true;
        this.animations = {
            idle: [],
            walk: [],
            attack: [],
            hurt: [],
            die: []
        };
        this.currentAnimation = 'idle';
        this.currentFrame = 0;
        this.frameDelay = 5;
        this.frameCounter = 0;
        this.lastAttackTime = 0;
        this.facingRight = true; 
        this.loadFrames('idle', 7, './assets/sprites/regOrc/IDLE/IDLE_00');
        this.loadFrames('walk', 7, './assets/sprites/regOrc/WALK/WALK_00');
        this.loadFrames('attack', 7, './assets/sprites/regOrc/ATTAK/ATTAK_00');
        this.loadFrames('hurt', 7, './assets/sprites/regOrc/HURT/HURT_00');
        this.loadFrames('die', 7, './assets/sprites/regOrc/DIE/DIE_00');
    }

    loadFrames(animation, count, path) {
        for (let i = 0; i < count; i++) {
            const img = new Image();
            img.src = `${path}${i}.png`;
            this.animations[animation].push(img);
        }
    }

    calculateDistance(player) {
        const dx = player.x - this.x;
        return Math.abs(dx);
    }

    moveTowards(player) {
        const dx = player.x - this.x;
        if (dx !== 0) {
            this.velocityX = (dx / Math.abs(dx)) * this.speed;
            this.facingRight = dx > 0;
            this.setAnimation('walk');
        }
    }

    update(player) {
        if (!this.alive) {
            if (this.currentAnimation !== 'die') {
                this.setAnimation('die');
            }
            this.frameCounter++;
            if (this.frameCounter >= this.frameDelay) {
                this.currentFrame = (this.currentFrame + 1) % this.animations[this.currentAnimation].length;
                this.frameCounter = 0;
            }
            return;
        }

        if (this.alive && this.currentAnimation !== 'attack') {
            this.moveTowards(player);
        }

        this.x += this.velocityX;

        
        this.frameCounter++;
        if (this.frameCounter >= this.frameDelay) {
            this.currentFrame = (this.currentFrame + 1) % this.animations[this.currentAnimation].length;
            this.frameCounter = 0;
        }
    }

    draw() {
        const img = this.animations[this.currentAnimation][this.currentFrame];
        if (img.complete && img.naturalHeight !== 0) {
            ctx.save(); 
            if (!this.facingRight) {
                ctx.scale(-1, 1); 
                ctx.drawImage(img, -this.x - this.width, this.y, this.width, this.height);
            } else {
                ctx.drawImage(img, this.x, this.y, this.width, this.height);
            }
            ctx.restore(); 
        }
    }

    attack() {
        const now = Date.now();
        if (now - this.lastAttackTime > 2000) { 
            this.setAnimation('attack');
            this.velocityX = 0; 
            this.lastAttackTime = now;
            return true;
        }
        return false;
    }

    hurt() {
        if (this.alive) {
            this.setAnimation('hurt');
            this.hitpoints -= 10;
            if (this.hitpoints <= 0) {
                this.die();
            }
        }
    }

     die() {
        this.setAnimation('die');
        this.alive = false;
        this.deathTime = Date.now();  
    }

    
    isDeathAnimationComplete() {
        
        const deathAnimationDuration = this.animations['die'].length * this.frameDelay * (1000 / 60); 
        return (Date.now() - this.deathTime) >= deathAnimationDuration;
    }

    setAnimation(animation) {
        if (this.currentAnimation !== animation) {
            this.currentAnimation = animation;
            this.currentFrame = 0;
            this.frameCounter = 0;
        }
    }

   
    isDead() {
        return this.currentAnimation === 'die' && this.currentFrame === this.animations['die'].length - 1;
    }

    removeAnimation() {
        this.currentAnimation = 'idle';
        this.currentFrame = 0;
        this.frameCounter = 0;
    }
}

class speedOrc {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = SPRITE_WIDTH-10;
        this.height = SPRITE_HEIGHT;
        this.velocityX = 0;
        this.speed = 4; 
        this.hitpoints = 20; 
        this.alive = true;
        this.animations = {
            idle: [],
            walk: [],
            attack: [],
            hurt: [],
            die: []
        };
        this.currentAnimation = 'idle';
        this.currentFrame = 0;
        this.frameDelay = 5;
        this.frameCounter = 0;
        this.lastAttackTime = 0;
        this.facingRight = true; 
        this.loadFrames('idle', 7, './assets/sprites/speedOrc/IDLE/IDLE_00');
        this.loadFrames('walk', 7, './assets/sprites/speedOrc/RUN/RUN_00');
        this.loadFrames('attack', 7, './assets/sprites/speedOrc/ATTAK/ATTAK_00');
        this.loadFrames('hurt', 7, './assets/sprites/speedOrc/HURT/HURT_00');
        this.loadFrames('die', 7, './assets/sprites/speedOrc/DIE/DIE_00');
    }

    loadFrames(animation, count, path) {
        for (let i = 0; i < count; i++) {
            const img = new Image();
            img.src = `${path}${i}.png`;
            this.animations[animation].push(img);
        }
    }

    calculateDistance(player) {
        const dx = player.x - this.x;
        return Math.abs(dx);
    }

    moveTowards(player) {
        const dx = player.x - this.x;
        if (dx !== 0) {
            this.velocityX = (dx / Math.abs(dx)) * this.speed;
            this.facingRight = dx > 0;
            this.setAnimation('walk');
        }
    }

    update(player) {
        if (!this.alive) {
            if (this.currentAnimation !== 'die') {
                this.setAnimation('die');
            }
            this.frameCounter++;
            if (this.frameCounter >= this.frameDelay) {
                this.currentFrame = (this.currentFrame + 1) % this.animations[this.currentAnimation].length;
                this.frameCounter = 0;
            }
            return;
        }

        if (this.alive && this.currentAnimation !== 'attack') {
            this.moveTowards(player);
        }

        this.x += this.velocityX;

        
        this.frameCounter++;
        if (this.frameCounter >= this.frameDelay) {
            this.currentFrame = (this.currentFrame + 1) % this.animations[this.currentAnimation].length;
            this.frameCounter = 0;
        }
    }

    draw() {
        const img = this.animations[this.currentAnimation][this.currentFrame];
        if (img.complete && img.naturalHeight !== 0) {
            ctx.save(); 
            if (!this.facingRight) {
                ctx.scale(-1, 1); 
                ctx.drawImage(img, -this.x - this.width, this.y, this.width, this.height);
            } else {
                ctx.drawImage(img, this.x, this.y, this.width, this.height);
            }
            ctx.restore(); 
        }
    }

    attack() {
        const now = Date.now();
        if (now - this.lastAttackTime > 2000) { 
            this.setAnimation('attack');
            this.velocityX = 0; 
            this.lastAttackTime = now;
            return true;
        }
        return false;
    }

    hurt() {
        if (this.alive) {
            this.setAnimation('hurt');
            this.hitpoints -= 10;
            if (this.hitpoints <= 0) {
                this.die();
            }
        }
    }

     die() {
        this.setAnimation('die');
        this.alive = false;
        this.deathTime = Date.now();  
    }

    
    isDeathAnimationComplete() {
        
        const deathAnimationDuration = this.animations['die'].length * this.frameDelay * (1000 / 60); 
        return (Date.now() - this.deathTime) >= deathAnimationDuration;
    }

    setAnimation(animation) {
        if (this.currentAnimation !== animation) {
            this.currentAnimation = animation;
            this.currentFrame = 0;
            this.frameCounter = 0;
        }
    }

   
    isDead() {
        return this.currentAnimation === 'die' && this.currentFrame === this.animations['die'].length - 1;
    }

    removeAnimation() {
        this.currentAnimation = 'idle';
        this.currentFrame = 0;
        this.frameCounter = 0;
    }
}

class giantOrc {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = SPRITE_WIDTH*2;
        this.height = SPRITE_HEIGHT*2;
        this.velocityX = 0;
        this.speed = 0.5; 
        this.hitpoints = 50; 
        this.alive = true;
        this.animations = {
            idle: [],
            walk: [],
            attack: [],
            hurt: [],
            die: []
        };
        this.currentAnimation = 'idle';
        this.currentFrame = 0;
        this.frameDelay = 5;
        this.frameCounter = 0;
        this.lastAttackTime = 0;
        this.facingRight = true; 
        this.loadFrames('idle', 7, './assets/sprites/giantOrc/IDLE/IDLE_00');
        this.loadFrames('walk', 7, './assets/sprites/giantOrc/WALK/WALK_00');
        this.loadFrames('attack', 7, './assets/sprites/giantOrc/ATTAK/ATTAK_00');
        this.loadFrames('hurt', 7, './assets/sprites/giantOrc/HURT/HURT_00');
        this.loadFrames('die', 7, './assets/sprites/giantOrc/DIE/DIE_00');
    }

    loadFrames(animation, count, path) {
        for (let i = 0; i < count; i++) {
            const img = new Image();
            img.src = `${path}${i}.png`;
            this.animations[animation].push(img);
        }
    }

    calculateDistance(player) {
        const dx = player.x - this.x;
        return Math.abs(dx);
    }

    moveTowards(player) {
        const dx = player.x - this.x;
        if (dx !== 0) {
            this.velocityX = (dx / Math.abs(dx)) * this.speed;
            this.facingRight = dx > 0;
            this.setAnimation('walk');
        }
    }

    update(player) {
        if (!this.alive) {
            if (this.currentAnimation !== 'die') {
                this.setAnimation('die');
            }
            this.frameCounter++;
            if (this.frameCounter >= this.frameDelay) {
                this.currentFrame = (this.currentFrame + 1) % this.animations[this.currentAnimation].length;
                this.frameCounter = 0;
            }
            return;
        }

        if (this.alive && this.currentAnimation !== 'attack') {
            this.moveTowards(player);
        }

        this.x += this.velocityX;

        
        this.frameCounter++;
        if (this.frameCounter >= this.frameDelay) {
            this.currentFrame = (this.currentFrame + 1) % this.animations[this.currentAnimation].length;
            this.frameCounter = 0;
        }
    }

    draw() {
        const img = this.animations[this.currentAnimation][this.currentFrame];
        if (img.complete && img.naturalHeight !== 0) {
            ctx.save(); 
            if (!this.facingRight) {
                ctx.scale(-1, 1); 
                ctx.drawImage(img, -this.x - this.width, this.y, this.width, this.height);
            } else {
                ctx.drawImage(img, this.x, this.y, this.width, this.height);
            }
            ctx.restore(); 
        }
    }

    attack() {
        const now = Date.now();
        if (now - this.lastAttackTime > 2000) { 
            this.setAnimation('attack');
            this.velocityX = 0; 
            this.lastAttackTime = now;
            return true;
        }
        return false;
    }

    hurt() {
        if (this.alive) {
            this.setAnimation('hurt');
            this.hitpoints -= 10;
            if (this.hitpoints <= 0) {
                this.die();
            }
        }
    }

     die() {
        this.setAnimation('die');
        this.alive = false;
        this.deathTime = Date.now();  
    }

    
    isDeathAnimationComplete() {
        
        const deathAnimationDuration = this.animations['die'].length * this.frameDelay * (1000 / 6); 
        return (Date.now() - this.deathTime) >= deathAnimationDuration;
    }

    setAnimation(animation) {
        if (this.currentAnimation !== animation) {
            this.currentAnimation = animation;
            this.currentFrame = 0;
            this.frameCounter = 0;
        }
    }

   
    isDead() {
        return this.currentAnimation === 'die' && this.currentFrame === this.animations['die'].length - 1;
    }

    removeAnimation() {
        this.currentAnimation = 'idle';
        this.currentFrame = 0;
        this.frameCounter = 0;
    }
}

const player = new Player(originX-SPRITE_WIDTH/2, floorY - 50);

const orcs = [];
const regOrcs = [];
const giantOrcs = [];
const speedOrcs = [];

const projectiles = [];

function spawnOrc() {
    const x = Math.random() < 0.5 ? 0 : canvas.width;
    const orc = new regularOrc(x, floorY - SPRITE_WIDTH);
    orcs.push(orc);
    regOrcs.push(orc);
}
function spawnGiantOrc() {
    const x = Math.random() < 0.5 ? 0 : canvas.width;
    const orc = new giantOrc(x, floorY - SPRITE_WIDTH*2);
    orcs.push(orc);
    giantOrcs.push(orc);
}
function spawnSpeedOrc() {
    const x = Math.random() < 0.5 ? 0 : canvas.width;
    const orc = new speedOrc(x, floorY - SPRITE_WIDTH);
    orcs.push(orc);
    speedOrcs.push(orc);
}

setInterval(spawnOrc, 3000);
setInterval(spawnGiantOrc, 15000);
setInterval(spawnSpeedOrc, 8000);


const keys = {
    left: false,
    right: false,
    up: false,
    pause: false
};

let paused = false;

window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') keys.left = true;
    if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') keys.right = true;
    if (e.key === 'ArrowUp' || e.key.toLowerCase() === 'w') keys.up = true;
    if (e.keyCode === 32 || e.key.toLowerCase() === 'p') keys.pause = paused = !paused;
    paused? pauseButton.textContent = '': pauseButton.textContent = '';
});

window.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') keys.left = false;
    if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') keys.right = false;
    if (e.key === 'ArrowUp' || e.key.toLowerCase() === 'w') keys.up = false;
});

pauseButton.addEventListener('click', () => {
    paused = !paused;
    paused? pauseButton.textContent = '': pauseButton.textContent = '';
});

restartButton.addEventListener('click', () => {
    restart();
});

canvas.addEventListener('click', (e) => {
    if (player.alive) {
        const rect = canvas.getBoundingClientRect();
        const targetX = e.clientX - rect.left;
        const targetY = e.clientY - rect.top - SPRITE_HEIGHT ;
        const projectile = new Projectile(player.x + player.width / 2, player.y + player.height / 2, targetX, targetY);
        projectiles.push(projectile);
    }
});

function handleInput() {
    if (keys.left) {
        player.moveLeft();
    } else if (keys.right) {
        player.moveRight();
    } else {
        player.stop();
    }

    if (keys.up) {
        player.jump();
    }

    if (keys.pause) {
        paused = !paused;
        keys.pause = false;
    }
}

function checkCollisions() {
    orcs.forEach((orc, orcIndex) => {
        if (!orc.alive && orc.isDeathAnimationComplete()) {
            orcs.splice(orcIndex, 1); 
            return; 
        }

        const distance = orc.calculateDistance(player);
        if (distance < orc.width / 2) {
            orc.velocityX = 0;
            if (orc.attack()) {
                player.hurt();
            }
        } else {
            orc.moveTowards(player);
        }

        projectiles.forEach((projectile, projectileIndex) => {
            const distance = Math.hypot(orc.x - projectile.x, orc.y - projectile.y);
            if (distance < orc.width / 2) {
                orc.hurt(); 
                if (orc.hitpoints <= 0) {
                   
                    
                        if (orc instanceof regularOrc) {
                        regOrcs.splice(orcIndex, 1);
                        player.score += 75;
                    }
                    else if (orc instanceof giantOrc) {
                        giantOrcs.splice(orcIndex, 1);
                        player.score += 200;
                    }
                    else if (orc instanceof speedOrc) {
                        speedOrcs.splice(orcIndex, 1);
                        player.score += 125;
                    }
                    // orcs.splice(orcIndex, 1);
                }
                projectile.setAnimation('hitOrc');
                setTimeout(() => projectiles.splice(projectileIndex, 1), projectile.animations['hitOrc'].frames * projectile.frameDelay);
            }
        });
    });

    projectiles.forEach((projectile, index) => {
        if (projectile.y > floorY) {
            projectile.setAnimation('hitFloor');
            setTimeout(() => projectiles.splice(index, 1), projectile.animations['hitFloor'].frames * projectile.frameDelay);
        } else if (projectile.y > canvas.height || projectile.x < 0 || projectile.x > canvas.width) {
            projectiles.splice(index, 1);
        }
    });
}

function animate() {
    console.log(player.score);
    if (paused) {
        requestAnimationFrame(animate);
        return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = 'rgba(0, 0, 0, 0)';
    ctx.fillRect(0, floorY, canvas.width, canvas.height - floorY);

    handleInput();

    player.update();
    player.draw();

    projectiles.forEach((projectile, index) => {
        projectile.update();
        projectile.draw();
    });

    orcs.forEach((orc, index) => {
        orc.update(player);
        orc.draw();
    });

    for (let i = orcs.length - 1; i >= 0; i--) {
        if (orcs[i].isDead() && orcs[i].isDeathAnimationComplete()) {
            orcs.splice(i, 1);
        }
    }
    scoreEl.textContent = `Score: ${player.score}`
    bestEl.textContent = `Best: ${player.bestScore}`
    checkCollisions();

    checkGameOver();

    requestAnimationFrame(animate);
}

animate();

function restart() {
    player.x = originX - SPRITE_WIDTH / 2;
    player.y = floorY - SPRITE_HEIGHT / 2;
    player.velocityX = 0;
    player.velocityY = 0;
    player.hitpoints = 100;
    
    player.alive = true;
    player.setAnimation('idle');
    orcs.length = 0;
    giantOrcs.length = 0;
    speedOrcs.length = 0;
    regOrcs.length = 0;
    projectiles.length = 0;
    paused = false;
    pauseButton.textContent = '';
    if(player.score > player.bestScore){
        player.bestScore = player.score;
    }
    player.score = 0
}

window.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase () === 'r') {
        restart();
    }
});

function checkGameOver() {
    if (player.currentAnimation === 'die' && player.currentFrame === player.animations['die'].length - 1) {
        paused = true;
        
        alert("Game Over");
    }
}
