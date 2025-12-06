// 音源文件映射
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
let globalSampler = null;
let isAudioContextStarted = false;

// 启动音频上下文的函数
async function startAudioContext() {
    if (isAudioContextStarted) return;
    
    try {
        await Tone.start();
        console.log("AudioContext started successfully");
        isAudioContextStarted = true;
    } catch (error) {
        console.error("Failed to start AudioContext:", error);
    }
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

// 隐藏加载界面
function hideLoadingPage() {
    const loadingPage = document.getElementById('loadingPage');
    if (loadingPage) {
        loadingPage.style.opacity = '0';
        loadingPage.style.transition = 'opacity 0.5s ease';
        
        setTimeout(() => {
            loadingPage.style.display = 'none';
            document.getElementById('fullscreenPiano').style.display = 'block';
        }, 500);
    }
}

// 初始化音源加载
function initAudioLoad() {
    return new Promise((resolve, reject) => {
        const cachedAudioData = sessionStorage.getItem('pianoAudioData');
        const cachedLoadTime = sessionStorage.getItem('pianoAudioLoadTime');
        
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
                        globalSampler = sampler;
                        
                        setTimeout(() => {
                            hideLoadingPage();
                            resolve(sampler);
                        }, 500);
                    },
                    onerror: (error) => {
                        console.error("缓存音源加载失败，重新加载:", error);
                        updateLoadProgress(0, "缓存加载失败，重新加载...");
                        loadAudioFromScratch(resolve, reject);
                    }
                }).toDestination();
                
                return;
            } catch (error) {
                console.error("缓存解析失败，重新加载音源:", error);
                updateLoadProgress(0, "缓存解析失败，重新加载...");
                loadAudioFromScratch(resolve, reject);
            }
        } else {
            updateLoadProgress(0, "没有缓存，开始从本地加载音源...");
            loadAudioFromScratch(resolve, reject);
        }
    });
}

// 正常加载音源的函数
function loadAudioFromScratch(resolve, reject) {
    console.log("开始加载音源...");
    
    simulateLoadProgress();
    
    const sampler = new Tone.Sampler({
        urls: soundFiles,
        baseUrl: "./sounds/",
        onload: () => {
            console.log("本地钢琴音源加载完成");
            updateLoadProgress(100, "音源加载完成！");
            isAudioLoaded = true;
            globalSampler = sampler;
            
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
            
            setTimeout(() => {
                hideLoadingPage();
                resolve(sampler);
            }, 500);
        },
        onerror: (error) => {
            console.error("音源加载错误:", error);
            updateLoadProgress(0, `加载错误: ${error.message}`);
        }
    }).toDestination();
}

// pure-piano.js 简化版
const octaveStart = 0;
const octaveEnd = 8;
const blackKeys = ["C#", "D#", "F#", "G#", "A#"];

let noteDuration = 0.8;

// 创建钢琴键盘
function createPiano(pianoElement) {
    if (!pianoElement) return;

    pianoElement.innerHTML = '';

    for (let octave = octaveStart; octave <= octaveEnd; octave++) {
        let startIndex = 0;
        let endIndex = 11;

        if (octave === 0) {
            startIndex = 9;
            endIndex = 11;
        } else if (octave === 8) {
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

            // 点击琴键事件
            key.addEventListener('click', async () => {
                try {
                    await startAudioContext();
                    key.classList.add('playing');
                    setTimeout(() => key.classList.remove('playing'), 300);
                    playNote(fullNote, noteDuration, 0, null, 127);
                } catch (error) {
                    console.error("播放错误:", error);
                }
            });

            // 触摸事件支持
            key.addEventListener('touchstart', async (e) => {
                e.preventDefault();
                try {
                    await startAudioContext();
                    key.classList.add('playing');
                    setTimeout(() => key.classList.remove('playing'), 300);
                    playNote(fullNote, noteDuration, 0, null, 127);
                } catch (error) {
                    console.error("播放错误:", error);
                }
            });

            pianoElement.appendChild(key);
        }
    }
}

