
"use strict";

// ========================================
// CAZAFANTASMAS: NOCHE DE HALLOWEEN
// ========================================

// Configuracion del canvas
const canvas = document.getElementById("canvasJuego");
const ctx = canvas.getContext("2d");

// Contador de fantasmas atrapados
const contadorHTML = document.getElementById("contador");
const botonMusica = document.getElementById("botonMusica");
const botonReiniciar = document.getElementById("botonReiniciar");

// Cantidad fija de objetos
const TOTAL_FANTASMAS = 25;
const ANCHO = canvas.width;
const ALTO = canvas.height;

// Emojis que representan los objetos del videojuego
const personajes = ["👻", "🎃", "👻", "🦇", "👻"];

// Arreglos del juego
let fantasmas = [];
let impactos = [];
let atrapados = 0;
let musicaActiva = false;

// ========================================
// FUNCIONES PARA NUMEROS ALEATORIOS
// ========================================

function aleatorio(min, max) {
    return Math.random() * (max - min) + min;
}

// ========================================
// CREAR UN FANTASMA
// ========================================

function crearFantasma() {
    const tipo = Math.floor(Math.random() * personajes.length);

    return {
        x: aleatorio(30, ANCHO - 30),
        y: aleatorio(30, ALTO - 30),
        radio: 18,

        // Cada objeto tiene su propia velocidad
        velocidad: aleatorio(1.0, 2.8),

        // Cuatro tipos de movimiento
        movimiento: Math.floor(Math.random() * 4),

        // Direccion horizontal y vertical
        dx: Math.random() < 0.5 ? -1 : 1,
        dy: Math.random() < 0.5 ? -1 : 1,

        // Para el movimiento circular
        angulo: aleatorio(0, Math.PI * 2),
        radioOrbita: aleatorio(15, 45),

        // Imagen representada por un emoji
        personaje: personajes[tipo],

        // Control de animacion de choque
        ultimoChoque: 0
    };
}

// ========================================
// INICIALIZAR LOS 25 OBJETOS
// ========================================

function iniciarJuego() {
    fantasmas = [];
    impactos = [];
    atrapados = 0;

    for (let i = 0; i < TOTAL_FANTASMAS; i++) {
        fantasmas.push(crearFantasma());
    }

    actualizarContador();
}

// ========================================
// ACTUALIZAR EL CONTADOR
// ========================================

function actualizarContador() {
    contadorHTML.textContent = atrapados;
}

// ========================================
// FONDO DEL CEMENTERIO
// ========================================

