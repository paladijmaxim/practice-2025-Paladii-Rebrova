const graph = {
    'toilet': ['corridor-0'],
    '2705': ['corridor-1'],
    '2706': ['corridor-2'],
    'elevator': ['corridor-3'],
    '2701': ['corridor-4'],
    '2702': ['corridor-5'],
    
    'stairs1': ['corridor-0'],
    'empty1': ['corridor-1'],
    '2704': ['corridor-2'],
    '2703': ['corridor-3'],
    '2712': ['corridor-4'],
    'stairs2': ['corridor-5'],
    '2711': ['corridor-6'],
    
    'corridor-0': ['toilet', 'stairs1', 'corridor-1'],
    'corridor-1': ['corridor-0', '2705', 'empty1', 'corridor-2'],
    'corridor-2': ['corridor-1', '2706', '2704', 'corridor-3'],
    'corridor-3': ['corridor-2', 'elevator', '2703', 'corridor-4'],
    'corridor-4': ['corridor-3', '2701', '2712', 'corridor-5'],
    'corridor-5': ['corridor-4', '2702', 'stairs2', 'corridor-6'],
    'corridor-6': ['corridor-5', '2711']
};

const roomPositions = {};
let currentPath = [];
let animationFrame = null;
let snakeSegments = [];
let currentStep = 0;
let selectedRoom = null;

function initRoomPositions() {
    document.querySelectorAll('.room, .corridor-segment').forEach(el => {
        const rect = el.getBoundingClientRect();
        const containerRect = document.getElementById('game-container').getBoundingClientRect();
        
        roomPositions[el.dataset.room || `corridor-${el.dataset.segment}`] = {
            x: rect.left - containerRect.left + rect.width / 2,
            y: rect.top - containerRect.top + rect.height / 2,
            width: rect.width,
            height: rect.height,
            element: el
        };
    });
}

function findShortestPath(start, end) {
    const queue = [[start]];
    const visited = new Set([start]);

    while (queue.length > 0) {
        const path = queue.shift();
        const node = path[path.length - 1];

        if (node === end) return path;

        (graph[node] || []).forEach(neighbor => {
            if (!visited.has(neighbor)) {
                visited.add(neighbor);
                queue.push([...path, neighbor]);
            }
        });
    }

    return null;
}

function buildEvacuationPath(start) {
    const exits = ['stairs1', 'stairs2', 'elevator'];
    const paths = exits.map(exit => findShortestPath(start, exit)).filter(p => p);
    
    if (paths.length === 0) return null;
    
    return paths.reduce((shortest, current) => 
        current.length < shortest.length ? current : shortest
    );
}

function createSnake() {
    document.querySelectorAll('.snake, .snake-head').forEach(el => el.remove());
    snakeSegments = [];

    for (let i = 0; i < currentPath.length - 1; i++) {
        const current = roomPositions[currentPath[i]];
        const next = roomPositions[currentPath[i+1]];
        
        if (!current || !next) continue;

        const segment = document.createElement('div');
        segment.className = 'snake';
        
        // Рассчитываем угол и длину линии
        const dx = next.x - current.x;
        const dy = next.y - current.y;
        const length = Math.sqrt(dx*dx + dy*dy);
        const angle = Math.atan2(dy, dx) * 180 / Math.PI;
        
        segment.style.width = `${length}px`;
        segment.style.height = '6px'; // Толщина линии
        segment.style.left = `${current.x}px`;
        segment.style.top = `${current.y - 3}px`; // Центрируем по вертикали
        segment.style.transformOrigin = '0 50%';
        segment.style.transform = `rotate(${angle}deg)`;
        segment.style.borderRadius = '3px'; // Закругленные края

        document.getElementById('game-container').appendChild(segment);
        snakeSegments.push(segment);
    }

    const head = document.createElement('div');
    head.className = 'snake-head';
    head.style.width = '16px';
    head.style.height = '16px';
    document.getElementById('game-container').appendChild(head);
    snakeSegments.push(head);
}

function animateSnake() {
    if (currentStep >= currentPath.length * 20) { // Увеличил для плавности
        cancelAnimationFrame(animationFrame);
        return;
    }

    const progress = currentStep / (currentPath.length * 20);
    const pathIndex = Math.min(
        Math.floor(progress * (currentPath.length - 1)),
        currentPath.length - 2
    );
    const segmentProgress = (progress * (currentPath.length - 1)) % 1;

    const current = roomPositions[currentPath[pathIndex]];
    const next = roomPositions[currentPath[pathIndex + 1]];
    
    if (current && next) {
        const head = snakeSegments[snakeSegments.length - 1];
        const headX = current.x + (next.x - current.x) * segmentProgress;
        const headY = current.y + (next.y - current.y) * segmentProgress;
        
        head.style.left = `${headX - 8}px`; // Центрируем голову
        head.style.top = `${headY - 8}px`;
    }

    // Подсветка пройденного пути
    snakeSegments.forEach((seg, i) => {
        if (i < pathIndex) seg.style.opacity = '1';
        else if (i === pathIndex) seg.style.opacity = '0.8';
        else seg.style.opacity = '0.5';
    });

    currentStep++;
    animationFrame = requestAnimationFrame(animateSnake);
}

function showRouteInfo() {
    const exitNames = {
        'stairs1': 'Левая лестница',
        'stairs2': 'Правая лестница',
        'elevator': 'Центральные лестница/лифт'
    };
    
    const exit = exitNames[currentPath[currentPath.length - 1]] || currentPath[currentPath.length - 1];
    document.getElementById('route-info').innerHTML = `
        <h3>Маршрут эвакуации:</h3>
        <p>От: <strong>${selectedRoom}</strong></p>
        <p>К: <strong>${exit}</strong></p>
        <p>Длина маршрута: ${currentPath.length - 1} шагов</p>
    `;
}

function reset() {
    cancelAnimationFrame(animationFrame);
    document.querySelectorAll('.snake, .snake-head').forEach(el => el.remove());
    document.querySelectorAll('.room.selected').forEach(el => el.classList.remove('selected'));
    document.getElementById('route-info').innerHTML = '';
    currentPath = [];
    currentStep = 0;
    selectedRoom = null;
    document.getElementById('room-select').value = '';
}

document.addEventListener('DOMContentLoaded', () => {
    initRoomPositions();

    document.getElementById('room-select').addEventListener('change', function() {
        reset();
        if (this.value) {
            selectedRoom = this.value;
            document.querySelector(`.room[data-room="${this.value}"]`).classList.add('selected');
        }
    });

    document.querySelectorAll('.room').forEach(room => {
        room.addEventListener('click', function() {
            reset();
            selectedRoom = this.dataset.room;
            document.getElementById('room-select').value = selectedRoom;
            this.classList.add('selected');
        });
    });

    document.getElementById('start-btn').addEventListener('click', function() {
        if (!selectedRoom) {
            alert('Выберите помещение для начала эвакуации');
            return;
        }

        currentPath = buildEvacuationPath(selectedRoom);
        if (currentPath) {
            createSnake();
            showRouteInfo();
            animateSnake();
        } else {
            alert('Не удалось построить маршрут эвакуации');
        }
    });

    document.getElementById('reset-btn').addEventListener('click', reset);
});