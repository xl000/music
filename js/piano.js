// 钢琴相关功能模块

// 添加全局声明
window.playRandomSequence = playRandomSequence;
window.playSolfegeSequence = playSolfegeSequence;
window.resetSelection = resetSelection;

// 钢琴键盘配置 - 扩展到A0到C8（88键标准钢琴）
const octaveStart = 0; // 从A0开始
const octaveEnd = 8;   // 到C8结束
const blackKeys = ["C#", "D#", "F#", "G#", "A#"];

// 音源配置 - 只使用本地音源
const soundFiles = {
    "A0": "A0.mp3",
    "C1": "C1.mp3",
    "A1": "A1.mp3",
    "C2": "C2.mp3",
    "A2": "A2.mp3",
    "C3": "C3.mp3",
    "A3": "A3.mp3",
    "C4": "C4.mp3",
    "A4": "A4.mp3",
    "C5": "C5.mp3",
    "A5": "A5.mp3",
    "C6": "C6.mp3",
    "A6": "A6.mp3",
    "A7": "A7.mp3",
    "C7": "C7.mp3",
    "C8": "C8.mp3"
};

// 全局加载状态
let sampler = null;
let isAudioLoaded = false;
let loadProgress = 0;
let totalFiles = Object.keys(soundFiles).length;
let loadedFiles = 0;

// 初始化音源加载
function initAudioLoad() {
    return new Promise((resolve, reject) => {
        // 先检查sessionStorage中是否有缓存的音源数据
        const cachedAudioData = sessionStorage.getItem('pianoAudioData');
        const cachedLoadTime = sessionStorage.getItem('pianoAudioLoadTime');

        // 如果缓存存在且是最近加载的（比如1小时内），直接使用缓存
        if (cachedAudioData && cachedLoadTime && (Date.now() - parseInt(cachedLoadTime)) < 3600000) {
            try {
                console.log("从sessionStorage加载缓存的音源数据");
                updateLoadProgress(100, "从缓存加载音源完成！");
                isAudioLoaded = true;

                // 创建采样器使用缓存状态
                sampler = new Tone.Sampler({
                    urls: soundFiles,
                    baseUrl: "./sounds/",
                    onload: () => {
                        // 将sampler暴露给全局，供其他模块使用
                        window.sampler = sampler;

                        setTimeout(() => {
                            switchToMainInterface();
                            resolve(sampler);
                        }, 100);
                    }
                }).toDestination();

                return;
            } catch (error) {
                console.error("缓存加载失败，重新加载音源:", error);
                // 如果缓存加载失败，继续正常加载流程
            }
        }

        // 正常加载音源
        updateLoadProgress(0, "开始加载音源...");

        // 创建采样器 - 只使用本地音源
        sampler = new Tone.Sampler({
            urls: soundFiles,
            baseUrl: "./sounds/",
            onload: () => {
                loadedFiles = totalFiles;
                updateLoadProgress(100, "音源加载完成！");
                isAudioLoaded = true;

                // 将音源数据存储到sessionStorage
                try {
                    const audioData = {
                        soundFiles: soundFiles,
                        baseUrl: "./sounds/",
                        loadTime: Date.now()
                    };
                    sessionStorage.setItem('pianoAudioData', JSON.stringify(audioData));
                    sessionStorage.setItem('pianoAudioLoadTime', Date.now().toString());
                    console.log("音源数据已存储到sessionStorage");
                } catch (error) {
                    console.warn("sessionStorage存储失败:", error);
                }

                // 将sampler暴露给全局，供其他模块使用
                window.sampler = sampler;

                setTimeout(() => {
                    // 切换到主界面
                    switchToMainInterface();
                    resolve(sampler);
                }, 500);
            },
            onerror: (error) => {
                console.error("音源加载错误:", error);
                updateLoadProgress(loadProgress, `加载错误: ${error.message}`);
                // 即使加载失败也切换到主界面
                setTimeout(() => {
                    switchToMainInterface();
                    MessageUtils.showError("音源加载失败，但可以继续使用基础功能");
                }, 1000);
                reject(error);
            }
        }).toDestination();

        // 模拟加载进度
        simulateLoadProgress();
    });
}

// 切换到主界面
function switchToMainInterface() {
    document.body.classList.add('loaded');
    // 确保音频状态正确设置
    window.isAudioLoaded = isAudioLoaded;
    window.loadProgress = 100;

    // 更新状态消息
    if (typeof MessageUtils !== 'undefined') {
        MessageUtils.showStatusMessage("音源加载完成，可以开始使用");
    }
}

// 模拟加载进度
function simulateLoadProgress() {
    let progress = 0;
    const interval = setInterval(() => {
        if (isAudioLoaded) {
            clearInterval(interval);
            return;
        }

        progress += Math.random() * 5;
        if (progress < 90) {
            updateLoadProgress(progress, `正在加载音源文件... (${Math.round(progress)}%)`);
        } else if (progress < 99) {
            updateLoadProgress(progress, "即将完成...");
        }
    }, 200);
}

// 更新加载进度
function updateLoadProgress(percent, message) {
    loadProgress = Math.min(100, Math.max(0, percent));

    const progressBar = document.getElementById('globalProgressBar');
    const progressText = document.getElementById('progressText');
    const loadingDetails = document.getElementById('loadingDetails');

    if (progressBar) {
        progressBar.style.width = loadProgress + '%';
    }
    if (progressText) {
        progressText.textContent = Math.round(loadProgress) + '%';
    }
    if (loadingDetails) {
        loadingDetails.textContent = message;
    }

    // 更新全局状态
    window.loadProgress = loadProgress;
}

// 检查音频是否已加载
function isAudioReady() {
    return isAudioLoaded;
}

// 获取采样器（确保音频已加载）
function getSampler() {
    if (!isAudioLoaded) {
        throw new Error("音频尚未加载完成");
    }
    return sampler;
}

// 获取DOM元素
const piano = document.getElementById('piano');
const randomBtn = document.getElementById('randomBtn');
const resetBtn = document.getElementById('resetBtn');
const noteCountInput = document.getElementById('noteCount');
const randomModeSelect = document.getElementById('randomMode');
const selectedNotesContainer = document.getElementById('selectedNotesContainer');
// 获取随机唱名数量输入框
const randomSolfegeCountInput = document.getElementById('randomSolfegeCount');
// 获取音符类型下拉框
const noteTypeSelect = document.getElementById('noteType');

// 错误提示元素
const noteCountError = document.getElementById('noteCountError');
const randomSolfegeCountError = document.getElementById('randomSolfegeCountError');

// 当前选中的音符
let selectedNotes = ["A4", "B4", "F#4"];
// 存储每个音符的唱名标签
let solfegeLabels = {};
let noteCount = 3;

// 播放控制变量
let isPlaying = false;
let currentPlaybackIndex = 0;
let totalPlaybackDuration = 0;
let playbackStartTime = 0;
let playbackInterval = null;
let currentPlaybackSequence = [];

// 触摸事件控制变量
let touchStartTime = 0;
let isTouchMoving = false;
let lastTapTime = 0; // 记录上一次点击时间，用于双击检测
let tapTimeout = null; // 双击检测的定时器