// 播放钢琴音符
async function playNote(noteName, duration = 0.8, sustain = 0, startTime = null, velocity = 127) {
    try {
        await startAudioContext();

        const totalDuration = duration + sustain;
        const normalizedVelocity = Math.max(0, Math.min(1, velocity / 127));
        const now = startTime !== null ? startTime : Tone.now();
        
        globalSampler.triggerAttack(noteName, now, normalizedVelocity);
        globalSampler.triggerRelease(noteName, now + duration);
        
        if (sustain > 0) {
            globalSampler.triggerRelease(noteName, now + totalDuration);
        }

        const key = document.querySelector(`.fullscreen-piano-keyboard .key[data-note="${noteName}"]`);
        if (key) {
            key.classList.add('playing');
            setTimeout(() => {
                key.classList.remove('playing');
            }, duration * 1000);
        }

    } catch (error) {
        console.error("播放音符错误:", error);
    }
}

// 钢琴播放器
class PianoPlayer {
    constructor(sampler) {
        this.isPlaying = false;
        this.currentPlaybackIndex = 0;
        this.playbackStartTime = 0;
        this.playbackInterval = null;
        this.currentPlaybackSequence = [];
        this.activeSustains = new Map();
        this.isFullscreen = true;
        this.rainContainer = null;
        this.activeRainElements = [];
        this.noteBaseDuration = 1;
        this.noteBaseVelocity = 127;
        this.rainDefaultSpeed = 3;
        this.sampler = sampler;

        // 钢琴雨颜色映射
        this.baseNoteColors = {
            'C4': 'hsl(0, 80%, 60%)',
            'C#4': 'hsl(30, 80%, 60%)',
            'D4': 'hsl(60, 80%, 60%)',
            'D#4': 'hsl(90, 80%, 60%)',
            'E4': 'hsl(120, 80%, 60%)',
            'F4': 'hsl(150, 80%, 60%)',
            'F#4': 'hsl(180, 80%, 60%)',
            'G4': 'hsl(210, 80%, 60%)',
            'G#4': 'hsl(240, 80%, 60%)',
            'A4': 'hsl(270, 80%, 60%)',
            'A#4': 'hsl(300, 80%, 60%)',
            'B4': 'hsl(330, 80%, 60%)'
        };

        this.initUI();
        this.setupEventListeners();
    }

    initUI() {
        this.fullscreenPiano = document.getElementById('fullscreenPiano');
        this.fullscreenPianoKeyboard = document.getElementById('fullscreenPianoKeyboard');
        this.initPiano();
        this.createRainContainer();
    }

    setupEventListeners() {
        window.addEventListener('resize', () => {
            if (this.isFullscreen) {
                setTimeout(() => this.adjustPianoSize(), 100);
            }
        });
    }

    createRainContainer() {
        this.rainContainer = document.createElement('div');
        this.rainContainer.className = 'piano-rain-container';
        this.fullscreenPiano.appendChild(this.rainContainer);
    }

    initPiano() {
        createPiano(this.fullscreenPianoKeyboard);
    }

    showFullscreenPiano() {
        this.isFullscreen = true;
        document.body.classList.add('fullscreen-mode');
        this.fullscreenPiano.classList.add('active');
        setTimeout(() => {
            this.adjustPianoSize();
        }, 100);
    }

    adjustPianoSize() {
        if (!this.isFullscreen) return;

        const keyboard = this.fullscreenPianoKeyboard;
        const container = keyboard.parentElement;
        const containerWidth = container.clientWidth;

        const whiteKeys = keyboard.querySelectorAll('.white.key');
        if (whiteKeys.length === 0) return;

        const totalWhiteKeys = whiteKeys.length;
        const newWhiteKeyWidth = Math.max(20, Math.floor(containerWidth / totalWhiteKeys));

        whiteKeys.forEach(key => {
            key.style.width = `${newWhiteKeyWidth}px`;
            key.style.minWidth = `${newWhiteKeyWidth}px`;
        });

        const blackKeys = keyboard.querySelectorAll('.black.key');
        const newBlackKeyWidth = Math.max(12, Math.floor(newWhiteKeyWidth * 0.6));

        blackKeys.forEach(key => {
            key.style.width = `${newBlackKeyWidth}px`;
            key.style.minWidth = `${newBlackKeyWidth}px`;
            key.style.marginLeft = `-${newBlackKeyWidth / 2}px`;
            key.style.marginRight = `-${newBlackKeyWidth / 2}px`;
        });

        const keyLabels = keyboard.querySelectorAll('.key-label');
        const newFontSize = Math.max(8, Math.floor(newWhiteKeyWidth * 0.4));
        keyLabels.forEach(label => {
            label.style.fontSize = `${newFontSize}px`;
        });
    }

