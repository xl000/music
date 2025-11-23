// parser.js - .sim 文件解析器
class SIMParser {
    constructor() {
        this.notes = [];
        this.chordDetectionThreshold = 0.05; // 和声检测时间阈值（秒）
    }

    // 解析 .sim 文件内容
    parse(content) {
        try {
            this.notes = [];

            // 按行分割内容
            const lines = content.split('\n');

            for (let line of lines) {
                // 清理行内容：移除多余空格和制表符
                const cleanedLine = line.trim().replace(/\t/g, ' ');

                // 使用两个或以上空格作为列分隔符
                const columns = cleanedLine.split(/\s{2,}/).filter(col => col.trim() !== '');

                // 检查是否为有效的音符行（至少有5列，第二列为"音符"）
                if (columns.length >= 5 && columns[1] === '音符') {
                    const noteInfo = this.parseNoteLine(columns);
                    if (noteInfo) {
                        this.notes.push(noteInfo);
                    }
                }
            }

            // 按播放时间排序
            this.notes.sort((a, b) => a.time - b.time);

            // 检测和声并添加踏板标记
            this.detectChordsAndAddPedal();

            return {
                success: true,
                notes: this.notes,
                totalNotes: this.notes.length,
                totalChords: this.countChords(),
                duration: this.notes.length > 0 ? this.notes[this.notes.length - 1].time : 0
            };

        } catch (error) {
            console.error('解析 .sim 文件时出错:', error);
            return {
                success: false,
                error: error.message,
                notes: [],
                totalNotes: 0,
                duration: 0
            };
        }
    }

    // 检测和声并为和声内的音符添加踏板标记
    detectChordsAndAddPedal() {
        if (this.notes.length === 0) return;

        let currentChord = [];
        let chordStartTime = this.notes[0].time;

        for (let i = 0; i < this.notes.length; i++) {
            const currentNote = this.notes[i];
            
            // 检查当前音符是否属于当前和声
            if (currentChord.length === 0 || 
                Math.abs(currentNote.time - chordStartTime) <= this.chordDetectionThreshold) {
                
                // 添加到当前和声
                currentChord.push(currentNote);
                chordStartTime = currentNote.time; // 更新和声开始时间为第一个音符的时间
            } else {
                // 检测到新的和声开始，处理前一个和声
                if (currentChord.length > 1) {
                    this.markChordWithPedal(currentChord);
                }
                
                // 开始新的和声
                currentChord = [currentNote];
                chordStartTime = currentNote.time;
            }
        }

        // 处理最后一个和声
        if (currentChord.length > 1) {
            this.markChordWithPedal(currentChord);
        }
    }

    // 为和声内的所有音符标记踏板
    markChordWithPedal(chordNotes) {
        // 计算和声的平均时间（用于确定和声的准确时间点）
        const avgTime = chordNotes.reduce((sum, note) => sum + note.time, 0) / chordNotes.length;
        
        // 为和声内的每个音符添加踏板标记和和声信息
        chordNotes.forEach(note => {
            note.withPedal = true;
            note.isChord = true;
            note.chordSize = chordNotes.length;
            note.chordTime = avgTime;
            note.chordNotes = chordNotes.map(n => n.name); // 存储和声中的所有音符名称
        });

        console.log(`检测到和声: ${chordNotes.map(n => n.name).join(', ')} (时间: ${avgTime.toFixed(3)}s)`);
    }

    // 统计和声数量
    countChords() {
        const chordNotes = this.notes.filter(note => note.isChord);
        const uniqueChords = new Set();
        
        chordNotes.forEach(note => {
            if (note.chordTime !== undefined) {
                uniqueChords.add(note.chordTime.toFixed(3));
            }
        });
        
        return uniqueChords.size;
    }