// 进度条元素
const progressBar = document.getElementById('progressBar');
const progressFill = document.getElementById('progressFill');
const progressTime = document.getElementById('progressTime');
const progressContainer = document.querySelector('.playback-progress-container');

// 计算琴键总数
function getTotalKeys() {
    let total = 0;
    for (let octave = octaveStart; octave <= octaveEnd; octave++) {
        if (octave === 0) {
            // A0八度只有A0, A#0, B0三个键
            total += 3;
        } else if (octave === 8) {
            // C8八度只有C8一个键
            total += 1;
        } else {
            // 其他八度有完整的12个键
            total += 12;
        }
    }
    return total;
}

// 获取音符类型设置
function getNoteType() {
    return noteTypeSelect ? noteTypeSelect.value : 'fixedDurationFixedVelocity';
}

// 获取音符时长设置
function getNoteDuration() {
    const noteDurationInput = document.getElementById('noteDuration');
    if (noteDurationInput) {
        const value = parseFloat(noteDurationInput.value);
        // 如果输入无效，使用默认值0.5秒
        return isNaN(value) ? 0.5 : Math.max(0, Math.min(4, value));
    }
    return 0.5; // 默认值
}

// 修改现有的getRandomDuration函数，加入随机范围控制
function getRandomDuration() {
    const baseDuration = getNoteDuration(); // 获取基础时值
    const maxDuration = 4.0; // 最大时值

    // 计算上下区间范围
    const lowerRange = baseDuration * durationRandomRange; // 下区间范围
    const upperRange = (maxDuration - baseDuration) * durationRandomRange; // 上区间范围

    // 计算随机范围
    const minDuration = Math.max(0.1, baseDuration - lowerRange); // 最小时值
    const maxDurationValue = Math.min(maxDuration, baseDuration + upperRange); // 最大时值

    // 生成随机时长并保留最多3位小数
    const randomDuration = minDuration + Math.random() * (maxDurationValue - minDuration);
    return Math.round(randomDuration * 1000) / 1000; // 保留3位小数
}

// 修改现有的getRandomVelocity函数，加入随机范围控制
function getRandomVelocity() {
    const baseVelocity = getDefaultVelocity(); // 获取基础力度
    const maxVelocity = 127; // 最大力度

    // 计算上下区间范围
    const lowerRange = baseVelocity * velocityRandomRange; // 下区间范围
    const upperRange = (maxVelocity - baseVelocity) * velocityRandomRange; // 上区间范围

    // 计算随机范围
    const minVelocity = Math.max(0, baseVelocity - lowerRange); // 最小力度
    const maxVelocityValue = Math.min(maxVelocity, baseVelocity + upperRange); // 最大力度

    return Math.floor(minVelocity + Math.random() * (maxVelocityValue - minVelocity + 1));
}

// 获取默认延音率设置
function getSustainRate() {
    return sustainRate || 0.0; // 如果没有定义，默认为0%
}

// 计算延音时长（基于音符时长和延音率）
function calculateSustainDuration(baseDuration) {
    const rate = getSustainRate();
    if (rate === 0) {
        return 0; // 延音率为0时，延音时长为0
    }
    // 延音时长 = 音符时长 × 延音率 × 4 (因为取值范围是0-4倍)
    const sustainDuration = baseDuration * rate * 4;
    return parseFloat(sustainDuration.toFixed(3)); // 保留3位小数
}


// 获取默认力度（从输入框读取）
function getDefaultVelocity() {
    const noteVelocityInput = document.getElementById('noteVelocity');
    if (noteVelocityInput) {
        const value = parseInt(noteVelocityInput.value);
        // 如果输入无效，使用默认值100
        return isNaN(value) ? 100 : Math.max(0, Math.min(127, value));
    }
    return 100; // 默认值
}

// 创建钢琴键盘
function createPiano() {
    piano.innerHTML = '';

    for (let octave = octaveStart; octave <= octaveEnd; octave++) {
        // 确定当前八度要生成的音符范围
        let startIndex = 0;
        let endIndex = 11;

        if (octave === 0) {
            // A0八度：只生成A(9), A#(10), B(11)
            startIndex = 9;
            endIndex = 11;
        } else if (octave === 8) {
            // C8八度：只生成C(0)
            startIndex = 0;
            endIndex = 0;
        }

        const notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

        for (let i = startIndex; i <= endIndex; i++) {
            const note = notes[i];
            const fullNote = note + octave;
            const isBlack = blackKeys.includes(note);

            const key = document.createElement('div');
            key.className = `key ${isBlack ? 'black' : 'white'}`;
            key.dataset.note = fullNote;

            const label = document.createElement('div');
            label.className = 'key-label';
            label.textContent = fullNote;
            key.appendChild(label);

            // 鼠标按下事件 - 立即发声并持续
            key.addEventListener('mousedown', async (e) => {
                e.preventDefault();
                if (!isAudioReady()) {
                    MessageUtils.showWarning("音频尚未加载完成，请稍候");
                    return;
                }
                await handleKeyPress(fullNote, key);
            });

            // 鼠标抬起事件 - 停止发声
            key.addEventListener('mouseup', (e) => {
                e.preventDefault();
                handleKeyRelease(fullNote, key);
            });

            // 鼠标离开事件 - 停止发声
            key.addEventListener('mouseleave', (e) => {
                e.preventDefault();
                handleKeyRelease(fullNote, key);
            });

            // 双击事件 - 选择音符（不播放声音）
            key.addEventListener('dblclick', (e) => {
                e.preventDefault();
                e.stopPropagation();
                handleNoteSelection(fullNote);
            });

            // 触摸事件支持 - 改进移动端处理，支持双击选择
            key.addEventListener('touchstart', async (e) => {
                e.preventDefault();
                touchStartTime = Date.now();
                isTouchMoving = false;

                // 双击检测
                const currentTime = new Date().getTime();
                const tapLength = currentTime - lastTapTime;
                if (tapLength < 500 && tapLength > 0) {
                    // 双击事件
                    e.preventDefault();
                    if (tapTimeout) {
                        clearTimeout(tapTimeout);
                        tapTimeout = null;
                    }
                    lastTapTime = 0;
                    handleNoteSelection(fullNote);
                } else {
                    // 第一次点击
                    lastTapTime = currentTime;
                    tapTimeout = setTimeout(() => {
                        // 单机超时，不处理选择
                        lastTapTime = 0;
                    }, 500);
                }

                if (!isAudioReady()) {
                    MessageUtils.showWarning("音频尚未加载完成，请稍候");
                    return;
                }
                await handleKeyPress(fullNote, key);
            });

            key.addEventListener('touchmove', (e) => {
                e.preventDefault();
                isTouchMoving = true;
            });

            key.addEventListener('touchend', (e) => {
                e.preventDefault();
                handleKeyRelease(fullNote, key);
            });

            key.addEventListener('touchcancel', (e) => {
                e.preventDefault();
                handleKeyRelease(fullNote, key);
            });

            piano.appendChild(key);
        }
    }

    highlightSelectedKeys();
    updateSelectedNotesDisplay();
}

