// 音源配置 - 与ear.html相同
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

// 加载进度控制
let loadProgress = 0;
let isAudioLoaded = false;

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
}

// 模拟加载进度（用于正常加载时）
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

// 隐藏加载界面
function hideLoadingPage() {
    const loadingPage = document.getElementById('loadingPage');
    if (loadingPage) {
        // 添加淡出效果
        loadingPage.style.opacity = '0';
        loadingPage.style.transition = 'opacity 0.5s ease';
        
        setTimeout(() => {
            loadingPage.style.display = 'none';
            // 显示主内容
            document.querySelector('.container').style.display = 'block';
            document.querySelector('footer').style.display = 'block';
        }, 500);
    }
}

// 显示加载界面
function showLoadingPage() {
    const loadingPage = document.getElementById('loadingPage');
    if (loadingPage) {
        loadingPage.style.display = 'flex';
        loadingPage.style.opacity = '1';
    }
}

// 初始化音源加载 - 优先使用sessionStorage缓存
function initAudioLoad() {
    return new Promise((resolve, reject) => {
        // 先检查sessionStorage中是否有缓存的音源数据
        const cachedAudioData = sessionStorage.getItem('pianoAudioData');
        const cachedLoadTime = sessionStorage.getItem('pianoAudioLoadTime');
        
        // 如果缓存存在且是最近加载的（比如1小时内），直接使用缓存
        if (cachedAudioData && cachedLoadTime && (Date.now() - parseInt(cachedLoadTime)) < 3600000) {
            try {
                console.log("从sessionStorage加载缓存的音源数据");
                updateLoadProgress(50, "从缓存加载音源配置...");
                
                const audioData = JSON.parse(cachedAudioData);
                
                const sampler = new Tone.Sampler({
                    urls: audioData.soundFiles,
                    baseUrl: audioData.baseUrl,
                    onload: () => {
                        console.log("从缓存加载音源完成");
                        updateLoadProgress(100, "音源加载完成！");
                        isAudioLoaded = true;
                        
                        // 延迟隐藏加载界面，让用户看到完成信息
                        setTimeout(() => {
                            hideLoadingPage();
                            createBaseNoteOptions();
                            createScaleDisplay();
                            createIntervalOptions();
                            resolve(sampler);
                        }, 500);
                    },
                    onerror: (error) => {
                        console.error("缓存音源加载失败，重新加载:", error);
                        updateLoadProgress(0, "缓存加载失败，重新加载...");
                        // 缓存加载失败，使用正常加载流程
                        loadAudioFromScratch(resolve, reject);
                    }
                }).toDestination();
                
                return;
            } catch (error) {
                console.error("缓存解析失败，重新加载音源:", error);
                updateLoadProgress(0, "缓存解析失败，重新加载...");
                // 如果缓存解析失败，继续正常加载流程
                loadAudioFromScratch(resolve, reject);
            }
        } else {
            // 没有缓存，正常加载
            updateLoadProgress(0, "开始加载音源...");
            loadAudioFromScratch(resolve, reject);
        }
    });
}

// 正常加载音源的函数
function loadAudioFromScratch(resolve, reject) {
    console.log("开始加载音源...");
    
    // 开始模拟加载进度
    simulateLoadProgress();
    
    const sampler = new Tone.Sampler({
        urls: soundFiles,
        baseUrl: "sounds/",
        onload: () => {
            console.log("本地钢琴音源加载完成");
            updateLoadProgress(100, "音源加载完成！");
            isAudioLoaded = true;
            
            // 将音源数据存储到sessionStorage供下次使用
            try {
                const audioData = {
                    soundFiles: soundFiles,
                    baseUrl: "sounds/",
                    loadTime: Date.now()
                };
                sessionStorage.setItem('pianoAudioData', JSON.stringify(audioData));
                sessionStorage.setItem('pianoAudioLoadTime', Date.now().toString());
                console.log("音源数据已存储到sessionStorage");
            } catch (error) {
                console.warn("sessionStorage存储失败:", error);
            }
            
            // 延迟隐藏加载界面，让用户看到完成信息
            setTimeout(() => {
                hideLoadingPage();
                createBaseNoteOptions();
                createScaleDisplay();
                createIntervalOptions();
                resolve(sampler);
            }, 500);
        },
        onerror: (error) => {
            console.error("音源加载错误:", error);
            updateLoadProgress(0, `加载错误: ${error.message}`);
            // 即使加载失败也隐藏加载界面
            setTimeout(() => {
                hideLoadingPage();
                reject(error);
            }, 1000);
        }
    }).toDestination();
}

// 使用初始化函数
let sampler;

// 页面加载完成后开始初始化
document.addEventListener('DOMContentLoaded', function() {
    // 初始隐藏主内容，只显示加载界面
    document.querySelector('.container').style.display = 'none';
    document.querySelector('footer').style.display = 'none';
    
    initAudioLoad().then((loadedSampler) => {
        sampler = loadedSampler;
        window.sampler = sampler; // 暴露到全局
        
        // 初始化应用 - 确保只执行一次
        console.log("音源加载完成，开始初始化应用");
        init();
    }).catch((error) => {
        console.error("音源加载失败:", error);
        // 即使加载失败也继续初始化
        hideLoadingPage();
        document.querySelector('.container').style.display = 'block';
        document.querySelector('footer').style.display = 'block';
        
        console.log("音源加载失败，使用降级方案初始化");
        init();
        
        // 显示错误提示
        showModal("加载警告", "音源加载失败，但可以继续使用基础功能");
    });
});

// 获取DOM元素
const piano = document.getElementById('piano');
const playScaleBtn = document.getElementById('playScaleBtn');
const randomTrainingBtn = document.getElementById('randomTrainingBtn');
const replayTestNoteBtn = document.getElementById('replayTestNoteBtn');
const scaleDirection = document.getElementById('scaleDirection');
const baseNoteSelect = document.getElementById('baseNote');
const scaleTypeSelect = document.getElementById('scaleType');
const notationTypeSelect = document.getElementById('notationType');
const trainingModeSelect = document.getElementById('trainingMode');
const trainingMethodSelect = document.getElementById('trainingMethod'); // 新增：训练方式下拉框
const scaleDisplay = document.getElementById('scaleDisplay');
const bpmInput = document.getElementById('bpmInput');
const rhythmSelect = document.getElementById('rhythmSelect');
const bpmError = document.getElementById('bpmError');
const toggleSettingsBtn = document.getElementById('toggleSettingsBtn');
const settingsPanel = document.getElementById('settingsPanel');
const resultModal = document.getElementById('resultModal');
const modalTitle = document.getElementById('modalTitle');
const modalMessage = document.getElementById('modalMessage');
const modalBtn = document.getElementById('modalBtn');
const intervalGrid = document.getElementById('intervalGrid');

