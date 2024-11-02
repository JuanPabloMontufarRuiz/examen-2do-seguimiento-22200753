// Configuración del canvas y el contexto
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
let score = 0;
let timeLeft = 180; // 3 minutos en segundos
let playerLives = 3; // Vidas iniciales del personaje

// Velocidades y estado de tecla lenta
const normalSpeed = 5;
const slowSpeed = 2;
let isSlowMode = false; // Estado de la tecla "C"

// Arrays para enemigos y proyectiles
const enemies = [];
const enemyProjectiles = []; // Array global para almacenar proyectiles de enemigos

// Cargar imágenes de los proyectiles
const projectileImages = [
    'assets/pro1.png',
    'assets/pro2.png',
    'assets/pro3.png',
    'assets/pro4.png',
    'assets/pro5.png'
].map(src => {
    const img = new Image();
    img.src = src;
    return img;
});

// Actualizar puntuación
function updateScore(points) {
    score += points;
    document.getElementById('score').textContent = `${score}`;
}

// Actualizar el indicador de vidas
function updateLives() {
    document.getElementById('livesCount').textContent = `${playerLives}`;
}

// Temporizador del Stage
function updateTimer() {
    if (timeLeft > 0) {
        timeLeft--;
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        document.getElementById('timer').textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
        startBossBattle();
    }
}

// Llamar al temporizador cada segundo
setInterval(updateTimer, 1000);

// Función para iniciar la pelea con el jefe
function startBossBattle() {
    console.log("¡El jefe ha aparecido!");
    // Aquí se colocará la lógica del jefe
}

// Fondo en movimiento (video)
const bgVideo = document.createElement('video');
bgVideo.src = 'assets/bg game.mp4';
bgVideo.loop = true;
bgVideo.muted = true;
bgVideo.play();

function renderBackground() {
    ctx.drawImage(bgVideo, 0, 0, canvas.width, canvas.height);
    requestAnimationFrame(renderBackground);
}

bgVideo.addEventListener('play', renderBackground);

const backgroundMusic = document.getElementById('backgroundMusic');
backgroundMusic.volume = 0.1;
function toggleMusic() {
    if (backgroundMusic.paused) {
        backgroundMusic.play();
    } else {
        backgroundMusic.pause();
    }
}

// Configuración del personaje principal
const characterSprite = new Image();
characterSprite.src = 'assets/Principal.png';

// Tamaño y posición inicial del personaje
const spriteWidth = 64;
const spriteHeight = 64;
let characterX = canvas.width / 2 - spriteWidth / 2;
let characterY = canvas.height - spriteHeight - 20;

// Radio de la hitbox
const hitboxRadius = 5;

// Detecta teclas presionadas
const keys = {
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false,
    w: false,
    s: false,
    a: false,
    d: false,
    c: false
};

window.addEventListener('keydown', (e) => {
    if (keys.hasOwnProperty(e.key)) {
        keys[e.key] = true;
    }
    if (e.key === 'c') {
        isSlowMode = true;
    }
});

window.addEventListener('keyup', (e) => {
    if (keys.hasOwnProperty(e.key)) {
        keys[e.key] = false;
    }
    if (e.key === 'c') {
        isSlowMode = false;
    }
});

// Actualiza la posición del personaje en función de las teclas presionadas
function moveCharacter() {
    const speed = isSlowMode ? slowSpeed : normalSpeed;
    if (keys.ArrowUp || keys.w) characterY = Math.max(0, characterY - speed);
    if (keys.ArrowDown || keys.s) characterY = Math.min(canvas.height - spriteHeight, characterY + speed);
    if (keys.ArrowLeft || keys.a) characterX = Math.max(0, characterX - speed);
    if (keys.ArrowRight || keys.d) characterX = Math.min(canvas.width - spriteWidth, characterX + speed);
}

// Función para reiniciar el juego después de Game Over
function resetGame() {
    playerLives = 3;
    score = 0;
    timeLeft = 180;
    enemies.length = 0;
    enemyProjectiles.length = 0;
    characterX = canvas.width / 2 - spriteWidth / 2;
    characterY = canvas.height - spriteHeight - 20;
    updateScore(0);
    updateLives();
}