// 处理音符选择
function handleNoteSelection(fullNote) {
    // 检查是否已经选中该音符
    const noteIndex = selectedNotes.indexOf(fullNote);

    if (noteIndex !== -1) {
        // 如果已经选中，则取消选择（移除）
        selectedNotes.splice(noteIndex, 1);

        // 同时移除对应的唱名标签
        if (solfegeLabels[noteIndex]) {
            delete solfegeLabels[noteIndex];
        }

        // 重新索引solfegeLabels（可选，保持连续性）
        const newSolfegeLabels = {};
        Object.keys(solfegeLabels).forEach((key, index) => {
            if (parseInt(key) > noteIndex) {
                newSolfegeLabels[parseInt(key) - 1] = solfegeLabels[key];
            } else if (parseInt(key) < noteIndex) {
                newSolfegeLabels[key] = solfegeLabels[key];
            }
        });
        solfegeLabels = newSolfegeLabels;

    } else {
        // 如果没有选中，则添加选择
        if (selectedNotes.length < noteCount) {
            selectedNotes.push(fullNote);
        } else {
            MessageUtils.showWarning(`已达到最大选择数量 (${noteCount})`);
            return;
        }
    }

    updateSelectedNotesDisplay();
    highlightSelectedKeys();
    generateNoteDisplays(); // 重新生成显示区域以更新唱名输入框
    if (typeof checkAllValidations === 'function') {
        checkAllValidations(); // 实时验证
    }
}

// 处理琴键按下
async function handleKeyPress(fullNote, key) {
    try {
        // 确保音频上下文已启动
        if (Tone.context.state !== 'running') {
            await Tone.start();
            MessageUtils.showStatusMessage("音频上下文已启动！");
        }

        // 添加播放效果
        key.classList.add('playing');

        // 播放音符 - 持续发声直到释放
        const velocity = getDefaultVelocity() / 127;
        getSampler().triggerAttack(fullNote, undefined, velocity);

        // 存储当前播放的音符以便释放
        key._currentNote = fullNote;

    } catch (error) {
        console.error("播放错误:", error);
        MessageUtils.showError("播放错误：" + error.message);
    }
}

// 处理琴键释放
function handleKeyRelease(fullNote, key) {
    if (key._currentNote) {
        // 停止发声
        getSampler().triggerRelease(key._currentNote);
        key.classList.remove('playing');
        key._currentNote = null;
    }
}

// 高亮选中的琴键
function highlightSelectedKeys() {
    document.querySelectorAll('.key').forEach(key => {
        key.classList.remove('selected');
        const positionIndicator = key.querySelector('.position-indicator');
        if (positionIndicator) {
            positionIndicator.remove();
        }
    });

    selectedNotes.forEach((note, index) => {
        const key = document.querySelector(`.key[data-note="${note}"]`);
        if (key) {
            key.classList.add('selected');

            // 添加位置指示器
            const positionIndicator = document.createElement('div');
            positionIndicator.className = 'position-indicator';
            positionIndicator.textContent = index + 1;
            key.appendChild(positionIndicator);
        }
    });
}

// 更新选中的音符显示
function updateSelectedNotesDisplay() {
    for (let i = 0; i < noteCount; i++) {
        const displayElement = document.getElementById(`displayNote${i}`);
        if (displayElement) {
            displayElement.textContent = selectedNotes[i] || "";
        }
    }
}

// 更新音符数量
function updateNoteCount(newCount) {
    const oldCount = noteCount;
    noteCount = newCount;

    // 如果当前选择的音符数量超过新数量，截断数组
    if (selectedNotes.length > noteCount) {
        selectedNotes = selectedNotes.slice(0, noteCount);

        // 同时截断solfegeLabels
        const newSolfegeLabels = {};
        for (let i = 0; i < noteCount; i++) {
            if (solfegeLabels[i]) {
                newSolfegeLabels[i] = solfegeLabels[i];
            }
        }
        solfegeLabels = newSolfegeLabels;
    }

    // 如果音符数量增加，需要验证新增的唱名是否与之前的重复
    if (noteCount > oldCount) {
        for (let i = oldCount; i < noteCount; i++) {
            if (solfegeLabels[i]) {
                ValidationUtils.validateSolfegeInput(i, solfegeLabels[i], solfegeLabels, noteCount);
            }
        }
    }

    // 重新生成音符显示区域
    generateNoteDisplays();
    updateSelectedNotesDisplay();
    highlightSelectedKeys();
    if (typeof checkAllValidations === 'function') {
        checkAllValidations(); // 实时验证
    }
}

// 生成音符显示区域
function generateNoteDisplays() {
    selectedNotesContainer.innerHTML = '';

    for (let i = 0; i < noteCount; i++) {
        const noteDisplayElement = document.createElement('div');
        noteDisplayElement.className = 'note-display';
        noteDisplayElement.id = `noteDisplay${i}`;

        const noteNumber = document.createElement('div');
        noteNumber.className = 'note-number';
        noteNumber.textContent = `音符 ${i + 1}`;

        const noteValue = document.createElement('div');
        noteValue.className = 'note-value';
        noteValue.id = `displayNote${i}`;
        noteValue.textContent = selectedNotes[i] || "";

        // 创建唱名输入容器
        const solfegeContainer = document.createElement('div');
        solfegeContainer.className = 'solfege-input-container';

        // 创建唱名输入框 - 去掉下拉框，改为普通文本输入
        const solfegeInput = document.createElement('input');
        solfegeInput.type = 'text';
        solfegeInput.className = 'solfege-input';
        solfegeInput.id = `solfegeInput${i}`;
        solfegeInput.placeholder = '输入唱名';
        solfegeInput.value = solfegeLabels[i] || '';

        // 创建错误提示元素
        const errorMessage = document.createElement('div');
        errorMessage.className = 'error-message';
        errorMessage.id = `solfegeError${i}`;

        // 将输入框和错误提示添加到容器
        solfegeContainer.appendChild(solfegeInput);
        solfegeContainer.appendChild(errorMessage);

        // 事件处理：输入框变化
        solfegeInput.addEventListener('input', function () {
            solfegeLabels[i] = this.value;
            // 实时验证
            ValidationUtils.validateSolfegeInput(i, this.value, solfegeLabels, noteCount, true);
            if (typeof checkAllValidations === 'function') {
                checkAllValidations(); // 实时验证
            }
        });

        // 事件处理：输入框失去焦点
        solfegeInput.addEventListener('change', function () {
            ValidationUtils.validateSolfegeInput(i, this.value, solfegeLabels, noteCount);
            if (typeof checkAllValidations === 'function') {
                checkAllValidations(); // 实时验证
            }
        });

        // 组装显示元素
        noteDisplayElement.appendChild(noteNumber);
        noteDisplayElement.appendChild(noteValue);
        noteDisplayElement.appendChild(solfegeContainer);
        selectedNotesContainer.appendChild(noteDisplayElement);
    }
}

// 生成随机序列
function generateRandomSequence() {
    if (selectedNotes.length === 0) {
        MessageUtils.showWarning("请先选择至少一个音符");
        return null;
    }

    const mode = randomModeSelect.value;
    const sequence = [];

    if (mode === 'nonRepeat') {
        // 不重复序列：打乱已选音符的顺序
        return GeneralUtils.shuffleArray([...selectedNotes]);
    } else {
        // 允许重复序列：从已选音符中随机选择（允许重复）
        for (let i = 0; i < noteCount; i++) {
            const randomIndex = GeneralUtils.randomInt(0, selectedNotes.length - 1);
            sequence.push(selectedNotes[randomIndex]);
        }
        return sequence;
    }
}

