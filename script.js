class MathGame {
    constructor() {
        this.currentAge = null;
        this.currentStage = null;
        this.maxStage = null;
        this.currentProblem = null;
        this.score = 0;
        this.correctAnswers = 0;
        this.totalProblems = 0;
        this.startTime = null;
        this.gameTime = 0;
        this.timerInterval = null;
        this.timerPool = 0; // 분 단위, 누적 시간
        this.selectedVideoChoice = ''; // 종료 화면에서 선택한 영상

        // 현재 게임에 적용된 연산자 (로컬 스토리지에서 로드)
        this.currentOperator = localStorage.getItem('currentOperator') || '+';
        // 설정 페이지에서 선택된 연산자 (저장되기 전 임시 값)
        this.stagedOperator = this.currentOperator;
        // 사용자 지정 영상 선택지 (기본값 또는 localStorage에서 로드)
        this.customVideoChoices = JSON.parse(localStorage.getItem('customVideoChoices')) || ['뽀로로', '넘버블럭스', '슈퍼심플송'];


        this.initializeElements();
        this.bindEvents();
        this.updateVideoChoiceButtons(); // 초기 로드 시 영상 선택 버튼 업데이트
    }

    initializeElements() {
        // Pages
        this.landingPage = document.getElementById('landing-page');
        this.gamePage = document.getElementById('game-page');
        this.endPage = document.getElementById('end-page');
        this.settingsPage = document.getElementById('settings-page'); // 설정 페이지 추가

        // Landing page elements
        this.ageSelection = document.querySelector('.age-selection');
        this.stageSelection = document.querySelector('.stage-selection');
        this.ageButtons = document.querySelectorAll('.age-btn');
        this.stageButtons = document.querySelectorAll('.stage-btn');
        this.prevStageBtn = document.getElementById('prev-stage-btn');
        this.settingsBtn = document.getElementById('settings-btn'); // 설정 버튼 추가

        // Settings page elements
        this.operatorButtons = document.querySelectorAll('.operator-btn'); // 연산자 선택 버튼
        this.operatorChangeWarning = document.getElementById('operator-change-warning'); // 연산 종류 변경 경고 메시지
        this.videoInput1 = document.getElementById('video-input-1');
        this.videoInput2 = document.getElementById('video-input-2');
        this.videoInput3 = document.getElementById('video-input-3');
        this.saveVideoSettingsBtn = document.getElementById('save-video-settings-btn');
        this.backToLandingFromSettingsBtn = document.getElementById('back-to-landing-from-settings-btn');

        // Game page elements
        this.currentStageElement = document.getElementById('current-stage');
        this.scoreElement = document.getElementById('score');
        this.timerElement = document.getElementById('timer');
        this.progressFill = document.getElementById('progress-fill');
        this.problemText = document.getElementById('problem-text');
        this.answerInput = document.getElementById('answer-input');
        this.submitBtn = document.getElementById('submit-btn');
        this.retryBtn = document.getElementById('retry-btn');
        this.homeBtnGame = document.getElementById('home-btn-game');
        this.numberButtons = document.querySelectorAll('.num-btn');

        // End page elements
        this.finalScoreElement = document.getElementById('final-score');
        this.accuracyElement = document.getElementById('accuracy');
        this.timeTakenElement = document.getElementById('time-taken');
        this.timerPoolDisplay = document.getElementById('timer-pool-display');
        this.timerFullMessage = document.getElementById('timer-full-message');
        this.videoOptionsContainer = document.querySelector('.video-options'); // 영상 선택 버튼들을 담을 컨테이너
        this.youtubeLink = document.getElementById('youtube-link');
        this.playAgainBtn = document.getElementById('play-again-btn');
        this.homeBtn = document.getElementById('home-btn');

        const isAndroid = /Android/i.test(navigator.userAgent);
        if (isAndroid) {
            this.answerInput.readOnly = true;
            document.getElementById('app').classList.add('android');
        }
    }

    bindEvents() {
        // Landing page events
        this.ageButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.currentAge = parseInt(e.currentTarget.dataset.age);
                this.showStageSelection();
            });
        });

        this.stageButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.maxStage = parseInt(e.currentTarget.dataset.stage);
                this.startGame(); // 단계 선택 후 바로 게임 시작
            });
        });

        this.prevStageBtn.addEventListener('click', () => this.showAgeSelection());
        this.settingsBtn.addEventListener('click', () => this.showSettingsPage()); // 설정 버튼 클릭 이벤트

        // Settings page events
        this.operatorButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const newStagedOperator = e.currentTarget.dataset.operator;
                // ▼▼▼ [수정된 부분] display 대신 visibility 속성 제어 ▼▼▼
                if (this.currentOperator !== newStagedOperator) {
                    this.operatorChangeWarning.style.visibility = 'visible';
                    this.timerPool = 0; // 타이머 풀 초기화
                    this.updateTimerPoolUI(); // UI 업데이트
                } else {
                    this.operatorChangeWarning.style.visibility = 'hidden';
                }
                // ▲▲▲ [수정된 부분] display 대신 visibility 속성 제어 ▲▲▲
                this.stagedOperator = newStagedOperator; // 임시 값으로 저장
                this.updateOperatorButtonSelection(); // 선택된 연산자 버튼 시각화 (임시 값 기준)
            });
        });

        this.saveVideoSettingsBtn.addEventListener('click', () => {
            this.saveSettings(); // 저장 버튼 클릭 시 모든 설정 저장
            this.showPage(this.landingPage); // 저장 버튼 클릭 시 랜딩 페이지로 돌아가기
        });
        // '이전으로' 버튼은 설정 저장 없이 랜딩 페이지로 돌아가기만 합니다.
        this.backToLandingFromSettingsBtn.addEventListener('click', () => this.showPage(this.landingPage));

        // Game page events
        this.submitBtn.addEventListener('click', () => this.checkAnswer());
        
        this.answerInput.addEventListener('keydown', (e) => {
            const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Enter'];
            const isNumber = e.key >= '0' && e.key <= '9';
            
            if (e.ctrlKey || e.altKey || e.metaKey) {
                return;
            }

            if (!isNumber && !allowedKeys.includes(e.key)) {
                e.preventDefault();
            }
            
            if (e.key === 'Enter') {
                this.checkAnswer();
            }
        });
        
        this.retryBtn.addEventListener('click', () => this.retryStage());
        this.homeBtnGame.addEventListener('click', () => this.goHome());
        
        this.numberButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const target = e.currentTarget;
                if (target.classList.contains('clear-btn')) {
                    this.answerInput.value = this.answerInput.value.slice(0, -1);
                } else if (target.dataset.num !== undefined) { // ▼▼▼ [수정된 부분] 'undefined' 버그 수정 ▼▼▼
                    const num = target.dataset.num;
                    if (this.answerInput.value.length < 3) {
                        this.answerInput.value += num;
                    }
                }
            });
        });

        // End page events
        this.playAgainBtn.addEventListener('click', () => this.playAgain());
        this.homeBtn.addEventListener('click', () => this.goHome());

        this.videoOptionsContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('video-choice')) {
                this.selectedVideoChoice = e.target.textContent.trim();
                this.videoOptionsContainer.querySelectorAll('.video-choice').forEach(btn => btn.classList.remove('selected'));
                e.target.classList.add('selected');
            }
        });

        this.youtubeLink.addEventListener('click', (e) => {
            e.preventDefault();
            if (this.youtubeLink.hasAttribute('disabled')) return;

            if (this.selectedVideoChoice) {
                const youtubeSearchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(this.selectedVideoChoice)}`;
                window.open(youtubeSearchUrl, '_blank');
            } else {
                this.showMessageBox('보고싶은 영상을 선택해주세요.');
            }
        });
    }

    // ====================================================================
    // 페이지 전환 관련 메서드
    // ====================================================================
    showPage(pageToShow) {
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });
        pageToShow.classList.add('active');

        if (pageToShow === this.settingsPage) {
            // 설정 페이지 진입 시 현재 활성화된 연산자를 임시 값으로 설정
            this.stagedOperator = this.currentOperator; 
            this.videoInput1.value = this.customVideoChoices[0] || '';
            this.videoInput2.value = this.customVideoChoices[1] || '';
            this.videoInput3.value = this.customVideoChoices[2] || '';
            this.updateOperatorButtonSelection(); // 임시 값 기준으로 버튼 선택 표시
            this.operatorChangeWarning.style.visibility = 'hidden'; // ▼▼▼ [수정된 부분] 페이지 진입 시 경고 메시지 숨김 ▼▼▼
        }
        if (pageToShow === this.endPage) {
            this.updateVideoChoiceButtons();
        }
    }

    showAgeSelection() {
        this.ageSelection.style.display = 'block';
        this.stageSelection.style.display = 'none';
        this.showPage(this.landingPage);
    }

    showStageSelection() {
        this.ageSelection.style.display = 'none';
        this.stageSelection.style.display = 'block';
    }

    showSettingsPage() {
        this.showPage(this.settingsPage);
    }

    // ====================================================================
    // 설정 페이지 관련 메서드
    // ====================================================================
    saveSettings() {
        // 연산자 설정 저장
        this.currentOperator = this.stagedOperator;
        localStorage.setItem('currentOperator', this.currentOperator);

        // 영상 설정 저장
        const newChoices = [
            this.videoInput1.value.trim() || '뽀로로',
            this.videoInput2.value.trim() || '넘버블럭스',
            this.videoInput3.value.trim() || '슈퍼심플송'
        ];
        this.customVideoChoices = newChoices;
        localStorage.setItem('customVideoChoices', JSON.stringify(this.customVideoChoices));
        this.updateVideoChoiceButtons();
    }

    updateVideoChoiceButtons() {
        this.videoOptionsContainer.innerHTML = '<p>보고싶은 영상 선택:</p>';
        this.customVideoChoices.forEach(choice => {
            if (choice) {
                const button = document.createElement('button');
                button.classList.add('video-choice');
                button.textContent = choice;
                this.videoOptionsContainer.appendChild(button);
            }
        });
    }

    updateOperatorButtonSelection() {
        this.operatorButtons.forEach(btn => {
            // 임시 값(stagedOperator)을 기준으로 선택된 버튼 표시
            if (btn.dataset.operator === this.stagedOperator) {
                btn.classList.add('selected');
            } else {
                btn.classList.remove('selected');
            }
        });
    }

    // ====================================================================
    // 게임 진행 관련 메서드
    // ====================================================================
    startGame() {
        this.currentStage = 1;
        this.score = 0;
        this.correctAnswers = 0;
        this.totalProblems = 0;
        this.startTime = Date.now();
        this.startTimer();

        this.showPage(this.gamePage);
        this.generateProblem();
        this.updateUI();
    }

    generateProblem() {
        const problem = this.generateProblemByOperator(this.currentAge, this.currentStage, this.currentOperator);
        this.currentProblem = problem;
        this.problemText.textContent = `${problem.num1} ${problem.operator} ${problem.num2} = ?`;
        this.answerInput.value = '';
        this.answerInput.focus();
    }

    generateProblemByOperator(age, stage, operator) {
        let num1, num2;
        if (age === 5) {
            if (stage === 1) { num1 = Math.floor(Math.random() * 5) + 1; num2 = Math.floor(Math.random() * 5) + 1; }
            else if (stage === 2) { num1 = Math.floor(Math.random() * 10) + 1; num2 = Math.floor(Math.random() * 5) + 1; }
            else if (stage === 3) { num1 = Math.floor(Math.random() * 10) + 1; num2 = Math.floor(Math.random() * 10) + 1; }
            else if (stage === 4) { num1 = Math.floor(Math.random() * 15) + 1; num2 = Math.floor(Math.random() * 15) + 1; }
            else if (stage === 5) { num1 = Math.floor(Math.random() * 20) + 1; num2 = Math.floor(Math.random() * 20) + 1; }
        } else if (age === 6) {
            if (stage === 1) { num1 = Math.floor(Math.random() * 15) + 1; num2 = Math.floor(Math.random() * 15) + 1; }
            else if (stage === 2) { num1 = Math.floor(Math.random() * 20) + 1; num2 = Math.floor(Math.random() * 20) + 1; }
            else if (stage === 3) { num1 = Math.floor(Math.random() * 30) + 1; num2 = Math.floor(Math.random() * 30) + 1; }
            else if (stage === 4) { num1 = Math.floor(Math.random() * 26) + 10; num2 = Math.floor(Math.random() * 26) + 10; }
            else if (stage === 5) { num1 = Math.floor(Math.random() * 16) + 20; num2 = Math.floor(Math.random() * 16) + 20; }
        } else if (age === 7) {
            if (stage === 1) { num1 = Math.floor(Math.random() * 26) + 10; num2 = Math.floor(Math.random() * 26) + 10; }
            else if (stage === 2) { num1 = Math.floor(Math.random() * 16) + 20; num2 = Math.floor(Math.random() * 16) + 20; }
            else if (stage === 3) { num1 = Math.floor(Math.random() * 26) + 20; num2 = Math.floor(Math.random() * 26) + 20; }
            else if (stage === 4) { num1 = Math.floor(Math.random() * 26) + 20; num2 = Math.floor(Math.random() * 36) + 20; }
            else if (stage === 5) { num1 = Math.floor(Math.random() * 36) + 30; num2 = Math.floor(Math.random() * 46) + 30; }
        } else if (age === 8) {
            if (stage === 1) { num1 = Math.floor(Math.random() * 26) + 20; num2 = Math.floor(Math.random() * 36) + 20; }
            else if (stage === 2) { num1 = Math.floor(Math.random() * 36) + 30; num2 = Math.floor(Math.random() * 46) + 30; }
            else if (stage === 3) { num1 = Math.floor(Math.random() * 56) + 30; num2 = Math.floor(Math.random() * 56) + 30; }
            else if (stage === 4) { num1 = Math.floor(Math.random() * 70) + 30; num2 = Math.floor(Math.random() * 70) + 30; }
            else if (stage === 5) { num1 = Math.floor(Math.random() * 50) + 50; num2 = Math.floor(Math.random() * 50) + 50; }
        }

        let answer;
        switch (operator) {
            case '+':
                answer = num1 + num2;
                break;
            case '-':
                if (num1 < num2) [num1, num2] = [num2, num1];
                answer = num1 - num2;
                break;
            default:
                operator = '+';
                answer = num1 + num2;
        }

        return { num1, num2, answer, operator };
    }

    checkAnswer() {
        const userAnswer = parseInt(this.answerInput.value);
        const correctAnswer = this.currentProblem.answer;
        this.totalProblems++;
        if (userAnswer === correctAnswer) {
            this.correctAnswers++;
            if (this.currentStage === 3) { this.score += 10; }
            else if (this.currentStage === 4) { this.score += 15; }
            else if (this.currentStage === 5) { this.score += 20; }
            else { this.score += this.currentStage * 10; }
            this.problemText.classList.add('correct');
            setTimeout(() => { this.problemText.classList.remove('correct'); }, 500);
        } else {
            this.problemText.classList.add('incorrect');
            setTimeout(() => { this.problemText.classList.remove('incorrect'); }, 500);
        }
        const problemsPerStage = 5;
        if (this.totalProblems % problemsPerStage === 0) {
            if (this.currentStage < this.maxStage) {
                this.currentStage++;
                this.updateUI();
                this.generateProblem();
            } else {
                this.endGame();
            }
        } else {
            this.updateUI();
            this.generateProblem();
        }
    }

    retryStage() {
        this.score = Math.max(0, this.score - (this.currentStage * 10 / 2));
        this.correctAnswers = Math.max(0, this.correctAnswers - 1);
        this.totalProblems = Math.max(0, this.totalProblems - 1);
        this.updateUI();
        this.generateProblem();
    }

    updateUI() {
        this.currentStageElement.textContent = `${this.currentStage}단계`;
        this.scoreElement.textContent = `점수: ${this.score}`;
        const progress = (this.totalProblems % 5) / 5 * 100;
        this.progressFill.style.width = `${progress}%`;
    }

    endGame() {
        this.stopTimer();
        this.gameTime = Math.floor((Date.now() - this.startTime) / 1000);
        const accuracy = this.totalProblems > 0 ? Math.round((this.correctAnswers / this.totalProblems) * 100) : 0;
        const minutes = Math.floor(this.gameTime / 60).toString().padStart(2, '0');
        const seconds = (this.gameTime % 60).toString().padStart(2, '0');

        this.finalScoreElement.textContent = this.score;
        this.accuracyElement.textContent = `${accuracy}% (${this.correctAnswers}/${this.totalProblems})`;
        this.timeTakenElement.textContent = `${minutes}:${seconds}`;

        const earnedMinutes = Math.floor(this.score / 50);
        this.timerPool += earnedMinutes;

        if (this.timerPool > 30) {
            this.timerPool = 30;
            this.timerFullMessage.style.display = 'block';
        } else {
            this.timerFullMessage.style.display = 'none';
        }
        this.updateTimerPoolUI();

        if (this.score < 50) {
            this.youtubeLink.setAttribute('disabled', true);
            this.youtubeLink.style.backgroundColor = '#ccc';
            this.youtubeLink.style.cursor = 'not-allowed';
        } else {
            this.youtubeLink.removeAttribute('disabled');
            this.youtubeLink.style.backgroundColor = '#ff0000';
            this.youtubeLink.style.cursor = 'pointer';
        }

        this.selectedVideoChoice = '';
        this.updateVideoChoiceButtons();

        this.showPage(this.endPage);
    }

    updateTimerPoolUI() {
        this.timerPoolDisplay.textContent = `${this.timerPool}분`;
    }

    playAgain() {
        this.startGame();
    }

    goHome() {
        this.stopTimer();
        this.showPage(this.landingPage);
        this.ageSelection.style.display = 'block';
        this.stageSelection.style.display = 'none';
    }

    startTimer() {
        this.timerInterval = setInterval(() => {
            const elapsedTime = Date.now() - this.startTime;
            const minutes = Math.floor(elapsedTime / 60000).toString().padStart(2, '0');
            const seconds = Math.floor((elapsedTime % 60000) / 1000).toString().padStart(2, '0');
            const centiseconds = Math.floor((elapsedTime % 1000) / 10).toString().padStart(2, '0');
            this.timerElement.textContent = `${minutes}:${seconds}:${centiseconds}`;
        }, 100);
    }

    stopTimer() {
        clearInterval(this.timerInterval);
    }

    showMessageBox(message) {
        const messageBox = document.createElement('div');
        messageBox.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background-color: white;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.3);
            z-index: 1000;
            text-align: center;
            font-family: 'Noto Sans KR', sans-serif;
            color: #333;
            font-size: 1.1rem;
            max-width: 80%;
        `;
        messageBox.textContent = message;

        const closeButton = document.createElement('button');
        closeButton.textContent = '확인';
        closeButton.style.cssText = `
            margin-top: 15px;
            padding: 8px 15px;
            background-color: #667eea;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 1rem;
            transition: background-color 0.3s ease;
        `;
        closeButton.onmouseover = () => closeButton.style.backgroundColor = '#764ba2';
        closeButton.onmouseout = () => closeButton.style.backgroundColor = '#667eea';

        closeButton.addEventListener('click', () => {
            document.body.removeChild(messageBox);
        });

        messageBox.appendChild(closeButton);
        document.body.appendChild(messageBox);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new MathGame();
});