function dibujarFondo() {
    // Cielo nocturno
    const cielo = ctx.createLinearGradient(0, 0, 0, ALTO);
    cielo.addColorStop(0, "#10142e");
    cielo.addColorStop(1, "#241438");

    ctx.fillStyle = cielo;
    ctx.fillRect(0, 0, ANCHO, ALTO);

    // Luna
    ctx.fillStyle = "#fff0bd";
    ctx.beginPath();
    ctx.arc(760, 80, 35, 0, Math.PI * 2);
    ctx.fill();

    // Sombra para dar efecto de luna
    ctx.fillStyle = "#10142e";
    ctx.beginPath();
    ctx.arc(775, 68, 30, 0, Math.PI * 2);
    ctx.fill();

    // Estrellas
    ctx.fillStyle = "#ffffff";

    for (let i = 0; i < 55; i++) {
        const x = (i * 137 + 23) % ANCHO;
        const y = (i * 67 + 17) % 230;

        ctx.globalAlpha = 0.4 + (i % 5) * 0.12;
        ctx.beginPath();
        ctx.arc(x, y, 1.5, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.globalAlpha = 1;

    // Suelo del cementerio
    ctx.fillStyle = "#18251d";
    ctx.fillRect(0, 390, ANCHO, 110);

    // Siluetas de tumbas
    ctx.fillStyle = "#454052";

    for (let i = 0; i < 9; i++) {
        const x = 25 + i * 105;

        ctx.beginPath();
        ctx.roundRect(x, 350 + (i % 3) * 15, 38, 65, 8);
        ctx.fill();

        ctx.fillStyle = "#a59ab4";
        ctx.fillRect(x + 17, 365 + (i % 3) * 15, 4, 25);
        ctx.fillRect(x + 9, 374 + (i % 3) * 15, 20, 4);

        ctx.fillStyle = "#454052";
    }
}

// ========================================
// DIBUJAR LOS OBJETOS
// ========================================

function dibujarFantasma(f) {
    ctx.save();

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "30px Arial";

    // Sombra del personaje
    ctx.shadowColor = "#bd83ff";
    ctx.shadowBlur = 12;

    ctx.fillText(f.personaje, f.x, f.y);

    ctx.restore();
}

// ========================================
// MOVIMIENTO DE LOS OBJETOS
// ========================================

function moverFantasma(f) {
    const velocidad = f.velocidad;

    // 0 = arriba
    if (f.movimiento === 0) {
        f.y -= velocidad;
    }

    // 1 = abajo
    else if (f.movimiento === 1) {
        f.y += velocidad;
    }

    // 2 = diagonal
    else if (f.movimiento === 2) {
        f.x += velocidad * f.dx;
        f.y += velocidad * f.dy;
    }

    // 3 = circular
    else if (f.movimiento === 3) {
        f.angulo += 0.035 * velocidad;

        f.x += Math.cos(f.angulo) * velocidad;
        f.y += Math.sin(f.angulo) * velocidad;
    }

    // Cambiar de zona al salir del canvas
    if (f.x < -30) f.x = ANCHO + 25;
    if (f.x > ANCHO + 30) f.x = -25;
    if (f.y < -30) f.y = ALTO + 25;
    if (f.y > ALTO + 30) f.y = -25;

    // Rebote en los bordes
    // para los movimientos diagonales
    if (f.movimiento === 2) {
        if (f.x < f.radio || f.x > ANCHO - f.radio) {
            f.dx *= -1;
        }

        if (f.y < f.radio || f.y > ALTO - f.radio) {
            f.dy *= -1;
        }
    }
}

// ========================================
// DETECTAR COLISIONES
// ========================================

function detectarColisiones() {
    for (let i = 0; i < fantasmas.length; i++) {
        for (let j = i + 1; j < fantasmas.length; j++) {
            const a = fantasmas[i];
            const b = fantasmas[j];

            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const distancia = Math.sqrt(dx * dx + dy * dy);

            if (distancia < a.radio + b.radio) {
                const ahora = Date.now();

                // Evitar repetir el efecto en cada fotograma
                if (
                    ahora - a.ultimoChoque > 250 &&
                    ahora - b.ultimoChoque > 250
                ) {
                    // Invertir direcciones
                    a.dx *= -1;
                    a.dy *= -1;
                    b.dx *= -1;
                    b.dy *= -1;

                    a.ultimoChoque = ahora;
                    b.ultimoChoque = ahora;

                    // Crear animacion breve de impacto
                    impactos.push({
                        x: (a.x + b.x) / 2,
                        y: (a.y + b.y) / 2,
                        tiempo: 18
                    });
                }
            }
        }
    }
}

// ========================================
// ANIMACION DE CHOQUE
// ========================================


const imagenFondo = new Image();
imagenFondo.src = "assets/fondo-halloween.png";

imagenFondo.onload = function() {
    console.log("¡Fondo de Halloween cargado correctamente!");
};

imagenFondo.onerror = function() {
    console.log("Error: no se pudo cargar la imagen de fondo.");
}; 

function dibujarFondo() {
    ctx.clearRect(0, 0, ANCHO, ALTO);

    if (imagenFondo.complete && imagenFondo.naturalWidth > 0) {
        ctx.drawImage(imagenFondo, 0, 0, ANCHO, ALTO);
    } else {
        ctx.fillStyle = "#10142e";
        ctx.fillRect(0, 0, ANCHO, ALTO);
    }
}


// ========================================
// BUCLE PRINCIPAL DEL VIDEOJUEGO
// ========================================
function dibujarImpactos() {
    for (let i = impactos.length - 1; i >= 0; i--) {
        const impacto = impactos[i];

        ctx.save();
        ctx.beginPath();
        ctx.arc(
            impacto.x,
            impacto.y,
            25 - impacto.tiempo,
            0,
            Math.PI * 2
        );

        ctx.strokeStyle = "#ffb347";
        ctx.lineWidth = 3;
        ctx.shadowColor = "#ff6600";
        ctx.shadowBlur = 15;
        ctx.stroke();
        ctx.restore();

        impacto.tiempo--;

        if (impacto.tiempo <= 0) {
            impactos.splice(i, 1);
        }
    }
}

function animar() {
    dibujarFondo();

    // Mover y dibujar todos los objetos
    for (const fantasma of fantasmas) {
        moverFantasma(fantasma);
        dibujarFantasma(fantasma);
    }

    // Revisar choques y dibujar sus efectos
    detectarColisiones();
    dibujarImpactos();

    // Repetir la animacion
    requestAnimationFrame(animar);
}

// ========================================
// ATRAPAR OBJETOS CON EL MOUSE
// ========================================

canvas.addEventListener("click", function(evento) {
    const rect = canvas.getBoundingClientRect();

    // Convertir la posicion del mouse
    // a las coordenadas reales del canvas
    const escalaX = canvas.width / rect.width;
    const escalaY = canvas.height / rect.height;

    const mouseX = (evento.clientX - rect.left) * escalaX;
    const mouseY = (evento.clientY - rect.top) * escalaY;

    for (let i = fantasmas.length - 1; i >= 0; i--) {
        const f = fantasmas[i];

        const dx = mouseX - f.x;
        const dy = mouseY - f.y;
        const distancia = Math.sqrt(dx * dx + dy * dy);

        if (distancia < f.radio + 12) {
            // Sumar un objeto atrapado
            atrapados++;
            actualizarContador();

            // Crear un nuevo objeto en otra zona
            fantasmas[i] = crearFantasma();

            // Solo atrapar un objeto por clic
            break;
        }
    }
});

// ========================================
// BOTON DE REINICIO
// ========================================

botonReiniciar.addEventListener("click", function() {
    iniciarJuego();
});

// ========================================
// BOTON DE MUSICA
// El audio real se agregara posteriormente
// ========================================


const musica = new Audio("assets/musica-halloween.mp3");
musica.loop = true;
musica.volume = 0.4;

botonMusica.addEventListener("click", async function() {
    try {
        if (musica.paused) {
            await musica.play();
            botonMusica.textContent = "🔇 Pausar música";
        } else {
            musica.pause();
            botonMusica.textContent = "🔊 Activar música";
        }
    } catch (error) {
        console.error("No se pudo reproducir la música:", error);
        alert("No se pudo reproducir el audio. Revisa el archivo dentro de assets.");
    }
});


// ========================================
// INICIAR EL VIDEOJUEGO
// ========================================

iniciarJuego();
animar();
