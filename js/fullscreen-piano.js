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
    "A4": "A4.mp4",  // 修正文件扩展名
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
let audioContextStartedPromise = null; // 添加Promise控制

// 启动音频上下文的函数 - 修复版本
async function startAudioContext() {
    if (isAudioContextStarted) return Promise.resolve();
    
    if (audioContextStartedPromise) {
        return audioContextStartedPromise;
    }
    
    audioContextStartedPromise = new Promise(async (resolve, reject) => {
        try {
            // 确保用户交互后才启动音频上下文
            if (Tone.context.state === 'suspended') {
                await Tone.context.resume();
            } else if (Tone.context.state === 'closed') {
                await Tone.start();
            }
            
            console.log("AudioContext started successfully, state:", Tone.context.state);
            isAudioContextStarted = true;
            resolve();
        } catch (error) {
            console.error("Failed to start AudioContext:", error);
            reject(error);
        } finally {
            audioContextStartedPromise = null;
        }
    });
    
    return audioContextStartedPromise;
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
                    release: 1, // 添加释放时间
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
        release: 1, // 添加释放时间减少噪音
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
function createPiano(pianoElement, pianoPlayer) {
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
            key.dataset.pressing = "false"; // 标记按键状态

            const label = document.createElement('div');
            label.className = 'key-label';
            label.textContent = fullNote;
            key.appendChild(label);

            // 键盘事件处理函数
            const handleKeyDown = async (e) => {
                e.preventDefault();
                if (key.dataset.pressing === "true") return; // 防止重复触发
                
                try {
                    await startAudioContext();
                    key.dataset.pressing = "true";
                    
                    // 记录按下时间
                    const pressStartTime = Date.now();
                    key.dataset.pressStartTime = pressStartTime;
                    
                    // 开始播放音符
                    pianoPlayer.startPlayingNote(fullNote, pressStartTime);
                } catch (error) {
                    console.error("播放错误:", error);
                }
            };

            const handleKeyUp = async (e) => {
                e.preventDefault();
                if (key.dataset.pressing !== "true") return;
                
                try {
                    await startAudioContext();
                    key.dataset.pressing = "false";
                    
                    const pressStartTime = parseInt(key.dataset.pressStartTime) || Date.now();
                    const pressDuration = (Date.now() - pressStartTime) / 1000; // 秒
                    
                    // 停止播放音符
                    pianoPlayer.stopPlayingNote(fullNote, pressDuration);
                    
                    // 移除高亮
                    setTimeout(() => {
                        key.classList.remove('playing');
                    }, 50);
                    
                    // 清理时间戳
                    delete key.dataset.pressStartTime;
                } catch (error) {
                    console.error("播放错误:", error);
                }
            };

            // 鼠标事件
            key.addEventListener('mousedown', handleKeyDown);
            key.addEventListener('mouseup', handleKeyUp);
            key.addEventListener('mouseleave', (e) => {
                if (key.dataset.pressing === "true") {
                    handleKeyUp(e);
                }
            });
            
            // 触摸事件支持
            key.addEventListener('touchstart', (e) => {
                e.preventDefault();
                handleKeyDown(e);
            });
            key.addEventListener('touchend', (e) => {
                e.preventDefault();
                handleKeyUp(e);
            });
            key.addEventListener('touchcancel', (e) => {
                e.preventDefault();
                handleKeyUp(e);
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
            }, Math.min(duration * 1000, 3000)); // 添加最大高亮时间
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
        this.activeRainElements = new Map(); // 使用Map存储雨滴
        this.rainAnimationFrames = new Map(); // 存储动画帧ID
        this.noteBaseDuration = 1;
        this.noteBaseVelocity = 1;
        this.rainDefaultSpeed = 100; // 像素/秒
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
                this.adjustPianoSize();
            }
        });
        
        // 监听页面可见性变化，暂停动画以节省资源
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pauseAllRainAnimations();
            } else {
                this.resumeAllRainAnimations();
            }
        });
    }

    createRainContainer() {
        this.rainContainer = document.createElement('div');
        this.rainContainer.className = 'piano-rain-container';
        this.rainContainer.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            overflow: hidden;
            z-index: 5;
        `;
        this.fullscreenPiano.appendChild(this.rainContainer);
    }

    initPiano() {
        createPiano(this.fullscreenPianoKeyboard, this);
    }

    showFullscreenPiano() {
        this.isFullscreen = true;

        document.body.classList.add('fullscreen-mode');
        this.fullscreenPiano.classList.add('active');
        
        // 立即调整钢琴尺寸
        setTimeout(() => {
            this.adjustPianoSize();
        }, 10);
        
        // 添加额外的调整以确保完全展开
        setTimeout(() => {
            this.adjustPianoSize();
        }, 100);
    }

    // 开始播放音符（按住不放时持续播放）
    async startPlayingNote(noteName, startTime) {
        try {
            await startAudioContext();
            
            // 高亮琴键
            this.highlightKey(noteName, true);
            
            // 开始声音播放
            this.sampler.triggerAttack(noteName, Tone.now(), this.noteBaseVelocity);
            
            // 创建钢琴雨
            this.startRainEffect(noteName, startTime);
        } catch (error) {
            console.error("开始播放音符错误:", error);
        }
    }
    
    // 停止播放音符（松开琴键）
    async stopPlayingNote(noteName, pressDuration) {
        try {
            await startAudioContext();
            
            // 停止声音播放
            this.sampler.triggerRelease(noteName, Tone.now());
            
            // 停止钢琴雨生长
            this.stopRainEffect(noteName, pressDuration);
            
            // 移除高亮
            setTimeout(() => {
                this.highlightKey(noteName, false);
            }, 50);
        } catch (error) {
            console.error("停止播放音符错误:", error);
        }
    }

    // 播放单个音符（兼容原有接口）
    async playPianoNote(noteName, duration = 0.8, sustain = 0, startTime = null, velocity = 1) {
        try {
            const actualDuration = duration * this.noteBaseDuration;
            
            await playNote(noteName, actualDuration, sustain, startTime, velocity);
            
            this.highlightKey(noteName, true);
            setTimeout(() => {
                this.highlightKey(noteName, false);
            }, Math.min(actualDuration * 1000, 3000));
            
            this.createRainEffect(noteName, actualDuration, sustain);
        } catch (error) {
            console.error("播放音符错误:", error);
        }
    }

    highlightKey(noteName, isPlaying) {
        if (!this.fullscreenPianoKeyboard) return;

        const key = this.fullscreenPianoKeyboard.querySelector(`.key[data-note="${noteName}"]`);
        if (key) {
            if (isPlaying) {
                key.classList.add('playing');
            } else {
                key.classList.remove('playing');
            }
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

    // 创建固定时长的钢琴雨效果
    createRainEffect(noteName, duration, sustain = 0) {
        this.startRainEffect(noteName, Date.now(), duration, sustain);
    }
    
    // 开始钢琴雨效果（可动态生长）
    startRainEffect(noteName, startTime, fixedDuration = null, sustain = 0) {
        if (!this.rainContainer || !this.fullscreenPianoKeyboard) return;

        const key = this.fullscreenPianoKeyboard.querySelector(`.key[data-note="${noteName}"]`);
        if (!key) return;

        const keyRect = key.getBoundingClientRect();
        const containerRect = this.fullscreenPiano.getBoundingClientRect();

        // 如果这个音符已经有一个雨滴，先停止它
        if (this.activeRainElements.has(noteName)) {
            this.stopRainAnimation(noteName);
        }

        const rainElement = document.createElement('div');
        rainElement.className = 'piano-rain';

        const color = this.getNoteColor(noteName);

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
            opacity: 1;
            transition: height 0.1s ease-out;
        `;

        this.rainContainer.appendChild(rainElement);

        const rainData = {
            element: rainElement,
            note: noteName,
            startTime: startTime,
            fixedDuration: fixedDuration,
            sustain: sustain,
            isGrowing: true,
            currentHeight: 0,
            startTop: startTop,
            containerHeight: containerRect.height,
            keyRect: keyRect,
            containerRect: containerRect,
            growSpeed: 200, // 像素/秒的生长速度
            moveSpeed: 100, // 像素/秒的上移速度
            lastUpdateTime: startTime,
            animationId: null
        };

        this.activeRainElements.set(noteName, rainData);
        this.updateRainEffect(rainData);
    }
    
    // 停止钢琴雨生长
    stopRainEffect(noteName, pressDuration) {
        if (!this.activeRainElements.has(noteName)) return;
        
        const rainData = this.activeRainElements.get(noteName);
        if (!rainData.isGrowing) return;
        
        rainData.isGrowing = false;
        
        // 如果已经有动画帧，取消它
        if (rainData.animationId) {
            cancelAnimationFrame(rainData.animationId);
        }
        
        // 限制最大高度为容器高度
        const maxHeight = rainData.containerHeight;
        if (rainData.currentHeight > maxHeight) {
            rainData.currentHeight = maxHeight;
        }
        
        // 设置最终高度
        rainData.finalHeight = Math.min(rainData.currentHeight, 1000);
        rainData.element.style.height = `${rainData.finalHeight}px`;
        rainData.element.style.top = `${rainData.startTop - rainData.finalHeight}px`;
        
        // 开始上移动画
        this.startRainMoveAnimation(rainData);
    }
    
    // 更新钢琴雨效果
    updateRainEffect(rainData) {
        if (!rainData.element.parentNode) {
            this.cleanupRainElement(rainData.note);
            return;
        }

        const now = Date.now();
        const elapsed = now - rainData.lastUpdateTime;
        
        if (elapsed <= 0) {
            rainData.animationId = requestAnimationFrame(() => this.updateRainEffect(rainData));
            return;
        }
        
        const deltaTime = elapsed / 1000; // 转换为秒
        rainData.lastUpdateTime = now;
        
        if (rainData.isGrowing) {
            // 生长阶段
            if (rainData.fixedDuration !== null) {
                // 固定时长的生长
                const totalDuration = rainData.fixedDuration + rainData.sustain;
                const timeSinceStart = (now - rainData.startTime) / 1000;
                const growProgress = Math.min(1, timeSinceStart / totalDuration);
                const targetHeight = 200 * growProgress; // 最大高度200像素
                
                rainData.currentHeight = targetHeight;
                rainData.element.style.height = `${targetHeight}px`;
                rainData.element.style.top = `${rainData.startTop - targetHeight}px`;
                
                if (growProgress >= 1) {
                    rainData.isGrowing = false;
                    rainData.finalHeight = targetHeight;
                    this.startRainMoveAnimation(rainData);
                    return;
                }
            } else {
                // 持续生长（按住不放）
                const heightIncrease = deltaTime * rainData.growSpeed;
                rainData.currentHeight += heightIncrease;
                
                // 限制最大高度为容器高度
                const maxHeight = rainData.containerHeight;
                if (rainData.currentHeight > maxHeight) {
                    rainData.currentHeight = maxHeight;
                }
                
                rainData.element.style.height = `${rainData.currentHeight}px`;
                rainData.element.style.top = `${rainData.startTop - rainData.currentHeight}px`;
            }
            
            // 继续动画
            rainData.animationId = requestAnimationFrame(() => this.updateRainEffect(rainData));
        }
    }
    
    // 开始雨滴上移动画
    startRainMoveAnimation(rainData) {
        const moveRain = () => {
            if (!rainData.element.parentNode) {
                this.cleanupRainElement(rainData.note);
                return;
            }
            
            const now = Date.now();
            const deltaTime = (now - rainData.lastUpdateTime) / 1000;
            rainData.lastUpdateTime = now;
            
            const moveDistance = deltaTime * rainData.moveSpeed;
            const currentTop = parseFloat(rainData.element.style.top) || rainData.startTop;
            const newTop = currentTop - moveDistance;
            
            rainData.element.style.top = `${newTop}px`;
            
            // 计算透明度，随着上移逐渐消失
            const elementBottom = newTop + rainData.finalHeight;
            const opacity = Math.max(0, Math.min(1, (elementBottom + 100) / rainData.containerHeight));
            rainData.element.style.opacity = opacity.toString();
            
            // 检查是否完全移出容器
            if (elementBottom < -100) { // 添加额外100px的缓冲区
                // 完全移出，移除元素
                this.cleanupRainElement(rainData.note);
                return;
            }
            
            // 继续动画
            rainData.animationId = requestAnimationFrame(moveRain);
        };
        
        rainData.animationId = requestAnimationFrame(moveRain);
    }
    
    // 停止单个雨滴的动画
    stopRainAnimation(noteName) {
        if (!this.activeRainElements.has(noteName)) return;
        
        const rainData = this.activeRainElements.get(noteName);
        if (rainData.animationId) {
            cancelAnimationFrame(rainData.animationId);
            rainData.animationId = null;
        }
        
        if (rainData.element && rainData.element.parentNode) {
            rainData.element.parentNode.removeChild(rainData.element);
        }
        
        this.activeRainElements.delete(noteName);
    }
    
    // 清理雨滴元素
    cleanupRainElement(noteName) {
        if (!this.activeRainElements.has(noteName)) return;
        
        const rainData = this.activeRainElements.get(noteName);
        if (rainData.animationId) {
            cancelAnimationFrame(rainData.animationId);
        }
        
        if (rainData.element && rainData.element.parentNode) {
            rainData.element.parentNode.removeChild(rainData.element);
        }
        
        this.activeRainElements.delete(noteName);
    }
    
    // 暂停所有雨滴动画
    pauseAllRainAnimations() {
        for (const [noteName, rainData] of this.activeRainElements) {
            if (rainData.animationId) {
                cancelAnimationFrame(rainData.animationId);
                rainData.animationId = null;
            }
        }
    }
    
    // 恢复所有雨滴动画
    resumeAllRainAnimations() {
        for (const [noteName, rainData] of this.activeRainElements) {
            if (!rainData.animationId) {
                rainData.lastUpdateTime = Date.now();
                if (rainData.isGrowing) {
                    this.updateRainEffect(rainData);
                } else {
                    this.startRainMoveAnimation(rainData);
                }
            }
        }
    }

    clearRainEffects() {
        // 停止所有动画
        for (const [noteName, rainData] of this.activeRainElements) {
            if (rainData.animationId) {
                cancelAnimationFrame(rainData.animationId);
            }
        }
        
        // 清空容器
        if (this.rainContainer) {
            this.rainContainer.innerHTML = '';
        }
        
        // 清空Map
        this.activeRainElements.clear();
        this.rainAnimationFrames.clear();
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

    // 其他方法保持不变...
    // [注意：由于代码长度限制，我删除了后面的序列解析和播放方法，但它们应该保持不变]
    // 您需要保留原来的 parseAbsoluteSequence, startAbsolutePlayback 等方法
}

// 初始化应用
document.addEventListener('DOMContentLoaded', function () {
    // 添加音频上下文交互触发
    const startAudioOnInteraction = () => {
        if (!isAudioContextStarted) {
            startAudioContext().then(() => {
                console.log("Audio context started via user interaction");
            }).catch(error => {
                console.error("Failed to start audio context:", error);
            });
        }
        // 移除事件监听器
        document.removeEventListener('click', startAudioOnInteraction);
        document.removeEventListener('keydown', startAudioOnInteraction);
        document.removeEventListener('touchstart', startAudioOnInteraction);
    };
    
    // 在用户交互时启动音频上下文
    document.addEventListener('click', startAudioOnInteraction);
    document.addEventListener('keydown', startAudioOnInteraction);
    document.addEventListener('touchstart', startAudioOnInteraction);
    
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