// 钢琴键盘配置
const octaveStart = 1;
const octaveEnd = 6;
const blackKeys = ["C#", "D#", "F#", "G#", "A#"];

// 音符列表
const notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

// 当前基准音
let baseNote = "A3";

// 当前音阶类型
let scaleType = "major";

// 唱名表示方式
let notationType = "solfa";

// 当前播放速度 (BPM)
let currentBPM = 60;

// 唱名映射（首调唱名法）
let solfegeMap = {};

// 音阶的音符（两个八度范围）
let scaleNotes = [];

// 唱名到数字的映射
const solfaToNumber = {
    "do": "1",
    "re": "2",
    "mi": "3",
    "fa": "4",
    "sol": "5",
    "la": "6",
    "si": "7",
    "#do": "#1",
    "#re": "#2",
    "#mi": "#3",
    "#fa": "#4",
    "#sol": "#5",
    "#la": "#6",
    "#si": "#7",
    "bdo": "b1",
    "bre": "b2",
    "bmi": "b3",
    "bfa": "b4",
    "bsol": "b5",
    "bla": "b6",
    "bsi": "b7"
};

// 节奏映射
const rhythmMap = {
    "whole": 4,
    "half": 2,
    "quarter": 1,
    "third": 1 / 3,
    "eighth": 0.5,
    "sixteenth": 0.25,
    "thirtysecond": 0.125,
    "sixtyfourth": 0.0625
};

// 训练状态
let isTrainingActive = false;
let currentTestNote = null;
let userCanAnswer = false;
let scaleNotesForReplay = [];
let isDualNoteTraining = false; // 新增：双音训练模式标志

// 音程范围设置
const intervalOptions = [
    { id: "P1", name: "纯一度", semitones: 0 },
    { id: "m2", name: "小二度", semitones: 1 },
    { id: "M2", name: "大二度", semitones: 2 },
    { id: "m3", name: "小三度", semitones: 3 },
    { id: "M3", name: "大三度", semitones: 4 },
    { id: "P4", name: "纯四度", semitones: 5 },
    { id: "A4", name: "增四度", semitones: 6 },
    { id: "P5", name: "纯五度", semitones: 7 },
    { id: "m6", name: "小六度", semitones: 8 },
    { id: "M6", name: "大六度", semitones: 9 },
    { id: "m7", name: "小七度", semitones: 10 },
    { id: "M7", name: "大七度", semitones: 11 },
    { id: "P8", name: "纯八度", semitones: 12 }
];

// 存储用户选择的音程范围 - 初始为全选
let selectedIntervals = new Set(intervalOptions.map(opt => opt.id));


// 初始化函数
function init() {
    console.log("初始化函数开始执行");
    
    createPiano();
    setupScrollArrows();
    createScaleDisplay();
    setupBPMControls();
    setupSettingsPanel();
    setupModal();
    setupReplayButton();
    createIntervalOptions(); // 创建音程范围选项
    validateIntervalSettings(); // 初始验证
    setupIntervalButtons(); // 设置音程范围按钮
    
    console.log("初始化函数执行完成");
    
    // 调试：检查按钮事件绑定
    console.log("设置面板按钮:", toggleSettingsBtn);
    console.log("播放按钮:", playScaleBtn);
}

// 创建音程范围选项
function createIntervalOptions() {
    intervalGrid.innerHTML = '';

    intervalOptions.forEach(interval => {
        const item = document.createElement('div');
        item.className = 'interval-item';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `interval-${interval.id}`;
        checkbox.value = interval.id;
        checkbox.checked = true; // 初始选中
        checkbox.addEventListener('change', handleIntervalChange);

        const label = document.createElement('label');
        label.htmlFor = `interval-${interval.id}`;
        label.textContent = interval.name;

        item.appendChild(checkbox);
        item.appendChild(label);
        intervalGrid.appendChild(item);
    });
}

// 处理音程范围选择变化
function handleIntervalChange(e) {
    const intervalId = e.target.value;

    if (e.target.checked) {
        selectedIntervals.add(intervalId);
    } else {
        selectedIntervals.delete(intervalId);
    }

    // 验证设置并更新按钮状态
    validateIntervalSettings();
}

// 验证音程设置并更新按钮状态
function validateIntervalSettings() {
    const isValid = isIntervalSettingsValid();

    // 更新按钮状态
    randomTrainingBtn.disabled = !isValid;
    replayTestNoteBtn.disabled = !isValid;

    return isValid;
}

// 检查音程设置是否有效
function isIntervalSettingsValid() {
    // 1. 检查是否至少选择了一个音程
    if (selectedIntervals.size === 0) {
        showModal("设置错误", "请至少选择一个音程范围，否则无法生成训练音");
        return false;
    }

    // 2. 检查是否能生成训练音
    if (!canGenerateTrainingNotes()) {
        showModal("设置错误", "当前选择的音程范围不属于当前音阶类型的音程范围，这将导致无法生成训练音，请调整设置");
        return false;
    }

    return true;
}

// 检查是否能生成训练音
function canGenerateTrainingNotes() {
    // 获取当前音阶类型和方向所包含的音程（半音数）集合
    const scaleIntervalSet = getScaleIntervals(scaleType, scaleDirection.value);

    // 获取用户选择的音程范围对应的半音数集合
    const selectedSemitones = new Set();
    for (const intervalId of selectedIntervals) {
        const interval = intervalOptions.find(opt => opt.id === intervalId);
        if (interval) {
            selectedSemitones.add(interval.semitones);
        }
    }

    // 取交集：当前音阶中存在的且用户选择的音程
    const allowedSemitones = new Set();
    for (const semitone of scaleIntervalSet) {
        if (selectedSemitones.has(semitone)) {
            allowedSemitones.add(semitone);
        }
    }

    // 检查是否有符合条件的音程
    return allowedSemitones.size > 0;
}

