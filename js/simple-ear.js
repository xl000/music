// simple-ear.js - 模块化版本，使用主页面加载的sampler
(function() {
    'use strict';

    const ScaleTraining = {
        sampler: null,
        isInitialized: false,
        
        // 配置常量
        octaveStart: 1,
        octaveEnd: 6,
        blackKeys: ["C#", "D#", "F#", "G#", "A#"],
        notes: ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"],
        
        // 状态变量
        baseNote: "A3",
        scaleType: "major",
        notationType: "solfa",
        currentBPM: 60,
        isTrainingActive: false,
        currentTestNote: null,
        userCanAnswer: false,
        scaleNotesForReplay: [],
        isDualNoteTraining: false,
        selectedIntervals: new Set(),
        solfegeMap: {},
        scaleNotes: [],

        // 初始化函数
        init: function(samplerInstance) {
            if (this.isInitialized) return;
            
            this.sampler = samplerInstance;
            this.isInitialized = true;
            
            console.log("音阶训练器初始化完成，使用共享音源");
            this.initializeApp();
        },

        // 应用初始化
        initializeApp: function() {
            this.createPiano();
            this.setupScrollArrows();
            this.createBaseNoteOptions();
            this.createScaleDisplay();
            this.setupBPMControls();
            this.setupSettingsPanel();
            this.setupModal();
            this.setupReplayButton();
            this.createIntervalOptions();
            this.validateIntervalSettings();
            this.setupIntervalButtons();
            this.setupEventListeners();
        },

        // 设置事件监听器
        setupEventListeners: function() {
            // 播放音阶按钮
            const playScaleBtn = document.getElementById('playScaleBtn');
            if (playScaleBtn) {
                playScaleBtn.addEventListener('click', () => {
                    this.playScale();
                });
            }

            // 随机训练按钮
            const randomTrainingBtn = document.getElementById('randomTrainingBtn');
            if (randomTrainingBtn) {
                randomTrainingBtn.addEventListener('click', () => {
                    this.startTraining();
                });
            }

            // 音阶方向
            const scaleDirection = document.getElementById('scaleDirection');
            if (scaleDirection) {
                scaleDirection.addEventListener('change', () => {
                    this.createScaleDisplay();
                });
            }

            // 基准音选择
            const baseNoteSelect = document.getElementById('baseNote');
            if (baseNoteSelect) {
                baseNoteSelect.addEventListener('change', () => {
                    this.baseNote = baseNoteSelect.value;
                    this.createScaleDisplay();
                    this.scrollToNote(this.baseNote);
                });
            }

            // 音阶类型
            const scaleTypeSelect = document.getElementById('scaleType');
            if (scaleTypeSelect) {
                scaleTypeSelect.addEventListener('change', () => {
                    this.scaleType = scaleTypeSelect.value;
                    this.createScaleDisplay();
                });
            }

            // 唱名表示方式
            const notationTypeSelect = document.getElementById('notationType');
            if (notationTypeSelect) {
                notationTypeSelect.addEventListener('change', () => {
                    this.notationType = notationTypeSelect.value;
                    this.createScaleDisplay();
                });
            }

            // 音阶显示点击事件
            const scaleDisplay = document.getElementById('scaleDisplay');
            if (scaleDisplay) {
                scaleDisplay.addEventListener('click', (e) => {
                    if (e.target.classList.contains('step-label')) {
                        const clickedNote = e.target.dataset.note;
                        this.handleUserAnswer(clickedNote);
                    }
                });
            }

            // 全局点击事件（设置面板）
            document.addEventListener('DOMContentLoaded', () => {
                document.addEventListener('click', (event) => {
                    this.handleGlobalClick(event);
                });
            });
        },

        // 创建钢琴键盘
        createPiano: function() {
            const piano = document.getElementById('piano');
            if (!piano) return;

            piano.innerHTML = '';

            for (let octave = this.octaveStart; octave <= this.octaveEnd; octave++) {
                for (let i = 0; i < this.notes.length; i++) {
                    const note = this.notes[i];
                    const fullNote = note + octave;
                    const isBlack = this.blackKeys.includes(note);

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
                            this.sampler.triggerAttackRelease(fullNote, 0.4);
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
                            this.sampler.triggerAttackRelease(fullNote, 0.4);
                        } catch (error) {
                            console.error("播放错误:", error);
                        }
                    });

                    piano.appendChild(key);
                }
            }
        },

        // 创建基准音选项
        createBaseNoteOptions: function() {
            const baseNoteSelect = document.getElementById('baseNote');
            if (!baseNoteSelect) return;

            baseNoteSelect.innerHTML = '';

            for (let octave = 2; octave <= 5; octave++) {
                for (let i = 0; i < this.notes.length; i++) {
                    const note = this.notes[i];
                    const fullNote = note + octave;

                    const option = document.createElement('option');
                    option.value = fullNote;
                    option.textContent = fullNote;

                    if (fullNote === this.baseNote) {
                        option.selected = true;
                    }

                    baseNoteSelect.appendChild(option);
                }
            }
        },

        // 节奏映射
        rhythmMap: {
            "whole": 4,
            "half": 2,
            "quarter": 1,
            "third": 1 / 3,
            "eighth": 0.5,
            "sixteenth": 0.25,
            "thirtysecond": 0.125,
            "sixtyfourth": 0.0625
        },

        // 唱名到数字映射
        solfaToNumber: {
            "do": "1", "re": "2", "mi": "3", "fa": "4", "sol": "5", "la": "6", "si": "7",
            "#do": "#1", "#re": "#2", "#mi": "#3", "#fa": "#4", "#sol": "#5", "#la": "#6", "#si": "#7",
            "bdo": "b1", "bre": "b2", "bmi": "b3", "bfa": "b4", "bsol": "b5", "bla": "b6", "bsi": "b7"
        },

        // 音程选项
        intervalOptions: [
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
        ],

        // 生成大调音阶
        generateMajorScale: function() {
            const majorScaleIntervals = [2, 2, 1, 2, 2, 2, 1];
            const baseNoteName = this.baseNote.replace(/\d+/, '');
            const baseOctave = parseInt(this.baseNote.match(/\d+/)[0]);
            let currentIndex = this.notes.indexOf(baseNoteName);
            let currentOctave = baseOctave;

            const ascendingScale = [this.baseNote];
            let cumulativeInterval = 0;

            for (let i = 0; i < majorScaleIntervals.length; i++) {
                cumulativeInterval += majorScaleIntervals[i];
                let nextIndex = (currentIndex + cumulativeInterval) % this.notes.length;
                let octaveOffset = Math.floor((currentIndex + cumulativeInterval) / this.notes.length);
                const nextNote = this.notes[nextIndex] + (currentOctave + octaveOffset);
                ascendingScale.push(nextNote);
            }

            const descendingScale = [];
            cumulativeInterval = 0;

            for (let i = majorScaleIntervals.length - 1; i >= 0; i--) {
                cumulativeInterval += majorScaleIntervals[i];
                let prevIndex = (currentIndex - cumulativeInterval + this.notes.length * 10) % this.notes.length;
                let octaveOffset = Math.floor((currentIndex - cumulativeInterval) / this.notes.length);
                const prevNote = this.notes[prevIndex] + (currentOctave + octaveOffset);
                descendingScale.unshift(prevNote);
            }

            this.scaleNotes = [...descendingScale, this.baseNote, ...ascendingScale.slice(1)];

            this.solfegeMap = {};
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

            for (let i = 0; i < this.scaleNotes.length; i++) {
                this.solfegeMap[this.scaleNotes[i]] = {
                    name: solfegeNames[i],
                    dot: dotPositions[i]
                };
            }
        },

        // 生成小调音阶
        generateMinorScale: function() {
            const minorScaleIntervals = [2, 1, 2, 2, 1, 2, 2];
            const baseNoteName = this.baseNote.replace(/\d+/, '');
            const baseOctave = parseInt(this.baseNote.match(/\d+/)[0]);
            let currentIndex = this.notes.indexOf(baseNoteName);
            let currentOctave = baseOctave;

            const ascendingScale = [this.baseNote];
            let cumulativeInterval = 0;

            for (let i = 0; i < minorScaleIntervals.length; i++) {
                cumulativeInterval += minorScaleIntervals[i];
                let nextIndex = (currentIndex + cumulativeInterval) % this.notes.length;
                let octaveOffset = Math.floor((currentIndex + cumulativeInterval) / this.notes.length);
                const nextNote = this.notes[nextIndex] + (currentOctave + octaveOffset);
                ascendingScale.push(nextNote);
            }

            const descendingScale = [];
            cumulativeInterval = 0;

            for (let i = minorScaleIntervals.length - 1; i >= 0; i--) {
                cumulativeInterval += minorScaleIntervals[i];
                let prevIndex = (currentIndex - cumulativeInterval + this.notes.length * 10) % this.notes.length;
                let octaveOffset = Math.floor((currentIndex - cumulativeInterval) / this.notes.length);
                const prevNote = this.notes[prevIndex] + (currentOctave + octaveOffset);
                descendingScale.unshift(prevNote);
            }

            this.scaleNotes = [...descendingScale, this.baseNote, ...ascendingScale.slice(1)];

            this.solfegeMap = {};
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

            for (let i = 0; i < this.scaleNotes.length; i++) {
                this.solfegeMap[this.scaleNotes[i]] = {
                    name: solfegeNames[i],
                    dot: dotPositions[i]
                };
            }
        },

        // 生成半音音阶
        generateChromaticScale: function() {
            const baseNoteName = this.baseNote.replace(/\d+/, '');
            const baseOctave = parseInt(this.baseNote.match(/\d+/)[0]);
            let currentIndex = this.notes.indexOf(baseNoteName);
            let currentOctave = baseOctave;

            const ascendingScale = [this.baseNote];
            for (let i = 1; i <= 12; i++) {
                const index = (currentIndex + i) % this.notes.length;
                const octaveOffset = Math.floor((currentIndex + i) / this.notes.length);
                const note = this.notes[index] + (currentOctave + octaveOffset);
                ascendingScale.push(note);
            }

            const descendingScale = [this.baseNote];
            for (let i = 1; i <= 12; i++) {
                const index = (currentIndex - i + this.notes.length * 10) % this.notes.length;
                const octaveOffset = Math.floor((currentIndex - i) / this.notes.length);
                const note = this.notes[index] + (currentOctave + octaveOffset);
                descendingScale.push(note);
            }

            this.scaleNotes = [...descendingScale, ...ascendingScale];

            this.solfegeMap = {};
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

            for (let i = 0; i < this.scaleNotes.length; i++) {
                this.solfegeMap[this.scaleNotes[i]] = {
                    name: solfegeNames[i],
                    dot: dotPositions[i]
                };
            }
        },

        // 生成音阶
        generateScale: function() {
            if (this.scaleType === "major") {
                this.generateMajorScale();
            } else if (this.scaleType === "minor") {
                this.generateMinorScale();
            } else if (this.scaleType === "chromatic") {
                this.generateChromaticScale();
            }
        },

        // 计算音符位置
        getNotePosition: function(noteStr) {
            const noteName = noteStr.replace(/\d+/, '');
            const octave = parseInt(noteStr.match(/\d+/)[0]);
            const noteIndex = this.notes.indexOf(noteName);
            return octave * 12 + noteIndex;
        },

        // 创建阶梯式唱名显示
        createScaleDisplay: function() {
            const scaleDisplay = document.getElementById('scaleDisplay');
            if (!scaleDisplay) return;

            scaleDisplay.innerHTML = '';
            this.generateScale();

            const direction = document.getElementById('scaleDirection').value;
            let scale, stepSolfege, stepDotPositions;

            if (this.scaleType === "chromatic") {
                if (direction === 'ascending') {
                    scale = this.scaleNotes.slice(13);
                    stepSolfege = scale.map(note => this.solfegeMap[note].name);
                    stepDotPositions = scale.map(note => this.solfegeMap[note].dot);
                } else {
                    scale = this.scaleNotes.slice(0, 13);
                    stepSolfege = scale.map(note => this.solfegeMap[note].name);
                    stepDotPositions = scale.map(note => this.solfegeMap[note].dot);
                }
            } else {
                if (direction === 'ascending') {
                    scale = this.scaleNotes.slice(7, 15);
                    stepSolfege = scale.map(note => this.solfegeMap[note].name);
                    stepDotPositions = scale.map(note => this.solfegeMap[note].dot);
                } else {
                    scale = [...this.scaleNotes.slice(0, 8)].reverse();

                    if (this.scaleType === "major") {
                        stepSolfege = ["do", "si", "la", "sol", "fa", "mi", "re", "do"];
                        stepDotPositions = ["none", "below", "below", "below", "below", "below", "below", "below"];
                    } else {
                        stepSolfege = ["la", "sol", "fa", "mi", "re", "do", "si", "la"];
                        stepDotPositions = ["none", "none", "none", "none", "none", "none", "below", "below"];
                    }
                }
            }

            if (this.notationType === "number") {
                stepSolfege = stepSolfege.map(name => {
                    if (name.startsWith("#") || name.startsWith("b")) {
                        const baseName = name.substring(1);
                        const prefix = name[0];
                        return prefix + (this.solfaToNumber[baseName] || name);
                    }
                    return this.solfaToNumber[name] || name;
                });
            }

            const firstNote = scale[0];
            const lastNote = scale[scale.length - 1];
            let totalSemitones;

            if (direction === 'ascending') {
                totalSemitones = this.getNotePosition(lastNote) - this.getNotePosition(firstNote);
            } else {
                totalSemitones = this.getNotePosition(firstNote) - this.getNotePosition(lastNote);
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
                    semitonesFromFirst = this.getNotePosition(note) - this.getNotePosition(firstNote);
                } else {
                    semitonesFromFirst = this.getNotePosition(firstNote) - this.getNotePosition(note);
                }

                if (direction === 'ascending') {
                    step.style.marginBottom = `${semitonesFromFirst * H}px`;
                } else {
                    step.style.marginTop = `${semitonesFromFirst * H}px`;
                }

                scaleDisplay.appendChild(step);
            });
        },

        // 播放音阶
        playScale: async function() {
            if (!this.validateBPMInput()) {
                return;
            }

            const direction = document.getElementById('scaleDirection').value;
            let scale;

            if (this.scaleType === "chromatic") {
                if (direction === 'ascending') {
                    scale = this.scaleNotes.slice(13);
                } else {
                    scale = this.scaleNotes.slice(0, 13);
                }
            } else {
                if (direction === 'ascending') {
                    scale = this.scaleNotes.slice(7, 15);
                } else {
                    scale = [...this.scaleNotes.slice(0, 8)].reverse();
                }
            }

            const playScaleBtn = document.getElementById('playScaleBtn');
            const randomTrainingBtn = document.getElementById('randomTrainingBtn');
            
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

                const rhythmValue = document.getElementById('rhythmSelect').value;
                const beatValue = this.rhythmMap[rhythmValue] || 0.5;
                const interval = (60 / this.currentBPM) * beatValue * 1000;

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

                    this.sampler.triggerAttackRelease(note, beatValue);
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
        },

        // 计算两个音符之间的半音数
        getSemitonesBetween: function(note1, note2) {
            const position1 = this.getNotePosition(note1);
            const position2 = this.getNotePosition(note2);
            return Math.abs(position1 - position2);
        },

        // 根据半音数获取音程ID
        getIntervalId: function(semitones) {
            for (const interval of this.intervalOptions) {
                if (interval.semitones === semitones) {
                    return interval.id;
                }
            }
            return null;
        },

        // 开始训练
        startTraining: async function() {
            if (!this.validateBPMInput()) {
                return;
            }

            // 验证音程设置
            if (!this.validateIntervalSettings()) {
                return;
            }

            const playScaleBtn = document.getElementById('playScaleBtn');
            const randomTrainingBtn = document.getElementById('randomTrainingBtn');
            const replayTestNoteBtn = document.getElementById('replayTestNoteBtn');
            
            playScaleBtn.disabled = true;
            randomTrainingBtn.disabled = true;
            replayTestNoteBtn.style.display = 'none';

            // 先添加visible类，然后再清除active类
            const trainingMethod = document.getElementById('trainingMethod').value;
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
                const trainingMode = document.getElementById('trainingMode').value;
                this.isDualNoteTraining = (trainingMode === 'dual');

                // 获取训练方式
                const trainingMethod = document.getElementById('trainingMethod').value;

                const rhythmValue = document.getElementById('rhythmSelect').value;
                const beatValue = this.rhythmMap[rhythmValue] || 0.5;
                const interval = (60 / this.currentBPM) * beatValue * 1000;

                // 保存当前音阶用于再听一遍功能
                const direction = document.getElementById('scaleDirection').value;
                let scale;

                if (this.scaleType === "chromatic") {
                    if (direction === 'ascending') {
                        scale = this.scaleNotes.slice(13);
                    } else {
                        scale = this.scaleNotes.slice(0, 13);
                    }
                } else {
                    if (direction === 'ascending') {
                        scale = this.scaleNotes.slice(7, 15);
                    } else {
                        scale = [...this.scaleNotes.slice(0, 8)].reverse();
                    }
                }

                this.scaleNotesForReplay = [...scale];

                // 根据训练方式决定是否播放整个音阶
                if (trainingMethod === 'fullScale') {
                    // 首先播放整个音阶
                    for (let i = 0; i < scale.length; i++) {
                        const note = scale[i];
                        const step = document.querySelector(`.step[data-note="${note}"]`);
                        const pianoKey = document.getElementById(`key-${note}`);
                        const standardKey = document.getElementById(`key-${this.baseNote}`);

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
                        if (this.isDualNoteTraining) {
                            if (standardKey) {
                                standardKey.classList.add('playing-dual');
                                void standardKey.offsetHeight;
                            }
                            this.sampler.triggerAttackRelease([this.baseNote, note], beatValue);
                        } else {
                            this.sampler.triggerAttackRelease(note, beatValue);
                        }

                        await new Promise(resolve => setTimeout(resolve, interval));

                        if (step) step.classList.remove('active');
                        if (pianoKey) pianoKey.classList.remove('playing');
                        if (this.isDualNoteTraining && standardKey) standardKey.classList.remove('playing-dual');
                    }

                    // 停顿1个节奏的时间
                    await new Promise(resolve => setTimeout(resolve, interval));
                } else {
                    // 如果是双音训练，直接跳过播放基准音，因为后面会播放双音
                    if (!this.isDualNoteTraining) {
                        // 只播放基准音（单音训练时才播放）
                        const standardKey = document.getElementById(`key-${this.baseNote}`);
                        if (standardKey) {
                            standardKey.classList.add('playing');
                            void standardKey.offsetHeight;
                        }

                        this.sampler.triggerAttackRelease(this.baseNote, beatValue);
                        await new Promise(resolve => setTimeout(resolve, interval));

                        if (standardKey) standardKey.classList.remove('playing');
                    }
                }

                // 随机选择一个音符（包括第一个和最后一个）
                // 获取当前音阶类型和方向所包含的音程（半音数）集合
                const scaleIntervalSet = this.getScaleIntervals(this.scaleType, direction);

                // 获取用户选择的音程范围对应的半音数集合
                const selectedSemitones = new Set();
                for (const intervalId of this.selectedIntervals) {
                        const interval = this.intervalOptions.find(opt => opt.id === intervalId);
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
                const baseNoteName = this.baseNote.replace(/\d+/, '');
                const baseOctave = parseInt(this.baseNote.match(/\d+/)[0]);
                const basePosition = this.getNotePosition(this.baseNote);

                for (let octave = baseOctave - 1; octave <= baseOctave + 1; octave++) {
                    for (let i = 0; i < this.notes.length; i++) {
                        const note = this.notes[i] + octave;
                        const notePosition = this.getNotePosition(note);
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
                this.currentTestNote = possibleNotes[randomIndex];
                console.log("--- 随机训练信息 ---");
                console.log(`基准音: ${this.baseNote}`);
                console.log(`训练音: ${this.currentTestNote}`);
                const semitones = this.getSemitonesBetween(this.baseNote, this.currentTestNote);
                const intervalId = this.getIntervalId(semitones);
                const intervalName = this.intervalOptions.find(opt => opt.id === intervalId)?.name || "未知音程";
                console.log(`音程: ${intervalName} (${semitones}个半音)`);
                console.log("-------------------");

                // 播放测试音符（不显示高亮）
                if (this.isDualNoteTraining) {
                    // 双音训练：同时播放基准音和测试音符
                    this.sampler.triggerAttackRelease([this.baseNote, this.currentTestNote], beatValue * 2);
                } else {
                    // 单音训练：只播放测试音符
                    this.sampler.triggerAttackRelease(this.currentTestNote, beatValue * 2);
                }

                // 允许用户回答
                this.userCanAnswer = true;
                this.isTrainingActive = true;

                // 显示再听一遍按钮
                replayTestNoteBtn.style.display = 'block';

            } catch (error) {
                console.error("训练错误:", error);
                this.resetTrainingState();
            }
        },

        // 处理用户回答
        handleUserAnswer: function(clickedNote) {
            if (!this.isTrainingActive || !this.userCanAnswer) return;

            const isCorrect = clickedNote === this.currentTestNote;

            if (isCorrect) {
                this.playCheerEffect();
                this.showModal("正确！", "太棒了！你答对了！");
            } else {
                this.showModal("再试一次", "不正确，请再试一次");
            }

            if (isCorrect) {
                this.resetTrainingState();
            }
        },

        // 播放欢呼效果
        playCheerEffect: function() {
            try {
                this.sampler.triggerAttackRelease([this.baseNote, this.currentTestNote], 1);

                const step = document.querySelector(`.step[data-note="${this.currentTestNote}"]`);
                if (step) {
                    const label = step.querySelector('.step-label');
                    if (label) {
                        label.classList.add('cheer-effect');
                        this.createSparkles(step);
                        setTimeout(() => {
                            label.classList.remove('cheer-effect');
                        }, 1000);
                    }
                }
            } catch (error) {
                console.error("播放欢呼效果错误:", error);
            }
        },

        // 创建火花效果
        createSparkles: function(element) {
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
        },

        // 重置训练状态
        resetTrainingState: function() {
            this.isTrainingActive = false;
            this.userCanAnswer = false;
            this.currentTestNote = null;

            const playScaleBtn = document.getElementById('playScaleBtn');
            const randomTrainingBtn = document.getElementById('randomTrainingBtn');
            const replayTestNoteBtn = document.getElementById('replayTestNoteBtn');
            
            playScaleBtn.disabled = false;
            randomTrainingBtn.disabled = false;
            replayTestNoteBtn.style.display = 'none';

            document.querySelectorAll('.step').forEach(step => {
                step.classList.remove('active');
            });
        },

        // 滚动到指定音符的位置
        scrollToNote: function(note) {
            const pianoContainer = document.querySelector('.piano-container');
            const key = document.getElementById(`key-${note}`);
            if (key && pianoContainer) {
                const containerWidth = pianoContainer.clientWidth;
                const keyPosition = key.offsetLeft - (containerWidth / 2) + (key.clientWidth / 2);
                pianoContainer.scrollTo({
                    left: keyPosition,
                    behavior: 'smooth'
                });
            }
        },

        // 设置滚动箭头
        setupScrollArrows: function() {
            const pianoContainer = document.querySelector('.piano-container');
            const leftArrow = document.querySelector('.left-arrow');
            const rightArrow = document.querySelector('.right-arrow');

            if (!pianoContainer || !leftArrow || !rightArrow) return;

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
        },

        // 根据音阶类型和方向获取该音阶包含的音程（半音数）集合
        getScaleIntervals: function(scaleType, direction) {
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
        },

        // 创建音程范围选项
        createIntervalOptions: function() {
            const intervalGrid = document.getElementById('intervalGrid');
            if (!intervalGrid) return;

            intervalGrid.innerHTML = '';

            this.intervalOptions.forEach(interval => {
                const item = document.createElement('div');
                item.className = 'interval-item';

                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.id = `interval-${interval.id}`;
                checkbox.value = interval.id;
                checkbox.checked = true;
                checkbox.addEventListener('change', (e) => this.handleIntervalChange(e));

                const label = document.createElement('label');
                label.htmlFor = `interval-${interval.id}`;
                label.textContent = interval.name;

                item.appendChild(checkbox);
                item.appendChild(label);
                intervalGrid.appendChild(item);

                // 添加到选中集合
                this.selectedIntervals.add(interval.id);
            });
        },

        // 处理音程范围选择变化
        handleIntervalChange: function(e) {
            const intervalId = e.target.value;

            if (e.target.checked) {
                this.selectedIntervals.add(intervalId);
            } else {
                this.selectedIntervals.delete(intervalId);
            }

            // 验证设置并更新按钮状态
            this.validateIntervalSettings();
        },

        // 验证音程设置并更新按钮状态
        validateIntervalSettings: function() {
            const isValid = this.isIntervalSettingsValid();

            // 更新按钮状态
            const randomTrainingBtn = document.getElementById('randomTrainingBtn');
            const replayTestNoteBtn = document.getElementById('replayTestNoteBtn');
            
            if (randomTrainingBtn) randomTrainingBtn.disabled = !isValid;
            if (replayTestNoteBtn) replayTestNoteBtn.disabled = !isValid;

            return isValid;
        },

        // 检查音程设置是否有效
        isIntervalSettingsValid: function() {
            // 1. 检查是否至少选择了一个音程
            if (this.selectedIntervals.size === 0) {
                this.showModal("设置错误", "请至少选择一个音程范围，否则无法生成训练音");
                return false;
            }

            // 2. 检查是否能生成训练音
            if (!this.canGenerateTrainingNotes()) {
                this.showModal("设置错误", "当前选择的音程范围不属于当前音阶类型的音程范围，这将导致无法生成训练音，请调整设置");
                return false;
            }

            return true;
        },

        // 检查是否能生成训练音
        canGenerateTrainingNotes: function() {
            const direction = document.getElementById('scaleDirection').value;
            
            // 获取当前音阶类型和方向所包含的音程（半音数）集合
            const scaleIntervalSet = this.getScaleIntervals(this.scaleType, direction);

            // 获取用户选择的音程范围对应的半音数集合
            const selectedSemitones = new Set();
            for (const intervalId of this.selectedIntervals) {
                const interval = this.intervalOptions.find(opt => opt.id === intervalId);
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
        },

        // 设置音程范围按钮功能
        setupIntervalButtons: function() {
            const selectAllBtn = document.getElementById('selectAllIntervals');
            const deselectAllBtn = document.getElementById('deselectAllIntervals');

            if (!selectAllBtn || !deselectAllBtn) return;

            selectAllBtn.addEventListener('click', () => {
                // 选中所有复选框
                document.querySelectorAll('.interval-item input[type="checkbox"]').forEach(checkbox => {
                    checkbox.checked = true;
                    // 更新selectedIntervals集合
                    this.selectedIntervals.add(checkbox.value);
                });
                this.validateIntervalSettings();
            });

            deselectAllBtn.addEventListener('click', () => {
                // 取消选中所有复选框
                document.querySelectorAll('.interval-item input[type="checkbox"]').forEach(checkbox => {
                    checkbox.checked = false;
                    // 更新selectedIntervals集合
                    this.selectedIntervals.delete(checkbox.value);
                });

                // 自动选择纯一度（P1）
                const p1Checkbox = document.querySelector('input[value="P1"]');
                if (p1Checkbox) {
                    p1Checkbox.checked = true;
                    this.selectedIntervals.add("P1");
                }

                // 显示提示
                this.showModal("提示", "已自动选择纯一度，因为至少需要一个音程范围");

                this.validateIntervalSettings();
            });
        },

        // 设置BPM控制
        setupBPMControls: function() {
            const bpmInput = document.getElementById('bpmInput');
            if (!bpmInput) return;

            bpmInput.value = this.currentBPM;

            bpmInput.addEventListener('input', () => {
                this.validateBPMInput();
            });

            bpmInput.addEventListener('change', () => {
                this.validateBPMInput();
            });

            bpmInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    this.validateBPMInput();
                }
            });
        },

        // 验证BPM输入
        validateBPMInput: function() {
            const bpmInput = document.getElementById('bpmInput');
            const bpmError = document.getElementById('bpmError');
            const playScaleBtn = document.getElementById('playScaleBtn');
            const randomTrainingBtn = document.getElementById('randomTrainingBtn');
            
            if (!bpmInput || !bpmError) return false;

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
                this.currentBPM = value;
                isValid = true;
            }

            if (playScaleBtn) playScaleBtn.disabled = !isValid;
            if (randomTrainingBtn) randomTrainingBtn.disabled = !isValid;
            
            return isValid;
        },

        // 设置设置面板
        setupSettingsPanel: function() {
            const toggleSettingsBtn = document.getElementById('toggleSettingsBtn');
            const settingsPanel = document.getElementById('settingsPanel');
            
            if (!toggleSettingsBtn || !settingsPanel) return;

            toggleSettingsBtn.addEventListener('click', function (e) {
                e.stopPropagation();
                const isExpanded = settingsPanel.classList.toggle('expanded');
                toggleSettingsBtn.textContent = isExpanded ? '收起设置' : '设置面板';

                // 根据面板状态启用/禁用按钮
                const playScaleBtn = document.getElementById('playScaleBtn');
                const randomTrainingBtn = document.getElementById('randomTrainingBtn');
                const replayTestNoteBtn = document.getElementById('replayTestNoteBtn');
                
                if (playScaleBtn) playScaleBtn.disabled = isExpanded;
                if (randomTrainingBtn) randomTrainingBtn.disabled = isExpanded;
                if (replayTestNoteBtn) replayTestNoteBtn.disabled = isExpanded;

                // 当面板收起时刷新页面并更新设置
                if (!isExpanded) {
                    setTimeout(() => {
                        this.resetTrainingState();
                        this.createScaleDisplay();
                        this.scrollToNote(this.baseNote);
                    }, 0);
                }
            }.bind(this));
        },

        // 设置再听一遍按钮
        setupReplayButton: function() {
            const replayTestNoteBtn = document.getElementById('replayTestNoteBtn');
            if (!replayTestNoteBtn) return;

            replayTestNoteBtn.addEventListener('click', () => {
                if (this.currentTestNote) {
                    this.replayTestNote();
                }
            });
        },

        // 再听一遍功能
        replayTestNote: async function() {
            if (!this.currentTestNote || this.scaleNotesForReplay.length === 0) return;

            const replayTestNoteBtn = document.getElementById('replayTestNoteBtn');
            const randomTrainingBtn = document.getElementById('randomTrainingBtn');
            
            // 禁用按钮防止重复点击
            replayTestNoteBtn.disabled = true;
            randomTrainingBtn.disabled = true;

            // 新增代码 - 在baseNoteOnly模式下显示所有音阶音符
            const trainingMethod = document.getElementById('trainingMethod').value;
            if (trainingMethod === 'baseNoteOnly') {
                document.querySelectorAll('.step').forEach(step => {
                    step.classList.add('visible');
                });
            }

            try {
                // 获取节奏值
                const rhythmValue = document.getElementById('rhythmSelect').value;
                const beatValue = this.rhythmMap[rhythmValue] || 0.5;
                const interval = (60 / this.currentBPM) * beatValue * 1000;

                // 确保音频上下文已启动
                if (Tone.context.state !== 'running') {
                    await Tone.start();
                }

                // 获取训练方式
                const trainingMethod = document.getElementById('trainingMethod').value;

                // 1. 根据训练方式决定是否播放整个音阶
                if (trainingMethod === 'fullScale') {
                    // 播放整个音阶
                    for (let i = 0; i < this.scaleNotesForReplay.length; i++) {
                        const note = this.scaleNotesForReplay[i];
                        const step = document.querySelector(`.step[data-note="${note}"]`);
                        const pianoKey = document.getElementById(`key-${note}`);
                        const standardKey = document.getElementById(`key-${this.baseNote}`);

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
                        if (this.isDualNoteTraining) {
                            if (standardKey) {
                                standardKey.classList.add('playing-dual');
                                void standardKey.offsetHeight;
                            }
                            this.sampler.triggerAttackRelease([this.baseNote, note], beatValue);
                        } else {
                            this.sampler.triggerAttackRelease(note, beatValue);
                        }

                        await new Promise(resolve => setTimeout(resolve, interval));

                        if (step) step.classList.remove('active');
                        if (pianoKey) pianoKey.classList.remove('playing');
                        if (this.isDualNoteTraining && standardKey) standardKey.classList.remove('playing-dual');
                    }

                    // 停顿1个节奏的时间
                    await new Promise(resolve => setTimeout(resolve, interval));
                } else {
                    // 如果是双音训练，直接跳过播放基准音，因为后面会播放双音
                    if (!this.isDualNoteTraining) {
                        // 只播放基准音（单音训练时才播放）
                        const standardKey = document.getElementById(`key-${this.baseNote}`);
                        if (standardKey) {
                            standardKey.classList.add('playing');
                            void standardKey.offsetHeight;
                        }

                        this.sampler.triggerAttackRelease(this.baseNote, beatValue);
                        await new Promise(resolve => setTimeout(resolve, interval));

                        if (standardKey) standardKey.classList.remove('playing');
                    }
                }

                // 2. 再播放测试音符
                const testKey = document.getElementById(`key-${this.currentTestNote}`);
                const standardKey = document.getElementById(`key-${this.baseNote}`);

                if (this.isDualNoteTraining) {
                    // 双音训练：同时播放基准音和测试音符
                    this.sampler.triggerAttackRelease([this.baseNote, this.currentTestNote], beatValue * 2);
                } else {
                    // 单音训练：只播放测试音符
                    this.sampler.triggerAttackRelease(this.currentTestNote, beatValue * 2);
                }

            } catch (error) {
                console.error("再听一遍错误:", error);
            } finally {
                // 重新启用按钮
                replayTestNoteBtn.disabled = false;
                randomTrainingBtn.disabled = false;
            }
        },

        // 设置模态框
        setupModal: function() {
            const modalBtn = document.getElementById('modalBtn');
            if (!modalBtn) return;

            modalBtn.addEventListener('click', () => {
                const resultModal = document.getElementById('resultModal');
                if (resultModal) {
                    resultModal.style.display = 'none';
                }
            });
        },

        // 显示模态框
        showModal: function(title, message) {
            const resultModal = document.getElementById('resultModal');
            const modalTitle = document.getElementById('modalTitle');
            const modalMessage = document.getElementById('modalMessage');
            
            if (!resultModal || !modalTitle || !modalMessage) return;

            modalTitle.textContent = title;
            modalMessage.textContent = message;
            resultModal.style.display = 'flex';
        },

        // 处理全局点击事件
        handleGlobalClick: function(event) {
            const settingsPanel = document.getElementById('settingsPanel');
            const toggleBtn = document.getElementById('toggleSettingsBtn');
            const resultModal = document.getElementById('resultModal');

            if (!settingsPanel || !toggleBtn) return;

            // 检查点击是否发生在设置面板、切换按钮或模态框上
            const isClickInsideSettings = settingsPanel.contains(event.target) ||
                toggleBtn === event.target ||
                toggleBtn.contains(event.target);

            const isClickInsideModal = resultModal && resultModal.contains(event.target);

            // 如果点击发生在外部且面板是展开的，并且点击的不是模态框内容，则尝试收起面板
            if (!isClickInsideSettings && !isClickInsideModal && settingsPanel.classList.contains('expanded')) {
                // 首先验证音程设置
                if (!this.validateIntervalSettings()) {
                    // 如果设置无效，阻止收起面板并显示错误提示
                    this.showModal("设置错误", "请至少选择一个有效的音程范围");
                    return;
                }

                // 设置有效，收起面板
                settingsPanel.classList.remove('expanded');
                toggleBtn.textContent = '设置面板';

                // 新增代码：在面板收起后立即刷新页面并更新设置
                setTimeout(() => {
                    this.resetTrainingState();
                    this.createScaleDisplay();
                    this.scrollToNote(this.baseNote);
                }, 0);
            }
        }
    };

    // 暴露到全局
    window.ScaleTraining = ScaleTraining;
})();