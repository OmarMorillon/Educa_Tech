// Configuración de puzzles por categoría (solo animales, frutas y naturaleza)
const puzzlesConfig = {
    animales: {
        name: "Animales",
        icon: "🐶",
        puzzles: [
            { name: "Perrito Feliz", image: "puzzles/animales/puzzle1.jpg" },
            { name: "Gatito Juguetón", image: "puzzles/animales/puzzle2.jpg" },
            { name: "Pájaro Colorido", image: "puzzles/animales/puzzle3.jpg" }
        ]
    },
    naturaleza: {
        name: "Naturaleza",
        icon: "🌳",
        puzzles: [
            { name: "Bosque Encantado", image: "puzzles/naturaleza/puzzle1.jpg" },
            { name: "Playa Hermosa", image: "puzzles/naturaleza/puzzle2.jpg" },
            { name: "Montañas Nevadas", image: "puzzles/naturaleza/puzzle3.jpg" }
        ]
    },
    frutas: {
        name: "Frutas",
        icon: "🍎",
        puzzles: [
            { name: "Canasta de Frutas", image: "puzzles/frutas/puzzle1.jpg" },
            { name: "Sandía Jugosa", image: "puzzles/frutas/puzzle2.jpg" },
            { name: "Uvas Dulces", image: "puzzles/frutas/puzzle3.jpg" }
        ]
    }
};

// Variables del juego
let currentCategory = '';
let currentPuzzleIndex = 0;
let difficulty = 3; // 3x3 por defecto
let startTime = null;
let timerInterval = null;
let movimientos = 0;
let completados = parseInt(localStorage.getItem('puzzlesCompletados') || '0');
let draggedElement = null;
let correctPlacements = 0;
let currentImageUrl = '';
let completedPuzzlesInCategory = 0;
const MAX_PUZZLES_PER_CATEGORY = 3;

// Elementos del DOM
const categorySelector = document.getElementById('category-selector');
const gameContainer = document.getElementById('game-container');
const resultsContainer = document.getElementById('results-container');
const puzzleTitle = document.getElementById('puzzle-title');
const puzzleGrid = document.getElementById('puzzle-grid');
const piecesGrid = document.getElementById('pieces-grid');
const tiempoElement = document.getElementById('tiempo');
const movimientosElement = document.getElementById('movimientos');
const completadosElement = document.getElementById('puzzles-completados');
const resumenTiempo = document.getElementById('resumen-tiempo');
const resumenMovimientos = document.getElementById('resumen-movimientos');
const resumenDificultad = document.getElementById('resumen-dificultad');
const medalImg = document.getElementById('medal-img');
const medalMessage = document.getElementById('medal-message');

// Inicializar el juego
function initGame() {
    completadosElement.textContent = completados;
    
    document.querySelectorAll('.category-card').forEach(card => {
        card.addEventListener('click', () => {
            currentCategory = card.dataset.category;
            startCategory();
        });
    });
    
    document.querySelectorAll('.difficulty-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelector('.difficulty-btn.active').classList.remove('active');
            btn.classList.add('active');
            difficulty = parseInt(btn.dataset.difficulty);
            generatePuzzle();
        });
    });
    
    document.getElementById('nuevo-puzzle').addEventListener('click', generatePuzzle);
    document.getElementById('ayuda-btn').addEventListener('click', showHelp);
    document.getElementById('volver-categorias').addEventListener('click', showCategories);
    document.getElementById('jugar-otra-vez').addEventListener('click', generatePuzzle);
    document.getElementById('volver-menu').addEventListener('click', () => {
        window.location.href = 'index.html';
    });
}

function startCategory() {
    categorySelector.style.display = 'none';
    gameContainer.style.display = 'block';
    currentPuzzleIndex = 0;
    completedPuzzlesInCategory = 0;
    generatePuzzle();
}

function showCategories() {
    gameContainer.style.display = 'none';
    resultsContainer.style.display = 'none';
    categorySelector.style.display = 'block';
}