// 设置再听一遍按钮
function setupReplayButton() {
    replayTestNoteBtn.addEventListener('click', function () {
        if (currentTestNote) {
            replayTestNote();
        }
    });
}

// 再听一遍功能
async function replayTestNote() {
    if (!currentTestNote || scaleNotesForReplay.length === 0) return;

    // 禁用按钮防止重复点击
    replayTestNoteBtn.disabled = true;
    randomTrainingBtn.disabled = true;

    // 新增代码 - 在baseNoteOnly模式下显示所有音阶音符
    const trainingMethod = trainingMethodSelect.value;
    if (trainingMethod === 'baseNoteOnly') {
        document.querySelectorAll('.step').forEach(step => {
            step.classList.add('visible');
        });
    }

    try {
        // 获取节奏值
        const rhythmValue = rhythmSelect.value;
        const beatValue = rhythmMap[rhythmValue] || 0.5;
        const interval = (60 / currentBPM) * beatValue * 1000;

        // 确保音频上下文已启动
        if (Tone.context.state !== 'running') {
            await Tone.start();
        }

        // 获取训练方式
        const trainingMethod = trainingMethodSelect.value;

        // 1. 根据训练方式决定是否播放整个音阶
        if (trainingMethod === 'fullScale') {
            // 播放整个音阶
            for (let i = 0; i < scaleNotesForReplay.length; i++) {
                const note = scaleNotesForReplay[i];
                const step = document.querySelector(`.step[data-note="${note}"]`);
                const pianoKey = document.getElementById(`key-${note}`);
                const standardKey = document.getElementById(`key-${baseNote}`);

                if (step) {
                    step.classList.add('visible');
                    step.classList.add('active');
                    void step.offsetHeight; // 强制重绘
                }

                if (pianoKey) {
                    pianoKey.classList.add('playing');
                    void pianoKey.offsetHeight;
                }

                // 在双音训练模式下播放双音并高亮基准音
                if (isDualNoteTraining) {
                    if (standardKey) {
                        standardKey.classList.add('playing-dual');
                        void standardKey.offsetHeight;
                    }
                    sampler.triggerAttackRelease([baseNote, note], beatValue);
                } else {
                    sampler.triggerAttackRelease(note, beatValue);
                }

                await new Promise(resolve => setTimeout(resolve, interval));

                if (step) step.classList.remove('active');
                if (pianoKey) pianoKey.classList.remove('playing');
                if (isDualNoteTraining && standardKey) standardKey.classList.remove('playing-dual');
            }

            // 停顿1个节奏的时间
            await new Promise(resolve => setTimeout(resolve, interval));
        } else {
            // 如果是双音训练，直接跳过播放基准音，因为后面会播放双音
            if (!isDualNoteTraining) {
                // 只播放基准音（单音训练时才播放）
                const standardKey = document.getElementById(`key-${baseNote}`);
                if (standardKey) {
                    standardKey.classList.add('playing');
                    void standardKey.offsetHeight;
                }

                sampler.triggerAttackRelease(baseNote, beatValue);
                await new Promise(resolve => setTimeout(resolve, interval));

                if (standardKey) standardKey.classList.remove('playing');
            }
        }

        // 2. 再播放测试音符
        const testKey = document.getElementById(`key-${currentTestNote}`);
        const standardKey = document.getElementById(`key-${baseNote}`);

        if (isDualNoteTraining) {
            // 双音训练：同时播放基准音和测试音符
            // 注意：测试音不显示高亮（避免暴露答案）
            sampler.triggerAttackRelease([baseNote, currentTestNote], beatValue * 2);
        } else {
            // 单音训练：只播放测试音符
            // 注意：测试音不显示高亮（避免暴露答案）
            sampler.triggerAttackRelease(currentTestNote, beatValue * 2);
        }

    } catch (error) {
        console.error("再听一遍错误:", error);
    } finally {
        // 重新启用按钮
        replayTestNoteBtn.disabled = false;
        randomTrainingBtn.disabled = false;
    }
}

// 设置模态框
function setupModal() {
    modalBtn.addEventListener('click', function () {
        resultModal.style.display = 'none';
    });
}

// 显示模态框
function showModal(title, message) {
    modalTitle.textContent = title;
    modalMessage.textContent = message;
    resultModal.style.display = 'flex';
}

// 设置设置面板
function setupSettingsPanel() {
    // 先移除可能存在的旧事件监听器
    toggleSettingsBtn.removeEventListener('click', handleSettingsToggle);
    
    // 添加新的事件监听器
    toggleSettingsBtn.addEventListener('click', handleSettingsToggle);
}

// 单独提取设置面板切换处理函数
function handleSettingsToggle(e) {
    e.preventDefault();
    e.stopPropagation(); // 阻止事件冒泡
    
    console.log("设置面板按钮被点击"); // 调试信息
    
    // 验证设置（仅在展开时验证）
    if (!settingsPanel.classList.contains('expanded')) {
        if (!validateIntervalSettings()) {
            showModal("设置错误", "请检查音程范围设置");
            return; // 阻止展开面板
        }
    }
    
    const isExpanded = settingsPanel.classList.toggle('expanded');
    toggleSettingsBtn.textContent = isExpanded ? '收起设置' : '设置面板';

    // 根据面板状态启用/禁用按钮
    playScaleBtn.disabled = isExpanded;
    randomTrainingBtn.disabled = isExpanded;
    replayTestNoteBtn.disabled = isExpanded;

    // 当面板收起时刷新页面并更新设置
    if (!isExpanded) {
        setTimeout(() => {
            // 重置训练状态
            resetTrainingState();
            // 重新生成音阶显示
            createScaleDisplay();
            // 滚动到当前基准音位置
            scrollToNote(baseNote);
        }, 0);
    }
}

// 设置BPM控制
function setupBPMControls() {
    bpmInput.value = currentBPM;

    bpmInput.addEventListener('input', function () {
        validateBPMInput();
    });

    bpmInput.addEventListener('change', function () {
        validateBPMInput();
    });

    bpmInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
            validateBPMInput();
        }
    });
}