    // 播放单个音符
    async playPianoNote(noteName, duration = 0.8, sustain = 0, startTime = null, velocity = 127) {
        try {
            const actualDuration = duration * this.noteBaseDuration;
            const actualSustain = sustain;
            const totalDuration = actualDuration + actualSustain;
            
            await playNote(noteName, actualDuration, actualSustain, startTime, velocity);
            
            this.highlightKey(noteName, actualDuration);
            this.createRainEffect(noteName, actualDuration, actualSustain, velocity);
        } catch (error) {
            console.error("播放音符错误:", error);
        }
    }

    highlightKey(noteName, duration) {
        if (!this.fullscreenPianoKeyboard) return;

        const key = this.fullscreenPianoKeyboard.querySelector(`.key[data-note="${noteName}"]`);
        if (key) {
            key.classList.add('playing');
            setTimeout(() => {
                key.classList.remove('playing');
            }, duration * 1000);
        }
    }

    // 同时播放多个音符
    async playNotesSimultaneously(notes, startTime = null) {
        if (!notes || notes.length === 0) return;

        try {
            await startAudioContext();
            const actualStartTime = startTime !== null ? startTime : Tone.now();

            const playPromises = notes.map(note => {
                let duration = note.duration || 0.8;
                const velocity = note.velocity !== undefined ? note.velocity : 127;
                const sustain = note.sustain !== undefined ? note.sustain : 0;

                this.createRainEffect(note.note || note, duration, sustain, velocity);
                return this.playPianoNote(note.note || note, duration, sustain, actualStartTime, velocity);
            });

            await Promise.all(playPromises);

        } catch (error) {
            console.error("播放和弦错误:", error);
        }
    }