// 生成随机序列
async function playRandomSequence() {
    if (!isAudioReady()) {
        MessageUtils.showWarning("音源尚未加载完成，请稍候");
        return;
    }

    // 获取用户输入的随机唱名数量n
    const n = parseInt(randomSolfegeCountInput.value);
    if (isNaN(n) || n < 1) {
        MessageUtils.showWarning("请输入有效的随机唱名数量");
        return;
    }

    // 收集所有非空的唱名标签
    const allSolfege = [];
    for (let i = 0; i < noteCount; i++) {
        if (solfegeLabels[i] && solfegeLabels[i].trim() !== '') {
            allSolfege.push(solfegeLabels[i].trim());
        }
    }

    if (allSolfege.length === 0) {
        MessageUtils.showWarning("没有可用的唱名，请先输入唱名标签");
        return;
    }

    const mode = randomModeSelect.value;
    let randomSolfegeSequence = [];

    if (mode === 'nonRepeat') {
        if (n > allSolfege.length) {
            MessageUtils.showWarning(`不重复模式下，随机数量不能超过可用唱名数量（${allSolfege.length}）`);
            return;
        }
        randomSolfegeSequence = GeneralUtils.shuffleArray(allSolfege).slice(0, n);
    } else {
        for (let i = 0; i < n; i++) {
            const randomIndex = GeneralUtils.randomInt(0, allSolfege.length - 1);
            randomSolfegeSequence.push(allSolfege[randomIndex]);
        }
    }

    // 获取默认延音率
    const currentSustainRate = getSustainRate();
    const noteType = getNoteType();
    const playbackSequence = [];

    for (const solfege of randomSolfegeSequence) {
        let duration, velocity, sustainDuration;
        let showDuration = false;
        let showVelocity = false;
        let showSustain = currentSustainRate > 0; // 延音率大于0时显示延音参数

        switch (noteType) {
            case 'randomDurationFixedVelocity':
                duration = getRandomDuration();
                velocity = getDefaultVelocity();
                showDuration = true;
                showVelocity = false;
                break;
            case 'fixedDurationRandomVelocity':
                duration = getNoteDuration();
                velocity = getRandomVelocity();
                showDuration = false;
                showVelocity = true;
                break;
            case 'randomDurationRandomVelocity':
                duration = getRandomDuration();
                velocity = getRandomVelocity();
                showDuration = true;
                showVelocity = true;
                break;
            default: // 'fixedDurationFixedVelocity'
                duration = getNoteDuration();
                velocity = getDefaultVelocity();
                showDuration = false;
                showVelocity = false;
        }

        // 计算延音时长
        sustainDuration = calculateSustainDuration(duration);

        // 根据显示规则构建序列项
        let sequenceItem = solfege;

        if (showDuration) {
            sequenceItem += `_${formatDurationDisplay(duration)}`;
        } else if (showVelocity) {
            // 如果只显示力度，时长位置用空字符串
            sequenceItem += `_`;
        } else {
            // 如果都不显示，但需要显示延音，也要加上时长占位符
            sequenceItem += `_`;
        }

        if (showVelocity) {
            sequenceItem += `_${velocity}`;
        } else if (showDuration || showSustain) {
            // 如果显示时长或延音，但不需要显示力度，力度位置用空字符串
            sequenceItem += `_`;
        }

        // 延音参数显示逻辑
        if (showSustain) {
            sequenceItem += `_${formatDurationDisplay(sustainDuration)}`;
        } else if (showVelocity) {
            // 如果显示力度但不显示延音，延音位置留空
            sequenceItem += `_`;
        }

        // 清理多余的下划线
        sequenceItem = sequenceItem.replace(/_+$/, ''); // 去掉末尾的多余下划线
        if (sequenceItem.endsWith('_')) {
            sequenceItem = sequenceItem.slice(0, -1);
        }

        playbackSequence.push(sequenceItem);
    }

    // 将随机选择的唱名序列填入唱名序列框
    const solfegeSequenceInput = document.getElementById('solfegeSequence');
    solfegeSequenceInput.value = playbackSequence.join(',');

    // 播放唱名序列
    await playSolfegeSequence();
}

// 重置选择
function resetSelection() {
    selectedNotes = [];
    solfegeLabels = {};
    updateSelectedNotesDisplay();
    highlightSelectedKeys();

    // 清空所有唱名错误提示
    for (let i = 0; i < noteCount; i++) {
        const errorElement = document.getElementById(`solfegeError${i}`);
        if (errorElement) {
            ValidationUtils.hideError(errorElement);
        }
    }

    generateNoteDisplays(); // 重新生成显示区域以重置唱名标签
    MessageUtils.showSuccess("选择已重置");
    if (typeof checkAllValidations === 'function') {
        checkAllValidations(); // 实时验证
    }
}

// 唱名到音符的映射关系
const solfegeToNoteMap = {
    'do': 'C',
    're': 'D',
    'mi': 'E',
    'fa': 'F',
    'sol': 'G',
    'la': 'A',
    'si': 'B'
};

// 解析八度和升降符号
function parseSolfegeWithModifiers(solfegeStr) {
    let baseSolfege = solfegeStr;
    let octaveShift = 0;
    let pitchShift = 0;

    // 解析八度符号
    const octaveMatch = baseSolfege.match(/(<+)|(>+)/g);
    if (octaveMatch) {
        octaveMatch.forEach(match => {
            if (match.startsWith('<')) {
                octaveShift -= match.length;
            } else if (match.startsWith('>')) {
                octaveShift += match.length;
            }
        });
        // 移除八度符号
        baseSolfege = baseSolfege.replace(/[<>]/g, '');
    }

    // 解析升降符号
    if (baseSolfege.endsWith('#')) {
        pitchShift = 1;
        baseSolfege = baseSolfege.slice(0, -1);
    } else if (baseSolfege.endsWith('*')) {
        pitchShift = -1;
        baseSolfege = baseSolfege.slice(0, -1);
    }

    return {
        baseSolfege,
        octaveShift,
        pitchShift
    };
}