// 验证BPM输入
function validateBPMInput() {
    const value = parseInt(bpmInput.value);
    let isValid = true;

    if (isNaN(value)) {
        bpmError.textContent = "请输入有效数字";
        bpmInput.classList.add('invalid-input');
        isValid = false;
    } else if (value < 20) {
        bpmError.textContent = "BPM不能小于20";
        bpmInput.classList.add('invalid-input');
        isValid = false;
    } else if (value > 300) {
        bpmError.textContent = "BPM不能大于300";
        bpmInput.classList.add('invalid-input');
        isValid = false;
    } else {
        bpmError.textContent = "";
        bpmInput.classList.remove('invalid-input');
        currentBPM = value;
    }

    playScaleBtn.disabled = !isValid;
    randomTrainingBtn.disabled = !isValid;
    return isValid;
}

// 创建钢琴键盘
function createPiano() {
    piano.innerHTML = '';

    for (let octave = octaveStart; octave <= octaveEnd; octave++) {
        for (let i = 0; i < notes.length; i++) {
            const note = notes[i];
            const fullNote = note + octave;
            const isBlack = blackKeys.includes(note);

            const key = document.createElement('div');
            key.className = `key ${isBlack ? 'black' : 'white'}`;
            key.dataset.note = fullNote;
            key.id = `key-${fullNote}`;

            const label = document.createElement('div');
            label.className = 'key-label';
            label.textContent = fullNote;
            key.appendChild(label);

            key.addEventListener('click', async () => {
                try {
                    if (Tone.context.state !== 'running') {
                        await Tone.start();
                    }

                    key.classList.add('playing');
                    setTimeout(() => key.classList.remove('playing'), 300);
                    sampler.triggerAttackRelease(fullNote, 0.4);
                } catch (error) {
                    console.error("播放错误:", error);
                }
            });

            key.addEventListener('touchstart', async (e) => {
                e.preventDefault();
                try {
                    if (Tone.context.state !== 'running') {
                        await Tone.start();
                    }

                    key.classList.add('playing');
                    setTimeout(() => key.classList.remove('playing'), 300);
                    sampler.triggerAttackRelease(fullNote, 0.4);
                } catch (error) {
                    console.error("播放错误:", error);
                }
            });

            piano.appendChild(key);
        }
    }
}

// 创建基准音选项
function createBaseNoteOptions() {
    baseNoteSelect.innerHTML = '';

    for (let octave = 2; octave <= 5; octave++) {
        for (let i = 0; i < notes.length; i++) {
            const note = notes[i];
            const fullNote = note + octave;

            const option = document.createElement('option');
            option.value = fullNote;
            option.textContent = fullNote;

            if (fullNote === baseNote) {
                option.selected = true;
            }

            baseNoteSelect.appendChild(option);
        }
    }
}

// 生成大调音阶
function generateMajorScale() {
    const majorScaleIntervals = [2, 2, 1, 2, 2, 2, 1];
    const baseNoteName = baseNote.replace(/\d+/, '');
    const baseOctave = parseInt(baseNote.match(/\d+/)[0]);
    let currentIndex = notes.indexOf(baseNoteName);
    let currentOctave = baseOctave;

    const ascendingScale = [baseNote];
    let cumulativeInterval = 0;

    for (let i = 0; i < majorScaleIntervals.length; i++) {
        cumulativeInterval += majorScaleIntervals[i];
        let nextIndex = (currentIndex + cumulativeInterval) % notes.length;
        let octaveOffset = Math.floor((currentIndex + cumulativeInterval) / notes.length);
        const nextNote = notes[nextIndex] + (currentOctave + octaveOffset);
        ascendingScale.push(nextNote);
    }

    const descendingScale = [];
    cumulativeInterval = 0;

    for (let i = majorScaleIntervals.length - 1; i >= 0; i--) {
        cumulativeInterval += majorScaleIntervals[i];
        let prevIndex = (currentIndex - cumulativeInterval + notes.length * 10) % notes.length;
        let octaveOffset = Math.floor((currentIndex - cumulativeInterval) / notes.length);
        const prevNote = notes[prevIndex] + (currentOctave + octaveOffset);
        descendingScale.unshift(prevNote);
    }

    scaleNotes = [...descendingScale, baseNote, ...ascendingScale.slice(1)];

    solfegeMap = {};
    const solfegeNames = [
        "si", "la", "sol", "fa", "mi", "re", "do",
        "do",
        "re", "mi", "fa", "sol", "la", "si", "do"
    ];

    const dotPositions = [
        "below", "below", "below", "below", "below", "below", "below",
        "none",
        "none", "none", "none", "none", "none", "none", "above"
    ];

    for (let i = 0; i < scaleNotes.length; i++) {
        solfegeMap[scaleNotes[i]] = {
            name: solfegeNames[i],
            dot: dotPositions[i]
        };
    }
}

// 生成小调音阶
function generateMinorScale() {
    const minorScaleIntervals = [2, 1, 2, 2, 1, 2, 2];
    const baseNoteName = baseNote.replace(/\d+/, '');
    const baseOctave = parseInt(baseNote.match(/\d+/)[0]);
    let currentIndex = notes.indexOf(baseNoteName);
    let currentOctave = baseOctave;

    const ascendingScale = [baseNote];
    let cumulativeInterval = 0;

    for (let i = 0; i < minorScaleIntervals.length; i++) {
        cumulativeInterval += minorScaleIntervals[i];
        let nextIndex = (currentIndex + cumulativeInterval) % notes.length;
        let octaveOffset = Math.floor((currentIndex + cumulativeInterval) / notes.length);
        const nextNote = notes[nextIndex] + (currentOctave + octaveOffset);
        ascendingScale.push(nextNote);
    }

    const descendingScale = [];
    cumulativeInterval = 0;

    for (let i = minorScaleIntervals.length - 1; i >= 0; i--) {
        cumulativeInterval += minorScaleIntervals[i];
        let prevIndex = (currentIndex - cumulativeInterval + notes.length * 10) % notes.length;
        let octaveOffset = Math.floor((currentIndex - cumulativeInterval) / notes.length);
        const prevNote = notes[prevIndex] + (currentOctave + octaveOffset);
        descendingScale.unshift(prevNote);
    }

    scaleNotes = [...descendingScale, baseNote, ...ascendingScale.slice(1)];

    solfegeMap = {};
    const solfegeNames = [
        "sol", "fa", "mi", "re", "do", "si", "la",
        "la",
        "si", "do", "re", "mi", "fa", "sol", "la"
    ];

    const dotPositions = [
        "below", "below", "below", "below", "below", "below", "below",
        "none",
        "none", "above", "above", "above", "above", "above", "above"
    ];

    for (let i = 0; i < scaleNotes.length; i++) {
        solfegeMap[scaleNotes[i]] = {
            name: solfegeNames[i],
            dot: dotPositions[i]
        };
    }
}