    // 解析单行音符信息
    parseNoteLine(columns) {
        try {
            // 第一列：播放时间（格式：00:00:00:00.00）
            const timeString = columns[0].trim();
            const timeInSeconds = this.convertTimeToSeconds(timeString);

            // 第三列：音符名称
            const noteName = columns[3].trim();

            // 检查是否为纯数字（空闲音符，不播放）
            if (/^\d+$/.test(noteName)) {
                return null;
            }

            // 第四列：音符力度
            const velocity = parseInt(columns[4].trim(), 10);

            // 验证数据有效性
            if (isNaN(timeInSeconds) || isNaN(velocity) || !noteName) {
                return null;
            }

            return {
                time: timeInSeconds,
                name: noteName,
                velocity: velocity,
                withPedal: false, // 默认不踩踏板，将在和声检测中设置
                isChord: false,    // 是否属于和声
                chordSize: 1,      // 和声大小（单音为1）
                chordTime: timeInSeconds, // 和声时间点
                chordNotes: [noteName]    // 和声音符列表
            };

        } catch (error) {
            console.error('解析音符行时出错:', error);
            return null;
        }
    }

    // 将时间字符串转换为秒
    convertTimeToSeconds(timeString) {
        // 格式：00:00:00:00.00（时:分:秒:帧.百分秒）
        const parts = timeString.split(':');

        if (parts.length < 4) {
            throw new Error(`无效的时间格式: ${timeString}`);
        }

        // 忽略时、分（前两部分），只取秒和帧
        const seconds = parseInt(parts[2], 10) || 0;
        const framePart = parts[3];

        // 分离帧和百分秒
        const [frames, hundredths = '0'] = framePart.split('.');

        const framesValue = parseInt(frames, 10) || 0;
        const hundredthsValue = parseInt(hundredths, 10) || 0;

        // 假设帧率为30fps（根据.sim文件格式调整）
        const frameRate = 30;
        const totalSeconds = seconds + (framesValue / frameRate) + (hundredthsValue / 100 / frameRate);

        return parseFloat(totalSeconds.toFixed(3));
    }

    // 获取和声信息统计
    getChordStatistics() {
        const chordNotes = this.notes.filter(note => note.isChord);
        const singleNotes = this.notes.filter(note => !note.isChord);
        
        const chordGroups = this.groupChordsByTime();
        
        return {
            totalChords: chordGroups.length,
            totalChordNotes: chordNotes.length,
            totalSingleNotes: singleNotes.length,
            chordSizes: chordGroups.map(chord => chord.notes.length),
            averageChordSize: chordGroups.length > 0 ? 
                chordNotes.length / chordGroups.length : 0
        };
    }

    // 按时间分组和声
    groupChordsByTime() {
        const chords = [];
        const processedTimes = new Set();
        
        this.notes.forEach(note => {
            if (note.isChord && note.chordTime !== undefined) {
                const timeKey = note.chordTime.toFixed(3);
                if (!processedTimes.has(timeKey)) {
                    processedTimes.add(timeKey);
                    const chordNotes = this.notes.filter(n => 
                        n.isChord && Math.abs(n.chordTime - note.chordTime) < 0.001
                    );
                    chords.push({
                        time: note.chordTime,
                        notes: chordNotes,
                        size: chordNotes.length
                    });
                }
            }
        });
        
        return chords;
    }

    // 获取解析后的音符信息
    getNotes() {
        return this.notes;
    }

    // 清空解析结果
    clear() {
        this.notes = [];
    }
}

// 文件上传处理器
class SIMFileHandler {
    constructor() {
        this.parser = new SIMParser();
        this.setupEventListeners();
    }

    // 在 SIMFileHandler 的 setupEventListeners 方法中，确保正确监听文件上传
    setupEventListeners() {
        // 监听文件上传事件
        document.addEventListener('DOMContentLoaded', () => {
            const fileInput = document.getElementById('fileInput');
            if (fileInput) {
                fileInput.addEventListener('change', (event) => {
                    this.handleFileUpload(event);
                });
            }

            // 同时监听自定义的SIM解析完成事件
            document.addEventListener('simParseComplete', (event) => {
                console.log('SIM文件解析完成', event.detail);
            });
        });
    }

    handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        // 检查文件扩展名
        if (!file.name.toLowerCase().endsWith('.sim')) {
            console.log('非 .sim 文件，跳过解析');
            return;
        }

        console.log('检测到 .sim 文件，开始解析...');

        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const content = e.target.result;
                const result = this.parser.parse(content);

                if (result.success) {
                    this.onParseSuccess(result, file);
                } else {
                    this.onParseError(result.error);
                }

            } catch (error) {
                this.onParseError(error.message);
            }
        };

        reader.onerror = () => {
            this.onParseError('读取文件时发生错误');
        };

        reader.readAsText(file);
    }

    onParseSuccess(result, file) {
        console.log('解析成功:', result);

        // 获取和声统计信息
        const chordStats = this.parser.getChordStatistics();
        result.chordStatistics = chordStats;

        // 触发自定义事件，通知其他组件
        this.dispatchParseCompleteEvent(result, file);

        // 更新UI显示解析结果
        this.updateUI(result, file);
    }

    onParseError(error) {
        console.error('解析失败:', error);

        // 显示错误信息
        this.showError(`解析 .sim 文件时出错: ${error}`);
    }

    dispatchParseCompleteEvent(result, file) {
        const event = new CustomEvent('simParseComplete', {
            detail: {
                file: file,
                data: result,
                parser: this.parser
            }
        });

        document.dispatchEvent(event);
    }

    updateUI(result, file) {
        // 查找或创建显示区域
        let simInfoContainer = document.getElementById('simInfo');

        if (!simInfoContainer) {
            simInfoContainer = document.createElement('div');
            simInfoContainer.id = 'simInfo';
            simInfoContainer.className = 'sim-info-container';
            simInfoContainer.style.cssText = `
                margin: 20px 0;
                padding: 15px;
                background: #f5f5f5;
                border-radius: 8px;
                border-left: 4px solid #4CAF50;
            `;

            const results = document.getElementById('results');
            if (results) {
                results.insertBefore(simInfoContainer, results.firstChild);
            }
        }

        // 计算和声相关统计
        const notesWithPedal = result.notes.filter(note => note.withPedal).length;
        const chordNotes = result.notes.filter(note => note.isChord);
        const singleNotes = result.notes.filter(note => !note.isChord);
        const pedalPercentage = result.totalNotes > 0 ? 
            ((notesWithPedal / result.totalNotes) * 100).toFixed(1) : 0;

        // 更新显示内容，包含和声信息
        simInfoContainer.innerHTML = `
            <h3>🎵 .sim 文件解析结果</h3>
            <div class="sim-basic-info">
                <p><strong>文件名:</strong> ${file.name}</p>
                <p><strong>总音符数:</strong> ${result.totalNotes}</p>
                <p><strong>单音数量:</strong> ${singleNotes.length}</p>
                <p><strong>和声数量:</strong> ${result.totalChords} 个和声，包含 ${chordNotes.length} 个音符</p>
                <p><strong>平均和声大小:</strong> ${result.chordStatistics.averageChordSize.toFixed(1)} 个音</p>
                <p><strong>使用踏板的音符:</strong> ${notesWithPedal} (${pedalPercentage}%)</p>
                <p><strong>预估时长:</strong> ${result.duration.toFixed(2)} 秒</p>
            </div>
            <div class="sim-notes-preview">
                <p><strong>前10个音符预览（🔊表示和声）:</strong></p>
                <div style="max-height: 200px; overflow-y: auto;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="background: #e0e0e0;">
                                <th style="padding: 8px; border: 1px solid #ccc;">播放时间(s)</th>
                                <th style="padding: 8px; border: 1px solid #ccc;">音符名称</th>
                                <th style="padding: 8px; border: 1px solid #ccc;">音符力度</th>
                                <th style="padding: 8px; border: 1px solid #ccc;">踏板</th>
                                <th style="padding: 8px; border: 1px solid #ccc;">和声</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${result.notes.slice(0, 10).map(note => `
                                <tr>
                                    <td style="padding: 6px; border: 1px solid #ccc;">${note.time.toFixed(3)}</td>
                                    <td style="padding: 6px; border: 1px solid #ccc;">${note.name} ${note.isChord ? '🔊' : ''}</td>
                                    <td style="padding: 6px; border: 1px solid #ccc;">${note.velocity}</td>
                                    <td style="padding: 6px; border: 1px solid #ccc;">${note.withPedal ? '✅' : '❌'}</td>
                                    <td style="padding: 6px; border: 1px solid #ccc;">${note.isChord ? `${note.chordSize}个音` : '单音'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
            <button id="playSimPiano" class="btn" style="margin-top: 10px;">
                使用钢琴播放 .sim 文件
            </button>
        `;

        // 添加钢琴播放按钮事件
        const playButton = document.getElementById('playSimPiano');
        if (playButton) {
            playButton.addEventListener('click', () => {
                this.initPianoPlayback(result);
            });
        }
    }

    showError(message) {
        // 使用现有的错误显示机制
        const errorElement = document.getElementById('error');
        if (errorElement) {
            errorElement.style.display = 'block';
            errorElement.textContent = message;
        }

        // 3秒后自动隐藏错误
        setTimeout(() => {
            if (errorElement) {
                errorElement.style.display = 'none';
            }
        }, 3000);
    }

    initPianoPlayback(result) {
        // 触发钢琴播放事件
        document.dispatchEvent(new CustomEvent('initPianoPlayback', {
            detail: {
                midiData: {
                    file: { name: 'Parsed SIM File' },
                    data: this.convertToMidiFormat(result)
                },
                isPianoOnly: false
            }
        }));
    }

    // 将 .sim 解析结果转换为 MIDI 格式（兼容现有钢琴播放器）
    convertToMidiFormat(simData) {
        return {
            format: 1,
            tracks: [
                {
                    name: 'SIM 音轨',
                    notes: simData.notes.map(note => ({
                        name: note.name,
                        time: note.time,
                        duration: 0.5, // 默认持续时间
                        velocity: note.velocity / 127, // 标准化到 0-1
                        withPedal: note.withPedal,
                        isChord: note.isChord,
                        chordSize: note.chordSize,
                        chordNotes: note.chordNotes,
                        midi: this.noteNameToMidi(note.name)
                    })),
                    instrument: { name: '钢琴', program: 0 },
                    isPiano: true,
                    pedalEvents: []
                }
            ],
            duration: simData.duration,
            header: {
                ppq: 480,
                bpm: 120
            }
        };
    }

    // 音符名称转换为 MIDI 编号（辅助函数）
    noteNameToMidi(noteName) {
        const noteMap = {
            'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3,
            'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8,
            'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11
        };

        const match = noteName.match(/^([A-G][#b]?)(-?\d+)$/);
        if (!match) return 60; // 默认返回 C4

        const note = match[1];
        const octave = parseInt(match[2]);

        return (octave + 1) * 12 + (noteMap[note] || 0);
    }
}

// 初始化 .sim 文件处理器
document.addEventListener('DOMContentLoaded', function () {
    window.simFileHandler = new SIMFileHandler();

    // 监听钢琴播放器就绪事件，以便集成
    document.addEventListener('simParseComplete', function (event) {
        console.log('SIM 文件解析完成，可以用于钢琴播放', event.detail);
        
        // 这里可以添加额外的处理，比如更新UI显示和声信息
        const result = event.detail.data;
        if (result.chordStatistics) {
            console.log('和声统计:', result.chordStatistics);
        }
    });
});

// 导出供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SIMParser, SIMFileHandler };
}