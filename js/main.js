"use strict";

;(function() {
    let wrapper = document.querySelector('#wrapper');
    let step = wrapper.querySelector('#step');
    let auto = wrapper.querySelector('#auto');
    let start = wrapper.querySelector('#start');
    let restart = wrapper.querySelector('#restart');
    let lis = wrapper.querySelectorAll('#ships li');
    let myField = wrapper.querySelector('#myField');
    let pcField = wrapper.querySelector('#pcField');
    let ships = {
            destroyer: {
                maxNum: 1,// максимальное количество кораблей
                currentNum: 1,// текущее количество кораблей
                numTds: 4, },// количество ячеек, которое занимает корабль
            frigate: {maxNum: 2, currentNum: 2, numTds: 3, },
            corvette: {maxNum: 3, currentNum: 3, numTds: 2, },
            landing: {maxNum: 4, currentNum: 4, numTds: 1, },
    }
    let myTds = createField(myField);// двумерный массив моего поля
    let pcTds = createField(pcField);// двумерный массив поля Pc
    let myFleet = [];// массив объектов моих кораблей 
    let pcFleet = [];// массив объектов Pc кораблей
    let tds = pcTds;
    let currentShip = 'none';
    let position = 'horizontal';
    let game = 'off';// маркер, что началась игра
    let aims = [];// массив целей для Pc
    let lastHit = [];// последнее попадание Pc
    let timerId;
    let blockTds = false;// блокировка тдшек при работе задержки выполнения функции stepPc
    var audio = new Audio();// звук фона

    setShips(pcFleet);
    addMenuListener();
    addFieldListener();

    //старт игры
    start.addEventListener('click', startGame);

    // удаление поля
    function deleteField(field) {
        let trs = wrapper.querySelectorAll(field);

        for (let tr of trs) {
            tr.remove();
        }
    }

    // рестарт игры
    restart.addEventListener('click', function() {
        if (!blockTds) {
            audio.pause();
            deleteField('#myField tr');
            deleteField('#pcField tr');
            getShipsObj();
            currentShip = 'none';
            position = 'horizontal';
            game = 'off';
            aims = [];
            lastHit = [];
            blockTds = false;
            myFleet = [];
            pcFleet = [];
            myTds = createField(myField);
            pcTds = createField(pcField);
            tds = pcTds;
            setShips(pcFleet);
            getShipsObj();
            changeMenu();
            tds = myTds;
            addFieldListener();
            currentShip = 'none';
        }
    });

    // обработчик начала игры
    function startGame() {
        if (game == 'off') {
            if (!checkShipMenu()) {
                alert('Не все корабли выставлены!');
                
            } else {
                step.textContent = 'Ваш ход...';
                game = 'on';
                soundFon();
                addFieldPcListener(pcTds);  
            }   
        }
    }

    // проверка на победу
    function checkWin(fleet) {
        for (let ship of fleet) {
            if (ship.hp > 0) {
                return false;
            }
        }

        return true;
    }

    // проверка на то, что выставлены все корабли
    function checkShipMenu() {
        for (let ship in ships) {
            if (ships[ship].currentNum) {
                return false;
            }
        }

        return true;
    }

    // добавление обработчиков событий полю Pc при старте игры
    function addFieldPcListener(tds) { 
        for (let i = 0; i < tds.length; i++) {
            for (let j = 0; j < tds[i].length; j++) {
                tds[i][j].addEventListener('click', function func() {
                    if (!blockTds && !tds[i][j].classList.contains('unactive')) {
                        blockTds = true;
                        
                        if (checkHit(i, j, tds, pcFleet)) {
                            if (checkWin(pcFleet)) {
                                alert('Победа!');
                                audio.pause();
                            }

                            blockTds = false;
                        } else {
                            step.textContent = 'Ход компьютера';
                            timerId = setInterval(function() {
                                step.textContent += '.';
                            }, 500);
                            setTimeout(function() {
                                stepPc(myTds, myFleet);
                            }, 1500);
                        }
    
                        tds[i][j].removeEventListener('click', func);
                    }
                });
            }
        }
    }

    // ход Pc
    function stepPc(tds, fleet) {
        let i;
        let j;
        let randomInt;
        
        clearInterval(timerId);

        if (aims.length == 0) {
            [i, j] = findCoordinates(tds);
        } else {
            randomInt = getRandomInt(0, (aims.length - 1));
            i = aims[randomInt][0];
            j = aims[randomInt][1];
        }

        if (checkHit(i, j, tds, fleet)) {
            findAims(randomInt, i, j, tds, fleet);

            if (checkWin(fleet)) {
                alert('Поражение!');
                audio.pause();
            } else {
                step.textContent = 'Ход компьютера';
                timerId = setInterval(function() {
                    step.textContent += '.';
                }, 500);
                setTimeout(function() {
                    stepPc(myTds, myFleet);
                }, 1500);
            }
        } else {
            'splice', aims.splice(randomInt, 1);
            step.textContent = 'Ваш ход...';
            blockTds = false;
        }
    }

    // нахождение целей
    function findAims(randomInt, i, j, tds, fleet) {
        let k = 0;
        let arr = [];

        for (let elem of fleet) {
            if (elem.name == tds[i][j].value) {
                if (elem.hp != 0) {
                    if (aims.length != 0) {
                        'splice', aims.splice(randomInt, 1);

                        if (i == lastHit[0]) {
                            for (let aim of aims) {
                                if (aim[0] == i) {
                                    arr.push(aim);
                                    k++;
                                }
                            }

                            checkJ();
                        } else if (j == lastHit[1]) {
                            for (let aim of aims) {
                                if (aim[1] == j) {
                                    arr.push(aim);
                                    k++;
                                }
                            }

                            checkI();
                        }
                    } else {
                        checkI();
                        checkJ();
                    }

                    aims = arr;
                    lastHit = [];
                    lastHit.push(i, j);
                } else {
                    aims = [];
                }
            }
        }

        // проверка координаты i
        function checkI() {
            if ((i - 1) >= 0 && !(tds[i - 1][j].classList.contains('miss') || tds[i - 1][j].classList.contains('hit') || tds[i - 1][j].classList.contains('unactive'))) {
                arr[k] = [];
                arr[k].push(i - 1, j);
                k++;
            }
            if ((i + 1) < 10 && !(tds[i + 1][j].classList.contains('miss') || tds[i + 1][j].classList.contains('hit') || tds[i + 1][j].classList.contains('unactive'))) {
                arr[k] = [];
                arr[k].push(i + 1, j);
                k++;
            }
        }

        // проверка координаты j
        function checkJ() {
            if ((j - 1) >= 0 && !(tds[i][j - 1].classList.contains('miss') || tds[i][j - 1].classList.contains('hit') || tds[i][j - 1].classList.contains('unactive'))) {
                arr[k] = [];
                arr[k].push(i, j - 1);
                k++;
            }
            if ((j + 1) < 10 && !(tds[i][j + 1].classList.contains('miss') || tds[i][j + 1].classList.contains('hit') || tds[i][j + 1].classList.contains('unactive'))) {
                arr[k] = [];
                arr[k].push(i, j + 1);
                k++;
            }
        }
    }

    // нахождение координат при пустом массиве целей
    function findCoordinates(tds) {
        let i = getRandomInt(0, 9);
        let j = getRandomInt(0, 9); 

        while (tds[i][j].classList.contains('miss') || tds[i][j].classList.contains('hit') || tds[i][j].classList.contains('unactive')) {
            i = getRandomInt(0, 9);
            j = getRandomInt(0, 9); 
        }

        return [i, j];
    }

    // проверка ячейки на попадание
    function checkHit(i, j, tds, fleet) {
        if (tds[i][j].classList.contains('ship')) {
            tds[i][j].classList.add('hit');
            
            for (let elem of fleet) {
                if (tds[i][j].value == elem.name) {
                    elem.hp--;
                    soundDestroy();

                    if (elem.hp == 0) {
                        for (let neighbour of elem.neighbors) {
                            neighbour.classList.add('unactive');
                        }   
                    }
                }
            }

            return true;
        } else {
            soundMiss();
            tds[i][j].classList.add('miss');
            
            return false;
        }
    }

    // отмена клика правой кнопкой мыши
    wrapper.addEventListener('contextmenu', function(event) {
        event.preventDefault();
    });

    //кнопка auto, заполняющая моё поле автоматически
    auto.addEventListener('click', function func() {
        if (game == 'off') {
            tds = myTds;
            myFleet = [];
            getShipsObj();
            cleanTds(true);
            removeMarker()
            cleanLis();
            setShips(myFleet);
            cleanTds();
            currentShip = 'none';
        } else {
            auto.removeEventListener('click', func)
        }
    });

    // восстанавливает объект ships до начальных значений
    function getShipsObj() {
        for (let ship in ships) {
            ships[ship].currentNum = ships[ship].maxNum;
        }
    }

    //очистка списка lis
    function cleanLis() {
        for (let i = 0; i < lis.length; i++) {
            lis[i].firstElementChild.textContent = 0;
        }
    }

    // заполнение поля Pc кораблями и в режиме auto
    function setShips(fleet) {
        for (let ship in ships) {
            currentShip = ship;
            
            while(ships[currentShip].currentNum > 0) {
                let i = getRandomInt(0, 9);
                let j = getRandomInt(0, 9);

                if (getRandomInt(0, 1)) {
                    position = 'horizontal';
                } else {
                    position = 'vertical';
                }

                drawShipPc(i, j, fleet);
            }
        }
    }

    // получение случайного целого числа
    function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    // отрисовка кораблей Pc
    function drawShipPc(i, j, fleet) {
        if (checkFixing(i, j)) {
            setClass(i, j, 'ship');
            setValue(i, j, currentShip + ships[currentShip].currentNum);
            fleet.push({ name: tds[i][j].value, hp: ships[currentShip].numTds, neighbors: checkNeighbors(i, j),});           
            ships[currentShip].currentNum--;
        }
    }    

    // установка значения ячейки равное имени корабля
    function setValue(i, j, value) {
        if (position == 'horizontal') {
            for (let k = 0; k < ships[currentShip].numTds; k++) {
                if ((j + k) < 10) {
                    tds[i][j + k].value = value;
                } else {
                    break;
                }
            }
        } else if (position == 'vertical') {
            for (let k = 0; k < ships[currentShip].numTds; k++) {
                if ((i + k) < 10) {
                    tds[i + k][j].value = value;
                } else {
                    break;
                }
            }      
        }
    }

    // создание игрового поля 
    function createField(field) {
        let arr = [];

        for (let i = 0; i < 10; i++) {
            let tr = document.createElement('tr');

            arr[i] = [];

            for (let j = 0; j < 10; j++) {
                let td = document.createElement('td');

                arr[i].push(td);
                tr.appendChild(td);
            }

            field.appendChild(tr);
        }

        return arr;
    }

    // навешивание обработчиков на меню с кораблями
    function addMenuListener() {
        let keys = Object.keys(ships);

        tds = myTds;
        currentShip = 'none';
        getShipsObj();

        for (let i = 0; i < 4; i++) {
            lis[i].lastElementChild.addEventListener('click', function func() {
                if (ships[keys[i]].currentNum == 0) {
                    lis[i].removeEventListener('click', func);
                } else if (currentShip == 'none') {
                    currentShip = keys[i];
                    removeMarker();
                    lis[i].lastElementChild.classList.add('mark');
                } 
                else if (currentShip == keys[i]) {
                    currentShip = 'none';
                    removeMarker();
                } else {
                    currentShip = keys[i];
                    removeMarker();
                    lis[i].lastElementChild.classList.add('mark');
                }
            });
        }
    }

    // удаление маркера помеченного корабля
    function removeMarker() {
        for (let li of lis) {
            li.lastElementChild.classList.remove('mark');
        }
    }

    // навешивание обработчиков на ячейки поля
    function addFieldListener() {
        for (let i = 0; i < 10; i++) {
            for (let j = 0; j < 10; j++) {
                // наведение на ячейки поля и отрисовка корабля
                tds[i][j].addEventListener('mouseover', function() {
                    if (currentShip != 'none') {                       
                        drawShip(i, j);
                    }
                });

                // очистка поля при уходе курсора с ячейки
                tds[i][j].addEventListener('mouseout', function() {
                    cleanTds();
                });

                // вращение корабля
                tds[i][j].addEventListener('contextmenu', function(event) { 
                    event.preventDefault();

                    if (currentShip != 'none') {
                        if (position == 'horizontal') {
                            position = 'vertical';
                        } else if (position == 'vertical') {
                            position = 'horizontal';
                        }
    
                        cleanTds();
                        drawShip(i, j);
                    }
                });

                // фиксация корабля
                tds[i][j].addEventListener('click', function func() {
                    if (tds[i][j].classList.contains('ship')) {
                        tds[i][j].removeEventListener('click', func);               
                    } else if (tds[i][j].classList.contains('right')) {
                        setClass(i, j, 'ship');
                        setValue(i, j, currentShip + ships[currentShip].currentNum)
                        myFleet.push({ name: tds[i][j].value, hp: ships[currentShip].numTds, neighbors: checkNeighbors(i, j),})
                        removeMarker();
                        ships[currentShip].currentNum--;
                        changeMenu();
                        currentShip = 'none';
                    }
                });
            }
        }
    }

    // отрисовка корабля при наведении мышью
    function drawShip(i, j) {
            if (checkFixing(i, j)) {
                setClass(i, j, 'right');
            } else {
                setClass(i, j, 'wrong');
            }
    }    

    // присвоение класса для отрисовки корабля
    function setClass(i, j, nameClass) {
        if (position == 'horizontal') {
            for (let k = 0; k < ships[currentShip].numTds; k++) {
                if ((j + k) < 10) {
                    tds[i][j + k].classList.add(nameClass);
                } else {
                    break;
                }
            }
        } else if (position == 'vertical') {
            for (let k = 0; k < ships[currentShip].numTds; k++) {
                if ((i + k) < 10) {
                    tds[i + k][j].classList.add(nameClass);
                } else {
                    break;
                }
            }      
        }
    }

    // очистка ячеек поля, параметр all задаёт полную очистку
    function cleanTds(all = false) {
        if (!all) {
            for (let subTd of tds) {
                for (let td of subTd) {
                    td.classList.remove('wrong');
    
                    if (td.classList.contains('ship')) {
                        td.classList.add('right');
                    } else {
                        td.classList.remove('right');
                    }
                }
            }
        } else {
            for (let subTd of tds) {
                for (let td of subTd) {
                    td.classList.remove('wrong');
                    td.classList.remove('right');
                    td.classList.remove('heighbor');
                    td.classList.remove('ship');
                    td.value = '';
                }
            } 
        }

    }
    
    // изменение количества кораблей в списке меню
    function changeMenu() {
        let keys = Object.keys(ships)
        for (let i = 0; i < lis.length; i++) {
            lis[i].firstElementChild.textContent = ships[keys[i]].currentNum;
        }
    }
    
    // проверка на то, что корабль помещается в поле и не пересекается с ячейками с классами ship и neighbor
    function checkFixing(i, j) {
        if (position == 'horizontal') {
            for (let k = 0; k < ships[currentShip].numTds; k++) {
                if ((j + k) < 10) {
                    if (tds[i][j + k].classList.contains('ship') || tds[i][j + k].classList.contains('neighbor')) {
                        return false;
                    }
                } else { 
                    return false;
                }
            }
        } else if (position == 'vertical') {
            for (let k = 0; k < ships[currentShip].numTds; k++) {
                if ((i + k) < 10) {
                    if (tds[i + k][j].classList.contains('ship') || tds[i + k][j].classList.contains('neighbor')) {
                        return false;
                    }
                } else {
                    return false;
                }
            }
        }

        return true;
    }

    // определение соседних клеток рядом с кораблём
    function checkNeighbors(i, j) {
        let res = [];// возращает массив соседей

        if (position == 'horizontal') {

            if ((j - 1) >= 0) {
                tds[i][j - 1].classList.add('neighbor');    
                res.push(tds[i][j - 1]);
            }

            if ((j + ships[currentShip].numTds) < 10) {
                tds[i][j + ships[currentShip].numTds].classList.add('neighbor');
                res.push(tds[i][j + ships[currentShip].numTds]);
            }

            if ((j - 1) >= 0) {
                if ((i - 1) >= 0 && (i + 1) < 10) {
                    res.push(...setNeighbors(i - 1, j - 1, ships[currentShip].numTds + 2));
                    res.push(...setNeighbors(i + 1, j - 1, ships[currentShip].numTds + 2));
                } else if ((i - 1) >= 0){
                    res.push(...setNeighbors(i - 1, j - 1, ships[currentShip].numTds + 2));
                } else if ((i + 1) < 10) {
                    res.push(...setNeighbors(i + 1, j - 1, ships[currentShip].numTds + 2));
                }
            } else if ((j + ships[currentShip].numTds) < 10) {
                if ((i - 1) >= 0 && (i + 1) < 10) {
                    res.push(...setNeighbors(i - 1, j, ships[currentShip].numTds + 1));
                    res.push(...setNeighbors(i + 1, j, ships[currentShip].numTds + 1));
                } else if ((i - 1) >= 0) {
                    res.push(...setNeighbors(i - 1, j, ships[currentShip].numTds + 1));
                } else if ((i + 1) < 10) {
                    res.push(...setNeighbors(i + 1, j, ships[currentShip].numTds + 1,));
                }
            }
        } else if (position == 'vertical') {
            if ((i - 1) >= 0) {
                tds[i - 1][j].classList.add('neighbor');
                res.push(tds[i - 1][j]);
            }

            if ((i + ships[currentShip].numTds) < 10) {
                tds[i + ships[currentShip].numTds][j].classList.add('neighbor');
                res.push(tds[i + ships[currentShip].numTds][j]);
            }

            if ((i - 1) >= 0) {
                if ((j - 1) >= 0 && (j + 1) < 10) {
                    res.push(...setNeighbors(i - 1, j - 1, ships[currentShip].numTds + 2,));
                    res.push(...setNeighbors(i - 1, j + 1, ships[currentShip].numTds + 2,));
                } else if ((j - 1) >= 0){
                    res.push(...setNeighbors(i - 1, j - 1, ships[currentShip].numTds + 2,));
                } else if ((j + 1) < 10) {
                    res.push(...setNeighbors(i - 1, j + 1, ships[currentShip].numTds + 2,));
                }
            } else if ((i + ships[currentShip].numTds) < 10) {
                if (((j - 1) >= 0) && ((j + 1) < 10)) {
                    res.push(...setNeighbors(i, j - 1, ships[currentShip].numTds + 1,));
                    res.push(...setNeighbors(i, j + 1, ships[currentShip].numTds + 1,));
                } else if ((j - 1) >= 0){
                    res.push(...setNeighbors(i, j - 1, ships[currentShip].numTds + 1,));
                } else if ((j + 1) < 10) {
                    res.push(...setNeighbors(i, j + 1, ships[currentShip].numTds + 1,));
                }
            }
        }
  
        return res;
    }
    
    // установка класса neighbor и возвращение массива соседей
    function setNeighbors(i, j, length) {
        let arr = [];

        if (position == 'horizontal') {
            for (let k = 0; k < length; k++) {

                if ((j + k) < 10) {
                    tds[i][j + k].classList.add('neighbor');
                    arr.push(tds[i][j + k]);
                } else {
                    return arr;
                }
            }
        } else if (position == 'vertical') {
            for (let k = 0; k < length; k++) {

                if ((i + k) < 10) {
                    tds[i + k][j].classList.add('neighbor');
                    arr.push(tds[i + k][j]);
                } else {
                    return arr;
                }
            }
        }   
        
        return arr;
    }

    // запуск звука уничтожения корабля
    function soundDestroy() {
        var audio = new Audio(); // Создаём новый элемент Audio

        audio.src = 'sound/destroy.mp3'; // Указываем путь к звуку "клика"
        audio.autoplay = true; // Автоматически запускаем
    }

    // запуск звука промаха
    function soundMiss() {
        var audio = new Audio(); // Создаём новый элемент Audio

        audio.src = 'sound/miss.mp3'; // Указываем путь к звуку "клика"
        audio.autoplay = true; // Автоматически запускаем
    }

    // запуск фонового звука
    function soundFon() {
        audio.src = 'sound/fon.mp3'; // Указываем путь к звуку "клика"
        audio.autoplay = true; // Автоматически запускаем
        audio.loop = true;
    }
})();