// 生成半音音阶
function generateChromaticScale() {
    const baseNoteName = baseNote.replace(/\d+/, '');
    const baseOctave = parseInt(baseNote.match(/\d+/)[0]);
    let currentIndex = notes.indexOf(baseNoteName);
    let currentOctave = baseOctave;

    const ascendingScale = [baseNote];
    for (let i = 1; i <= 12; i++) {
        const index = (currentIndex + i) % notes.length;
        const octaveOffset = Math.floor((currentIndex + i) / notes.length);
        const note = notes[index] + (currentOctave + octaveOffset);
        ascendingScale.push(note);
    }

    const descendingScale = [baseNote];
    for (let i = 1; i <= 12; i++) {
        const index = (currentIndex - i + notes.length * 10) % notes.length;
        const octaveOffset = Math.floor((currentIndex - i) / notes.length);
        const note = notes[index] + (currentOctave + octaveOffset);
        descendingScale.push(note);
    }

    scaleNotes = [...descendingScale, ...ascendingScale];

    solfegeMap = {};
    const ascendingSolfege = [
        "do", "do#", "re", "re#", "mi", "fa", "fa#", "sol", "sol#", "la", "la#", "si", "do"
    ];

    const descendingSolfege = [
        "do", "si", "la#", "la", "sol#", "sol", "fa#", "fa", "mi", "re#", "re", "do#", "do"
    ];

    const ascendingDotPositions = [
        "none", "none", "none", "none", "none", "none", "none", "none", "none", "none", "none", "none", "above"
    ];

    const descendingDotPositions = [
        "none", "below", "below", "below", "below", "below", "below", "below", "below", "below", "below", "below", "below"
    ];

    const solfegeNames = [
        ...descendingSolfege,
        ...ascendingSolfege
    ];

    const dotPositions = [
        ...descendingDotPositions,
        ...ascendingDotPositions
    ];

    for (let i = 0; i < scaleNotes.length; i++) {
        solfegeMap[scaleNotes[i]] = {
            name: solfegeNames[i],
            dot: dotPositions[i]
        };
    }
}

// 生成音阶
function generateScale() {
    if (scaleType === "major") {
        generateMajorScale();
    } else if (scaleType === "minor") {
        generateMinorScale();
    } else if (scaleType === "chromatic") {
        generateChromaticScale();
    }
}

// 计算音符位置
function getNotePosition(noteStr) {
    const noteName = noteStr.replace(/\d+/, '');
    const octave = parseInt(noteStr.match(/\d+/)[0]);
    const noteIndex = notes.indexOf(noteName);
    return octave * 12 + noteIndex;
}

// 创建阶梯式唱名显示
function createScaleDisplay() {
    scaleDisplay.innerHTML = '';
    generateScale();

    const direction = scaleDirection.value;
    let scale, stepSolfege, stepDotPositions;

    if (scaleType === "chromatic") {
        if (direction === 'ascending') {
            scale = scaleNotes.slice(13);
            stepSolfege = scale.map(note => solfegeMap[note].name);
            stepDotPositions = scale.map(note => solfegeMap[note].dot);
        } else {
            scale = scaleNotes.slice(0, 13);
            stepSolfege = scale.map(note => solfegeMap[note].name);
            stepDotPositions = scale.map(note => solfegeMap[note].dot);
        }
    } else {
        if (direction === 'ascending') {
            scale = scaleNotes.slice(7, 15);
            stepSolfege = scale.map(note => solfegeMap[note].name);
            stepDotPositions = scale.map(note => solfegeMap[note].dot);
        } else {
            scale = [...scaleNotes.slice(0, 8)].reverse();

            if (scaleType === "major") {
                stepSolfege = ["do", "si", "la", "sol", "fa", "mi", "re", "do"];
                stepDotPositions = ["none", "below", "below", "below", "below", "below", "below", "below"];
            } else {
                stepSolfege = ["la", "sol", "fa", "mi", "re", "do", "si", "la"];
                stepDotPositions = ["none", "none", "none", "none", "none", "none", "below", "below"];
            }
        }
    }

    if (notationType === "number") {
        stepSolfege = stepSolfege.map(name => {
            if (name.startsWith("#") || name.startsWith("b")) {
                const baseName = name.substring(1);
                const prefix = name[0];
                return prefix + (solfaToNumber[baseName] || name);
            }
            return solfaToNumber[name] || name;
        });
    }

    const firstNote = scale[0];
    const lastNote = scale[scale.length - 1];
    let totalSemitones;

    if (direction === 'ascending') {
        totalSemitones = getNotePosition(lastNote) - getNotePosition(firstNote);
    } else {
        totalSemitones = getNotePosition(firstNote) - getNotePosition(lastNote);
    }

    totalSemitones = Math.abs(totalSemitones);
    const H = totalSemitones > 0 ? 180 / totalSemitones : 0;

    scale.forEach((note, index) => {
        const step = document.createElement('div');
        step.className = 'step';
        step.dataset.note = note;

        if (direction === 'ascending') {
            step.style.alignSelf = 'flex-end';
        } else {
            step.style.alignSelf = 'flex-start';
        }

        const label = document.createElement('div');
        label.className = 'step-label';
        label.textContent = stepSolfege[index];
        label.dataset.note = note;
        step.appendChild(label);

        if (stepDotPositions[index] === "above") {
            const dot = document.createElement('div');
            dot.className = 'dot-above';
            label.appendChild(dot);
        } else if (stepDotPositions[index] === "below") {
            const dot = document.createElement('div');
            dot.className = 'dot-below';
            label.appendChild(dot);
        }

        const line = document.createElement('div');
        line.className = 'step-line';
        step.appendChild(line);

        let semitonesFromFirst;
        if (direction === 'ascending') {
            semitonesFromFirst = getNotePosition(note) - getNotePosition(firstNote);
        } else {
            semitonesFromFirst = getNotePosition(firstNote) - getNotePosition(note);
        }

        if (direction === 'ascending') {
            step.style.marginBottom = `${semitonesFromFirst * H}px`;
        } else {
            step.style.marginTop = `${semitonesFromFirst * H}px`;
        }

        scaleDisplay.appendChild(step);
    });
}

