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
let isAudioContextStarted = false; // 新增：标记音频上下文是否已启动

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
                        
                        // 延迟隐藏加载界面，让用户看到完成信息
                        setTimeout(() => {
                            hideLoadingPage();
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
            updateLoadProgress(0, "没有缓存，开始从本地加载音源...");
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
        baseUrl: "./sounds/",
        onload: () => {
            console.log("本地钢琴音源加载完成");
            updateLoadProgress(100, "音源加载完成！");
            isAudioLoaded = true;
            globalSampler = sampler;
            
            // 将音源数据存储到sessionStorage供下次使用
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
            
            // 延迟隐藏加载界面，让用户看到完成信息
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

            // 点击琴键事件 - 修复：添加音频上下文启动
            key.addEventListener('click', async () => {
                try {
                    await startAudioContext(); // 确保音频上下文已启动

                    key.classList.add('playing');
                    setTimeout(() => key.classList.remove('playing'), 300);
                    globalSampler.triggerAttackRelease(fullNote, noteDuration);
                } catch (error) {
                    console.error("播放错误:", error);
                }
            });

            // 触摸事件支持 - 修复：添加音频上下文启动
            key.addEventListener('touchstart', async (e) => {
                e.preventDefault();
                try {
                    await startAudioContext(); // 确保音频上下文已启动

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

// 播放钢琴音符
async function playNote(noteName, duration = 0.8, startTime = null) {
    try {
        await startAudioContext(); // 确保音频上下文已启动

        // 修复：使用传入的startTime而不是Tone.now()
        const now = startTime !== null ? startTime : Tone.now();
        globalSampler.triggerAttackRelease(noteName, duration, now);

        // 高亮琴键
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
        this.isFullscreen = true; // 修改：默认设置为全屏模式
        this.rainContainer = null;
        this.activeRainElements = [];
        this.noteBaseDuration = 1;
        this.noteBaseVelocity = 1;
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
        this.fullscreenPlaybackInfo = document.getElementById('fullscreenPlaybackInfo');

        this.initPiano();
        this.createRainContainer();
    }

    setupEventListeners() {

        // 窗口大小改变时重新调整钢琴大小
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

    collapseFullscreen() {
        this.isFullscreen = false;
        document.body.classList.remove('fullscreen-mode');
        this.fullscreenPiano.classList.remove('active');
        this.stop();
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
    async playPianoNote(noteName, duration = 0.8, startTime = null, velocity = 1) {
        try {
            let actualDuration = duration * this.noteBaseDuration;

            await playNote(noteName, actualDuration, startTime);
            this.highlightKey(noteName, actualDuration);

            // 创建钢琴雨效果
            this.createRainEffect(noteName, actualDuration);
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
            await startAudioContext(); // 确保音频上下文已启动

            // 修复：使用传入的startTime而不是Tone.now()
            const actualStartTime = startTime !== null ? startTime : Tone.now() + 0.1;

            const playPromises = notes.map(note => {
                let duration = Math.min(note.duration || 0.8, 2);
                const velocity = note.velocity || 1;

                this.createRainEffect(note.note || note, duration, note);

                return this.playPianoNote(note.note || note, duration, actualStartTime, velocity);
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

    createRainEffect(noteName, duration, note) {
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
        const baseHeight = duration * 100 * this.noteBaseDuration;
        const maxHeightValue = Math.min(maxHeight, Math.max(minHeight, baseHeight));

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
            note: note,
            duration: duration,
            startTime: Date.now(),
            maxHeight: maxHeightValue,
            moveSpeed: moveSpeed,
            startTop: startTop,
            containerHeight: containerRect.height,
            keyRect: keyRect,
            containerRect: containerRect,
            isGrowing: true,
            currentHeight: 0
        };

        this.activeRainElements.push(rainData);
        this.startRainMovement(rainData);
    }

    startRainMovement(rainData) {
        const startTime = Date.now();
        const growDuration = rainData.duration * 1000;

        const totalMoveDistance = rainData.containerHeight + rainData.maxHeight;
        const totalMoveTime = (totalMoveDistance / rainData.moveSpeed) * 1000;

        const animate = () => {
            if (!rainData.element.parentNode) return;

            const elapsed = Date.now() - startTime;

            if (elapsed <= growDuration && rainData.isGrowing) {
                const growProgress = elapsed / growDuration;
                const currentHeight = growProgress * rainData.maxHeight;

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
            if (currentTop > -rainData.maxHeight && elapsed < (growDuration + totalMoveTime)) {
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

    // 播放序列（供外部调用）
    async playSequence(sequence, title = "自定义序列") {
        try {
            await startAudioContext(); // 确保音频上下文已启动
            
            this.startPlayback(sequence, title);
        } catch (error) {
            console.error("启动音频上下文失败:", error);
        }
    }

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

        // 按时间分组音符
        const timeGroups = this.groupNotesByTime(sequence);

        timeGroups.forEach((group, index) => {
            const eventId = Tone.Transport.schedule((time) => {
                if (!this.isPlaying) return;

                if (group.notes.length > 1) {
                    // 播放和弦 - 修复：使用传入的time参数
                    this.playNotesSimultaneously(group.notes, time);
                } else {
                    // 播放单音 - 修复：使用传入的time参数
                    this.playPianoNote(group.notes[0].note || group.notes[0],
                        group.duration || 0.8, time);
                }

                this.currentTimeIndex = index;
                this.updatePlaybackInfo(index, timeGroups.length, title);

            }, group.time);
            this.scheduledEvents.push(eventId);
        });

        const totalDuration = sequence.length > 0 ? 
            sequence[sequence.length - 1].time + (sequence[sequence.length - 1].duration || 0.8) + 0.5 : 0;
            
        const endEventId = Tone.Transport.schedule(() => {
            this.stop();
        }, totalDuration);
        this.scheduledEvents.push(endEventId);

        Tone.Transport.start();
        this.playbackStartTime = Tone.now();
        this.updatePlaybackInfo(0, timeGroups.length, title);
    }

    // 按时间分组音符
    groupNotesByTime(notes) {
        if (notes.length === 0) return [];

        const validNotes = notes.filter(note => note && (note.time !== undefined || note.note));
        if (validNotes.length === 0) return [];

        // 为每个音符添加时间属性（如果不存在）
        validNotes.forEach((note, index) => {
            if (note.time === undefined) {
                note.time = index * 0.5; // 默认0.5秒间隔
            }
        });

        // 按时间排序
        validNotes.sort((a, b) => (a.time || 0) - (b.time || 0));

        const groups = [];
        let currentGroup = {
            time: validNotes[0].time,
            notes: [validNotes[0]],
            duration: validNotes[0].duration || 0.8
        };

        for (let i = 1; i < validNotes.length; i++) {
            const note = validNotes[i];
            if (!note) continue;

            if (Math.abs(note.time - currentGroup.time) < 0.001) {
                currentGroup.notes.push(note);
                // 取最长的持续时间
                if (note.duration && note.duration > currentGroup.duration) {
                    currentGroup.duration = note.duration;
                }
            } else {
                groups.push(currentGroup);
                currentGroup = {
                    time: note.time,
                    notes: [note],
                    duration: note.duration || 0.8
                };
            }
        }

        groups.push(currentGroup);
        return groups;
    }

    updatePlaybackInfo(currentIndex, totalItems, title) {
        this.fullscreenPlaybackInfo.textContent =
            `播放中: ${title} (${currentIndex + 1}/${totalItems})`;
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

        this.fullscreenPlaybackInfo.textContent = `播放已停止`;
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
                    window.pianoPlayer.noteBaseVelocity = parseFloat(defaultNoteVelocity);
                }

                // 解析并播放序列
                const parsedSequence = parseConvertedSequence(convertedSequence);
                if (parsedSequence && parsedSequence.length > 0) {
                    // 延迟一下确保钢琴界面完全加载
                    setTimeout(() => {
                        window.pianoPlayer.playSequence(parsedSequence, "特效点播序列");
                        // 播放完成后清理sessionStorage
                        sessionStorage.removeItem('convertedAbsoluteSequence');
                        sessionStorage.removeItem('defaultNoteDuration');
                        sessionStorage.removeItem('defaultNoteVelocity');
                    }, 1000);
                }
            } else {
                if (infoElement) {
                    infoElement.innerHTML = "这是一个独立的全屏钢琴页面，包含钢琴雨效果，可以手动弹奏或通过API调用播放功能。";
                }
            }
        }

        // 解析转换后的序列
        function parseConvertedSequence(sequenceStr) {
            try {
                const items = sequenceStr.split(',').map(item => item.trim()).filter(item => item);
                const sequence = [];
                let currentTime = 0;

                items.forEach((item, index) => {
                    // 处理休止符（以下划线开头）
                    if (item.startsWith('_')) {
                        const restParts = item.substring(1).split('_').filter(part => part);
                        let restDuration = window.pianoPlayer.noteBaseDuration;
                        let restSustain = 0;

                        if (restParts.length >= 1) {
                            restDuration = parseFloat(restParts[0]) || restDuration;
                        }
                        if (restParts.length >= 2) {
                            restSustain = parseFloat(restParts[1]) || 0;
                        }

                        // 休止符：增加时间但不添加音符
                        currentTime += restDuration;
                        return;
                    }

                    // 处理和弦（括号内的内容）
                    if (item.startsWith('(') && item.endsWith(')')) {
                        const chordContent = item.substring(1, item.length - 1);
                        const chordNotes = chordContent.split(',').map(note => note.trim()).filter(note => note);
                        const chordSequence = [];

                        chordNotes.forEach(chordNote => {
                            const noteData = parseSingleNote(chordNote, currentTime);
                            if (noteData) {
                                chordSequence.push(noteData);
                            }
                        });

                        if (chordSequence.length > 0) {
                            // 取最长的持续时间作为和弦的持续时间
                            const maxDuration = Math.max(...chordSequence.map(note => note.duration));
                            sequence.push({
                                time: currentTime,
                                notes: chordSequence,
                                duration: maxDuration,
                                isChord: true
                            });
                            currentTime += maxDuration;
                        }
                        return;
                    }

                    // 处理单个音符
                    const noteData = parseSingleNote(item, currentTime);
                    if (noteData) {
                        sequence.push({
                            time: currentTime,
                            notes: [noteData],
                            duration: noteData.duration,
                            isChord: false
                        });
                        currentTime += noteData.duration;
                    }
                });

                return sequence;
            } catch (error) {
                console.error("解析序列错误:", error);
                return null;
            }
        }

        // 解析单个音符
        function parseSingleNote(noteStr, startTime) {
            const parts = noteStr.split('_').filter(part => part);
            if (parts.length === 0) return null;

            const noteName = parts[0];
            let duration = window.pianoPlayer.noteBaseDuration;
            let velocity = window.pianoPlayer.noteBaseVelocity;
            let sustain = 0;

            // 解析时长
            if (parts.length >= 2) {
                duration = parseFloat(parts[1]) || duration;
            }

            // 解析力度
            if (parts.length >= 3) {
                velocity = parseFloat(parts[2]) || velocity;
            }

            // 解析延音
            if (parts.length >= 4) {
                sustain = parseFloat(parts[3]) || 0;
            }

            return {
                note: noteName,
                duration: duration,
                velocity: velocity,
                sustain: sustain,
                time: startTime
            };
        }

        // 修改PianoPlayer类的playSequence方法，支持新的序列格式
        PianoPlayer.prototype.playSequence = async function (sequence, title = "自定义序列") {
            try {
                await startAudioContext(); // 确保音频上下文已启动
                this.startPlayback(sequence, title);
            } catch (error) {
                console.error("启动音频上下文失败:", error);
            }
        };

        // 修改startPlayback方法以支持新的序列格式
        PianoPlayer.prototype.startPlayback = function (sequence, title) {
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

            // 安排播放事件
            sequence.forEach((item, index) => {
                const eventId = Tone.Transport.schedule((time) => {
                    if (!this.isPlaying) return;

                    if (item.isChord && item.notes) {
                        // 播放和弦 - 修复：使用传入的time参数
                        this.playNotesSimultaneously(item.notes, time);
                    } else if (item.notes && item.notes.length > 0) {
                        // 播放单音 - 修复：使用传入的time参数
                        const note = item.notes[0];
                        this.playPianoNote(note.note, note.duration, time, note.velocity);
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
        };

        // 修改playNotesSimultaneously方法以支持新的音符格式
        PianoPlayer.prototype.playNotesSimultaneously = async function (notes, startTime = null) {
            if (!notes || notes.length === 0) return;

            try {
                await startAudioContext(); // 确保音频上下文已启动

                // 修复：使用传入的startTime而不是Tone.now()
                const actualStartTime = startTime !== null ? startTime : Tone.now() + 0.1;
                const playPromises = notes.map(note => {
                    let duration = Math.min(note.duration || 0.8, 2);
                    const velocity = note.velocity || 1;

                    this.createRainEffect(note.note, duration, note);
                    return this.playPianoNote(note.note, duration, actualStartTime, velocity);
                });

                await Promise.all(playPromises);
            } catch (error) {
                console.error("播放和弦错误:", error);
            }
        };

        // 页面加载完成后检查并播放序列
        setTimeout(() => {
            checkAndPlayConvertedSequence();
        }, 500);

    }).catch((error) => {
        console.error("音源加载失败:", error);
        // 即使音源加载失败，也显示主界面
        hideLoadingPage();
        document.querySelector('.container').style.display = 'block';
        document.getElementById('conversionInfo').innerHTML = 
            "音源加载失败，钢琴功能可能无法正常使用。请刷新页面重试。";
    });
});