// Función para animar el personaje, fondo y enemigos
function animateCharacter() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Dibuja el fondo
    ctx.drawImage(bgVideo, 0, 0, canvas.width, canvas.height);

    // Mueve el personaje en función de las teclas presionadas
    moveCharacter();

    // Dibuja el personaje
    ctx.drawImage(characterSprite, characterX, characterY, spriteWidth, spriteHeight);

    // Dibuja el círculo de hitbox si está en modo lento
    if (isSlowMode) {
        const centerX = characterX + spriteWidth / 2;
        const centerY = characterY + spriteHeight / 2;
        const hitboxRadius = 6;

        const gradient = ctx.createRadialGradient(centerX, centerY, hitboxRadius / 4, centerX, centerY, hitboxRadius);
        gradient.addColorStop(0, 'rgba(240, 240, 240, 1)');
        gradient.addColorStop(0.7, 'rgba(255, 0, 0, 0.4)');
        gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');

        ctx.beginPath();
        ctx.arc(centerX, centerY, hitboxRadius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.shadowBlur = 15;
        ctx.shadowColor = 'rgba(255, 0, 0, 0.7)';
        ctx.fill();
        ctx.closePath();
        ctx.shadowBlur = 0;
    }

    // Actualiza y dibuja cada enemigo
    enemies.forEach((enemy, enemyIndex) => {
        enemy.move();
        enemy.shoot();
        enemy.draw();

        // Verificar colisiones entre proyectiles de enemigo y el círculo de hitbox
        enemyProjectiles.forEach((projectile, projectileIndex) => {
            const dx = (characterX + spriteWidth / 2) - projectile.x;
            const dy = (characterY + spriteHeight / 2) - projectile.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < hitboxRadius + 6) {
                playerLives--;
                updateLives();
                enemyProjectiles.splice(projectileIndex, 1);

                if (playerLives <= 0) {
                    alert("Game Over");
                    resetGame();
                }
            }
        });

        if (enemy.y > canvas.height) {
            enemies.splice(enemyIndex, 1);
        }
    });

    // Dibuja cada proyectil
    enemyProjectiles.forEach((projectile, index) => {
        projectile.x += projectile.vx;
        projectile.y += projectile.vy;

        const img = projectile.image;
        ctx.drawImage(img, projectile.x - 12, projectile.y - 12, 24, 24);

        if (projectile.y > canvas.height || projectile.x < 0 || projectile.x > canvas.width) {
            enemyProjectiles.splice(index, 1);
        }
    });

    requestAnimationFrame(animateCharacter);
}

// Inicia la animación cuando la imagen del personaje está cargada
characterSprite.onload = () => {
    animateCharacter();
};

// Clase Enemy para los enemigos normales con patrones de ataque complejos
class Enemy {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = 40;
        this.image = new Image();
        this.image.src = 'assets/Normal.png';
        this.shootInterval = 60;
        this.pattern = Math.floor(Math.random() * 3);
        this.angle = 0;
        this.entryAnimationFrames = 30;
        this.vx = Math.random() * 2 - 1;
        this.vy = Math.random() * 2;
    }

    move() {
        if (this.entryAnimationFrames > 0) {
            this.size += 1;
            this.entryAnimationFrames--;
        } else {
            this.x += this.vx;
            this.y += this.vy;
            if (this.x <= 0 || this.x >= canvas.width - this.size) this.vx *= -1;
            if (this.y <= 0 || this.y >= canvas.height / 2) this.vy *= -1;
        }
    }

    shoot() {
        if (this.shootInterval <= 0) {
            switch (this.pattern) {
                case 0:
                    this.shootCone();
                    break;
                case 1:
                    this.shootSpiral();
                    break;
                case 2:
                    this.shootWave();
                    break;
            }
            this.shootInterval = 60;
        } else {
            this.shootInterval--;
        }
    }

    shootCone() {
        const numberOfProjectiles = 5;
        const spreadAngle = Math.PI / 4;

        for (let i = 0; i < numberOfProjectiles; i++) {
            const angle = -spreadAngle / 2 + (spreadAngle / (numberOfProjectiles - 1)) * i;
            enemyProjectiles.push({
                x: this.x + this.size / 2,
                y: this.y + this.size / 2,
                vx: Math.cos(angle) * 1.5,
                vy: Math.sin(angle) * 1.5,
                image: projectileImages[Math.floor(Math.random() * projectileImages.length)]
            });
        }
    }

    shootSpiral() {
        const speed = 1.5;
        const angleIncrement = Math.PI / 12;

        enemyProjectiles.push({
            x: this.x + this.size / 2,
            y: this.y + this.size / 2,
            vx: Math.cos(this.angle) * speed,
            vy: Math.sin(this.angle) * speed,
            image: projectileImages[Math.floor(Math.random() * projectileImages.length)]
        });
        this.angle += angleIncrement;
    }

    shootWave() {
        const speed = 1.5;
        const waveAmplitude = 2;

        enemyProjectiles.push({
            x: this.x + this.size / 2,
            y: this.y + this.size / 2,
            vx: Math.sin(this.angle) * waveAmplitude,
            vy: speed,
            image: projectileImages[Math.floor(Math.random() * projectileImages.length)]
        });
        this.angle += 0.1;
    }

    draw() {
        ctx.drawImage(this.image, this.x, this.y, this.size, this.size);
    }
}

// Detectar clic en el canvas y verificar si impacta a un enemigo
canvas.addEventListener('click', (event) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    enemies.forEach((enemy, index) => {
        if (
            mouseX >= enemy.x &&
            mouseX <= enemy.x + enemy.size &&
            mouseY >= enemy.y &&
            mouseY <= enemy.y + enemy.size
        ) {
            enemies.splice(index, 1);
            updateScore(10);
        }
    });
});

// Función para generar enemigos en la parte superior del canvas
function spawnEnemy() {
    const x = Math.random() * (canvas.width - 40);
    const y = Math.random() * 50;
    enemies.push(new Enemy(x, y));
}

// Genera un nuevo enemigo cada segundo
setInterval(spawnEnemy, 1000);

// Iniciar el juego
resetGame();