// 播放音阶
async function playScale() {
    if (!validateBPMInput()) {
        return;
    }

    const direction = scaleDirection.value;
    let scale;

    if (scaleType === "chromatic") {
        if (direction === 'ascending') {
            scale = scaleNotes.slice(13);
        } else {
            scale = scaleNotes.slice(0, 13);
        }
    } else {
        if (direction === 'ascending') {
            scale = scaleNotes.slice(7, 15);
        } else {
            scale = [...scaleNotes.slice(0, 8)].reverse();
        }
    }

    playScaleBtn.disabled = true;
    playScaleBtn.textContent = "播放中...";
    randomTrainingBtn.disabled = true;

    document.querySelectorAll('.step').forEach(step => {
        step.classList.remove('active');
        step.classList.remove('visible');
    });

    try {
        if (Tone.context.state !== 'running') {
            await Tone.start();
        }

        const rhythmValue = rhythmSelect.value;
        const beatValue = rhythmMap[rhythmValue] || 0.5;
        const interval = (60 / currentBPM) * beatValue * 1000;

        for (let i = 0; i < scale.length; i++) {
            const note = scale[i];
            const step = document.querySelector(`.step[data-note="${note}"]`);
            const pianoKey = document.getElementById(`key-${note}`);

            if (step) {
                step.classList.add('visible');
                step.classList.add('active');
                void step.offsetHeight;
            }

            if (pianoKey) {
                pianoKey.classList.add('playing');
                void pianoKey.offsetHeight;
            }

            sampler.triggerAttackRelease(note, beatValue);
            await new Promise(resolve => setTimeout(resolve, interval));

            if (step) step.classList.remove('active');
            if (pianoKey) pianoKey.classList.remove('playing');
        }
    } catch (error) {
        console.error("播放错误:", error);
    } finally {
        playScaleBtn.disabled = false;
        playScaleBtn.textContent = "播放音阶";
        randomTrainingBtn.disabled = false;
    }
}

// 计算两个音符之间的半音数
function getSemitonesBetween(note1, note2) {
    const position1 = getNotePosition(note1);
    const position2 = getNotePosition(note2);
    return Math.abs(position1 - position2);
}

// 根据半音数获取音程ID
function getIntervalId(semitones) {
    for (const interval of intervalOptions) {
        if (interval.semitones === semitones) {
            return interval.id;
        }
    }
    return null;
}

