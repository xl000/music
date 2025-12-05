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
        // 添加淡出效果
        loadingPage.style.opacity = '0';
        loadingPage.style.transition = 'opacity 0.5s ease';
        
        setTimeout(() => {
            loadingPage.style.display = 'none';
            // 直接显示全屏钢琴界面
            document.getElementById('fullscreenPiano').style.display = 'block';
        }, 500);
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
const octaveStart = 0; // 从A0开始
const octaveEnd = 8;   // 到C8结束
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
                    globalSampler.triggerAttackRelease(fullNote, noteDuration);
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
                    globalSampler.triggerAttackRelease(fullNote, noteDuration);
                } catch (error) {
                    console.error("播放错误:", error);
                }
            });

            pianoElement.appendChild(key);
        }
    }
}

// 播放钢琴音符（增强版，支持延音）
async function playNote(noteName, duration = 0.8, sustain = 0, startTime = null, velocity = 1) {
    try {
        await startAudioContext();

        const actualDuration = duration + sustain;
        const now = startTime !== null ? startTime : Tone.now();
        
        globalSampler.triggerAttackRelease(noteName, actualDuration, now, velocity);

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
        this.currentTimeIndex = 0;
        this.playbackSchedule = null;
        this.scheduledEvents = [];
        this.pausedTime = 0;
        this.isPaused = false;
        this.isFullscreen = true;
        this.rainContainer = null;
        this.activeRainElements = [];
        this.noteBaseDuration = 1;
        this.noteBaseVelocity = 1;
        this.rainDefaultSpeed = 3;
        this.sampler = sampler;
        
        // 播放序列存储
        this.currentSequence = [];
        this.sequenceTitle = "";
        this.totalPlaybackTime = 0;
        this.playbackStartTime = 0;
        
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
    async playPianoNote(noteName, duration = 0.8, sustain = 0, startTime = null, velocity = 1) {
        try {
            const actualDuration = duration * this.noteBaseDuration;
            
            await playNote(noteName, actualDuration, sustain, startTime, velocity);
            
            this.highlightKey(noteName, actualDuration);
            this.createRainEffect(noteName, actualDuration, sustain);
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

            const actualStartTime = startTime !== null ? startTime : Tone.now() + 0.1;

            const playPromises = notes.map(note => {
                let duration = Math.min(note.duration || 0.8, 2);
                const velocity = note.velocity || 1;
                const sustain = note.sustain || 0;

                this.createRainEffect(note.note || note, duration, sustain);
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

    createRainEffect(noteName, duration, sustain = 0) {
        if (!this.rainContainer || !this.fullscreenPianoKeyboard) return;

        const key = this.fullscreenPianoKeyboard.querySelector(`.key[data-note="${noteName}"]`);
        if (!key) return;

        const keyRect = key.getBoundingClientRect();
        const containerRect = this.fullscreenPiano.getBoundingClientRect();

        const rainElement = document.createElement('div');
        rainElement.className = 'piano-rain';

        const color = this.getNoteColor(noteName);

        const minHeight = 20;
        const maxHeight = 500;
        const totalDuration = duration + sustain;
        const baseHeight = duration * 100 * this.noteBaseDuration;
        const sustainHeight = sustain * 100 * this.noteBaseDuration;
        const totalHeight = baseHeight + sustainHeight;
        const maxHeightValue = Math.min(maxHeight, Math.max(minHeight, totalHeight));

        const moveSpeed = this.rainDefaultSpeed * 100;

        const startTop = keyRect.top - containerRect.top;

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
        `;

        this.rainContainer.appendChild(rainElement);

        const rainData = {
            element: rainElement,
            note: noteName,
            duration: duration,
            sustain: sustain,
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

    updatePlaybackInfo(currentIndex, totalItems, title) {
        console.log(`播放中: ${title} (${currentIndex + 1}/${totalItems})`);
    }

    // ===================== 重写的序列解析和播放函数 =====================
    
    /**
     * 解析绝对音高序列
     * 格式示例: "C4_1_100_0.5, D4_0.5_80_0, (E4_1_100_0.5,F4_1_100_0.5), _1_0.5"
     */
    parseAbsoluteSequence(sequenceStr) {
        if (!sequenceStr || sequenceStr.trim() === '') {
            console.log("序列字符串为空");
            return [];
        }
        
        const sequence = [];
        let currentTime = 0;
        
        // 清理输入，移除空格
        const cleanSequence = sequenceStr.replace(/\s/g, '');
        
        // 分割序列项，正确处理和弦
        const items = this.splitSequenceItems(cleanSequence);
        
        for (const item of items) {
            if (!item || item === '') continue;
            
            // 处理休止符
            if (item.startsWith('_')) {
                const restData = this.parseRestItem(item.substring(1));
                if (restData) {
                    currentTime += restData.duration;
                }
                continue;
            }
            
            // 处理和絃
            if (item.startsWith('(') && item.endsWith(')')) {
                const chordData = this.parseChordItem(item, currentTime);
                if (chordData) {
                    sequence.push(chordData);
                    currentTime += chordData.duration;
                }
                continue;
            }
            
            // 处理单个音符
            const noteData = this.parseNoteItem(item, currentTime);
            if (noteData) {
                sequence.push(noteData);
                currentTime += noteData.duration;
            }
        }
        
        console.log("解析后的序列:", sequence);
        return sequence;
    }
    
    /**
     * 分割序列项，正确处理和弦
     */
    splitSequenceItems(sequenceStr) {
        const items = [];
        let current = '';
        let depth = 0;
        
        for (let i = 0; i < sequenceStr.length; i++) {
            const char = sequenceStr[i];
            
            if (char === '(') {
                depth++;
                current += char;
            } else if (char === ')') {
                depth--;
                current += char;
            } else if (char === ',' && depth === 0) {
                if (current) {
                    items.push(current);
                    current = '';
                }
            } else {
                current += char;
            }
        }
        
        if (current) {
            items.push(current);
        }
        
        return items;
    }
    
    /**
     * 解析休止符
     */
    parseRestItem(restStr) {
        const parts = restStr.split('_').filter(part => part !== '');
        
        if (parts.length === 0) {
            return { duration: this.noteBaseDuration };
        }
        
        try {
            const duration = parseFloat(parts[0]) || this.noteBaseDuration;
            return { duration };
        } catch (error) {
            console.warn("解析休止符失败:", restStr, error);
            return { duration: this.noteBaseDuration };
        }
    }
    
    /**
     * 解析单个音符
     */
    parseNoteItem(noteStr, startTime) {
        const parts = noteStr.split('_').filter(part => part !== '');
        
        if (parts.length === 0) {
            console.warn("空音符项:", noteStr);
            return null;
        }
        
        const noteName = parts[0];
        let duration = this.noteBaseDuration;
        let velocity = this.noteBaseVelocity;
        let sustain = 0;
        
        // 解析时长
        if (parts.length >= 2) {
            duration = parseFloat(parts[1]) || this.noteBaseDuration;
        }
        
        // 解析力度
        if (parts.length >= 3) {
            velocity = parseFloat(parts[2]) || this.noteBaseVelocity;
            // 标准化力度值 (0-1)
            velocity = Math.max(0, Math.min(1, velocity / 127));
        }
        
        // 解析延音
        if (parts.length >= 4) {
            sustain = parseFloat(parts[3]) || 0;
        }
        
        return {
            time: startTime,
            notes: [{
                note: noteName,
                duration: duration,
                velocity: velocity,
                sustain: sustain
            }],
            duration: duration,
            isChord: false
        };
    }
    
    /**
     * 解析和弦
     */
    parseChordItem(chordStr, startTime) {
        const inner = chordStr.substring(1, chordStr.length - 1);
        const noteStrings = inner.split(',').filter(str => str !== '');
        
        if (noteStrings.length === 0) {
            console.warn("空和弦:", chordStr);
            return null;
        }
        
        const chordNotes = [];
        let maxDuration = 0;
        
        for (const noteStr of noteStrings) {
            const noteData = this.parseNoteItem(noteStr, 0);
            if (noteData && noteData.notes && noteData.notes[0]) {
                const note = noteData.notes[0];
                chordNotes.push(note);
                maxDuration = Math.max(maxDuration, note.duration);
            }
        }
        
        if (chordNotes.length === 0) {
            return null;
        }
        
        return {
            time: startTime,
            notes: chordNotes,
            duration: maxDuration,
            isChord: true
        };
    }
    
    /**
     * 播放绝对音高序列
     */
    async playAbsoluteSequence(sequenceStr, title = "绝对音高序列") {
        try {
            await startAudioContext();
            
            // 解析序列
            const parsedSequence = this.parseAbsoluteSequence(sequenceStr);
            if (!parsedSequence || parsedSequence.length === 0) {
                console.error("序列解析失败或为空");
                return;
            }
            
            this.currentSequence = parsedSequence;
            this.sequenceTitle = title;
            
            // 计算总播放时间
            this.totalPlaybackTime = parsedSequence.reduce((total, item) => {
                return Math.max(total, item.time + item.duration);
            }, 0);
            
            this.startAbsolutePlayback(parsedSequence, title);
        } catch (error) {
            console.error("播放绝对音高序列失败:", error);
        }
    }
    
    /**
     * 开始播放绝对音高序列
     */
    startAbsolutePlayback(sequence, title) {
        if (this.isPlaying && !this.isPaused) return;
        
        if (this.isPaused) {
            this.resumePlayback();
            return;
        }
        
        this.stop();
        
        this.isPlaying = true;
        this.isPaused = false;
        this.currentTimeIndex = 0;
        this.pausedTime = 0;
        this.playbackStartTime = Date.now();
        
        this.clearRainEffects();
        this.clearKeyboardHighlights();
        
        // 使用Tone.Transport进行精确时间调度
        Tone.Transport.stop();
        Tone.Transport.cancel();
        Tone.Transport.bpm.value = 60; // 设置BPM
        
        // 安排每个音符事件
        sequence.forEach((item, index) => {
            const scheduleTime = item.time;
            
            if (item.isChord) {
                // 安排和弦
                Tone.Transport.schedule((time) => {
                    if (!this.isPlaying) return;
                    
                    this.playNotesSimultaneously(item.notes, time);
                    this.currentTimeIndex = index;
                    this.updatePlaybackInfo(index, sequence.length, title);
                    
                }, scheduleTime);
            } else if (item.notes && item.notes.length > 0) {
                // 安排单个音符
                Tone.Transport.schedule((time) => {
                    if (!this.isPlaying) return;
                    
                    const note = item.notes[0];
                    this.playPianoNote(
                        note.note, 
                        note.duration, 
                        note.sustain, 
                        time, 
                        note.velocity
                    );
                    this.currentTimeIndex = index;
                    this.updatePlaybackInfo(index, sequence.length, title);
                    
                }, scheduleTime);
            }
        });
        
        // 安排结束事件
        Tone.Transport.schedule(() => {
            this.onPlaybackComplete();
        }, this.totalPlaybackTime + 0.5);
        
        // 开始播放
        Tone.Transport.start();
        
        console.log(`开始播放序列: ${title}, 总时长: ${this.totalPlaybackTime.toFixed(2)}秒`);
    }
    
    /**
     * 播放完成回调
     */
    onPlaybackComplete() {
        this.isPlaying = false;
        this.isPaused = false;
        console.log("播放完成");
        
        // 可选：添加完成提示
        if (this.sequenceTitle) {
            console.log(`${this.sequenceTitle} 播放完成`);
        }
    }
    
    /**
     * 播放序列（兼容原有接口）
     */
    async playSequence(sequence, title = "自定义序列") {
        // 如果传入的是字符串，当作绝对音高序列处理
        if (typeof sequence === 'string') {
            return this.playAbsoluteSequence(sequence, title);
        }
        
        // 如果传入的是数组，使用原有逻辑
        try {
            await startAudioContext();
            this.startPlayback(sequence, title);
        } catch (error) {
            console.error("启动音频上下文失败:", error);
        }
    }
    
    /**
     * 原有的播放逻辑（保留兼容性）
     */
    startPlayback(sequence, title) {
        if (this.isPlaying && !this.isPaused) return;

        if (this.isPaused) {
            this.resumePlayback();
            return;
        }

        this.isPlaying = true;
        this.isPaused = false;
        this.currentTimeIndex = 0;
        this.pausedTime = 0;

        if (this.playbackSchedule) {
            this.playbackSchedule.stop();
            this.playbackSchedule = null;
        }

        if (this.scheduledEvents.length) {
            this.scheduledEvents.forEach(id => Tone.Transport.clear(id));
            this.scheduledEvents = [];
        }

        this.clearRainEffects();
        this.clearKeyboardHighlights();

        sequence.forEach((item, index) => {
            const eventId = Tone.Transport.schedule((time) => {
                if (!this.isPlaying) return;

                if (item.isChord && item.notes) {
                    this.playNotesSimultaneously(item.notes, time);
                } else if (item.notes && item.notes.length > 0) {
                    const note = item.notes[0];
                    this.playPianoNote(note.note, note.duration, note.sustain, time, note.velocity);
                }

                this.currentTimeIndex = index;
                this.updatePlaybackInfo(index, sequence.length, title);

            }, item.time);
            this.scheduledEvents.push(eventId);
        });

        const totalDuration = sequence.length > 0 ?
            sequence[sequence.length - 1].time + sequence[sequence.length - 1].duration + 0.5 : 0;

        const endEventId = Tone.Transport.schedule(() => {
            this.stop();
        }, totalDuration);
        this.scheduledEvents.push(endEventId);

        Tone.Transport.start();
        this.playbackStartTime = Tone.now();
        this.updatePlaybackInfo(0, sequence.length, title);
    }
    
    resumePlayback() {
        if (!this.isPaused) return;

        this.isPlaying = true;
        this.isPaused = false;
        Tone.Transport.start();
    }

    pausePlayback() {
        if (Tone.Transport.state === 'started') {
            Tone.Transport.pause();
            this.isPlaying = false;
            this.isPaused = true;
            this.pausedTime = Tone.Transport.seconds;

            if (this.scheduledEvents.length) {
                this.scheduledEvents.forEach(id => Tone.Transport.clear(id));
                this.scheduledEvents = [];
            }
        }
    }

    stop() {
        if (this.playbackSchedule) {
            this.playbackSchedule.stop();
            this.playbackSchedule = null;
        }

        Tone.Transport.stop();
        Tone.Transport.cancel();

        if (this.scheduledEvents.length) {
            this.scheduledEvents.forEach(id => Tone.Transport.clear(id));
            this.scheduledEvents = [];
        }

        this.isPlaying = false;
        this.isPaused = false;
        this.currentTimeIndex = 0;
        this.pausedTime = 0;
        this.clearKeyboardHighlights();
        this.clearRainEffects();

        console.log("播放已停止");
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
        
        // 检查并播放转换序列
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
                    window.pianoPlayer.noteBaseVelocity = parseFloat(defaultNoteVelocity);
                }

                // 延迟一下确保钢琴界面完全加载
                setTimeout(() => {
                    // 使用新的绝对音高序列播放方法
                    window.pianoPlayer.playAbsoluteSequence(convertedSequence, "转换序列");
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
        hideLoadingPage();
        document.querySelector('.container').style.display = 'block';
        if (document.getElementById('conversionInfo')) {
            document.getElementById('conversionInfo').innerHTML = 
                "音源加载失败，钢琴功能可能无法正常使用。请刷新页面重试。";
        }
    });
});