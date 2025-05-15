const graph = {
    'exit1': ['corridor-0'],
    'exit2': ['corridor-5'],
    '2201M': ['corridor-0'],
    '2201': ['corridor-0'],
    '2203': ['corridor-1'],
    '2204': ['corridor-2'],
    '2205': ['corridor-3'],
    '2206': ['corridor-4'],
    '2214': ['corridor-0'],
    '2210': ['corridor-0'],
    '2202B': ['corridor-1'],
    '2202A': ['corridor-1'],
    'elevator': ['corridor-2'],
    '2209': ['corridor-3'],
    '2208A': ['corridor-4'],
    '2208': ['corridor-4'],
    '2207': ['corridor-5'],
    'toilet': ['corridor-5'],
    'corridor-0': ['exit1', '2201M', '2201', '2214', '2210', 'corridor-1'],
    'corridor-1': ['corridor-0', '2203', '2202B', '2202A', 'corridor-2'],
    'corridor-2': ['corridor-1', '2204', 'elevator', 'corridor-3'],
    'corridor-3': ['corridor-2', '2205', '2209', 'corridor-4'],
    'corridor-4': ['corridor-3', '2206', '2208A', '2208', 'corridor-5'],
    'corridor-5': ['corridor-4', '2207', 'toilet', 'exit2']
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
    const pathToExit1 = findShortestPath(start, 'exit1');
    const pathToExit2 = findShortestPath(start, 'exit2');
    
    if (!pathToExit1) return pathToExit2;
    if (!pathToExit2) return pathToExit1;
    
    return pathToExit1.length <= pathToExit2.length ? pathToExit1 : pathToExit2;
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
        
        if (Math.abs(next.y - current.y) < 10) {
            segment.style.width = `${Math.abs(next.x - current.x)}px`;
            segment.style.height = '10px';
            segment.style.left = `${Math.min(current.x, next.x)}px`;
            segment.style.top = `${current.y - 5}px`;
        } else {
            segment.style.width = '10px';
            segment.style.height = `${Math.abs(next.y - current.y)}px`;
            segment.style.left = `${current.x - 5}px`;
            segment.style.top = `${Math.min(current.y, next.y)}px`;
        }

        document.getElementById('game-container').appendChild(segment);
        snakeSegments.push(segment);
    }

    const head = document.createElement('div');
    head.className = 'snake-head';
    document.getElementById('game-container').appendChild(head);
    snakeSegments.push(head);
}

function animateSnake() {
    if (currentStep >= currentPath.length * 10) {
        cancelAnimationFrame(animationFrame);
        return;
    }

    const progress = currentStep / (currentPath.length * 10);
    const pathIndex = Math.floor(progress * (currentPath.length - 1));
    const segmentProgress = (progress * (currentPath.length - 1)) % 1;

    const current = roomPositions[currentPath[pathIndex]];
    const next = roomPositions[currentPath[pathIndex + 1]];
    
    if (current && next) {
        const head = snakeSegments[snakeSegments.length - 1];
        head.style.left = `${current.x + (next.x - current.x) * segmentProgress - 7.5}px`;
        head.style.top = `${current.y + (next.y - current.y) * segmentProgress - 7.5}px`;
    }

    // Подсветка пройденного пути
    for (let i = 0; i < snakeSegments.length - 1; i++) {
        if (i < pathIndex) {
            snakeSegments[i].style.opacity = '1';
        }
    }

    currentStep++;
    animationFrame = requestAnimationFrame(animateSnake);
}

function showRouteInfo() {
    const exit = currentPath[currentPath.length - 1] === 'exit1' ? 'левому выходу' : 'правому выходу';
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

    document.querySelectorAll('.room:not(.exit)').forEach(room => {
        room.addEventListener('click', function() {
            reset();
            selectedRoom = this.dataset.room;
            document.getElementById('room-select').value = selectedRoom;
            this.classList.add('selected');
        });
    });

    document.getElementById('start-btn').addEventListener('click', function() {
        if (!selectedRoom) {
            alert('Выберите аудиторию для начала эвакуации');
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