// 开始训练
async function startTraining() {
    if (!validateBPMInput()) {
        return;
    }

    // 验证音程设置
    if (!validateIntervalSettings()) {
        return;
    }

    playScaleBtn.disabled = true;
    randomTrainingBtn.disabled = true;
    replayTestNoteBtn.style.display = 'none';

    // 先添加visible类，然后再清除active类
    // 新增代码 - 在baseNoteOnly模式下显示所有音阶音符
    const trainingMethod = trainingMethodSelect.value;
    if (trainingMethod === 'baseNoteOnly') {
        document.querySelectorAll('.step').forEach(step => {
            step.classList.add('visible');
        });
    }

    // 然后清除active类（但不清除visible类）
    document.querySelectorAll('.step').forEach(step => {
        step.classList.remove('active');
    });

    try {
        if (Tone.context.state !== 'running') {
            await Tone.start();
        }

        // 根据训练模式选择单音或双音训练
        const trainingMode = trainingModeSelect.value;
        isDualNoteTraining = (trainingMode === 'dual');

        // 获取训练方式
        const trainingMethod = trainingMethodSelect.value;

        const rhythmValue = rhythmSelect.value;
        const beatValue = rhythmMap[rhythmValue] || 0.5;
        const interval = (60 / currentBPM) * beatValue * 1000;

        // 保存当前音阶用于再听一遍功能
        const direction = scaleDirection.value;
        let scale;

        if (scaleType === "chromatic") {
            if (direction === 'ascending') {
                scale = scaleNotes.slice(13);
            } else {
                scale = scaleNotes.slice(0, 13);
            }
        } else {
            if (direction === 'ascending') {
                scale = scaleNotes.slice(7, 15);
            } else {
                scale = [...scaleNotes.slice(0, 8)].reverse();
            }
        }

        scaleNotesForReplay = [...scale];

        // 根据训练方式决定是否播放整个音阶
        if (trainingMethod === 'fullScale') {
            // 首先播放整个音阶
            for (let i = 0; i < scale.length; i++) {
                const note = scale[i];
                const step = document.querySelector(`.step[data-note="${note}"]`);
                const pianoKey = document.getElementById(`key-${note}`);
                const standardKey = document.getElementById(`key-${baseNote}`);

                if (step) {
                    step.classList.add('visible');
                    step.classList.add('active');
                    void step.offsetHeight;
                }

                if (pianoKey) {
                    pianoKey.classList.add('playing');
                    void pianoKey.offsetHeight;
                }

                // 在双音训练模式下播放双音并高亮基准音
                if (isDualNoteTraining) {
                    if (standardKey) {
                        standardKey.classList.add('playing-dual');
                        void standardKey.offsetHeight;
                    }
                    sampler.triggerAttackRelease([baseNote, note], beatValue);
                } else {
                    sampler.triggerAttackRelease(note, beatValue);
                }

                await new Promise(resolve => setTimeout(resolve, interval));

                if (step) step.classList.remove('active');
                if (pianoKey) pianoKey.classList.remove('playing');
                if (isDualNoteTraining && standardKey) standardKey.classList.remove('playing-dual');
            }

            // 停顿1个节奏的时间
            await new Promise(resolve => setTimeout(resolve, interval));
        } else {
            // 如果是双音训练，直接跳过播放基准音，因为后面会播放双音
            if (!isDualNoteTraining) {
                // 只播放基准音（单音训练时才播放）
                const standardKey = document.getElementById(`key-${baseNote}`);
                if (standardKey) {
                    standardKey.classList.add('playing');
                    void standardKey.offsetHeight;
                }

                sampler.triggerAttackRelease(baseNote, beatValue);
                await new Promise(resolve => setTimeout(resolve, interval));

                if (standardKey) standardKey.classList.remove('playing');
            }
        }

        // 随机选择一个音符（包括第一个和最后一个）
        // 获取当前音阶类型和方向所包含的音程（半音数）集合
        const scaleIntervalSet = getScaleIntervals(scaleType, scaleDirection.value);

        // 获取用户选择的音程范围对应的半音数集合
        const selectedSemitones = new Set();
        for (const intervalId of selectedIntervals) {
            const interval = intervalOptions.find(opt => opt.id === intervalId);
            if (interval) {
                selectedSemitones.add(interval.semitones);
            }
        }

        // 取交集：当前音阶中存在的且用户选择的音程
        const allowedSemitones = new Set();
        for (const semitone of scaleIntervalSet) {
            if (selectedSemitones.has(semitone)) {
                allowedSemitones.add(semitone);
            }
        }

        // 如果没有符合条件的音程，使用纯八度（12）作为默认
        if (allowedSemitones.size === 0) {
            allowedSemitones.add(12);
        }

        // 生成可能的音符（根据方向限制）
        const possibleNotes = [];
        const baseNoteName = baseNote.replace(/\d+/, ''); // 提取基准音的音名（如"A"）
        const baseOctave = parseInt(baseNote.match(/\d+/)[0]); // 提取基准音的八度（如3）
        const basePosition = getNotePosition(baseNote); // 基准音的绝对位置

        for (let octave = baseOctave - 1; octave <= baseOctave + 1; octave++) {
            for (let i = 0; i < notes.length; i++) {
                const note = notes[i] + octave;
                const notePosition = getNotePosition(note);
                const semitones = Math.abs(notePosition - basePosition);

                // 检查音程是否在允许范围内
                if (allowedSemitones.has(semitones)) {
                    // 根据方向筛选音符
                    if (direction === 'ascending' && notePosition >= basePosition) {
                        possibleNotes.push(note);
                    } else if (direction === 'descending' && notePosition <= basePosition) {
                        possibleNotes.push(note);
                    }
                }
            }
        }

        // 随机选择一个音符
        const randomIndex = Math.floor(Math.random() * possibleNotes.length);
        currentTestNote = possibleNotes[randomIndex];
        console.log("--- 随机训练信息 ---");
        console.log(`基准音: ${baseNote}`);
        console.log(`训练音: ${currentTestNote}`);
        const semitones = getSemitonesBetween(baseNote, currentTestNote);
        const intervalId = getIntervalId(semitones);
        const intervalName = intervalOptions.find(opt => opt.id === intervalId)?.name || "未知音程";
        console.log(`音程: ${intervalName} (${semitones}个半音)`);
        console.log("-------------------");

        // 播放测试音符（不显示高亮）
        if (isDualNoteTraining) {
            // 双音训练：同时播放基准音和测试音符
            sampler.triggerAttackRelease([baseNote, currentTestNote], beatValue * 2);
        } else {
            // 单音训练：只播放测试音符
            sampler.triggerAttackRelease(currentTestNote, beatValue * 2);
        }

        // 允许用户回答
        userCanAnswer = true;
        isTrainingActive = true;

        // 显示再听一遍按钮
        replayTestNoteBtn.style.display = 'block';

    } catch (error) {
        console.error("训练错误:", error);
        resetTrainingState();
    }
}

// 处理用户回答
function handleUserAnswer(clickedNote) {
    if (!isTrainingActive || !userCanAnswer) return;

    const isCorrect = clickedNote === currentTestNote;

    if (isCorrect) {
        playCheerEffect();
        showModal("正确！", "太棒了！你答对了！");
    } else {
        showModal("再试一次", "不正确，请再试一次");
    }

    if (isCorrect) {
        resetTrainingState();
    }
}

// 播放欢呼效果
function playCheerEffect() {
    try {
        sampler.triggerAttackRelease([baseNote, currentTestNote], 1);

        const step = document.querySelector(`.step[data-note="${currentTestNote}"]`);
        if (step) {
            const label = step.querySelector('.step-label');
            if (label) {
                label.classList.add('cheer-effect');
                createSparkles(step);
                setTimeout(() => {
                    label.classList.remove('cheer-effect');
                }, 1000);
            }
        }
    } catch (error) {
        console.error("播放欢呼效果错误:", error);
    }
}

// 创建火花效果
function createSparkles(element) {
    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    for (let i = 0; i < 12; i++) {
        const sparkle = document.createElement('div');
        sparkle.className = 'sparkle';

        const angle = Math.random() * Math.PI * 2;
        const distance = 30 + Math.random() * 50;
        const x = centerX + Math.cos(angle) * distance;
        const y = centerY + Math.sin(angle) * distance;

        sparkle.style.left = `${x}px`;
        sparkle.style.top = `${y}px`;

        const size = 3 + Math.random() * 7;
        sparkle.style.width = `${size}px`;
        sparkle.style.height = `${size}px`;

        const colors = ['#ffd700', '#ff4500', '#00ffff', '#ff00ff', '#00ff00'];
        sparkle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];

        sparkle.style.animationDelay = `${Math.random() * 0.5}s`;

        document.body.appendChild(sparkle);

        setTimeout(() => {
            sparkle.remove();
        }, 1500);
    }
}

// 重置训练状态
function resetTrainingState() {
    isTrainingActive = false;
    userCanAnswer = false;
    currentTestNote = null;

    playScaleBtn.disabled = false;
    randomTrainingBtn.disabled = false;
    replayTestNoteBtn.style.display = 'none';

    document.querySelectorAll('.step').forEach(step => {
        step.classList.remove('active');
    });
}