    getNoteColor(noteName) {
        const match = noteName.match(/([A-Ga-g]#?b?)(\d+)/);
        if (!match) return 'hsl(0, 80%, 60%)';

        const pitch = match[1];
        const octave = parseInt(match[2]);

        const baseNote = pitch + '4';
        const baseColor = this.baseNoteColors[baseNote] || 'hsl(0, 80%, 60%)';

        const hslMatch = baseColor.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
        if (!hslMatch) return baseColor;

        const hue = parseInt(hslMatch[1]);
        const saturation = parseInt(hslMatch[2]);
        let lightness = parseInt(hslMatch[3]);

        const octaveDiff = octave - 4;
        lightness = Math.max(10, Math.min(90, lightness + (octaveDiff * 10)));

        return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    }

    getNoteBrightness(velocity) {
        const normalizedVelocity = Math.max(0, Math.min(1, velocity / 127));
        return 30 + (normalizedVelocity * 70);
    }

    createRainEffect(noteName, duration, sustain = 0, velocity = 127) {
        if (!this.rainContainer || !this.fullscreenPianoKeyboard) return;

        const key = this.fullscreenPianoKeyboard.querySelector(`.key[data-note="${noteName}"]`);
        if (!key) return;

        const keyRect = key.getBoundingClientRect();
        const containerRect = this.fullscreenPiano.getBoundingClientRect();

        const rainElement = document.createElement('div');
        rainElement.className = 'piano-rain';

        const color = this.getNoteColor(noteName);
        const brightness = this.getNoteBrightness(velocity);

        const minHeight = 20;
        const maxHeight = 500;
        const totalDuration = duration + sustain;
        const baseHeight = duration * 100 * this.noteBaseDuration;
        const sustainHeight = sustain * 100 * this.noteBaseDuration;
        const totalHeight = baseHeight + sustainHeight;
        const maxHeightValue = Math.min(maxHeight, Math.max(minHeight, totalHeight));

        const moveSpeed = this.rainDefaultSpeed * 100;
        const startTop = keyRect.top - containerRect.top;
        const opacity = 0.5 + (velocity / 127) * 0.5;

        rainElement.style.cssText = `
            position: absolute;
            left: ${keyRect.left - containerRect.left}px;
            top: ${startTop}px;
            width: ${keyRect.width}px;
            height: 0;
            background: linear-gradient(to top, ${color}, ${color}00);
            border-radius: 2px;
            z-index: 5;
            overflow: hidden;
            transform-origin: bottom center;
            opacity: ${opacity};
        `;

        this.rainContainer.appendChild(rainElement);

        const rainData = {
            element: rainElement,
            note: noteName,
            duration: duration,
            sustain: sustain,
            velocity: velocity,
            startTime: Date.now(),
            maxHeight: maxHeightValue,
            baseHeight: Math.min(maxHeight, Math.max(minHeight, baseHeight)),
            moveSpeed: moveSpeed,
            startTop: startTop,
            containerHeight: containerRect.height,
            keyRect: keyRect,
            containerRect: containerRect,
            isGrowing: true,
            isSustainPhase: false,
            currentHeight: 0
        };

        this.activeRainElements.push(rainData);
        this.startRainMovement(rainData);
    }

    startRainMovement(rainData) {
        const startTime = Date.now();
        const growDuration = rainData.duration * 1000;
        const sustainDuration = rainData.sustain * 1000;
        const totalMoveDistance = rainData.containerHeight + rainData.maxHeight;
        const totalMoveTime = (totalMoveDistance / rainData.moveSpeed) * 1000;

        const animate = () => {
            if (!rainData.element.parentNode) return;

            const elapsed = Date.now() - startTime;

            if (elapsed <= growDuration && rainData.isGrowing && !rainData.isSustainPhase) {
                const growProgress = elapsed / growDuration;
                const currentHeight = growProgress * rainData.baseHeight;

                rainData.element.style.height = `${currentHeight}px`;
                rainData.element.style.top = `${rainData.startTop - currentHeight}px`;
                rainData.currentHeight = currentHeight;

            } else if (elapsed <= (growDuration + sustainDuration) && !rainData.isSustainPhase) {
                rainData.isSustainPhase = true;
                rainData.sustainStartTime = Date.now();
                rainData.sustainStartHeight = rainData.currentHeight;
                
            } else if (rainData.isSustainPhase && elapsed <= (growDuration + sustainDuration)) {
                const sustainProgress = (elapsed - growDuration) / sustainDuration;
                const additionalHeight = sustainProgress * (rainData.maxHeight - rainData.baseHeight) * 0.3;
                const currentHeight = rainData.baseHeight + additionalHeight;
                
                rainData.element.style.height = `${currentHeight}px`;
                rainData.element.style.top = `${rainData.startTop - currentHeight}px`;
                rainData.currentHeight = currentHeight;
                
            } else if (rainData.isGrowing) {
                rainData.isGrowing = false;
                rainData.growEndTime = Date.now();
                rainData.finalHeight = rainData.currentHeight;
                rainData.growEndTop = parseFloat(rainData.element.style.top) || rainData.startTop;
            }

            if (!rainData.isGrowing) {
                const moveElapsed = Date.now() - rainData.growEndTime;
                const moveDistance = (moveElapsed / 1000) * rainData.moveSpeed;
                rainData.element.style.top = `${rainData.growEndTop - moveDistance}px`;
                rainData.element.style.height = `${rainData.finalHeight}px`;
            }

            const currentTop = parseFloat(rainData.element.style.top) || rainData.startTop;
            if (currentTop > -rainData.maxHeight && elapsed < (growDuration + sustainDuration + totalMoveTime)) {
                requestAnimationFrame(animate);
            } else {
                if (rainData.element.parentNode) {
                    rainData.element.parentNode.removeChild(rainData.element);
                }
                const index = this.activeRainElements.indexOf(rainData);
                if (index > -1) {
                    this.activeRainElements.splice(index, 1);
                }
            }
        };

        requestAnimationFrame(animate);
    }

    clearRainEffects() {
        if (this.rainContainer) {
            this.rainContainer.innerHTML = '';
        }
        this.activeRainElements = [];
    }

    clearKeyboardHighlights() {
        if (!this.fullscreenPianoKeyboard) return;
        const keys = this.fullscreenPianoKeyboard.querySelectorAll('.key.playing');
        keys.forEach(key => {
            key.classList.remove('playing');
        });
    }

    stopAllNotes() {
        if (globalSampler) {
            Object.keys(soundFiles).forEach(note => {
                try {
                    globalSampler.triggerRelease(note);
                } catch (error) {
                    // 忽略释放不存在的音符的错误
                }
            });
        }
        this.clearKeyboardHighlights();
    }

    // 从play.js复制的函数开始
    
    // 获取默认音符时值
    getNoteDuration() {
        return this.noteBaseDuration || 0.5;
    }

    // 获取默认音符力度
    getDefaultVelocity() {
        return this.noteBaseVelocity || 127;
    }

    // 解析带引用的数值
    parseValueWithReference(valueStr, referenceType, baseValue) {
        if (!valueStr) return parseFloat(baseValue.toFixed(3));

        if (valueStr === referenceType) {
            return parseFloat(baseValue.toFixed(3));
        }

        if (valueStr.endsWith(referenceType)) {
            const multiplierStr = valueStr.slice(0, -1);
            const multiplier = parseFloat(multiplierStr);

            if (!isNaN(multiplier)) {
                return parseFloat((baseValue * multiplier).toFixed(3));
            }
        }

        const numericValue = parseFloat(valueStr);
        return isNaN(numericValue) ? parseFloat(baseValue.toFixed(3)) : parseFloat(numericValue.toFixed(3));
    }

    // 解析单个绝对音高项
    parseSingleAbsoluteNote(item) {
        const parts = item.split('_');
        const result = {
            note: parts[0] || '',
            duration: this.getNoteDuration(),
            velocity: this.getDefaultVelocity(),
            sustain: 0
        };

        // 解析时长部分
        if (parts.length >= 2 && parts[1] !== '') {
            result.duration = this.parseValueWithReference(parts[1], 't', this.getNoteDuration());
        }

        // 解析力度部分
        if (parts.length >= 3 && parts[2] !== '') {
            result.velocity = this.parseValueWithReference(parts[2], 'f', this.getDefaultVelocity());
        }

        // 解析延音部分
        if (parts.length >= 4 && parts[3] !== '') {
            result.sustain = this.parseValueWithReference(parts[3], 't', result.duration);
        }

        return result;
    }

    // 解析绝对音高和弦
    parseAbsoluteChord(chordStr) {
        const inner = chordStr.replace(/[()（）]/g, '');
        const notes = inner.split(/[，,]/).map(note => note.trim()).filter(note => note !== '');

        return notes.map(note => {
            const parts = note.split('_');
            const result = {
                note: parts[0] || '',
                duration: this.getNoteDuration(),
                velocity: this.getDefaultVelocity(),
                sustain: 0
            };

            if (parts.length >= 2 && parts[1] !== '') {
                result.duration = this.parseValueWithReference(parts[1], 't', this.getNoteDuration());
            }

            if (parts.length >= 3 && parts[2] !== '') {
                result.velocity = this.parseValueWithReference(parts[2], 'f', this.getDefaultVelocity());
            }

            if (parts.length >= 4 && parts[3] !== '') {
                result.sustain = this.parseValueWithReference(parts[3], 't', result.duration);
            }

            return result;
        });
    }

    // 智能解析绝对音高序列
    parseAbsolutePitchSequence(input) {
        const cleanInput = input.replace(/\s/g, '');

        if (!cleanInput) {
            return [];
        }

        const parsedSequence = [];
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
                    items.push('');
                }
            } else {
                current += char;
            }
        }

