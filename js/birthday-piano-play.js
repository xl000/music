class MIDIPianoPlayer {
    constructor() {
        this.isPlaying = false;
        this.currentTimeIndex = 0;
        this.selectedTracks = [];
        this.allNotesForPlayback = [];
        this.timeGroups = [];
        this.playbackStartTime = 0;
        this.playbackSchedule = null;
        this.scheduledEvents = [];
        this.pausedTime = 0;
        this.isPaused = false;
        this.currentMidiData = null;
        this.isPianoOnly = false;
        this.isFullscreen = false;
        this.rainContainer = null; // 钢琴雨容器
        this.activeRainElements = []; // 活动的钢琴雨元素
        this.controlsHidden = false; // 控制元素是否隐藏
        this.hideControlsTimeout = null; // 隐藏控制元素的定时器

        // 新增参数
        this.noteBaseDuration = 1; // 单音基准时值，默认1秒
        this.noteBaseVelocity = 1;   // 单音基准强度，默认1
        this.rainDefaultSpeed = 5;   // 钢琴雨默认速度，默认3
        this.pedalDurationFactor = 2.5; // 新增：踏板延音时长系数，默认2.5倍

        this.initUI();
        this.setupEventListeners();

        // 定义钢琴雨颜色映射（C4-B4）
        this.baseNoteColors = {
            'C4': 'hsl(0, 80%, 60%)',    // 红色
            'C#4': 'hsl(30, 80%, 60%)',  // 橙红色
            'D4': 'hsl(60, 80%, 60%)',   // 黄色
            'D#4': 'hsl(90, 80%, 60%)',  // 黄绿色
            'E4': 'hsl(120, 80%, 60%)', // 绿色
            'F4': 'hsl(150, 80%, 60%)', // 青绿色
            'F#4': 'hsl(180, 80%, 60%)', // 青色
            'G4': 'hsl(210, 80%, 60%)', // 蓝青色
            'G#4': 'hsl(240, 80%, 60%)', // 蓝色
            'A4': 'hsl(270, 80%, 60%)', // 紫蓝色
            'A#4': 'hsl(300, 80%, 60%)', // 紫色
            'B4': 'hsl(330, 80%, 60%)'  // 紫红色
        };
    }

    initUI() {
        // 只保留全屏模式下的元素
        this.fullscreenPiano = document.getElementById('fullscreenPiano');
        this.fullscreenPianoKeyboard = document.getElementById('fullscreenPianoKeyboard');
        this.fullscreenPlayBtn = document.getElementById('fullscreenPlayBtn');
        this.fullscreenPauseBtn = document.getElementById('fullscreenPauseBtn');
        this.fullscreenStopBtn = document.getElementById('fullscreenStopBtn');
        this.fullscreenPlaybackInfo = document.getElementById('fullscreenPlaybackInfo');
        this.fullscreenTrackSelection = document.getElementById('fullscreenTrackSelection');
        this.collapseBtn = document.getElementById('collapsePiano');
        this.fullscreenPianoControls = document.querySelector('.fullscreen-piano-controls');
        this.settingsContainer = document.querySelector('.piano-settings-container');
        this.birthdayTitle = document.querySelector('.birthday-title');

        // 设置音轨选择界面初始为隐藏
        this.fullscreenTrackSelection.style.display = 'none';

        this.initPiano();
        this.createRainContainer();
        this.createSettingsPanel(); // 创建设置面板
    }

    // 创建设置面板
    createSettingsPanel() {
        const settingsPanel = document.createElement('div');
        settingsPanel.className = 'piano-settings-panel control-element';
        settingsPanel.style.cssText = `
            display: flex;
            justify-content: center;
            gap: 20px;
            margin: 10px 0;
            flex-wrap: wrap;
            background: rgba(0, 0, 0, 0.3);
            padding: 10px;
            border-radius: 10px;
            backdrop-filter: blur(10px);
        `;

        // 单音基准时值设置
        const durationSetting = this.createSettingInput(
            '单音基准时值(秒)',
            'noteBaseDuration',
            this.noteBaseDuration,
            0.1,
            5,
            0.1,
            (value) => {
                this.noteBaseDuration = value;
                this.updateRainEffects();
            }
        );

        // 单音基准强度设置
        const velocitySetting = this.createSettingInput(
            '单音基准强度',
            'noteBaseVelocity',
            this.noteBaseVelocity,
            0.1,
            2,
            0.1,
            (value) => {
                this.noteBaseVelocity = value;
                this.updateRainEffects();
            }
        );

        // 钢琴雨默认速度设置
        const speedSetting = this.createSettingInput(
            '钢琴雨默认速度',
            'rainDefaultSpeed',
            this.rainDefaultSpeed,
            0.1,
            5,
            0.1,
            (value) => {
                this.rainDefaultSpeed = value;
                this.updateRainEffects();
            }
        );

        // 新增：踏板延音时长系数设置
        const pedalSetting = this.createSettingInput(
            '踏板延音时长系数',
            'pedalDurationFactor',
            this.pedalDurationFactor,
            1.0,
            5.0,
            0.1,
            (value) => {
                this.pedalDurationFactor = value;
            }
        );

        settingsPanel.appendChild(durationSetting);
        settingsPanel.appendChild(velocitySetting);
        settingsPanel.appendChild(speedSetting);
        settingsPanel.appendChild(pedalSetting); // 添加踏板设置

        // 将设置面板插入到容器中
        this.settingsContainer.appendChild(settingsPanel);
    }

    // 创建设置输入框
    createSettingInput(labelText, id, defaultValue, min, max, step, onChange) {
        const settingDiv = document.createElement('div');
        settingDiv.style.cssText = `
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 5px;
        `;

        const label = document.createElement('label');
        label.textContent = labelText;
        label.htmlFor = id;
        label.style.cssText = `
            color: white;
            font-size: 12px;
            font-weight: bold;
        `;

        const input = document.createElement('input');
        input.type = 'number';
        input.id = id;
        input.value = defaultValue;
        input.min = min;
        input.max = max;
        input.step = step;
        input.style.cssText = `
            width: 80px;
            padding: 5px;
            border: 1px solid rgba(255, 255, 255, 0.3);
            border-radius: 5px;
            background: rgba(255, 255, 255, 0.1);
            color: white;
            text-align: center;
        `;

        input.addEventListener('input', (e) => {
            let value = parseFloat(e.target.value);
            if (isNaN(value)) value = defaultValue;
            value = Math.max(min, Math.min(max, value));
            e.target.value = value;
            onChange(value);
        });

        settingDiv.appendChild(label);
        settingDiv.appendChild(input);
        return settingDiv;
    }

    setupEventListeners() {
        // 监听钢琴播放初始化事件
        document.addEventListener('initPianoPlayback', (event) => {
            this.currentMidiData = event.detail.midiData;
            this.isPianoOnly = event.detail.isPianoOnly;
            this.showFullscreenPiano();
        });

        // 全屏模式播放控制
        this.fullscreenPlayBtn.addEventListener('click', () => this.startPlayback());
        this.fullscreenPauseBtn.addEventListener('click', () => this.pausePlayback());
        this.fullscreenStopBtn.addEventListener('click', () => this.stopPlayback());

        // 收起按钮
        this.collapseBtn.addEventListener('click', () => this.collapseFullscreen());

        // 窗口大小改变时重新调整钢琴大小
        window.addEventListener('resize', () => {
            if (this.isFullscreen) {
                setTimeout(() => this.adjustPianoSize(), 100);
            }
        });
    }

    // 创建钢琴雨容器
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
            z-index: 5;
            overflow: hidden;
        `;
        this.fullscreenPiano.appendChild(this.rainContainer);
    }

    // 初始化钢琴
    initPiano() {
        if (typeof createPiano !== 'undefined') {
            createPiano(this.fullscreenPianoKeyboard, null);
        } else {
            console.error("pure-piano.js未正确加载");
        }
    }

    // 显示全屏钢琴
    showFullscreenPiano() {
        this.isFullscreen = true;

        document.body.classList.add('fullscreen-mode');
        this.fullscreenPiano.classList.add('active');

        this.preparePlayback();

        // 确保音轨选择界面隐藏
        this.fullscreenTrackSelection.style.display = 'none';

        setTimeout(() => {
            this.adjustPianoSize();
        }, 100);
    }

    // 收起全屏钢琴
    collapseFullscreen() {
        this.isFullscreen = false;
        document.body.classList.remove('fullscreen-mode');
        this.fullscreenPiano.classList.remove('active');
        this.stopPlayback();
    }

    // 调整钢琴大小以适应全屏
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

    // 播放钢琴音符
    async playPianoNote(noteName, duration = 0.8, startTime = null, withPedal = false, velocity = 1) {
        try {
            if (typeof playNote !== 'undefined') {
                // 计算音频持续时间（包含延音效果）
                let audioDuration = duration * this.noteBaseDuration;
                if (withPedal) {
                    audioDuration = Math.max(audioDuration * this.pedalDurationFactor, 1.0);
                }

                // 按键高亮时间严格等于基本时长（不含延音）
                const keyHighlightDuration = duration * this.noteBaseDuration;
                let actualVelocity = velocity * this.noteBaseVelocity;

                // 播放音符（使用包含延音的音频时长）
                await playNote(noteName, audioDuration, startTime);

                // 高亮琴键（使用基本时长，不含延音）
                this.highlightKey(noteName, keyHighlightDuration, withPedal);
                return audioDuration; // 返回音频持续时间

            } else {
                console.error("pure-piano.js的playNote函数未定义");
                return duration;
            }
        } catch (error) {
            console.error("播放音符错误:", error);
            return duration;
        }
    }

    // 高亮琴键
    highlightKey(noteName, keyHighlightDuration, withPedal) {
        if (!this.fullscreenPianoKeyboard) return;

        const key = this.fullscreenPianoKeyboard.querySelector(`.key[data-note="${noteName}"]`);
        if (key) {
            key.classList.add('playing');
            if (withPedal) {
                key.classList.add('pedal-active');
            }

            // 严格使用基本时长，不受延音影响
            setTimeout(() => {
                key.classList.remove('playing');
                key.classList.remove('pedal-active');
            }, keyHighlightDuration * 1000);
        }
    }

    async playNotesSimultaneously(notes, startTime = null) {
        if (!notes || notes.length === 0) return 0;

        try {
            const validNotes = notes.filter(note => note && note.name);
            if (validNotes.length === 0) return 0;

            if (Tone.context.state !== 'running') {
                await Tone.start();
            }

            const actualStartTime = startTime || Tone.now() + 0.1;
            let maxAudioDuration = 0; // 音频最大持续时间（含延音）
            let maxKeyDuration = 0;   // 按键最大持续时间（不含延音）

            const playPromises = validNotes.map(note => {
                let duration = Math.min(note.duration || 0.8, 2);
                const velocity = note.velocity || 1;

                // 为每个音符创建钢琴雨效果（使用基本时长）
                this.createRainEffect(note.name, duration, note);

                return this.playPianoNote(note.name, duration, actualStartTime, note.withPedal, velocity)
                    .then(audioDuration => {
                        // 记录音频最大持续时间（用于播放进度计算）
                        if (audioDuration > maxAudioDuration) {
                            maxAudioDuration = audioDuration;
                        }
                        // 记录按键最大持续时间（用于视觉同步）
                        const keyDuration = duration * this.noteBaseDuration;
                        if (keyDuration > maxKeyDuration) {
                            maxKeyDuration = keyDuration;
                        }
                    });
            });

            await Promise.all(playPromises);

            // 返回音频的最大持续时间（因为播放进度应该基于音频）
            return maxAudioDuration;

        } catch (error) {
            console.error("播放和弦错误:", error);
            return 0;
        }
    }

    // 获取音符对应的颜色
    getNoteColor(noteName) {
        // 解析音符名称（如 "C4"）
        const match = noteName.match(/([A-Ga-g]#?b?)(\d+)/);
        if (!match) return 'hsl(0, 80%, 60%)'; // 默认颜色

        const pitch = match[1];
        const octave = parseInt(match[2]);

        // 查找基础八度（C4-B4）对应的颜色
        const baseNote = pitch + '4';
        const baseColor = this.baseNoteColors[baseNote] || 'hsl(0, 80%, 60%)';

        // 解析基础颜色
        const hslMatch = baseColor.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
        if (!hslMatch) return baseColor;

        const hue = parseInt(hslMatch[1]);
        const saturation = parseInt(hslMatch[2]);
        let lightness = parseInt(hslMatch[3]);

        // 根据八度调整明度
        const octaveDiff = octave - 4;
        lightness = Math.max(10, Math.min(90, lightness + (octaveDiff * 10)));

        return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    }

    // 创建钢琴雨效果 - 使用基本时长
    createRainEffect(noteName, duration, note) {
        if (!this.rainContainer || !this.fullscreenPianoKeyboard) return;

        const key = this.fullscreenPianoKeyboard.querySelector(`.key[data-note="${noteName}"]`);
        if (!key) return;

        const keyRect = key.getBoundingClientRect();
        const containerRect = this.fullscreenPiano.getBoundingClientRect();

        // 创建钢琴雨元素
        const rainElement = document.createElement('div');
        rainElement.className = 'piano-rain';

        // 获取音符对应的颜色
        const color = this.getNoteColor(noteName);

        // 钢琴雨使用基本时长（不含延音）
        const rainDuration = duration * this.noteBaseDuration;

        // 计算钢琴雨参数
        const minHeight = 20;
        const maxHeight = 500;
        const baseHeight = rainDuration * 100;
        const maxHeightValue = Math.min(maxHeight, Math.max(minHeight, baseHeight));

        // 使用统一的移动速度
        const moveSpeed = this.rainDefaultSpeed * 100;

        // 初始位置
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
            duration: rainDuration, // 使用基本时长
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

        // 开始钢琴雨动画
        this.startRainMovement(rainData);
    }

    // 开始钢琴雨移动动画 - 修复后的逻辑
    startRainMovement(rainData) {
        const startTime = Date.now();
        const growDuration = rainData.duration * 1000; // 增长阶段的持续时间（毫秒）

        // 计算总移动距离和总时间
        const totalMoveDistance = rainData.containerHeight + rainData.maxHeight;
        const totalMoveTime = (totalMoveDistance / rainData.moveSpeed) * 1000; // 转换为毫秒

        const animate = () => {
            if (!rainData.element.parentNode) return; // 如果元素已被移除

            const elapsed = Date.now() - startTime;

            if (elapsed <= growDuration && rainData.isGrowing) {
                // 增长阶段：高度逐渐增加，下边界保持在琴键上边界
                const growProgress = elapsed / growDuration;
                const currentHeight = growProgress * rainData.maxHeight;

                // 修复：高度增加，但下边界保持不变（固定在琴键上边界）
                // 通过调整top值来保持下边界位置不变
                rainData.element.style.height = `${currentHeight}px`;
                rainData.element.style.top = `${rainData.startTop - currentHeight}px`;

                rainData.currentHeight = currentHeight;

            } else if (rainData.isGrowing) {
                // 增长阶段结束，切换到纯移动阶段
                rainData.isGrowing = false;
                rainData.growEndTime = Date.now();
                rainData.finalHeight = rainData.currentHeight;
                // 记录增长阶段结束时的位置
                rainData.growEndTop = parseFloat(rainData.element.style.top) || rainData.startTop;
            }

            if (!rainData.isGrowing) {
                // 纯移动阶段：高度保持不变，继续以统一速度向上移动
                const moveElapsed = Date.now() - rainData.growEndTime;
                const moveDistance = (moveElapsed / 1000) * rainData.moveSpeed;

                // 从增长阶段结束的位置继续向上移动
                rainData.element.style.top = `${rainData.growEndTop - moveDistance}px`;
                rainData.element.style.height = `${rainData.finalHeight}px`;
            }

            // 检查是否应该继续动画（元素是否还在容器内）
            const currentTop = parseFloat(rainData.element.style.top) || rainData.startTop;
            if (currentTop > -rainData.maxHeight && elapsed < (growDuration + totalMoveTime)) {
                requestAnimationFrame(animate);
            } else {
                // 动画结束后移除元素
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

    // 更新所有活动的钢琴雨效果
    updateRainEffects() {
        // 清除所有现有的钢琴雨效果
        this.clearRainEffects();

        // 如果有正在播放的音乐，可以重新创建钢琴雨效果
        if (this.isPlaying && this.currentTimeIndex > 0) {
            // 这里可以重新创建当前时间点之后的钢琴雨效果
            // 为了简化，我们只更新当前活动的效果
        }
    }

    // 隐藏控制元素
    hideControls() {
        if (this.controlsHidden) return;

        const controlElements = document.querySelectorAll('.control-element');
        controlElements.forEach(element => {
            element.style.display = 'none';
        });
        this.controlsHidden = true;
    }

    // 显示控制元素
    showControls() {
        if (!this.controlsHidden) return;

        const controlElements = document.querySelectorAll('.control-element');
        controlElements.forEach(element => {
            element.style.display = '';
        });
        this.controlsHidden = false;
    }

    // 准备播放
    preparePlayback() {
        if (!this.currentMidiData) return;

        this.allNotesForPlayback = [];
        this.selectedTracks = [];

        const tracksToUse = this.isPianoOnly ?
            this.currentMidiData.data.tracks.filter(track => track.isPiano) :
            this.currentMidiData.data.tracks;

        // 注释掉创建音轨选择界面的代码
        // this.createTrackSelection(tracksToUse);

        // 默认选择所有音轨
        this.selectedTracks = tracksToUse.map((_, index) => index);
        this.updateSelectedTracks();

        // 始终隐藏音轨选择界面
        this.fullscreenTrackSelection.style.display = 'none';
    }

    // 创建音轨选择界面（不再使用）
    createTrackSelection(tracksToUse) {
        // 不再创建音轨选择界面
        this.fullscreenTrackSelection.innerHTML = '';
    }

    // 创建音轨复选框（不再使用）
    createTrackCheckbox(track, index) {
        // 不再创建音轨复选框
        return document.createElement('div');
    }

    // 更新选中的音轨
    updateSelectedTracks() {
        this.selectedTracks = [];
        const tracksToUse = this.isPianoOnly ?
            this.currentMidiData.data.tracks.filter(track => track && track.isPiano) :
            this.currentMidiData.data.tracks;

        // 默认选择所有音轨
        this.selectedTracks = tracksToUse.map((_, index) => index);

        this.allNotesForPlayback = [];

        this.selectedTracks.forEach(trackIndex => {
            if (trackIndex < tracksToUse.length) {
                const track = tracksToUse[trackIndex];
                if (track && track.notes) {
                    track.notes.forEach(note => {
                        if (note) {
                            this.allNotesForPlayback.push({
                                ...note,
                                trackName: track.name || `音轨 ${trackIndex + 1}`
                            });
                        }
                    });
                }
            }
        });

        this.allNotesForPlayback.sort((a, b) => (a.time || 0) - (b.time || 0));
        this.timeGroups = this.groupNotesByTime(this.allNotesForPlayback);
        this.updatePlaybackInfo();
    }

    // 更新播放信息
    updatePlaybackInfo(groupIndex = null, group = null) {
        const notesWithPedal = this.allNotesForPlayback.filter(note => note.withPedal).length;
        const pedalPercentage = this.allNotesForPlayback.length > 0 ?
            ((notesWithPedal / this.allNotesForPlayback.length) * 100).toFixed(1) : 0;

        let infoText = `已选择 ${this.selectedTracks.length} 个音轨，共 ${this.allNotesForPlayback.length} 个音符，${notesWithPedal} 个使用延音踏板(${pedalPercentage}%)，分为 ${this.timeGroups.length} 个时间点`;

        if (groupIndex !== null && group) {
            const notesCount = group.notes.length;
            const notesWithPedal = group.notes.filter(note => note.withPedal).length;
            const noteNames = group.notes.map(n => n.name).join(', ');
            const pedalInfo = notesWithPedal > 0 ? ` (${notesWithPedal}个使用踏板)` : '';
            infoText = `播放中... 时间点 ${groupIndex + 1}/${this.timeGroups.length} (${notesCount}个音符${pedalInfo}: ${noteNames})`;
        }

        this.fullscreenPlaybackInfo.textContent = infoText;
    }

    // 按时间分组音符
    groupNotesByTime(notes) {
        if (notes.length === 0) return [];

        const validNotes = notes.filter(note => note && note.time !== undefined);
        if (validNotes.length === 0) return [];

        const groups = [];
        let currentGroup = {
            time: validNotes[0].time,
            notes: [validNotes[0]]
        };

        for (let i = 1; i < validNotes.length; i++) {
            const note = validNotes[i];
            if (!note) continue;

            if (Math.abs(note.time - currentGroup.time) < 0.001) {
                currentGroup.notes.push(note);
            } else {
                groups.push(currentGroup);
                currentGroup = {
                    time: note.time,
                    notes: [note]
                };
            }
        }

        groups.push(currentGroup);
        return groups;
    }

    // 开始播放
    startPlayback() {
        if (this.isPlaying && !this.isPaused) return;

        if (this.timeGroups.length === 0) {
            this.updatePlaybackInfo();
            return;
        }

        if (this.isPaused) {
            this.resumePlayback();
            return;
        }

        this.isPlaying = true;
        this.isPaused = false;
        this.currentTimeIndex = 0;
        this.pausedTime = 0;
        this.isNaturalEnd = false; // 重置标记
        this.lastNoteEndTime = 0; // 记录最后一个音符的结束时间

        if (this.playbackSchedule) {
            this.playbackSchedule.stop();
            this.playbackSchedule = null;
        }

        if (this.scheduledEvents.length) {
            this.scheduledEvents.forEach(id => Tone.Transport.clear(id));
            this.scheduledEvents = [];
        }

        this.clearRainEffects();
        this.adjustLayoutForPlayback(true);

        // 播放时隐藏控制元素
        this.hideControls();

        Tone.Transport.cancel();
        Tone.Transport.bpm.value = this.currentMidiData.data.header.bpm || 120;

        this.clearKeyboardHighlights();

        this.timeGroups.forEach((group, index) => {
            const eventId = Tone.Transport.schedule(async (time) => {
                if (!this.isPlaying) return;

                const maxDuration = await this.playNotesSimultaneously(group.notes, time);

                // 更新最后一个音符的结束时间
                const groupEndTime = time + maxDuration;
                if (groupEndTime > this.lastNoteEndTime) {
                    this.lastNoteEndTime = groupEndTime;
                }

                this.updatePlaybackInfo(index, group);
                this.currentTimeIndex = index;

            }, group.time);
            this.scheduledEvents.push(eventId);
        });

        const totalDuration = this.currentMidiData.data.duration;
        const endEventId = Tone.Transport.schedule(() => {
            this.isNaturalEnd = true; // 标记为自然播放结束

            // 计算需要等待的时间（最后一个音符结束时间 + 延音时间）
            const currentTime = Tone.now();
            const waitTime = Math.max(0, (this.lastNoteEndTime - currentTime) * 1000);

            // 等待所有声音播放完毕后再切换背景
            setTimeout(() => {
                this.stopPlayback();
            }, waitTime);

        }, totalDuration + 0.1);
        this.scheduledEvents.push(endEventId);

        Tone.Transport.start();
        this.playbackStartTime = Tone.now();
        this.updatePlaybackInfo(0, this.timeGroups[0]);
    }

    // 调整播放时的布局
    adjustLayoutForPlayback(isPlaying) {
        if (isPlaying) {
            // 播放时只控制钢琴的播放状态类，不控制音轨选择界面的显示
            this.fullscreenPiano.classList.add('playing');
        } else {
            this.fullscreenPiano.classList.remove('playing');
        }
    }

    // 清除钢琴雨效果
    clearRainEffects() {
        if (this.rainContainer) {
            this.rainContainer.innerHTML = '';
        }
        this.activeRainElements = [];
    }

    // 继续播放
    resumePlayback() {
        if (!this.isPaused) return;

        this.isPlaying = true;
        this.isPaused = false;
        this.adjustLayoutForPlayback(true);
        Tone.Transport.start();

        const remainingGroups = this.timeGroups.slice(this.currentTimeIndex);
        remainingGroups.forEach((group, index) => {
            const absoluteIndex = this.currentTimeIndex + index;
            const eventId = Tone.Transport.schedule(async (time) => {
                if (!this.isPlaying) return;

                const maxDuration = await this.playNotesSimultaneously(group.notes, time);

                // 更新最后一个音符的结束时间
                const groupEndTime = time + maxDuration;
                if (groupEndTime > this.lastNoteEndTime) {
                    this.lastNoteEndTime = groupEndTime;
                }

                this.updatePlaybackInfo(absoluteIndex, group);

            }, group.time);
            this.scheduledEvents.push(eventId);
        });

        this.updatePlaybackInfo(this.currentTimeIndex, this.timeGroups[this.currentTimeIndex]);
    }

    // 清除琴键高亮
    clearKeyboardHighlights() {
        if (!this.fullscreenPianoKeyboard) return;
        const keys = this.fullscreenPianoKeyboard.querySelectorAll('.key.playing, .key.pedal-active');
        keys.forEach(key => {
            key.classList.remove('playing');
            key.classList.remove('pedal-active');
        });
    }

    // 暂停播放
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

            const infoText = `已暂停 - 当前位置: 时间点 ${this.currentTimeIndex + 1}/${this.timeGroups.length}`;
            this.fullscreenPlaybackInfo.textContent = infoText;

            // 暂停时立即显示控制元素
            this.showControls();
        }
    }

    // 停止播放
    stopPlayback() {
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
        this.adjustLayoutForPlayback(false);

        const infoText = `播放已停止 - 共 ${this.timeGroups.length} 个时间点`;
        this.fullscreenPlaybackInfo.textContent = infoText;

        // 清除定时器
        if (this.hideControlsTimeout) {
            clearTimeout(this.hideControlsTimeout);
            this.hideControlsTimeout = null;
        }

        // 如果是自然播放结束，则执行生日祝福效果
        if (this.isNaturalEnd) {
            this.showBirthdayWishes();
        } else {
            // 如果是手动停止，立即显示控制元素
            this.showControls();
        }
    }

    // 新增：显示生日祝福效果
    showBirthdayWishes() {
        // 切换背景图片
        const background = document.querySelector('.piano-background');
        if (background) {
            background.style.backgroundImage = "url('img/cake.jpg')";
        }

        // 等待2秒后显示祝福文字容器
        setTimeout(() => {
            const birthdayWishes = document.getElementById('birthdayWishes');
            if (birthdayWishes) {
                birthdayWishes.style.display = 'flex';
            }

            // 逐行显示祝福文字
            setTimeout(() => {
                this.showWishesLine('wishesLine1');
            }, 500);

            setTimeout(() => {
                this.showWishesLine('wishesLine2');
            }, 1500);

            setTimeout(() => {
                this.showWishesLine('wishesLine3');
            }, 2500);

            setTimeout(() => {
                this.showWishesLine('wishesLine4');
            }, 3000);

            // 在祝福文字显示完成后，等待4秒，然后显示控制元素
            setTimeout(() => {
                this.showControls();
            }, 6500); // 2.5秒（最后一行文字显示完成） + 4秒 = 6.5秒
        }, 1000); // 等待6.5秒后再显示音轨
    }

    // 新增：逐行显示祝福文字
    showWishesLine(lineId) {
        const line = document.getElementById(lineId);
        if (line) {
            line.classList.add('show');
        }
    }

    // 收起全屏钢琴时重置背景和祝福文字
    collapseFullscreen() {
        this.isFullscreen = false;
        document.body.classList.remove('fullscreen-mode');
        this.fullscreenPiano.classList.remove('active');
        this.stopPlayback();

        // 重置背景图片和祝福文字
        this.resetBirthdayWishes();
    }

    // 新增：重置生日祝福效果
    resetBirthdayWishes() {
        // 重置背景图片
        const background = document.querySelector('.piano-background');
        if (background) {
            background.style.backgroundImage = "url('img/background.jpg')";
        }

        // 隐藏祝福文字容器，并重置动画
        const birthdayWishes = document.getElementById('birthdayWishes');
        if (birthdayWishes) {
            birthdayWishes.style.display = 'none';

            // 移除所有行的显示类
            const wishesLines = birthdayWishes.querySelectorAll('.wishes-line');
            wishesLines.forEach(line => {
                line.classList.remove('show');
            });
        }
    }
}

// 初始化钢琴播放器
document.addEventListener('DOMContentLoaded', function () {
    window.midiPianoPlayer = new MIDIPianoPlayer();

    const originalPlayBtn = document.getElementById('playPianoBtn');
    if (originalPlayBtn) {
        originalPlayBtn.addEventListener('click', function () {
            if (!window.midiInfoDisplay || !window.midiInfoDisplay.currentMidiData) {
                window.midiInfoDisplay.showError('请先上传并解析MIDI文件');
                return;
            }

            document.dispatchEvent(new CustomEvent('initPianoPlayback', {
                detail: {
                    midiData: window.midiInfoDisplay.currentMidiData,
                    isPianoOnly: window.midiInfoDisplay.isPianoOnly
                }
            }));
        });
    }
});