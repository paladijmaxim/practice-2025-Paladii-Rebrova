        document.addEventListener('DOMContentLoaded', function() {
            const grid = document.getElementById('grid');
            const startBtn = document.getElementById('startBtn');
            const resetBtn = document.getElementById('resetBtn');
            
            const ROWS = 20;
            const COLS = 20;
            let playerPosition = { x: 2, y: 2 };
            let exitPosition = { x: 18, y: 18 };
            let path = [];
            let isGameStarted = false;
            
            // Создаем лабиринт/здание
            function createBuilding() {
                grid.innerHTML = '';
                
                // Генерация стен и путей
                for (let y = 0; y < ROWS; y++) {
                    for (let x = 0; x < COLS; x++) {
                        const cell = document.createElement('div');
                        cell.classList.add('cell');
                        
                        // Границы здания
                        if (x === 0 || y === 0 || x === COLS-1 || y === ROWS-1) {
                            cell.classList.add('wall');
                        } 
                        // Выход
                        else if (x === exitPosition.x && y === exitPosition.y) {
                            cell.classList.add('exit');
                            cell.textContent = 'Выход';
                        }
                        // Игрок
                        else if (x === playerPosition.x && y === playerPosition.y) {
                            cell.classList.add('player');
                        }
                        // Пути (пока пустые)
                        else {
                            cell.classList.add('path');
                        }
                        
                        grid.appendChild(cell);
                    }
                }
                
                // Добавляем внутренние стены
                addWalls();
                
                // Генерируем путь эвакуации
                generateEvacuationPath();
            }
            
            function addWalls() {
                // Горизонтальные стены
                addWall(5, 2, 10, 2);
                addWall(3, 5, 15, 5);
                addWall(2, 8, 8, 8);
                addWall(10, 8, 18, 8);
                addWall(4, 12, 12, 12);
                addWall(14, 12, 18, 12);
                addWall(2, 15, 10, 15);
                addWall(12, 15, 16, 15);
                
                // Вертикальные стены
                addWall(5, 2, 5, 8);
                addWall(10, 5, 10, 8);
                addWall(15, 2, 15, 5);
                addWall(8, 8, 8, 12);
                addWall(12, 8, 12, 15);
                addWall(4, 12, 4, 15);
                addWall(16, 12, 16, 15);
            }
            
            function addWall(x1, y1, x2, y2) {
                // Горизонтальная стена
                if (y1 === y2) {
                    for (let x = x1; x <= x2; x++) {
                        const index = y1 * COLS + x;
                        if (index < grid.children.length) {
                            grid.children[index].classList.add('wall');
                            grid.children[index].classList.remove('path');
                        }
                    }
                }
                // Вертикальная стена
                else if (x1 === x2) {
                    for (let y = y1; y <= y2; y++) {
                        const index = y * COLS + x1;
                        if (index < grid.children.length) {
                            grid.children[index].classList.add('wall');
                            grid.children[index].classList.remove('path');
                        }
                    }
                }
            }
            
            function generateEvacuationPath() {
                // Очищаем предыдущий путь
                path.forEach(pos => {
                    const index = pos.y * COLS + pos.x;
                    if (grid.children[index].classList.contains('arrow')) {
                        grid.children[index].classList.remove('arrow');
                        grid.children[index].textContent = '';
                        grid.children[index].classList.add('path');
                    }
                });
                
                path = [];
                
                // Генерируем путь от игрока к выходу (упрощенный алгоритм)
                let currentX = playerPosition.x;
                let currentY = playerPosition.y;
                
                // Простой алгоритм движения сначала по горизонтали, потом по вертикали
                while (currentX !== exitPosition.x || currentY !== exitPosition.y) {
                    // Двигаемся по горизонтали
                    if (currentX < exitPosition.x) {
                        currentX++;
                    } else if (currentX > exitPosition.x) {
                        currentX--;
                    }
                    // Затем по вертикали
                    else if (currentY < exitPosition.y) {
                        currentY++;
                    } else if (currentY > exitPosition.y) {
                        currentY--;
                    }
                    
                    // Проверяем, не стена ли это
                    const index = currentY * COLS + currentX;
                    if (grid.children[index].classList.contains('wall')) {
                        // Если наткнулись на стену, ищем обходной путь
                        if (currentX < exitPosition.x) {
                            currentY++;
                        } else {
                            currentX++;
                        }
                        continue;
                    }
                    
                    path.push({ x: currentX, y: currentY });
                }
                
                // Добавляем стрелки направления
                for (let i = 0; i < path.length - 1; i++) {
                    const current = path[i];
                    const next = path[i+1];
                    let direction = '';
                    
                    if (next.x > current.x) direction = '→';
                    else if (next.x < current.x) direction = '←';
                    else if (next.y > current.y) direction = '↓';
                    else if (next.y < current.y) direction = '↑';
                    
                    const index = current.y * COLS + current.x;
                    grid.children[index].classList.add('arrow');
                    grid.children[index].classList.remove('path');
                    grid.children[index].textContent = direction;
                }
            }
            
            function startEvacuation() {
                if (isGameStarted) return;
                isGameStarted = true;
                
                let step = 0;
                const playerIndex = playerPosition.y * COLS + playerPosition.x;
                grid.children[playerIndex].classList.add('player');
                
                const interval = setInterval(() => {
                    if (step >= path.length) {
                        clearInterval(interval);
                        alert('Вы успешно эвакуировались!');
                        isGameStarted = false;
                        return;
                    }
                    
                    // Убираем игрока с предыдущей позиции
                    const prevIndex = playerPosition.y * COLS + playerPosition.x;
                    grid.children[prevIndex].classList.remove('player');
                    
                    // Перемещаем игрока
                    playerPosition = { ...path[step] };
                    const newIndex = playerPosition.y * COLS + playerPosition.x;
                    grid.children[newIndex].classList.add('player');
                    
                    step++;
                }, 500);
            }
            
            startBtn.addEventListener('click', startEvacuation);
            resetBtn.addEventListener('click', () => {
                playerPosition = { x: 2, y: 2 };
                isGameStarted = false;
                createBuilding();
            });
            
            // Инициализация
            createBuilding();
        });