function generatePuzzle() {
    movimientos = 0;
    correctPlacements = 0;
    startTime = Date.now();
    movimientosElement.textContent = movimientos;
    
    puzzleGrid.innerHTML = '';
    piecesGrid.innerHTML = '';
    
    const gridSize = difficulty * difficulty;
    const cellSize = difficulty === 3 ? 80 : difficulty === 4 ? 70 : 60;
    const gridWidth = difficulty * cellSize + (difficulty - 1) * 5 + 20;
    
    puzzleGrid.style.gridTemplateColumns = `repeat(${difficulty}, 1fr)`;
    puzzleGrid.style.width = `${gridWidth}px`;
    piecesGrid.style.gridTemplateColumns = `repeat(${difficulty}, 1fr)`;
    piecesGrid.style.width = `${gridWidth}px`;
    
    const categoryPuzzles = puzzlesConfig[currentCategory].puzzles;
    currentPuzzleIndex = Math.floor(Math.random() * categoryPuzzles.length);
    currentImageUrl = categoryPuzzles[currentPuzzleIndex].image;
    puzzleTitle.textContent = `${puzzlesConfig[currentCategory].name}: ${categoryPuzzles[currentPuzzleIndex].name}`;
    
    for (let i = 0; i < gridSize; i++) {
        const slot = document.createElement('div');
        slot.className = 'puzzle-slot';
        slot.dataset.position = i;
        slot.style.width = `${cellSize}px`;
        slot.style.height = `${cellSize}px`;
        
        slot.addEventListener('dragover', handleDragOver);
        slot.addEventListener('drop', handleDrop);
        slot.addEventListener('dragleave', handleDragLeave);
        
        puzzleGrid.appendChild(slot);
    }
    
    const pieces = Array.from({length: gridSize}, (_, i) => i);
    shuffleArray(pieces);
    
    pieces.forEach((position, index) => {
        const piece = document.createElement('div');
        piece.className = 'puzzle-piece';
        piece.draggable = true;
        piece.dataset.correctPosition = position;
        piece.dataset.currentIndex = index;
        piece.style.width = `${cellSize - 10}px`;
        piece.style.height = `${cellSize - 10}px`;
        
        const row = Math.floor(position / difficulty);
        const col = position % difficulty;
        const bgPosX = -col * cellSize;
        const bgPosY = -row * cellSize;
        const bgSize = difficulty * cellSize;
        
        piece.style.backgroundImage = `url(${currentImageUrl})`;
        piece.style.backgroundPosition = `${bgPosX}px ${bgPosY}px`;
        piece.style.backgroundSize = `${bgSize}px ${bgSize}px`;
        
        piece.addEventListener('dragstart', handleDragStart);
        piece.addEventListener('dragend', handleDragEnd);
        piece.addEventListener('touchstart', handleTouchStart, {passive: false});
        piece.addEventListener('touchmove', handleTouchMove, {passive: false});
        piece.addEventListener('touchend', handleTouchEnd);
        
        piecesGrid.appendChild(piece);
    });
    
    startTimer();
}

// Funciones de arrastre para desktop
function handleDragStart(e) {
    if (e.target.classList.contains('used')) {
        e.preventDefault();
        return;
    }
    draggedElement = e.target;
    e.target.classList.add('dragging');
    e.dataTransfer.setData('text/plain', e.target.dataset.correctPosition);
}

function handleDragEnd(e) {
    e.target.classList.remove('dragging');
    draggedElement = null;
}

function handleDragOver(e) {
    e.preventDefault();
    e.target.classList.add('drag-over');
}

function handleDragLeave(e) {
    e.target.classList.remove('drag-over');
}

function handleDrop(e) {
    e.preventDefault();
    e.target.classList.remove('drag-over');
    
    if (!draggedElement || e.target.classList.contains('filled')) return;
    
    const dropPosition = parseInt(e.target.dataset.position);
    const pieceCorrectPosition = parseInt(draggedElement.dataset.correctPosition);
    
    movimientos++;
    movimientosElement.textContent = movimientos;
    
    if (dropPosition === pieceCorrectPosition) {
        placePieceCorrectly(e.target, draggedElement, pieceCorrectPosition);
        correctPlacements++;
        
        if (correctPlacements === difficulty * difficulty) {
            completePuzzle();
        }
    } else {
        showIncorrectFeedback(draggedElement);
    }
}

// Funciones de touch para móviles
let touchStartX = 0;
let touchStartY = 0;
let touchElement = null;

function handleTouchStart(e) {
    if (e.target.classList.contains('used')) {
        e.preventDefault();
        return;
    }
    touchElement = e.target;
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    e.target.classList.add('dragging');
}

function handleTouchMove(e) {
    if (!touchElement) return;
    e.preventDefault();
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartX;
    const deltaY = touch.clientY - touchStartY;
    
    touchElement.style.position = 'absolute';
    touchElement.style.left = `${touch.clientX - touchElement.offsetWidth / 2}px`;
    touchElement.style.top = `${touch.clientY - touchElement.offsetHeight / 2}px`;
    touchElement.style.zIndex = '1000';
    touchElement.style.transform = 'scale(1.2)';
}

function handleTouchEnd(e) {
    if (!touchElement) return;
    
    const touch = e.changedTouches[0];
    const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
    
    if (elementBelow && elementBelow.classList.contains('puzzle-slot') && 
        !elementBelow.classList.contains('filled')) {
        
        const dropPosition = parseInt(elementBelow.dataset.position);
        const pieceCorrectPosition = parseInt(touchElement.dataset.correctPosition);
        
        movimientos++;
        movimientosElement.textContent = movimientos;
        
        if (dropPosition === pieceCorrectPosition) {
            placePieceCorrectly(elementBelow, touchElement, pieceCorrectPosition);
            correctPlacements++;
            
            if (correctPlacements === difficulty * difficulty) {
                completePuzzle();
            }
        } else {
            showIncorrectFeedback(touchElement);
        }
    } else {
        touchElement.style.position = '';
        touchElement.style.left = '';
        touchElement.style.top = '';
        touchElement.style.zIndex = '';
        touchElement.style.transform = '';
    }
    
    touchElement.classList.remove('dragging');
    touchElement = null;
}