// 滚动到指定音符的位置
function scrollToNote(note) {
    const pianoContainer = document.querySelector('.piano-container');
    const key = document.getElementById(`key-${note}`);
    if (key) {
        const containerWidth = pianoContainer.clientWidth;
        const keyPosition = key.offsetLeft - (containerWidth / 2) + (key.clientWidth / 2);
        pianoContainer.scrollTo({
            left: keyPosition,
            behavior: 'smooth'
        });
    }
}

function setupScrollArrows() {
    const pianoContainer = document.querySelector('.piano-container');
    const leftArrow = document.querySelector('.left-arrow');
    const rightArrow = document.querySelector('.right-arrow');

    const scrollStep = 200;

    leftArrow.addEventListener('click', () => {
        pianoContainer.scrollBy({
            left: -scrollStep,
            behavior: 'smooth'
        });
    });

    rightArrow.addEventListener('click', () => {
        pianoContainer.scrollBy({
            left: scrollStep,
            behavior: 'smooth'
        });
    });

    let startX = 0;
    let scrollLeft = 0;

    pianoContainer.addEventListener('touchstart', (e) => {
        startX = e.touches[0].pageX;
        scrollLeft = pianoContainer.scrollLeft;
    });

    pianoContainer.addEventListener('touchmove', (e) => {
        e.preventDefault();
        const x = e.touches[0].pageX;
        const walk = (x - startX) * 2;
        pianoContainer.scrollLeft = scrollLeft - walk;
    });
}

// 根据音阶类型和方向获取该音阶包含的音程（半音数）集合
function getScaleIntervals(scaleType, direction) {
    const intervals = new Set();

    if (scaleType === 'major') {
        if (direction === 'ascending') {
            [0, 2, 4, 5, 7, 9, 11, 12].forEach(i => intervals.add(i));
        } else {
            [0, 1, 3, 5, 7, 8, 10, 12].forEach(i => intervals.add(i));
        }
    } else if (scaleType === 'minor') {
        if (direction === 'ascending') {
            [0, 2, 3, 5, 7, 8, 10, 12].forEach(i => intervals.add(i));
        } else {
            [0, 2, 4, 5, 7, 9, 10, 12].forEach(i => intervals.add(i));
        }
    } else if (scaleType === 'chromatic') {
        // 半音阶包含0到12的所有半音
        for (let i = 0; i <= 12; i++) {
            intervals.add(i);
        }
    }

    return intervals;
}

// 设置音程范围按钮功能
function setupIntervalButtons() {
    const selectAllBtn = document.getElementById('selectAllIntervals');
    const deselectAllBtn = document.getElementById('deselectAllIntervals');

    selectAllBtn.addEventListener('click', function () {
        // 选中所有复选框
        document.querySelectorAll('.interval-item input[type="checkbox"]').forEach(checkbox => {
            checkbox.checked = true;
            // 更新selectedIntervals集合
            selectedIntervals.add(checkbox.value);
        });
        validateIntervalSettings();
    });

    deselectAllBtn.addEventListener('click', function () {
        // 取消选中所有复选框
        document.querySelectorAll('.interval-item input[type="checkbox"]').forEach(checkbox => {
            checkbox.checked = false;
            // 更新selectedIntervals集合
            selectedIntervals.delete(checkbox.value);
        });

        // 自动选择纯一度（P1）
        const p1Checkbox = document.querySelector('input[value="P1"]');
        if (p1Checkbox) {
            p1Checkbox.checked = true;
            selectedIntervals.add("P1");
        }

        // 显示提示
        showModal("提示", "已自动选择纯一度，因为至少需要一个音程范围");

        validateIntervalSettings();
    });
}


// 事件监听
playScaleBtn.addEventListener('click', playScale);
randomTrainingBtn.addEventListener('click', startTraining);
scaleDirection.addEventListener('change', createScaleDisplay);
baseNoteSelect.addEventListener('change', function () {
    baseNote = this.value;
    createScaleDisplay();
    scrollToNote(baseNote);
});

scaleTypeSelect.addEventListener('change', function () {
    scaleType = this.value;
    createScaleDisplay();
});

notationTypeSelect.addEventListener('change', function () {
    notationType = this.value;
    createScaleDisplay();
});

scaleDisplay.addEventListener('click', function (e) {
    if (e.target.classList.contains('step-label')) {
        const clickedNote = e.target.dataset.note;
        handleUserAnswer(clickedNote);
    }
});

// 修改全局点击事件监听器
document.addEventListener('DOMContentLoaded', function () {
    document.addEventListener('click', function (event) {
        const settingsPanel = document.getElementById('settingsPanel');
        const toggleBtn = document.getElementById('toggleSettingsBtn');
        const resultModal = document.getElementById('resultModal');

        if (!settingsPanel || !toggleBtn) return;

        // 检查点击是否发生在设置面板、切换按钮或模态框上
        const isClickInsideSettings = settingsPanel.contains(event.target) ||
            toggleBtn === event.target ||
            toggleBtn.contains(event.target);

        const isClickInsideModal = resultModal.contains(event.target);

        // 如果点击的是切换按钮本身，不执行收起逻辑（由专门的按钮点击事件处理）
        if (toggleBtn === event.target || toggleBtn.contains(event.target)) {
            return;
        }

        // 如果点击发生在外部且面板是展开的，并且点击的不是模态框内容，则尝试收起面板
        if (!isClickInsideSettings && !isClickInsideModal && settingsPanel.classList.contains('expanded')) {
            // 首先验证音程设置
            if (!validateIntervalSettings()) {
                // 如果设置无效，阻止收起面板并显示错误提示
                showModal("设置错误", "请至少选择一个有效的音程范围");
                return; // 阻止收起面板
            }

            // 设置有效，收起面板
            settingsPanel.classList.remove('expanded');
            toggleBtn.textContent = '设置面板';

            // 在面板收起后立即刷新页面并更新设置
            setTimeout(() => {
                // 重置训练状态
                resetTrainingState();
                // 重新生成音阶显示
                createScaleDisplay();
                // 滚动到当前基准音位置
                scrollToNote(baseNote);
            }, 0);
        }
    });
});