        if (current) {
            items.push(current);
        } else if (cleanInput.endsWith(',') || cleanInput.endsWith('，')) {
            items.push('');
        }

        for (const item of items) {
            if (item === '') {
                parsedSequence.push({
                    note: null,
                    duration: this.getNoteDuration(),
                    velocity: this.getDefaultVelocity(),
                    isRest: true
                });
            } else if (item.startsWith('_')) {
                const parts = item.split('_');
                let duration = this.getNoteDuration();

                if (parts.length >= 2 && parts[1] !== '') {
                    duration = this.parseValueWithReference(parts[1], 't', this.getNoteDuration());
                }

                parsedSequence.push({
                    note: null,
                    duration: duration,
                    velocity: this.getDefaultVelocity(),
                    isRest: true
                });
            } else if ((item.startsWith('(') || item.startsWith('（')) &&
                       (item.endsWith(')') || item.endsWith('）'))) {
                const chordNotes = this.parseAbsoluteChord(item);
                parsedSequence.push({
                    chord: chordNotes,
                    isChord: true
                });
            } else {
                parsedSequence.push(this.parseSingleAbsoluteNote(item));
            }
        }

        return parsedSequence;
    }

    // 计算总时长
    calculateTotalDurationForAbsolute(sequence) {
        if (!sequence || sequence.length === 0) return 0;

        let totalBasicDuration = 0;
        let maxEndTime = 0;

        sequence.forEach((item) => {
            if (item.isRest) {
                totalBasicDuration += item.duration;
                maxEndTime = totalBasicDuration;
            } else if (item.isChord) {
                const chordStartTime = totalBasicDuration;
                let maxChordDuration = 0;
                let maxChordEndTime = chordStartTime;

                item.chord.forEach(note => {
                    const noteDuration = note.duration || this.getNoteDuration();
                    const sustainDuration = note.sustain || 0;
                    const noteEndTime = chordStartTime + noteDuration + sustainDuration;
                    maxChordEndTime = Math.max(maxChordEndTime, noteEndTime);
                    maxChordDuration = Math.max(maxChordDuration, noteDuration);
                });

                maxEndTime = Math.max(maxEndTime, maxChordEndTime);
                totalBasicDuration += maxChordDuration;
            } else {
                const noteDuration = item.duration || this.getNoteDuration();
                const sustainDuration = item.sustain || 0;
                const noteStartTime = totalBasicDuration;
                const noteEndTime = noteStartTime + noteDuration + sustainDuration;

                maxEndTime = Math.max(maxEndTime, noteEndTime);
                totalBasicDuration += noteDuration;
            }
        });

        return maxEndTime;
    }

    // 从指定索引开始播放
    async playFromIndex(startIndex) {
        if (!this.isPlaying) return;

        const sequence = this.currentPlaybackSequence;
        const activeSustains = new Map();

        for (let i = startIndex; i < sequence.length; i++) {
            if (!this.isPlaying) break;

            const item = sequence[i];
            this.currentPlaybackIndex = i;

            if (item.isRest) {
                await new Promise(resolve => {
                    const timeout = setTimeout(resolve, item.duration * 1000);
                    const checkStop = setInterval(() => {
                        if (!this.isPlaying) {
                            clearTimeout(timeout);
                            clearInterval(checkStop);
                            resolve();
                        }
                    }, 100);
                });
                continue;
            }

            if (item.isChord) {
                const chordNotes = [];
                let maxNoteDuration = 0;

                for (const chordItem of item.chord) {
                    if (!chordItem.note) continue;

                    const noteDuration = chordItem.duration || this.getNoteDuration();
                    const sustainDuration = chordItem.sustain || 0;
                    const velocity = chordItem.velocity || this.getDefaultVelocity();

                    chordNotes.push({
                        note: chordItem.note,
                        duration: noteDuration,
                        velocity: velocity,
                        sustain: sustainDuration
                    });
                    maxNoteDuration = Math.max(maxNoteDuration, noteDuration);
                }

                if (chordNotes.length > 0) {
                    // 高亮琴键
                    chordNotes.forEach(chordNote => {
                        const key = document.querySelector(`.fullscreen-piano-keyboard .key[data-note="${chordNote.note}"]`);
                        if (key) key.classList.add('playing');
                    });

                    // 播放和弦
                    chordNotes.forEach(chordNote => {
                        const normalizedVelocity = Math.max(0, Math.min(127, chordNote.velocity)) / 127;
                        const sustainDuration = chordNote.sustain || 0;

                        if (sustainDuration > 0) {
                            this.sampler.triggerAttack(chordNote.note, undefined, normalizedVelocity);
                            const releaseTime = Date.now() + (chordNote.duration + sustainDuration) * 1000;
                            activeSustains.set(chordNote.note, releaseTime);
                        } else {
                            this.sampler.triggerAttackRelease(chordNote.note, chordNote.duration, undefined, normalizedVelocity);
                        }
                        // 创建钢琴雨效果
                        this.createRainEffect(chordNote.note, chordNote.duration, chordNote.sustain, chordNote.velocity);
                    });

                    await new Promise(resolve => {
                        const timeout = setTimeout(() => {
                            chordNotes.forEach(chordNote => {
                                const key = document.querySelector(`.fullscreen-piano-keyboard .key[data-note="${chordNote.note}"]`);
                                if (key) key.classList.remove('playing');
                            });
                            resolve();
                        }, maxNoteDuration * 1000);

                        const checkStop = setInterval(() => {
                            if (!this.isPlaying) {
                                clearTimeout(timeout);
                                clearInterval(checkStop);
                                resolve();
                            }
                        }, 100);
                    });
                }
            } else {
                if (!item.note) continue;

                const noteDuration = item.duration || this.getNoteDuration();
                const sustainDuration = item.sustain || 0;
                const velocity = item.velocity || this.getDefaultVelocity();

                // 高亮琴键
                const key = document.querySelector(`.fullscreen-piano-keyboard .key[data-note="${item.note}"]`);
                if (key) key.classList.add('playing');

                const normalizedVelocity = Math.max(0, Math.min(127, velocity)) / 127;

                if (sustainDuration > 0) {
                    this.sampler.triggerAttack(item.note, undefined, normalizedVelocity);
                    const releaseTime = Date.now() + (noteDuration + sustainDuration) * 1000;
                    activeSustains.set(item.note, releaseTime);
                } else {
                    this.sampler.triggerAttackRelease(item.note, noteDuration, undefined, normalizedVelocity);
                }
                
                // 创建钢琴雨效果
                this.createRainEffect(item.note, noteDuration, sustainDuration, velocity);

                await new Promise(resolve => {
                    const timeout = setTimeout(() => {
                        if (key) key.classList.remove('playing');
                        resolve();
                    }, noteDuration * 1000);

                    const checkStop = setInterval(() => {
                        if (!this.isPlaying) {
                            clearTimeout(timeout);
                            clearInterval(checkStop);
                            resolve();
                        }
                    }, 100);
                });
            }
        }

        // 处理延音
        if (this.isPlaying && activeSustains.size > 0) {
            const now = Date.now();
            const releaseTimes = Array.from(activeSustains.values());
            const maxReleaseTime = Math.max(...releaseTimes);
            const remainingTime = Math.max(0, maxReleaseTime - now);

            if (remainingTime > 0) {
                await new Promise(resolve => {
                    const timeout = setTimeout(() => {
                        activeSustains.forEach((releaseTime, note) => {
                            if (Date.now() >= releaseTime) {
                                this.sampler.triggerRelease(note);
                                activeSustains.delete(note);
                            }
                        });
                        resolve();
                    }, remainingTime);

                    const checkStop = setInterval(() => {
                        if (!this.isPlaying) {
                            clearTimeout(timeout);
                            clearInterval(checkStop);
                            activeSustains.forEach((releaseTime, note) => {
                                this.sampler.triggerRelease(note);
                            });
                            activeSustains.clear();
                            resolve();
                        }
                    }, 100);
                });
            }

            activeSustains.forEach((releaseTime, note) => {
                this.sampler.triggerRelease(note);
            });
            activeSustains.clear();
        }
    }

    // 启动匀速进度更新
    startUniformProgressUpdate() {
        if (this.playbackInterval) {
            clearInterval(this.playbackInterval);
        }

        this.playbackInterval = setInterval(() => {
            if (!this.isPlaying) {
                clearInterval(this.playbackInterval);
                return;
            }

            const currentTime = (Date.now() - this.playbackStartTime) / 1000;
            const totalTime = this.totalPlaybackDuration || 1;

            if (currentTime >= totalTime) {
                clearInterval(this.playbackInterval);
                if (this.isPlaying) {
                    this.stop();
                }
            }
        }, 100);
    }

    // 主函数：播放绝对音高序列
    async playAbsolutePitchSequence(sequenceInput, title = "自定义序列") {
        if (!isAudioLoaded) {
            console.warn("音源尚未加载完成，请稍候");
            return;
        }

        if (this.isPlaying) {
            this.stop();
            return;
        }

        if (!sequenceInput || sequenceInput.trim() === "") {
            console.warn("请输入绝对音高序列");
            return;
        }

        const parsedSequence = this.parseAbsolutePitchSequence(sequenceInput.trim());

        if (parsedSequence.length === 0) {
            console.warn("没有有效的序列项");
            return;
        }

        this.isPlaying = true;
        this.currentPlaybackSequence = parsedSequence;
        this.currentPlaybackIndex = 0;
        this.totalPlaybackDuration = this.calculateTotalDurationForAbsolute(parsedSequence);
        this.playbackStartTime = Date.now();

        this.clearRainEffects();
        this.clearKeyboardHighlights();

        console.log(`开始播放: ${title} (${parsedSequence.length}个音符)`);

        try {
            await startAudioContext();
            this.startUniformProgressUpdate();
            await this.playFromIndex(0);

            if (this.isPlaying) {
                console.log("绝对音高序列播放完成！");
            }

        } catch (error) {
            console.error("播放错误:", error);
        } finally {
            this.stop();
        }
    }

    // 停止播放
    stop() {
        this.isPlaying = false;
        this.currentPlaybackIndex = 0;
        this.totalPlaybackDuration = 0;
        this.playbackStartTime = 0;

        if (this.playbackInterval) {
            clearInterval(this.playbackInterval);
            this.playbackInterval = null;
        }

        if (this.sampler) {
            this.sampler.releaseAll();
        }

        this.clearKeyboardHighlights();
        this.clearRainEffects();

        console.log("播放已停止");
    }

    // 播放序列（兼容旧接口）
    async playSequence(sequence, title = "自定义序列") {
        try {
            await startAudioContext();
            this.playAbsolutePitchSequence(sequence, title);
        } catch (error) {
            console.error("启动音频上下文失败:", error);
        }
    }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', function () {
    // 先加载音源
    initAudioLoad().then((sampler) => {
        // 音源加载完成后初始化钢琴播放器
        window.pianoPlayer = new PianoPlayer(sampler);
        
        // 自动显示全屏钢琴界面
        window.pianoPlayer.showFullscreenPiano();
        
        // 检查是否有从ear.html传递的转换序列
        function checkAndPlayConvertedSequence() {
            const convertedSequence = sessionStorage.getItem('convertedAbsoluteSequence');
            const defaultNoteDuration = sessionStorage.getItem('defaultNoteDuration');
            const defaultNoteVelocity = sessionStorage.getItem('defaultNoteVelocity');
            const infoElement = document.getElementById('conversionInfo');

            if (convertedSequence) {
                if (infoElement) {
                    infoElement.innerHTML = `检测到转换序列<br>正在准备播放...`;
                }

                // 设置默认参数
                if (defaultNoteDuration) {
                    window.pianoPlayer.noteBaseDuration = parseFloat(defaultNoteDuration);
                }
                if (defaultNoteVelocity) {
                    const velocity = parseFloat(defaultNoteVelocity);
                    window.pianoPlayer.noteBaseVelocity = velocity <= 1 ? velocity * 127 : velocity;
                }

                // 使用新的playAbsolutePitchSequence方法播放
                setTimeout(() => {
                    window.pianoPlayer.playAbsolutePitchSequence(convertedSequence, "特效点播序列");
                    // 播放完成后清理sessionStorage
                    sessionStorage.removeItem('convertedAbsoluteSequence');
                    sessionStorage.removeItem('defaultNoteDuration');
                    sessionStorage.removeItem('defaultNoteVelocity');
                }, 1000);
            } else {
                if (infoElement) {
                    infoElement.innerHTML = "这是一个独立的全屏钢琴页面，包含钢琴雨效果，可以手动弹奏或通过API调用播放功能。";
                }
            }
        }

        // 页面加载完成后检查并播放序列
        setTimeout(() => {
            checkAndPlayConvertedSequence();
        }, 500);

    }).catch((error) => {
        console.error("音源加载失败:", error);
        // 即使音源加载失败，也显示主界面
        hideLoadingPage();
        document.getElementById('conversionInfo').innerHTML = 
            "音源加载失败，钢琴功能可能无法正常使用。请刷新页面重试。";
    });
});