function placePieceCorrectly(slot, piece, position) {
    const cellSize = difficulty === 3 ? 80 : difficulty === 4 ? 70 : 60;
    const row = Math.floor(position / difficulty);
    const col = position % difficulty;
    const bgPosX = -col * cellSize;
    const bgPosY = -row * cellSize;
    const bgSize = difficulty * cellSize;
    
    slot.style.backgroundImage = `url(${currentImageUrl})`;
    slot.style.backgroundPosition = `${bgPosX}px ${bgPosY}px`;
    slot.style.backgroundSize = `${bgSize}px ${bgSize}px`;
    slot.classList.add('filled');
    
    piece.classList.add('used');
    piece.style.position = '';
    piece.style.left = '';
    piece.style.top = '';
    piece.style.zIndex = '';
    piece.style.transform = '';
}

function showIncorrectFeedback(element) {
    element.style.animation = 'shake 0.5s ease-in-out';
    setTimeout(() => {
        if (element) {
            element.style.animation = '';
            element.style.position = '';
            element.style.left = '';
            element.style.top = '';
            element.style.zIndex = '';
            element.style.transform = '';
        }
    }, 500);
}

function completePuzzle() {
    clearInterval(timerInterval);
    completados++;
    completedPuzzlesInCategory++;
    localStorage.setItem('puzzlesCompletados', completados.toString());
    
    if (completedPuzzlesInCategory >= MAX_PUZZLES_PER_CATEGORY) {
        showCategoryCompletion();
    } else {
        showResults();
    }
}

function showResults() {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    const tiempoTexto = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    resumenTiempo.textContent = tiempoTexto;
    resumenMovimientos.textContent = movimientos;
    resumenDificultad.textContent = 
        difficulty === 3 ? 'Fácil' : difficulty === 4 ? 'Medio' : 'Difícil';
    
    let medalType, medalColor, message;
    const tiempoLimiteOro = difficulty === 3 ? 60 : difficulty === 4 ? 120 : 180;
    const movimientosLimiteOro = difficulty === 3 ? 15 : difficulty === 4 ? 30 : 45;
    
    if (elapsed <= tiempoLimiteOro && movimientos <= movimientosLimiteOro) {
        medalType = "gold";
        message = "¡Medalla de Oro! ¡Eres un genio de los puzzles! 🏆";
    } else if (elapsed <= tiempoLimiteOro * 1.5 && movimientos <= movimientosLimiteOro * 1.5) {
        medalType = "silver";
        message = "¡Medalla de Plata! ¡Excelente trabajo! 👍";
    } else {
        medalType = "bronze";
        message = "¡Medalla de Bronce! ¡Sigue practicando! 💪";
    }
    
    medalImg.src = `medals/${medalType}.png`;
    medalImg.alt = `Medalla de ${medalType}`;
    medalImg.className = `medal ${medalType}-medal`;
    medalMessage.textContent = message;
    
    gameContainer.style.display = 'none';
    resultsContainer.style.display = 'block';
}

function showCategoryCompletion() {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    const tiempoTexto = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    completedPuzzlesInCategory = 0;
    
    medalImg.src = 'medals/gold.png';
    medalImg.alt = 'Medalla de oro';
    medalMessage.textContent = `¡Completaste los 3 puzzles de ${puzzlesConfig[currentCategory].name}!`;
    
    resumenTiempo.textContent = tiempoTexto;
    resumenMovimientos.textContent = movimientos;
    resumenDificultad.textContent = difficulty === 3 ? 'Fácil' : difficulty === 4 ? 'Medio' : 'Difícil';
    
    document.getElementById('jugar-otra-vez').textContent = '🔁 Otra categoría';
    document.getElementById('jugar-otra-vez').onclick = showCategories;
    
    gameContainer.style.display = 'none';
    resultsContainer.style.display = 'block';
}

function startTimer() {
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        tiempoElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }, 1000);
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function showHelp() {
    const ayuda = `
🎯 CÓMO JUGAR:

1. Toca y arrastra las piezas del lado derecho
2. Suéltalas en la posición correcta del puzzle
3. Las piezas solo encajan en su lugar correcto
4. ¡Completa la imagen para ganar!

💡 CONSEJOS:
• Observa los colores y patrones
• Empieza por las esquinas y bordes
• Usa las formas como guía
• ¡No te rindas! Puedes intentarlo cuantas veces quieras
    `;
    alert(ayuda);
}

// Estilo para animación de shake
const style = document.createElement('style');
style.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
        20%, 40%, 60%, 80% { transform: translateX(5px); }
    }
`;
document.head.appendChild(style);

// Inicializar el juego al cargar
document.addEventListener('DOMContentLoaded', initGame);