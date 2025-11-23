// pure-piano.js - 钢琴核心功能模块

// 钢琴键盘配置 - 扩展到A0到C8（88键标准钢琴）
const octaveStart = 0; // 从A0开始
const octaveEnd = 8;   // 到C8结束
const blackKeys = ["C#", "D#", "F#", "G#", "A#"];

// 音效控制变量
let noteDuration = 0.8; // 默认0.4秒

// 初始化Tone.js - 使用本地下载的音源
const sampler = new Tone.Sampler({
    urls: {
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
    },
    baseUrl: "./sounds/",
    onload: () => {
        console.log("本地钢琴音源加载完成");
    },
    onerror: (error) => {
        console.error("音源加载错误:", error);
    }
}).toDestination();

// 当前选中的音符
let selectedNotes = [];
let noteCount = 0;

// 计算琴键总数
function getTotalKeys() {
    let total = 0;
    for (let octave = octaveStart; octave <= octaveEnd; octave++) {
        if (octave === 0) {
            total += 3;
        } else if (octave === 8) {
            total += 1;
        } else {
            total += 12;
        }
    }
    return total;
}

// 创建钢琴键盘
function createPiano(pianoElement, onNoteSelect = null) {
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
                    if (Tone.context.state !== 'running') {
                        await Tone.start();
                    }

                    key.classList.add('playing');
                    setTimeout(() => key.classList.remove('playing'), 300);
                    sampler.triggerAttackRelease(fullNote, noteDuration);

                    // 调用外部回调函数
                    if (onNoteSelect && typeof onNoteSelect === 'function') {
                        onNoteSelect(fullNote, selectedNotes, noteCount);
                    }
                } catch (error) {
                    console.error("播放错误:", error);
                }
            });

            // 触摸事件支持
            key.addEventListener('touchstart', async (e) => {
                e.preventDefault();
                try {
                    if (Tone.context.state !== 'running') {
                        await Tone.start();
                    }

                    key.classList.add('playing');
                    setTimeout(() => key.classList.remove('playing'), 300);
                    sampler.triggerAttackRelease(fullNote, noteDuration);

                    if (onNoteSelect && typeof onNoteSelect === 'function') {
                        onNoteSelect(fullNote, selectedNotes, noteCount);
                    }
                } catch (error) {
                    console.error("播放错误:", error);
                }
            });

            pianoElement.appendChild(key);
        }
    }

    highlightSelectedKeys(pianoElement);
}

// 高亮选中的琴键
function highlightSelectedKeys(pianoElement) {
    if (!pianoElement) return;
    
    pianoElement.querySelectorAll('.key').forEach(key => {
        key.classList.remove('selected');
        const positionIndicator = key.querySelector('.position-indicator');
        if (positionIndicator) {
            positionIndicator.remove();
        }
    });

    selectedNotes.forEach((note, index) => {
        const key = pianoElement.querySelector(`.key[data-note="${note}"]`);
        if (key) {
            key.classList.add('selected');
            const positionIndicator = document.createElement('div');
            positionIndicator.className = 'position-indicator';
            positionIndicator.textContent = index + 1;
            key.appendChild(positionIndicator);
        }
    });
}

// 添加音符到选择
function addNoteToSelection(note) {
    if (!selectedNotes.includes(note)) {
        if (selectedNotes.length < noteCount) {
            selectedNotes.push(note);
            return true;
        }
    }
    return false;
}

// 移除音符从选择
function removeNoteFromSelection(note) {
    const index = selectedNotes.indexOf(note);
    if (index > -1) {
        selectedNotes.splice(index, 1);
        return true;
    }
    return false;
}

// 清空选择
function clearSelection() {
    selectedNotes = [];
}

// 设置音符数量限制
function setNoteCount(count) {
    noteCount = Math.max(1, count);
    if (selectedNotes.length > noteCount) {
        selectedNotes = selectedNotes.slice(0, noteCount);
    }
}

// 获取当前选中的音符
function getSelectedNotes() {
    return [...selectedNotes];
}

// 设置选中的音符
function setSelectedNotes(notes) {
    selectedNotes = [...notes].slice(0, noteCount);
}

// 在 pure-piano.js 中修改 playNote 函数
async function playNote(noteName, duration = 0.8, startTime = null) {
    try {
        await Tone.start(); // 确保音频上下文已启动
        
        const now = startTime || Tone.now();
        
        // 使用采样器而不是每次都创建新的合成器
        sampler.triggerAttackRelease(noteName, duration, now);
        
        // 高亮琴键
        const key = pianoKeyboard ? pianoKeyboard.querySelector(`.key[data-note="${noteName}"]`) : null;
        if (key) {
            key.classList.add('playing');
            setTimeout(() => {
                key.classList.remove('playing');
            }, duration * 1000);
        }
        
    } catch (error) {
        console.error("播放音符错误:", error);
        // 如果采样器失败，回退到合成器
        try {
            const synth = new Tone.Synth().toDestination();
            const now = startTime || Tone.now();
            synth.triggerAttackRelease(noteName, duration, now);
            
            setTimeout(() => {
                synth.dispose();
            }, duration * 1000 + 100);
        } catch (fallbackError) {
            console.error("回退播放也失败:", fallbackError);
        }
    }
}

// 添加新的同时播放多个音符的函数
async function playNotesSimultaneously(noteNames, duration = 0.8) {
    try {
        await Tone.start();
        
        const startTime = Tone.now() + 0.1; // 100ms后开始，确保调度准确
        
        // 使用Promise.all确保所有音符同时开始调度
        const playPromises = noteNames.map(noteName => 
            playNote(noteName, duration, startTime)
        );
        
        await Promise.all(playPromises);
        
    } catch (error) {
        console.error("同时播放音符错误:", error);
    }
}

// 设置音符持续时间
function setNoteDuration(duration) {
    noteDuration = Math.max(0.8, duration);
}

// 获取完整的88键音符列表
function getAllPianoNotes() {
    const notes = [];
    for (let midi = 21; midi <= 108; midi++) {
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

// 获取采样器实例
function getSampler() {
    return sampler;
}

// 导出功能
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        createPiano,
        highlightSelectedKeys,
        addNoteToSelection,
        removeNoteFromSelection,
        clearSelection,
        setNoteCount,
        getSelectedNotes,
        setSelectedNotes,
        playNote,
        setNoteDuration,
        getAllPianoNotes,
        getNoteName,
        isBlackKey,
        getSampler,
        getTotalKeys
    };
}