// Configuración de puzzles por categoría
const puzzlesConfig = {
    animales: {
        name: "Animales",
        icon: "🐶",
        puzzles: [
            { name: "Perrito Feliz", image: "puzzles/animales/puzzle1.jpeg" },
            { name: "Gatito Juguetón", image: "puzzles/animales/puzzle2.jpeg" },
            { name: "Pájaro Colorido", image: "puzzles/animales/puzzle3.jpeg" }
        ]
    },
    naturaleza: {
        name: "Naturaleza",
        icon: "🌳",
        puzzles: [
            { name: "Arbol Lindo", image: "puzzles/naturaleza/puzzle1.jpeg" },
            { name: "Flor Hermosa", image: "puzzles/naturaleza/puzzle2.jpeg" },
            { name: "Isla Perdida", image: "puzzles/naturaleza/puzzle3.jpeg" }
        ]
    },
    frutas: {
        name: "Frutas",
        icon: "🍎",
        puzzles: [
            { name: "Manzana Fresca", image: "puzzles/frutas/puzzle1.jpeg" },
            { name: "Sandía Jugosa", image: "puzzles/frutas/puzzle2.jpeg" },
            { name: "Uvas y Fresa Dulces", image: "puzzles/frutas/puzzle3.jpeg" }
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
let correctPlacements = 0;
let currentImageUrl = '';
let completedPuzzlesInCategory = 0;
const MAX_PUZZLES_PER_CATEGORY = 3;
let selectedPiece = null;

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
    selectedPiece = null;
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
    
    // Crear slots del puzzle
    for (let i = 0; i < gridSize; i++) {
        const slot = document.createElement('div');
        slot.className = 'puzzle-slot';
        slot.dataset.position = i;
        slot.style.width = `${cellSize}px`;
        slot.style.height = `${cellSize}px`;
        
        slot.addEventListener('click', () => handleSlotClick(slot));
        puzzleGrid.appendChild(slot);
    }
    
    // Crear piezas del puzzle
    const pieces = Array.from({length: gridSize}, (_, i) => i);
    shuffleArray(pieces);
    
    pieces.forEach((position, index) => {
        const piece = document.createElement('div');
        piece.className = 'puzzle-piece';
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
        
        piece.addEventListener('click', (e) => {
            e.stopPropagation();
            handlePieceClick(piece);
        });
        
        piecesGrid.appendChild(piece);
    });
    
    startTimer();
}

function handlePieceClick(piece) {
    // Deseleccionar si ya está seleccionada
    if (selectedPiece === piece) {
        selectedPiece.classList.remove('selected');
        selectedPiece = null;
        return;
    }
    
    // Deseleccionar cualquier pieza previa
    if (selectedPiece) {
        selectedPiece.classList.remove('selected');
    }
    
    // Seleccionar la nueva pieza
    selectedPiece = piece;
    piece.classList.add('selected');
}

function handleSlotClick(slot) {
    if (!selectedPiece || slot.classList.contains('filled')) return;
    
    const dropPosition = parseInt(slot.dataset.position);
    const pieceCorrectPosition = parseInt(selectedPiece.dataset.correctPosition);
    
    movimientos++;
    movimientosElement.textContent = movimientos;
    
    if (dropPosition === pieceCorrectPosition) {
        placePieceCorrectly(slot, selectedPiece, pieceCorrectPosition);
        correctPlacements++;
        
        if (correctPlacements === difficulty * difficulty) {
            completePuzzle();
        }
    } else {
        showIncorrectFeedback(selectedPiece);
    }
    
    selectedPiece.classList.remove('selected');
    selectedPiece = null;
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
    piece.style.display = 'none'; // Ocultar la pieza de la cuadrícula derecha
}

function showIncorrectFeedback(element) {
    element.style.animation = 'shake 0.5s ease-in-out';
    setTimeout(() => {
        if (element) {
            element.style.animation = '';
        }
    }, 500);
}

function completePuzzle() {
    clearInterval(timerInterval);
    completados++;
    completedPuzzlesInCategory++;
    localStorage.setItem('puzzlesCompletados', completados.toString());
    
    // Restablecer el botón "Jugar Otra Vez" a su estado original
    const jugarOtraVezBtn = document.getElementById('jugar-otra-vez');
    jugarOtraVezBtn.textContent = '↻ Jugar Otra Vez';
    jugarOtraVezBtn.onclick = generatePuzzle;
    
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
    
    let medalType, message;
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
    
    const jugarOtraVezBtn = document.getElementById('jugar-otra-vez');
    jugarOtraVezBtn.textContent = '🔁 Otra categoría';
    jugarOtraVezBtn.onclick = function() {
        showCategories();
        // Resetear el botón para futuros usos
        jugarOtraVezBtn.textContent = '↻ Jugar Otra Vez';
        jugarOtraVezBtn.onclick = generatePuzzle;
    };
    
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

1. Haz clic/toca una pieza para seleccionarla
2. Haz clic/toca en un espacio vacío para colocarla
3. Las piezas solo encajan en su lugar correcto
4. ¡Completa la imagen para ganar!

💡 CONSEJOS:
• Observa los colores y patrones
• Empieza por las esquinas y bordes
• Las piezas seleccionadas se resaltan
• ¡No te rindas! Puedes intentarlo cuantas veces quieras
    `;
    alert(ayuda);
}

// Estilos dinámicos
const style = document.createElement('style');
style.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
        20%, 40%, 60%, 80% { transform: translateX(5px); }
    }
    
    .puzzle-piece {
        cursor: pointer;
        transition: transform 0.2s;
    }
    
    .puzzle-piece.selected {
        transform: scale(1.1);
        box-shadow: 0 0 10px rgba(0,0,0,0.5);
        z-index: 10;
    }
    
    .puzzle-piece:active {
        transform: scale(1.05);
    }
    
    .puzzle-slot {
        cursor: pointer;
    }
    
    @media (max-width: 768px) {
        .puzzle-piece, .puzzle-slot {
            width: 70px !important;
            height: 70px !important;
        }
        
        #puzzle-grid, #pieces-grid {
            gap: 5px;
        }
        
        .puzzle-piece.selected {
            transform: scale(1.05);
        }
    }
    
    @media (max-width: 480px) {
        .puzzle-piece, .puzzle-slot {
            width: 60px !important;
            height: 60px !important;
        }
    }
`;
document.head.appendChild(style);

// Inicializar el juego al cargar
document.addEventListener('DOMContentLoaded', initGame);