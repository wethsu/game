/**
 * 九九乘法挑戰遊戲 - 主要邏輯
 */

// 常量定義
const ANIMALS = ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🦉', '🦋', '🐠', '🐳', '🐢', '🦖'];
const DEFAULT_TIME_LIMIT = 60; // 時間挑戰模式秒數

// 遊戲狀態
let gameState = {
    challengeMode: null,
    totalQuestions: 0,
    timeLimit: 0,
    currentQuestionIndex: 0,
    score: 0,
    correctAnswers: 0,
    questions: [],
    wrongQuestions: [],
    currentAnswer: '',
    isPracticeMode: false,
    allUniquePossibleQuestionKeys: new Set(),
    allUniquePossibleQuestions: [],
    globalUsedQuestionKeys: new Set(),
    selectedNumbers: [],
    startTime: null,
    gameTimer: null,
    elapsedTime: 0,
    timeChallengeRemaining: DEFAULT_TIME_LIMIT,
    timeChallengeInterval: null
};

let bgMusic;

// ==================== 輔助函數 ====================

/**
 * 洗牌陣列
 */
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

/**
 * 格式化時間（秒 -> MM:SS）
 */
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

/**
 * 切換螢幕顯示
 */
function showScreen(screenId) {
    document.querySelectorAll('.start-screen, .game-screen, .result-screen, .rank-screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.querySelector(`.${screenId}`).classList.add('active');
}

/**
 * 播放背景音樂
 */
function playMusic() {
    if (bgMusic && bgMusic.paused) {
        bgMusic.play().catch(e => console.log("Music play failed:", e));
    }
}

/**
 * 停止背景音樂
 */
function stopMusic() {
    if (bgMusic && !bgMusic.paused) {
        bgMusic.pause();
        bgMusic.currentTime = 0;
    }
}

// ==================== 計時器函數 ====================

/**
 * 啟動計時器
 */
function startTimer() {
    stopTimer();
    gameState.startTime = Date.now();

    if (gameState.challengeMode === 'time') {
        gameState.timeChallengeRemaining = DEFAULT_TIME_LIMIT;
        document.getElementById('timer').textContent = `⏰ ${formatTime(gameState.timeChallengeRemaining)}`;
        gameState.timeChallengeInterval = setInterval(() => {
            gameState.timeChallengeRemaining--;
            document.getElementById('timer').textContent = `⏰ ${formatTime(gameState.timeChallengeRemaining)}`;
            if (gameState.timeChallengeRemaining <= 0) {
                endGame();
            }
        }, 1000);
    } else {
        gameState.gameTimer = setInterval(updateTimer, 1000);
    }
}

/**
 * 停止計時器
 */
function stopTimer() {
    if (gameState.gameTimer) {
        clearInterval(gameState.gameTimer);
        gameState.gameTimer = null;
        if (gameState.challengeMode === 'questions' && gameState.startTime) {
            gameState.elapsedTime = Math.floor((Date.now() - gameState.startTime) / 1000);
        }
    }
    if (gameState.timeChallengeInterval) {
        clearInterval(gameState.timeChallengeInterval);
        gameState.timeChallengeInterval = null;
    }
}

/**
 * 更新計時器顯示
 */
function updateTimer() {
    const elapsed = Math.floor((Date.now() - gameState.startTime) / 1000);
    document.getElementById('timer').textContent =
        `⏰ ${String(Math.floor(elapsed / 60)).padStart(2, '0')}:${String(elapsed % 60).padStart(2, '0')}`;
}

// ==================== 離開確認視窗 ====================

/**
 * 顯示離開確認視窗
 */
function showExitModal() {
    document.getElementById('exitModal').style.display = 'flex';
}

/**
 * 關閉離開確認視窗
 */
function closeExitModal() {
    document.getElementById('exitModal').style.display = 'none';
}

/**
 * 確認離開遊戲
 */
function confirmExit() {
    closeExitModal();
    stopTimer();
    stopMusic();
    restartGame();
}

// ==================== 開始畫面邏輯 ====================

/**
 * 選擇挑戰模式
 */
function selectChallengeMode(mode) {
    gameState.challengeMode = mode;
    document.getElementById('timeChallengeBtn').classList.remove('selected');
    document.getElementById('questionChallengeBtn').classList.remove('selected');
    document.getElementById('questionCountSelection').style.display = 'none';

    if (mode === 'time') {
        document.getElementById('timeChallengeBtn').classList.add('selected');
        gameState.totalQuestions = 0;
        document.getElementById('customQuestions').value = '';
    } else if (mode === 'questions') {
        document.getElementById('questionChallengeBtn').classList.add('selected');
        document.getElementById('questionCountSelection').style.display = 'block';
        if (!document.getElementById('customQuestions').value && gameState.totalQuestions === 0) {
            selectQuestions(10);
        }
    }
    updateStartButton();
}

/**
 * 切換數字選擇
 */
function toggleNumber(number) {
    const btn = document.querySelector(`.number-btn[data-number="${number}"]`);
    const index = gameState.selectedNumbers.indexOf(number);

    if (index > -1) {
        gameState.selectedNumbers.splice(index, 1);
        btn.classList.remove('selected');
    } else {
        gameState.selectedNumbers.push(number);
        btn.classList.add('selected');
    }
    updateStartButton();
}

/**
 * 全選所有數字
 */
function selectAllNumbers() {
    gameState.selectedNumbers = [2, 3, 4, 5, 6, 7, 8, 9];
    document.querySelectorAll('.number-btn').forEach(btn => {
        btn.classList.add('selected');
    });
    updateStartButton();
}

/**
 * 清除所有數字選擇
 */
function clearAllNumbers() {
    gameState.selectedNumbers = [];
    document.querySelectorAll('.number-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
    updateStartButton();
}

/**
 * 更新開始按鈕狀態
 */
function updateStartButton() {
    const startBtn = document.getElementById('startBtn');
    const hasNumbers = gameState.selectedNumbers.length > 0;
    const hasMode = gameState.challengeMode !== null;
    let canStart = false;

    if (gameState.challengeMode === 'time') {
        canStart = hasNumbers;
    } else if (gameState.challengeMode === 'questions') {
        canStart = hasNumbers && gameState.totalQuestions > 0;
    }

    startBtn.disabled = !canStart;

    if (!hasMode) {
        startBtn.textContent = '請選擇挑戰模式';
    } else if (!hasNumbers) {
        startBtn.textContent = '請選擇乘法表';
    } else if (gameState.challengeMode === 'questions' && gameState.totalQuestions === 0) {
        startBtn.textContent = '請選擇題數';
    } else {
        startBtn.textContent = '開始遊戲';
    }
}

/**
 * 選擇預設題數
 */
function selectQuestions(num) {
    gameState.totalQuestions = num;
    updateStartButton();

    document.querySelectorAll('#questionCountSelection .question-btn').forEach(btn => {
        btn.style.background = 'linear-gradient(45deg, #FF6B6B, #4ECDC4)';
    });

    const clickedButton = Array.from(document.querySelectorAll('#questionCountSelection .question-btn'))
                               .find(btn => btn.textContent.includes(`${num} 題`));
    if (clickedButton) {
        clickedButton.style.background = 'linear-gradient(45deg, #FFD700, #FFA500)';
    }
    document.getElementById('customQuestions').value = '';
}

/**
 * 選擇自訂題數
 */
function selectCustomQuestions() {
    const customNumInput = document.getElementById('customQuestions');
    const customNum = parseInt(customNumInput.value);
    if (customNum && customNum > 0 && customNum <= 100) {
        gameState.totalQuestions = customNum;
        updateStartButton();

        document.querySelectorAll('#questionCountSelection .question-btn').forEach(btn => {
            btn.style.background = 'linear-gradient(45deg, #FF6B6B, #4ECDC4)';
        });
        customNumInput.style.borderColor = '#FFD700';
    } else {
        alert('請輸入 1-100 之間的數字！');
        customNumInput.value = '';
        customNumInput.style.borderColor = '#FF6B6B';
    }
}

// ==================== 遊戲邏輯 ====================

/**
 * 初始化所有可能的題目
 */
function initializeAllUniquePossibleQuestions() {
    gameState.allUniquePossibleQuestions = [];
    gameState.allUniquePossibleQuestionKeys.clear();

    for (let i = 2; i <= 9; i++) {
        for (let j = 2; j <= 9; j++) {
            const questionKey = `${i}x${j}`;
            if (!gameState.allUniquePossibleQuestionKeys.has(questionKey)) {
                gameState.allUniquePossibleQuestions.push({
                    num1: i,
                    num2: j,
                    answer: i * j,
                    questionKey: questionKey
                });
                gameState.allUniquePossibleQuestionKeys.add(questionKey);
            }
        }
    }
    shuffleArray(gameState.allUniquePossibleQuestions);
}

/**
 * 生成題目
 */
function generateQuestions() {
    gameState.questions = [];
    let availableQuestionsPool = [];

    if (gameState.isPracticeMode && gameState.wrongQuestions.length > 0) {
        availableQuestionsPool = [...gameState.wrongQuestions];
        shuffleArray(availableQuestionsPool);
    } else {
        if (gameState.allUniquePossibleQuestions.length === 0) {
            initializeAllUniquePossibleQuestions();
        }

        for (const q of gameState.allUniquePossibleQuestions) {
            const isRelevant = gameState.selectedNumbers.includes(q.num1) || gameState.selectedNumbers.includes(q.num2);
            if (isRelevant && !gameState.globalUsedQuestionKeys.has(q.questionKey)) {
                availableQuestionsPool.push(q);
            }
        }

        if (gameState.challengeMode === 'questions' && availableQuestionsPool.length < gameState.totalQuestions) {
            const relevantUsedQuestions = gameState.allUniquePossibleQuestions.filter(q =>
                (gameState.selectedNumbers.includes(q.num1) || gameState.selectedNumbers.includes(q.num2)) &&
                gameState.globalUsedQuestionKeys.has(q.questionKey)
            );
            availableQuestionsPool.push(...relevantUsedQuestions);
            shuffleArray(availableQuestionsPool);
        }
    }

    const numToSelect = gameState.challengeMode === 'time' ? 100 : Math.min(gameState.totalQuestions, availableQuestionsPool.length);

    for (let i = 0; i < numToSelect; i++) {
        const question = availableQuestionsPool[i % availableQuestionsPool.length];
        gameState.questions.push(question);
        if (!gameState.isPracticeMode) {
            gameState.globalUsedQuestionKeys.add(question.questionKey);
        }
    }

    if (gameState.questions.length === 0) {
        alert("沒有足夠的題目可以產生。請檢查您的乘法表選擇或重置題目庫。");
        restartGame();
    }
}

/**
 * 開始遊戲
 */
function startGame() {
    if (!gameState.challengeMode || gameState.selectedNumbers.length === 0 || 
        (gameState.challengeMode === 'questions' && gameState.totalQuestions === 0)) {
        alert('請先選擇挑戰模式、乘法表範圍和題數！');
        return;
    }

    gameState.currentQuestionIndex = 0;
    gameState.score = 0;
    gameState.correctAnswers = 0;
    gameState.wrongQuestions = [];
    gameState.currentAnswer = '';
    gameState.isPracticeMode = false;

    generateQuestions();

    showScreen('game-screen');
    updateGameDisplay();
    playMusic();
    startTimer();
}

/**
 * 隨機獲取動物圖示
 */
function getRandomAnimal() {
    return ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
}

/**
 * 顯示題目
 */
function displayQuestion() {
    const currentQ = gameState.questions[gameState.currentQuestionIndex];
    const questionDisplayElement = document.getElementById('question');
    questionDisplayElement.innerHTML = `<span class="animal-icon">${getRandomAnimal()}</span>${currentQ.num1} × ${currentQ.num2} = ?`;
    document.getElementById('answerInput').value = '';
    document.getElementById('feedback').textContent = '';
    document.getElementById('answerInput').focus();
}

/**
 * 更新遊戲顯示
 */
function updateGameDisplay() {
    document.getElementById('score').textContent = gameState.score;
    document.getElementById('currentQ').textContent = gameState.currentQuestionIndex + 1;
    document.getElementById('totalQ').textContent = gameState.challengeMode === 'time' ? '∞' : gameState.totalQuestions;
    displayQuestion();
}

/**
 * 輸入數字
 */
function inputNumber(num) {
    if (gameState.currentAnswer.length < 3) {
        gameState.currentAnswer += num;
        document.getElementById('answerInput').value = gameState.currentAnswer;
    }
}

/**
 * 退格刪除
 */
function backspace() {
    gameState.currentAnswer = gameState.currentAnswer.slice(0, -1);
    document.getElementById('answerInput').value = gameState.currentAnswer;
}

/**
 * 提交答案
 */
function submitAnswer() {
    const userAnswer = parseInt(gameState.currentAnswer);
    const currentQ = gameState.questions[gameState.currentQuestionIndex];
    const feedbackElement = document.getElementById('feedback');

    if (isNaN(userAnswer)) {
        feedbackElement.textContent = '請輸入答案！';
        feedbackElement.className = 'feedback incorrect';
        document.getElementById('answerInput').value = '';
        gameState.currentAnswer = '';
        setTimeout(() => {
            feedbackElement.textContent = '';
        }, 500);
        return;
    }

    document.querySelectorAll('.key-btn').forEach(btn => btn.disabled = true);

    let delay = 0;
    if (userAnswer === currentQ.answer) {
        feedbackElement.textContent = '✅ 太棒了！答對了！';
        feedbackElement.className = 'feedback correct';
        gameState.score += 10;
        gameState.correctAnswers++;
        if (gameState.isPracticeMode) {
            gameState.wrongQuestions = gameState.wrongQuestions.filter(q => q.questionKey !== currentQ.questionKey);
        }
        delay = 0;
    } else {
        feedbackElement.textContent = `❌ 錯了！正確答案是 ${currentQ.answer}`;
        feedbackElement.className = 'feedback incorrect';
        if (!gameState.wrongQuestions.some(q => q.questionKey === currentQ.questionKey)) {
            gameState.wrongQuestions.push(currentQ);
        }
        delay = 500;
    }
    document.getElementById('score').textContent = gameState.score;
    gameState.currentAnswer = '';

    setTimeout(() => {
        document.querySelectorAll('.key-btn').forEach(btn => btn.disabled = false);
        nextQuestion();
    }, delay);
}

/**
 * 下一題
 */
function nextQuestion() {
    document.getElementById('feedback').textContent = '';
    document.getElementById('answerInput').value = '';

    gameState.currentQuestionIndex++;

    if (gameState.challengeMode === 'questions') {
        if (gameState.currentQuestionIndex < gameState.totalQuestions) {
            updateGameDisplay();
        } else {
            endGame();
        }
    } else if (gameState.challengeMode === 'time') {
        if (gameState.timeChallengeRemaining > 0) {
            updateGameDisplay();
        } else {
            endGame();
        }
    }
}

/**
 * 結束遊戲
 */
function endGame() {
    stopTimer();
    stopMusic();
    showScreen('result-screen');

    document.getElementById('finalScore').textContent = gameState.score;
    document.getElementById('correctCount').textContent = gameState.correctAnswers;
    document.getElementById('incorrectCount').textContent = gameState.totalQuestions - gameState.correctAnswers;
    const accuracy = gameState.totalQuestions > 0 ? ((gameState.correctAnswers / gameState.totalQuestions) * 100).toFixed(0) : 0;
    document.getElementById('accuracy').textContent = accuracy;
    document.getElementById('totalTime').textContent = formatTime(
        gameState.elapsedTime > 0 ? gameState.elapsedTime : (DEFAULT_TIME_LIMIT - gameState.timeChallengeRemaining)
    );

    const totalPossibleQuestionsForSelectedRange = gameState.allUniquePossibleQuestions.filter(q =>
        gameState.selectedNumbers.includes(q.num1) || gameState.selectedNumbers.includes(q.num2)
    ).length;

    document.getElementById('completedQuestions').textContent = gameState.globalUsedQuestionKeys.size;
    document.getElementById('totalPossible').textContent = totalPossibleQuestionsForSelectedRange;
    document.getElementById('selectedTables').textContent = `選擇的乘法表：${gameState.selectedNumbers.join(', ')}`;

    const wrongQuestionsDiv = document.getElementById('wrongQuestions');
    wrongQuestionsDiv.innerHTML = '';
    if (gameState.wrongQuestions.length > 0) {
        document.getElementById('practiceBtn').style.display = 'inline-block';
        const list = document.createElement('ul');
        list.style.listStyleType = 'none';
        list.style.padding = '0';
        list.style.color = '#FF6B6B';
        list.style.fontWeight = 'bold';
        const header = document.createElement('h4');
        header.textContent = '😢 答錯的題目：';
        header.style.color = '#FF6B6B';
        wrongQuestionsDiv.appendChild(header);

        gameState.wrongQuestions.forEach(q => {
            const listItem = document.createElement('li');
            listItem.textContent = `${q.num1} × ${q.num2} = ${q.answer}`;
            list.appendChild(listItem);
        });
        wrongQuestionsDiv.appendChild(list);
    } else {
        document.getElementById('practiceBtn').style.display = 'none';
        wrongQuestionsDiv.textContent = '恭喜你，全部答對了！';
        wrongQuestionsDiv.style.color = '#4ECDC4';
        wrongQuestionsDiv.style.fontWeight = 'bold';
    }

    if (gameState.challengeMode === 'questions' && gameState.correctAnswers > 0) {
        checkAndPromptForName('questions', gameState.correctAnswers, gameState.elapsedTime);
    } else if (gameState.challengeMode === 'time' && gameState.score > 0) {
        checkAndPromptForName('time', gameState.score, gameState.correctAnswers);
    }
}

/**
 * 重新開始遊戲
 */
function restartGame() {
    gameState = {
        challengeMode: null,
        totalQuestions: 0,
        timeLimit: 0,
        currentQuestionIndex: 0,
        score: 0,
        correctAnswers: 0,
        questions: [],
        wrongQuestions: [],
        currentAnswer: '',
        isPracticeMode: false,
        allUniquePossibleQuestionKeys: gameState.allUniquePossibleQuestionKeys,
        allUniquePossibleQuestions: gameState.allUniquePossibleQuestions,
        globalUsedQuestionKeys: gameState.globalUsedQuestionKeys,
        selectedNumbers: [],
        startTime: null,
        gameTimer: null,
        elapsedTime: 0,
        timeChallengeRemaining: DEFAULT_TIME_LIMIT,
        timeChallengeInterval: null
    };

    document.getElementById('score').textContent = '0';
    document.getElementById('timer').textContent = '⏰ 00:00';
    document.getElementById('currentQ').textContent = '1';
    document.getElementById('totalQ').textContent = '10';
    document.getElementById('question').innerHTML = '';
    document.getElementById('answerInput').value = '';
    document.getElementById('feedback').textContent = '';
    document.getElementById('customQuestions').value = '';

    document.querySelectorAll('.number-btn').forEach(btn => {
        btn.classList.remove('selected');
    });

    document.querySelectorAll('.question-selection .question-btn').forEach(btn => {
        btn.style.background = 'linear-gradient(45deg, #FF6B6B, #4ECDC4)';
    });

    document.getElementById('timeChallengeBtn').classList.remove('selected');
    document.getElementById('questionChallengeBtn').classList.remove('selected');
    document.getElementById('questionCountSelection').style.display = 'none';

    updateStartButton();
    showScreen('start-screen');
    stopMusic();
}

/**
 * 練習錯題
 */
function practiceWrong() {
    if (gameState.wrongQuestions.length === 0) {
        alert('沒有錯題可以練習喔！');
        return;
    }
    gameState.isPracticeMode = true;
    gameState.totalQuestions = gameState.wrongQuestions.length;
    gameState.currentQuestionIndex = 0;
    gameState.score = 0;
    gameState.correctAnswers = 0;
    gameState.currentAnswer = '';
    gameState.challengeMode = 'questions';

    gameState.questions = [...gameState.wrongQuestions];
    shuffleArray(gameState.questions);
    gameState.wrongQuestions = [];

    showScreen('game-screen');
    updateGameDisplay();
    playMusic();
    startTimer();
}

/**
 * 重置題目庫
 */
function resetAllQuestions() {
    gameState.globalUsedQuestionKeys.clear();
    initializeAllUniquePossibleQuestions();
    alert('題目庫已重置，將從所有可能的題目中重新開始！');
    restartGame();
}

// ==================== 排行榜功能 ====================

/**
 * 獲取排行榜資料
 */
function getLeaderboard(mode) {
    try {
        const leaderboard = JSON.parse(localStorage.getItem(`multiplicationLeaderboard_${mode}`)) || [];
        return leaderboard;
    } catch (e) {
        console.error("Error parsing leaderboard from localStorage:", e);
        return [];
    }
}

/**
 * 儲存排行榜資料
 */
function saveLeaderboard(mode, leaderboard) {
    localStorage.setItem(`multiplicationLeaderboard_${mode}`, JSON.stringify(leaderboard));
}

/**
 * 檢查是否為高分並提示輸入名字
 */
function checkAndPromptForName(mode, score, extraValue) {
    const leaderboard = getLeaderboard(mode);
    const isTopPlayer = leaderboard.length < 10 ||
                        (mode === 'questions' && (score > leaderboard[leaderboard.length - 1].score || 
                        (score === leaderboard[leaderboard.length - 1].score && extraValue < leaderboard[leaderboard.length - 1].time))) ||
                        (mode === 'time' && score > leaderboard[leaderboard.length - 1].score);

    if (isTopPlayer) {
        document.getElementById('nameModal').style.display = 'flex';
        document.getElementById('playerNameInput').focus();
        document.getElementById('playerNameInput').dataset.mode = mode;
        document.getElementById('playerNameInput').dataset.score = score;
        document.getElementById('playerNameInput').dataset.extraValue = extraValue;
    }
}

/**
 * 儲存分數並顯示排行榜
 */
function saveScoreAndShowRank() {
    const playerNameInput = document.getElementById('playerNameInput');
    let playerName = playerNameInput.value.trim();
    if (!playerName) {
        playerName = "匿名玩家";
    }

    const mode = playerNameInput.dataset.mode;
    const score = parseInt(playerNameInput.dataset.score);
    const extraValue = parseInt(playerNameInput.dataset.extraValue);

    const leaderboard = getLeaderboard(mode);

    let newEntry;
    if (mode === 'questions') {
        newEntry = { name: playerName, score: score, time: extraValue };
        leaderboard.push(newEntry);
        leaderboard.sort((a, b) => {
            if (b.score !== a.score) {
                return b.score - a.score;
            }
            return a.time - b.time;
        });
    } else {
        newEntry = { name: playerName, score: score, correctCount: extraValue };
        leaderboard.push(newEntry);
        leaderboard.sort((a, b) => b.score - a.score);
    }

    while (leaderboard.length > 10) {
        leaderboard.pop();
    }

    saveLeaderboard(mode, leaderboard);
    document.getElementById('nameModal').style.display = 'none';
    playerNameInput.value = '';
    showLeaderboard(mode);
}

/**
 * 顯示排行榜
 */
function showLeaderboard(modeToDisplay = 'questions') {
    stopMusic();
    showScreen('rank-screen');
    displayLeaderboard(modeToDisplay);
}

/**
 * 顯示特定模式的排行榜
 */
function displayLeaderboard(mode) {
    const leaderboardList = document.getElementById('leaderboardList');
    leaderboardList.innerHTML = '';
    const leaderboard = getLeaderboard(mode);

    document.getElementById('showTimeRankBtn').classList.remove('active');
    document.getElementById('showQuestionRankBtn').classList.remove('active');
    if (mode === 'time') {
        document.getElementById('showTimeRankBtn').classList.add('active');
    } else {
        document.getElementById('showQuestionRankBtn').classList.add('active');
    }

    if (leaderboard.length === 0) {
        const li = document.createElement('li');
        li.textContent = '目前沒有紀錄。';
        li.style.justifyContent = 'center';
        li.style.color = '#999';
        leaderboardList.appendChild(li);
        return;
    }

    leaderboard.forEach((entry, index) => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span class="rank">${index + 1}.</span>
            <span class="name">${entry.name}</span>
            <span class="score-time">
                ${mode === 'questions' ? `答對：${entry.score}題 / 用時：${formatTime(entry.time)}` : `得分：${entry.score} / 答對：${entry.correctCount}題`}
            </span>
        `;
        leaderboardList.appendChild(li);
    });
}

/**
 * 清空排行榜
 */
function clearLeaderboard() {
    if (confirm('確定要清空排行榜嗎？這將無法復原。')) {
        localStorage.removeItem('multiplicationLeaderboard_questions');
        localStorage.removeItem('multiplicationLeaderboard_time');
        alert('排行榜已清空！');
        displayLeaderboard(document.getElementById('showQuestionRankBtn').classList.contains('active') ? 'questions' : 'time');
    }
}

// ==================== 初始化 ====================

document.addEventListener('DOMContentLoaded', () => {
    bgMusic = document.getElementById('bgMusic');
    initializeAllUniquePossibleQuestions();
    updateStartButton();
    document.getElementById('exitModal').style.display = 'none';
    document.getElementById('nameModal').style.display = 'none';

    if (!gameState.challengeMode) {
        selectChallengeMode('questions');
        selectQuestions(10);
    }
});