// 应用八度和升降偏移到音符
function applyPitchShift(noteName, octaveShift, pitchShift) {
    const noteMap = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const noteRegex = /^([A-G]#?)(-?\d+)$/;
    const match = noteName.match(noteRegex);

    if (!match) return noteName;

    const note = match[1];
    let octave = parseInt(match[2]);
    let noteIndex = noteMap.indexOf(note);

    if (noteIndex === -1) return noteName;

    // 应用八度偏移
    octave += octaveShift;

    // 应用半音偏移
    noteIndex += pitchShift;

    // 处理音符索引越界
    if (noteIndex >= noteMap.length) {
        noteIndex -= noteMap.length;
        octave += 1;
    } else if (noteIndex < 0) {
        noteIndex += noteMap.length;
        octave -= 1;
    }

    // 处理八度越界
    octave = Math.max(0, Math.min(8, octave));

    return noteMap[noteIndex] + octave;
}

// 解析单个音项，支持t和f引用
function parseSingleNote(item) {
    const parts = item.split('_');
    const result = {
        solfege: parts[0] || '',
        duration: parseFloat(getNoteDuration().toFixed(3)),
        velocity: getDefaultVelocity(),
        sustainDuration: 0 // 默认延音时长为0
    };

    // 解析时长部分（支持t引用）
    if (parts.length >= 2 && parts[1] !== '') {
        result.duration = parseValueWithReference(parts[1], 't', getNoteDuration());
    }

    // 解析力度部分（支持f引用）
    if (parts.length >= 3 && parts[2] !== '') {
        result.velocity = parseValueWithReference(parts[2], 'f', getDefaultVelocity());
    }

    // 解析延音时长部分（新增第四个参数）
    if (parts.length >= 4 && parts[3] !== '') {
        result.sustainDuration = parseValueWithReference(parts[3], 't', result.duration);
    } else {
        // 如果没有指定延音时长，使用默认延音率计算
        result.sustainDuration = calculateSustainDuration(result.duration);
    }

    return result;
}

// 解析和弦
function parseChord(chordStr) {
    const inner = chordStr.replace(/[()（）]/g, '');
    const notes = inner.split(/[，,]/).map(note => note.trim()).filter(note => note !== '');

    return notes.map(note => {
        const parts = note.split('_');
        const result = {
            solfege: parts[0] || '',
            duration: parseFloat(getNoteDuration().toFixed(3)),
            velocity: getDefaultVelocity(),
            sustainDuration: 0
        };

        // 解析时长部分
        if (parts.length >= 2 && parts[1] !== '') {
            result.duration = parseValueWithReference(parts[1], 't', getNoteDuration());
        }

        // 解析力度部分
        if (parts.length >= 3 && parts[2] !== '') {
            result.velocity = parseValueWithReference(parts[2], 'f', getDefaultVelocity());
        }

        // 解析延音时长部分
        if (parts.length >= 4 && parts[3] !== '') {
            result.sustainDuration = parseValueWithReference(parts[3], 't', result.duration);
        } else {
            result.sustainDuration = calculateSustainDuration(result.duration);
        }

        return result;
    });
}

// 智能解析点播序列格式（支持新格式）
function parseSolfegeSequence(input) {
    // 移除所有空格
    const cleanInput = input.replace(/\s/g, '');

    if (!cleanInput) {
        return [];
    }

    const parsedSequence = [];

    // 使用正则表达式分割，考虑括号内的内容
    const items = [];
    let current = '';
    let inChord = false;
    let depth = 0;

    for (let i = 0; i < cleanInput.length; i++) {
        const char = cleanInput[i];

        if (char === '(' || char === '（') {
            if (depth === 0 && current) {
                items.push(current);
                current = '';
            }
            depth++;
            inChord = true;
            current += char;
        } else if (char === ')' || char === '）') {
            depth--;
            current += char;
            if (depth === 0) {
                items.push(current);
                current = '';
                inChord = false;
            }
        } else if ((char === ',' || char === '，') && !inChord) {
            if (current) {
                items.push(current);
                current = '';
            } else {
                // 处理空闲（空项）
                items.push('');
            }
        } else {
            current += char;
        }
    }

    // 添加最后一个项目
    if (current) {
        items.push(current);
    } else if (cleanInput.endsWith(',') || cleanInput.endsWith('，')) {
        // 处理以逗号结尾的空闲
        items.push('');
    }

    // 解析每个项目
    for (const item of items) {
        if (item === '') {
            // 空闲项
            parsedSequence.push({
                solfege: null,
                duration: parseFloat(getNoteDuration().toFixed(3)), // 保留3位小数
                velocity: getDefaultVelocity(),
                isRest: true
            });
        } else if (item.startsWith('_')) {
            // 只有时长的空闲
            const parts = item.split('_');
            let duration = parseFloat(getNoteDuration().toFixed(3)); // 保留3位小数

            // 解析时长部分（支持t引用）
            if (parts.length >= 2 && parts[1] !== '') {
                duration = parseValueWithReference(parts[1], 't', getNoteDuration());
            }

            parsedSequence.push({
                solfege: null,
                duration: duration,
                velocity: getDefaultVelocity(),
                isRest: true
            });
        } else if ((item.startsWith('(') || item.startsWith('（')) &&
            (item.endsWith(')') || item.endsWith('）'))) {
            // 和弦
            const chordNotes = parseChord(item);
            parsedSequence.push({
                chord: chordNotes,
                isChord: true
            });
        } else {
            // 音符
            parsedSequence.push(parseSingleNote(item));
        }
    }

    return parsedSequence;
}

// 修正的总时长计算函数（延音时长作为延长值）
function calculateTotalDuration(sequence) {
    if (!sequence || sequence.length === 0) return 0;

    let totalBasicDuration = 0; // 所有音符的基本时长总和
    let maxEndTime = 0;         // 最晚的音符结束时间

    sequence.forEach((item, index) => {
        if (item.isRest) {
            // 休止符：只增加基本时长
            totalBasicDuration += item.duration;
            maxEndTime = totalBasicDuration;
        } else if (item.isChord) {
            // 和弦：计算和弦中所有音符
            const chordStartTime = totalBasicDuration;
            let maxChordDuration = 0;
            let maxChordEndTime = chordStartTime;

            item.chord.forEach(note => {
                const noteDuration = note.duration || getNoteDuration();
                const sustainDuration = note.sustainDuration || 0;

                // 和弦音符的结束时间 = 开始时间 + 基本时长 + 延音时长
                const noteEndTime = chordStartTime + noteDuration + sustainDuration;
                maxChordEndTime = Math.max(maxChordEndTime, noteEndTime);
                maxChordDuration = Math.max(maxChordDuration, noteDuration);
            });

            maxEndTime = Math.max(maxEndTime, maxChordEndTime);
            totalBasicDuration += maxChordDuration;
        } else {
            // 单个音符
            const noteDuration = item.duration || getNoteDuration();
            const sustainDuration = item.sustainDuration || 0;

            // 音符的开始时间 = 当前累计的基本时长
            const noteStartTime = totalBasicDuration;
            // 音符的结束时间 = 开始时间 + 基本时长 + 延音时长
            const noteEndTime = noteStartTime + noteDuration + sustainDuration;

            maxEndTime = Math.max(maxEndTime, noteEndTime);
            totalBasicDuration += noteDuration;
        }
    });

    return maxEndTime;
}

// 解析带引用的数值（支持t和f引用）
function parseValueWithReference(valueStr, referenceType, baseValue) {
    if (!valueStr) return parseFloat(baseValue.toFixed(3));

    // 如果直接是引用符号，返回基准值（保留3位小数）
    if (valueStr === referenceType) {
        return parseFloat(baseValue.toFixed(3));
    }

    // 检查是否包含引用符号（如2t, 0.5f等）
    if (valueStr.endsWith(referenceType)) {
        const multiplierStr = valueStr.slice(0, -1); // 去掉结尾的t或f
        const multiplier = parseFloat(multiplierStr);

        if (!isNaN(multiplier)) {
            return parseFloat((baseValue * multiplier).toFixed(3));
        }
    }

    // 如果是纯数字，直接解析并保留3位小数
    const numericValue = parseFloat(valueStr);
    return isNaN(numericValue) ? parseFloat(baseValue.toFixed(3)) : parseFloat(numericValue.toFixed(3));
}


// 更新进度条显示
function updateProgressBar(currentTime, totalTime) {
    // 避免除零错误
    if (totalTime <= 0) totalTime = 0.001;

    const progressPercent = Math.min(100, (currentTime / totalTime) * 100);
    if (progressFill) {
        progressFill.style.width = `${progressPercent}%`;
    }

    // 简化时间显示：只显示秒，保留1位小数
    const formatTime = (seconds) => {
        return seconds.toFixed(1) + '秒';
    };

    const currentFormatted = formatTime(currentTime);
    const totalFormatted = formatTime(totalTime);

    if (progressTime) {
        progressTime.textContent = `${currentFormatted} / ${totalFormatted}`;
    }
}

// 格式化为秒的函数
function formatSecondsByTotal(seconds, totalSeconds) {
    // 获取总时长的小数位数
    const totalSecondsStr = totalSeconds.toString();
    let decimalPlaces = 0;

    if (totalSecondsStr.includes('.')) {
        decimalPlaces = totalSecondsStr.split('.')[1].length;
    }

    // 格式化当前时间，保持与总时长相同的小数位数
    return seconds.toFixed(decimalPlaces);
}

// 停止播放
function stopPlayback() {
    isPlaying = false;
    currentPlaybackIndex = 0;
    totalPlaybackDuration = 0;
    playbackStartTime = 0;

    // 清除进度更新定时器
    if (playbackInterval) {
        clearInterval(playbackInterval);
        playbackInterval = null;
    }

    // 停止所有音符
    try {
        getSampler().releaseAll();
    } catch (error) {
        console.warn("停止音符时出错:", error);
    }

    // 移除所有高亮
    document.querySelectorAll('.key.playing').forEach(key => {
        key.classList.remove('playing');
    });

    // 隐藏进度条
    progressContainer.classList.remove('visible');
    updateProgressBar(0, 1);

    randomBtn.disabled = false;
}


// 从指定索引开始播放
async function playFromIndex(startIndex) {
    if (!isPlaying) return;

    const sequence = currentPlaybackSequence;
    const solfegeNoteMap = createSolfegeNoteMap();
    const useDefaultMap = Object.keys(solfegeNoteMap).length === 0;
    const isHideMode = document.body.classList.contains('hide-mode');

    // 存储所有活跃的延音音符
    const activeSustains = new Map();

    for (let i = startIndex; i < sequence.length; i++) {
        if (!isPlaying) break;

        const item = sequence[i];
        currentPlaybackIndex = i;

        if (item.isRest) {
            // 处理休止符 - 简单等待
            await new Promise(resolve => {
                const timeout = setTimeout(resolve, item.duration * 1000);
                const checkStop = setInterval(() => {
                    if (!isPlaying) {
                        clearTimeout(timeout);
                        clearInterval(checkStop);
                        resolve();
                    }
                }, 100);
            });
            continue;
        }

        if (item.isChord) {
            // 处理和絃
            const chordNotes = [];
            let maxNoteDuration = 0;

            for (const chordItem of item.chord) {
                if (chordItem.solfege === null) continue;

                const noteToPlay = findNoteForSolfege(chordItem.solfege, solfegeNoteMap, useDefaultMap);
                if (noteToPlay) {
                    const noteDuration = chordItem.duration || getNoteDuration();
                    const sustainDuration = chordItem.sustainDuration || 0;

                    chordNotes.push({
                        note: noteToPlay,
                        duration: noteDuration,
                        velocity: chordItem.velocity || getDefaultVelocity(),
                        sustainDuration: sustainDuration
                    });
                    maxNoteDuration = Math.max(maxNoteDuration, noteDuration);
                }
            }

            if (chordNotes.length > 0) {
                // 播放前高亮
                if (!isHideMode) {
                    chordNotes.forEach(chordNote => {
                        const key = document.querySelector(`.key[data-note="${chordNote.note}"]`);
                        if (key) key.classList.add('playing');
                    });
                }

                // 播放和弦音符
                chordNotes.forEach(chordNote => {
                    const normalizedVelocity = Math.max(0, Math.min(127, chordNote.velocity)) / 127;
                    const sustainDuration = chordNote.sustainDuration || 0;

                    if (sustainDuration > 0) {
                        // 有延音
                        getSampler().triggerAttack(chordNote.note, undefined, normalizedVelocity);
                        const releaseTime = Date.now() + (chordNote.duration + sustainDuration) * 1000;
                        activeSustains.set(chordNote.note, releaseTime);
                    } else {
                        // 无延音
                        getSampler().triggerAttackRelease(chordNote.note, chordNote.duration, undefined, normalizedVelocity);
                    }
                });

                // 等待和弦的基本时长
                await new Promise(resolve => {
                    const timeout = setTimeout(() => {
                        if (!isHideMode) {
                            chordNotes.forEach(chordNote => {
                                const key = document.querySelector(`.key[data-note="${chordNote.note}"]`);
                                if (key) key.classList.remove('playing');
                            });
                        }
                        resolve();
                    }, maxNoteDuration * 1000);

                    const checkStop = setInterval(() => {
                        if (!isPlaying) {
                            clearTimeout(timeout);
                            clearInterval(checkStop);
                            resolve();
                        }
                    }, 100);
                });
            }
        } else {
            // 处理单个音符
            const noteToPlay = findNoteForSolfege(item.solfege, solfegeNoteMap, useDefaultMap);
            if (!noteToPlay) continue;

            const noteDuration = item.duration || getNoteDuration();
            const sustainDuration = item.sustainDuration || 0;
            const velocity = item.velocity || getDefaultVelocity();

            // 播放前高亮
            if (!isHideMode) {
                const key = document.querySelector(`.key[data-note="${noteToPlay}"]`);
                if (key) key.classList.add('playing');
            }

            // 播放音符
            const normalizedVelocity = Math.max(0, Math.min(127, velocity)) / 127;

            if (sustainDuration > 0) {
                // 有延音
                getSampler().triggerAttack(noteToPlay, undefined, normalizedVelocity);
                const releaseTime = Date.now() + (noteDuration + sustainDuration) * 1000;
                activeSustains.set(noteToPlay, releaseTime);
            } else {
                // 无延音
                getSampler().triggerAttackRelease(noteToPlay, noteDuration, undefined, normalizedVelocity);
            }

            // 只等待音符的基本时长
            await new Promise(resolve => {
                const timeout = setTimeout(() => {
                    if (!isHideMode) {
                        const key = document.querySelector(`.key[data-note="${noteToPlay}"]`);
                        if (key) key.classList.remove('playing');
                    }
                    resolve();
                }, noteDuration * 1000);

                const checkStop = setInterval(() => {
                    if (!isPlaying) {
                        clearTimeout(timeout);
                        clearInterval(checkStop);
                        resolve();
                    }
                }, 100);
            });
        }
    }

    // 等待所有延音结束
    if (isPlaying && activeSustains.size > 0) {
        const now = Date.now();
        const releaseTimes = Array.from(activeSustains.values());
        const maxReleaseTime = Math.max(...releaseTimes);
        const remainingTime = Math.max(0, maxReleaseTime - now);

        if (remainingTime > 0) {
            await new Promise(resolve => {
                const timeout = setTimeout(() => {
                    // 释放所有延音音符
                    activeSustains.forEach((releaseTime, note) => {
                        if (Date.now() >= releaseTime) {
                            getSampler().triggerRelease(note);
                            activeSustains.delete(note);
                        }
                    });
                    resolve();
                }, remainingTime);

                const checkStop = setInterval(() => {
                    if (!isPlaying) {
                        clearTimeout(timeout);
                        clearInterval(checkStop);
                        // 停止时立即释放所有音符
                        activeSustains.forEach((releaseTime, note) => {
                            getSampler().triggerRelease(note);
                        });
                        activeSustains.clear();
                        resolve();
                    }
                }, 100);
            });
        }

        // 最终释放所有剩余的音符
        activeSustains.forEach((releaseTime, note) => {
            getSampler().triggerRelease(note);
        });
        activeSustains.clear();
    }
}

// 创建唱名到音符的映射
function createSolfegeNoteMap() {
    const solfegeNoteMap = {};
    for (let i = 0; i < selectedNotes.length; i++) {
        const solfege = solfegeLabels[i] || '';
        if (solfege) {
            solfegeNoteMap[solfege.toLowerCase()] = selectedNotes[i];
        }
    }
    return solfegeNoteMap;
}

// 根据唱名查找音符
function findNoteForSolfege(solfegeStr, solfegeNoteMap, useDefaultMap) {
    const { baseSolfege, octaveShift, pitchShift } = parseSolfegeWithModifiers(solfegeStr);

    if (useDefaultMap) {
        const noteBase = solfegeToNoteMap[baseSolfege.toLowerCase()];
        if (noteBase) {
            for (const note of selectedNotes) {
                if (note.startsWith(noteBase)) {
                    return applyPitchShift(note, octaveShift, pitchShift);
                }
            }
        }
    } else {
        const mappedNote = solfegeNoteMap[baseSolfege.toLowerCase()];
        if (mappedNote) {
            return applyPitchShift(mappedNote, octaveShift, pitchShift);
        }
    }
    return null;
}

// 播放唱名序列（匀速显示进度）
async function playSolfegeSequence() {
    if (!isAudioReady()) {
        MessageUtils.showWarning("音源尚未加载完成，请稍候");
        return;
    }

    if (isPlaying) {
        stopPlayback();
        return;
    }

    const sequenceInput = document.getElementById('solfegeSequence').value.trim();
    if (!sequenceInput) {
        MessageUtils.showWarning("请输入唱名序列");
        return;
    }

    // 使用智能解析函数解析序列
    const parsedSequence = parseSolfegeSequence(sequenceInput);

    if (parsedSequence.length === 0) {
        MessageUtils.showWarning("没有有效的序列项");
        return;
    }

    // 获取当前选择的音符
    if (selectedNotes.length === 0) {
        MessageUtils.showWarning("请先选择至少一个音符");
        return;
    }

    isPlaying = true;
    currentPlaybackSequence = parsedSequence;
    currentPlaybackIndex = 0;

    // 使用修正后的总时长计算函数
    totalPlaybackDuration = calculateTotalDuration(parsedSequence);
    playbackStartTime = Date.now();

    // 显示进度条
    progressContainer.classList.add('visible');
    updateProgressBar(0, totalPlaybackDuration);

    randomBtn.disabled = true;
    MessageUtils.showStatusMessage("正在播放唱名序列...", 0);

    try {
        // 确保音频上下文已启动
        if (Tone.context.state !== 'running') {
            await Tone.start();
            MessageUtils.showStatusMessage("音频上下文已启动，正在播放唱名序列...", 0);
        }

        // 启动匀速进度更新
        startUniformProgressUpdate();

        // 开始播放音符（不处理进度更新）
        await playFromIndex(0);

        if (isPlaying) {
            MessageUtils.showSuccess("唱名序列播放完成！");
        }

    } catch (error) {
        console.error("播放错误:", error);
        MessageUtils.showError("播放失败：" + error.message);
    } finally {
        stopPlayback();
        randomBtn.disabled = false;
    }
}

// 启动匀速进度更新（像计时器一样）
function startUniformProgressUpdate() {
    if (playbackInterval) {
        clearInterval(playbackInterval);
    }

    playbackInterval = setInterval(() => {
        if (!isPlaying) {
            clearInterval(playbackInterval);
            return;
        }

        const currentTime = (Date.now() - playbackStartTime) / 1000;

        // 匀速更新进度，不考虑实际播放状态
        if (currentTime >= totalPlaybackDuration) {
            // 播放完成
            updateProgressBar(totalPlaybackDuration, totalPlaybackDuration);
            clearInterval(playbackInterval);
            if (isPlaying) {
                stopPlayback();
                MessageUtils.showSuccess("唱名序列播放完成！");
            }
        } else {
            // 匀速前进
            updateProgressBar(currentTime, totalPlaybackDuration);
        }
    }, 100); // 每100毫秒更新一次
}

// 获取完整的88键音符列表
function getAllPianoNotes() {
    const notes = [];
    for (let midi = 21; midi <= 108; midi++) { // A0到C8
        notes.push(getNoteName(midi));
    }
    return notes;
}

// 从MIDI编号获取音符名称
function getNoteName(midiNumber) {
    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const noteIndex = midiNumber % 12;
    const octave = Math.floor(midiNumber / 12) - 1;
    return notes[noteIndex] + octave;
}

// 检查音符是否在黑键上
function isBlackKey(noteName) {
    const noteBase = noteName.replace(/\d/g, '');
    return blackKeys.includes(noteBase);
}

// 为播放器提供完整的音符支持
function playNote(noteName, duration, velocity, sustainDuration = 0) {
    if (!isAudioReady()) {
        console.warn("音频未加载，无法播放");
        return;
    }

    if (duration === undefined) {
        duration = getNoteDuration();
    }
    if (velocity === undefined) {
        velocity = getDefaultVelocity();
    }

    try {
        const normalizedVelocity = Math.max(0, Math.min(127, velocity)) / 127;

        if (sustainDuration > 0) {
            // 有延音：先触发攻击，然后根据延音时长设置释放
            getSampler().triggerAttack(noteName, undefined, normalizedVelocity);
            setTimeout(() => {
                getSampler().triggerRelease(noteName);
            }, sustainDuration * 1000);
        } else {
            // 无延音：正常触发攻击释放
            getSampler().triggerAttackRelease(noteName, duration, undefined, normalizedVelocity);
        }
    } catch (error) {
        console.error("播放音符错误:", error);
    }
}

// 唱名模式转绝对音高朴素模式函数
function convertSolfegeToAbsolutePitch(inputText) {
    if (!inputText || inputText.trim() === '') {
        console.log("输入为空");
        return "";
    }

    const solfegeNoteMap = createSolfegeNoteMap();
    const useDefaultMap = Object.keys(solfegeNoteMap).length === 0;
    const baseDuration = getNoteDuration();
    const baseVelocity = getDefaultVelocity();

    // 解析输入文本，支持逗号和中文逗号分隔
    const items = inputText.split(/[,，]/).map(item => item.trim()).filter(item => item !== '');

    const convertedItems = items.map(item => {
        // 处理空闲时间（以下划线开头，只有时长参数）
        if (item.startsWith('_')) {
            // 解析空闲时间
            const restStr = item.substring(1); // 去掉开头的下划线
            const restParts = restStr.split('_').filter(part => part !== '');

            let result = '_';
            let restDuration = baseDuration;
            let restSustainDuration = 0;

            // 第一个参数是时长
            if (restParts.length >= 1 && restParts[0] !== '') {
                restDuration = parseValueWithReference(restParts[0], 't', baseDuration);
            }

            // 第二个参数是延音时长（如果有）
            if (restParts.length >= 2 && restParts[1] !== '') {
                restSustainDuration = parseValueWithReference(restParts[1], 't', restDuration);
            } else {
                restSustainDuration = calculateSustainDuration(restDuration);
            }

            result += formatDurationDisplay(restDuration) + '_' + formatDurationDisplay(restSustainDuration);
            return result;
        }

        // 处理和弦（括号内的内容）
        if ((item.startsWith('(') || item.startsWith('（')) &&
            (item.endsWith(')') || item.endsWith('）'))) {
            return convertChordToAbsolute(item, solfegeNoteMap, useDefaultMap, baseDuration, baseVelocity);
        }

        // 处理单个音符
        return convertSingleNoteToAbsolute(item, solfegeNoteMap, useDefaultMap, baseDuration, baseVelocity);
    });

    const result = convertedItems.join(', ');
    console.log("转换结果:", result);

    // 存入sessionStorage
    sessionStorage.setItem('convertedAbsoluteSequence', result);
    sessionStorage.setItem('conversionTimestamp', new Date().toISOString());

    // 新增：存储默认音符时值和音符力度到sessionStorage
    try {
        const defaultNoteDuration = getNoteDuration();
        const defaultNoteVelocity = getDefaultVelocity();

        sessionStorage.setItem('defaultNoteDuration', defaultNoteDuration.toString());
        sessionStorage.setItem('defaultNoteVelocity', defaultNoteVelocity.toString());

        console.log(`已存储默认设置 - 音符时值: ${defaultNoteDuration}, 音符力度: ${defaultNoteVelocity}`);
    } catch (error) {
        console.warn("存储默认设置到sessionStorage失败:", error);
    }

    return result;
}

// 转换和弦到绝对音高
function convertChordToAbsolute(chordStr, solfegeNoteMap, useDefaultMap, baseDuration, baseVelocity) {
    const inner = chordStr.replace(/[()（）]/g, '');
    const notes = inner.split(/[，,]/).map(note => note.trim()).filter(note => note !== '');

    const convertedNotes = notes.map(note => {
        return convertSingleNoteToAbsolute(note, solfegeNoteMap, useDefaultMap, baseDuration, baseVelocity);
    });

    return `(${convertedNotes.join(',')})`;
}

// 转换单个音符到绝对音高
function convertSingleNoteToAbsolute(item, solfegeNoteMap, useDefaultMap, baseDuration, baseVelocity) {
    // 使用正则表达式分割，正确处理连续的下划线
    const parts = item.split('_').filter(part => part !== '');
    if (parts.length === 0) return item;

    // 第一个部分永远是唱名
    const solfegePart = parts[0];
    const absoluteNote = convertSolfegeToNote(solfegePart, solfegeNoteMap, useDefaultMap);

    if (!absoluteNote) {
        console.warn(`无法转换唱名: ${solfegePart}`);
        return item;
    }

    const resultParts = [absoluteNote];

    // 解析参数：我们需要根据位置来判断每个参数的含义
    let duration = baseDuration;    // 默认使用基础时长
    let velocity = baseVelocity;    // 默认使用基础力度
    let sustainDuration = 0;        // 默认延音时长为0

    // 计算原始字符串中下划线的位置，以确定参数的位置
    const underscorePositions = [];
    let pos = -1;
    while ((pos = item.indexOf('_', pos + 1)) !== -1) {
        underscorePositions.push(pos);
    }

    // 根据下划线的数量判断参数的位置
    if (underscorePositions.length >= 1) {
        // 第一个下划线后的内容是时长参数（第二个参数）
        const durationStart = underscorePositions[0] + 1;
        let durationEnd = item.length;
        if (underscorePositions.length >= 2) {
            durationEnd = underscorePositions[1];
        }
        const durationStr = item.substring(durationStart, durationEnd).trim();

        if (durationStr && durationStr !== '') {
            // 如果有明确的时长值，使用它
            duration = parseValueWithReference(durationStr, 't', baseDuration);
        }
        // 如果没有值（如___），保持默认时长
    }

    if (underscorePositions.length >= 2) {
        // 第二个下划线后的内容是力度参数（第三个参数）
        const velocityStart = underscorePositions[1] + 1;
        let velocityEnd = item.length;
        if (underscorePositions.length >= 3) {
            velocityEnd = underscorePositions[2];
        }
        const velocityStr = item.substring(velocityStart, velocityEnd).trim();

        if (velocityStr && velocityStr !== '') {
            velocity = parseValueWithReference(velocityStr, 'f', baseVelocity);
        }
    }

    if (underscorePositions.length >= 3) {
        // 第三个下划线后的内容是延音参数（第四个参数）
        const sustainStart = underscorePositions[2] + 1;
        const sustainStr = item.substring(sustainStart).trim();

        if (sustainStr && sustainStr !== '') {
            sustainDuration = parseValueWithReference(sustainStr, 't', duration);
        } else {
            // 如果没有指定延音时长，使用默认延音率计算
            sustainDuration = calculateSustainDuration(duration);
        }
    } else {
        // 如果没有延音参数，使用默认延音率计算
        sustainDuration = calculateSustainDuration(duration);
    }

    // 构建结果：绝对音高_时长_力度_延音时长
    resultParts.push(formatDurationDisplay(duration));
    resultParts.push(velocity.toString());
    resultParts.push(formatDurationDisplay(sustainDuration));

    return resultParts.join('_');
}

// 将唱名转换为音符
function convertSolfegeToNote(solfegeStr, solfegeNoteMap, useDefaultMap) {
    const { baseSolfege, octaveShift, pitchShift } = parseSolfegeWithModifiers(solfegeStr);

    if (useDefaultMap) {
        // 使用默认映射
        const noteBase = solfegeToNoteMap[baseSolfege.toLowerCase()];
        if (noteBase) {
            for (const note of selectedNotes) {
                if (note.startsWith(noteBase)) {
                    return applyPitchShift(note, octaveShift, pitchShift);
                }
            }
        }
    } else {
        // 使用用户定义的映射
        const mappedNote = solfegeNoteMap[baseSolfege.toLowerCase()];
        if (mappedNote) {
            return applyPitchShift(mappedNote, octaveShift, pitchShift);
        }
    }

    return null;
}

// 在文件末尾导出函数，确保全局可用
window.convertSolfegeToAbsolutePitch = convertSolfegeToAbsolutePitch;


// 导出函数供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        sampler,
        getAllPianoNotes,
        getNoteName,
        isBlackKey,
        playNote,
        initAudioLoad,
        isAudioReady
    };
} 
