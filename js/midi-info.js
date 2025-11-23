class MIDIParser {
    constructor() {
        this.notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

        // General MIDI 音色映射表
        this.gmInstruments = [
            // 钢琴类 (0-7)
            "Acoustic Grand Piano", "Bright Acoustic Piano", "Electric Grand Piano", "Honky-tonk Piano",
            "Electric Piano 1", "Electric Piano 2", "Harpsichord", "Clavinet",

            // 打击乐器 (8-15)
            "Celesta", "Glockenspiel", "Music Box", "Vibraphone", "Marimba", "Xylophone", "Tubular Bells", "Dulcimer",

            // 风琴类 (16-23)
            "Drawbar Organ", "Percussive Organ", "Rock Organ", "Church Organ", "Reed Organ", "Accordion", "Harmonica", "Tango Accordion",

            // 吉他类 (24-31)
            "Acoustic Guitar (nylon)", "Acoustic Guitar (steel)", "Electric Guitar (jazz)", "Electric Guitar (clean)",
            "Electric Guitar (muted)", "Overdriven Guitar", "Distortion Guitar", "Guitar harmonics",

            // 贝斯类 (32-39)
            "Acoustic Bass", "Electric Bass (finger)", "Electric Bass (pick)", "Fretless Bass",
            "Slap Bass 1", "Slap Bass 2", "Synth Bass 1", "Synth Bass 2",

            // 弦乐类 (40-47)
            "Violin", "Viola", "Cello", "Contrabass", "Tremolo Strings", "Pizzicato Strings", "Orchestral Harp", "Timpani",

            // 合奏类 (48-55)
            "String Ensemble 1", "String Ensemble 2", "Synth Strings 1", "Synth Strings 2",
            "Choir Aahs", "Voice Oohs", "Synth Voice", "Orchestra Hit",

            // 铜管类 (56-63)
            "Trumpet", "Trombone", "Tuba", "Muted Trumpet", "French Horn", "Brass Section", "Synth Brass 1", "Synth Brass 2",

            // 簧片类 (64-71)
            "Soprano Sax", "Alto Sax", "Tenor Sax", "Baritone Sax", "Oboe", "English Horn", "Bassoon", "Clarinet",

            // 管乐类 (72-79)
            "Piccolo", "Flute", "Recorder", "Pan Flute", "Blown Bottle", "Shakuhachi", "Whistle", "Ocarina",

            // 合成领奏类 (80-87)
            "Lead 1 (square)", "Lead 2 (sawtooth)", "Lead 3 (calliope)", "Lead 4 (chiff)",
            "Lead 5 (charang)", "Lead 6 (voice)", "Lead 7 (fifths)", "Lead 8 (bass + lead)",

            // 合成背景类 (88-95)
            "Pad 1 (new age)", "Pad 2 (warm)", "Pad 3 (polysynth)", "Pad 4 (choir)",
            "Pad 5 (bowed)", "Pad 6 (metallic)", "Pad 7 (halo)", "Pad 8 (sweep)",

            // 合成效果类 (96-103)
            "FX 1 (rain)", "FX 2 (soundtrack)", "FX 3 (crystal)", "FX 4 (atmosphere)",
            "FX 5 (brightness)", "FX 6 (goblins)", "FX 7 (echoes)", "FX 8 (sci-fi)",

            // 民族乐器类 (104-111)
            "Sitar", "Banjo", "Shamisen", "Koto", "Kalimba", "Bag pipe", "Fiddle", "Shanai",

            // 打击乐器类 (112-119)
            "Tinkle Bell", "Agogo", "Steel Drums", "Woodblock", "Taiko Drum", "Melodic Tom", "Synth Drum", "Reverse Cymbal",

            // 音效类 (120-127)
            "Guitar Fret Noise", "Breath Noise", "Seashore", "Bird Tweet", "Telephone Ring", "Helicopter", "Applause", "Gunshot"
        ];
    }

    // 从MIDI编号获取音符名称
    getNoteName(midiNumber) {
        const noteIndex = midiNumber % 12;
        const octave = Math.floor(midiNumber / 12) - 1;
        return this.notes[noteIndex] + octave;
    }

    // 根据音色编号获取乐器名称
    getInstrumentName(programNumber) {
        if (programNumber >= 0 && programNumber < this.gmInstruments.length) {
            return this.gmInstruments[programNumber];
        }
        return "未知乐器";
    }

    // 检查音色是否为钢琴类
    isPianoInstrument(programNumber) {
        // 钢琴类音色编号为0-7
        return programNumber >= 0 && programNumber <= 7;
    }

    // 检查偏移量是否在范围内
    checkOffset(dataView, offset, bytesNeeded = 1) {
        return offset + bytesNeeded <= dataView.byteLength;
    }

    // 解析MIDI文件
    parse(arrayBuffer) {
        try {
            const dataView = new DataView(arrayBuffer);
            let offset = 0;

            // 检查文件大小
            if (dataView.byteLength < 14) {
                throw new Error('文件太小，不是有效的MIDI文件');
            }

            // 检查MIDI文件头
            if (!this.checkOffset(dataView, offset, 4) || this.readString(dataView, offset, 4) !== 'MThd') {
                throw new Error('无效的MIDI文件头');
            }

            offset += 4;

            if (!this.checkOffset(dataView, offset, 4)) {
                throw new Error('文件头长度超出范围');
            }

            const headerLength = dataView.getUint32(offset);
            offset += 4;

            if (headerLength !== 6) {
                throw new Error('无效的MIDI头长度');
            }

            if (!this.checkOffset(dataView, offset, 6)) {
                throw new Error('MIDI头数据不完整');
            }

            const format = dataView.getUint16(offset);
            offset += 2;

            const numTracks = dataView.getUint16(offset);
            offset += 2;

            const division = dataView.getUint16(offset);
            offset += 2;

            const ppq = division & 0x7FFF; // 获取PPQ值

            const tracks = [];
            let totalDuration = 0;
            let bpm = 120; // 默认BPM

            // 解析每个音轨
            for (let i = 0; i < numTracks; i++) {
                if (!this.checkOffset(dataView, offset, 8)) {
                    throw new Error(`音轨 ${i} 头信息不完整`);
                }

                if (this.readString(dataView, offset, 4) !== 'MTrk') {
                    throw new Error(`音轨 ${i} 无效`);
                }

                offset += 4;

                const trackLength = dataView.getUint32(offset);
                offset += 4;

                const trackEnd = offset + trackLength;

                // 检查音轨长度是否超出文件范围
                if (trackEnd > dataView.byteLength) {
                    throw new Error(`音轨 ${i} 长度超出文件范围`);
                }

                const track = {
                    name: `音轨 ${i + 1}`,
                    notes: [],
                    instrument: { name: '未知', program: -1 },
                    channel: 0,
                    isPiano: false,
                    pedalEvents: [],
                    aftertouchEvents: [] // 新增：存储触后压力事件
                };

                let currentTime = 0;
                let lastStatus = 0;
                let pedalState = false;
                let trackOffset = offset;

                // 解析音轨事件
                while (trackOffset < trackEnd) {
                    // 读取delta time
                    const deltaTimeResult = this.readVariableLengthSafe(dataView, trackOffset, trackEnd);
                    if (!deltaTimeResult) {
                        console.warn(`音轨 ${i} 的delta time读取错误，跳过剩余事件`);
                        break;
                    }

                    trackOffset = deltaTimeResult.offset;
                    currentTime += deltaTimeResult.value;

                    // 检查是否有足够的数据读取事件类型
                    if (!this.checkOffset(dataView, trackOffset)) {
                        break;
                    }

                    let eventType = dataView.getUint8(trackOffset);
                    trackOffset++;

                    // 检查是否为运行状态
                    if (eventType < 0x80) {
                        if (lastStatus === 0) {
                            console.warn('遇到数据字节但没有前一个状态字节，跳过');
                            continue;
                        }
                        eventType = lastStatus;
                        trackOffset--; // 回退，因为这个字节是数据
                    } else {
                        lastStatus = (eventType >= 0xF0 && eventType <= 0xF7) ? 0 : eventType;
                    }

                    const highNibble = eventType & 0xF0;
                    const lowNibble = eventType & 0x0F;

                    try {
                        // 处理不同的事件类型
                        if (highNibble === 0x80) { // 音符关闭
                            if (!this.checkOffset(dataView, trackOffset, 2)) break;
                            const note = dataView.getUint8(trackOffset);
                            trackOffset++;
                            const velocity = dataView.getUint8(trackOffset);
                            trackOffset++;

                            // 查找对应的音符开始事件并设置结束时间
                            for (let j = track.notes.length - 1; j >= 0; j--) {
                                if (track.notes[j].midi === note && !track.notes[j].endTime) {
                                    track.notes[j].endTime = currentTime;
                                    track.notes[j].duration = currentTime - track.notes[j].startTime;
                                    break;
                                }
                            }
                        }
                        else if (highNibble === 0x90) { // 音符开启
                            if (!this.checkOffset(dataView, trackOffset, 2)) break;
                            const note = dataView.getUint8(trackOffset);
                            trackOffset++;
                            const velocity = dataView.getUint8(trackOffset);
                            trackOffset++;

                            if (velocity > 0) {
                                track.notes.push({
                                    midi: note,
                                    name: this.getNoteName(note),
                                    startTime: currentTime,
                                    velocity: velocity / 127,
                                    channel: lowNibble,
                                    withPedal: pedalState
                                });
                            } else {
                                // 力度为0的音符开启事件相当于音符关闭
                                for (let j = track.notes.length - 1; j >= 0; j--) {
                                    if (track.notes[j].midi === note && !track.notes[j].endTime) {
                                        track.notes[j].endTime = currentTime;
                                        track.notes[j].duration = currentTime - track.notes[j].startTime;
                                        break;
                                    }
                                }
                            }
                        }
                        else if (highNibble === 0xB0) { // 控制改变事件
                            if (!this.checkOffset(dataView, trackOffset, 2)) break;
                            const controller = dataView.getUint8(trackOffset);
                            trackOffset++;
                            const value = dataView.getUint8(trackOffset);
                            trackOffset++;

                            if (controller === 64) { // 延音踏板
                                pedalState = value >= 64;
                                track.pedalEvents.push({
                                    time: currentTime,
                                    state: pedalState,
                                    channel: lowNibble
                                });
                            }
                        }
                        else if (highNibble === 0xC0) { // 程序变更事件
                            if (!this.checkOffset(dataView, trackOffset)) break;
                            const programNumber = dataView.getUint8(trackOffset);
                            trackOffset++;

                            track.instrument.program = programNumber;
                            track.instrument.name = this.getInstrumentName(programNumber);
                            track.isPiano = this.isPianoInstrument(programNumber);
                        }
                        else if (highNibble === 0xA0) { // 键触后压力事件
                            if (!this.checkOffset(dataView, trackOffset, 2)) break;
                            const note = dataView.getUint8(trackOffset);
                            trackOffset++;
                            const pressure = dataView.getUint8(trackOffset);
                            trackOffset++;

                            track.aftertouchEvents.push({
                                time: currentTime,
                                note: note,
                                pressure: pressure,
                                channel: lowNibble
                            });
                        }
                        else if (eventType === 0xD0) { // 通道触后压力事件
                            if (!this.checkOffset(dataView, trackOffset)) break;
                            const pressure = dataView.getUint8(trackOffset);
                            trackOffset++;

                            track.aftertouchEvents.push({
                                time: currentTime,
                                pressure: pressure,
                                channel: lowNibble,
                                isChannelAftertouch: true
                            });
                        }
                        else if (highNibble === 0xE0) { // 弯音轮事件
                            if (!this.checkOffset(dataView, trackOffset, 2)) break;
                            const lsb = dataView.getUint8(trackOffset);
                            trackOffset++;
                            const msb = dataView.getUint8(trackOffset);
                            trackOffset++;
                            // 可以记录弯音值
                        }
                        else if (eventType === 0xFF) { // 元事件
                            if (!this.checkOffset(dataView, trackOffset)) break;
                            const metaType = dataView.getUint8(trackOffset);
                            trackOffset++;

                            const lengthInfo = this.readVariableLengthSafe(dataView, trackOffset, trackEnd);
                            if (!lengthInfo) break;
                            trackOffset = lengthInfo.offset;
                            const length = lengthInfo.value;

                            if (!this.checkOffset(dataView, trackOffset, length)) break;

                            if (metaType === 0x03) { // 音轨名称
                                const name = this.readString(dataView, trackOffset, length);
                                track.name = name;
                            } else if (metaType === 0x04) { // 乐器名称
                                const instrument = this.readString(dataView, trackOffset, length);
                                track.instrument.name = instrument;
                            } else if (metaType === 0x51 && length === 3) { // 设置速度
                                const tempo = (dataView.getUint8(trackOffset) << 16) |
                                    (dataView.getUint8(trackOffset + 1) << 8) |
                                    dataView.getUint8(trackOffset + 2);
                                bpm = Math.round(60000000 / tempo);
                            }

                            trackOffset += length;
                        }
                        else if (eventType === 0xF0 || eventType === 0xF7) { // 系统专用信息
                            const lengthInfo = this.readVariableLengthSafe(dataView, trackOffset, trackEnd);
                            if (!lengthInfo) break;
                            trackOffset = lengthInfo.offset + lengthInfo.value;
                        }
                        else {
                            console.warn(`未知事件类型: 0x${eventType.toString(16)}，跳过`);
                            // 尝试跳过未知事件
                            if (eventType >= 0x80 && eventType <= 0xEF) {
                                // 通道声音/模式消息，通常有1-2个数据字节
                                if (this.checkOffset(dataView, trackOffset, 2)) {
                                    trackOffset += 2;
                                } else if (this.checkOffset(dataView, trackOffset, 1)) {
                                    trackOffset += 1;
                                } else {
                                    break;
                                }
                            } else {
                                break;
                            }
                        }
                    } catch (error) {
                        console.error(`处理事件时出错: ${error.message}`);
                        break;
                    }
                }

                // 计算未结束的音符的持续时间
                track.notes.forEach(note => {
                    if (!note.endTime) {
                        note.endTime = currentTime;
                        note.duration = currentTime - note.startTime;
                    }
                    // 转换为秒
                    note.time = note.startTime * (60 / (bpm * ppq));
                    note.duration = note.duration * (60 / (bpm * ppq));
                });

                // 如果没有程序变更事件，尝试通过音轨名称判断是否为钢琴音轨
                if (track.instrument.program === -1) {
                    track.isPiano = this.isPianoTrackByName(track);
                }

                tracks.push(track);

                if (currentTime > totalDuration) {
                    totalDuration = currentTime;
                }

                offset = trackEnd;
            }

            // 转换为秒
            totalDuration = totalDuration * (60 / (bpm * ppq));

            return {
                format: format,
                tracks: tracks,
                duration: totalDuration,
                header: {
                    ppq: ppq,
                    bpm: bpm
                }
            };
        } catch (error) {
            throw new Error('MIDI文件解析错误: ' + error.message);
        }
    }

    // 通过音轨名称判断是否为钢琴音轨
    isPianoTrackByName(track) {
        // 钢琴相关的关键词
        const pianoKeywords = [
            'piano', 'pianoforte', 'keyboard', 'keys',
            '钢琴', '钢琴声', '键盘', '钢琴音'
        ];

        // 检查音轨名称
        const trackName = track.name.toLowerCase();
        if (pianoKeywords.some(keyword => trackName.includes(keyword))) {
            return true;
        }

        // 检查乐器名称
        const instrumentName = track.instrument.name.toLowerCase();
        if (pianoKeywords.some(keyword => instrumentName.includes(keyword))) {
            return true;
        }

        return false;
    }

    // 读取可变长度值 - 修复后的安全版本
    readVariableLengthSafe(dataView, offset, maxOffset) {
        if (offset >= maxOffset) {
            return null;
        }

        let value = 0;
        let byte;
        let bytesRead = 0;

        do {
            if (offset >= maxOffset) {
                return null;
            }

            byte = dataView.getUint8(offset);
            offset++;
            bytesRead++;

            value = (value << 7) | (byte & 0x7F);

            // 防止无限循环和溢出
            if (bytesRead > 4) {
                return null;
            }
        } while (byte & 0x80);

        return { value, offset };
    }

    // 原有的读取可变长度值方法（保持兼容性）
    readVariableLength(dataView, offset) {
        return this.readVariableLengthSafe(dataView, offset, dataView.byteLength);
    }

    // 读取字符串
    readString(dataView, offset, length) {
        if (!this.checkOffset(dataView, offset, length)) {
            return '';
        }

        let str = '';
        for (let i = 0; i < length; i++) {
            str += String.fromCharCode(dataView.getUint8(offset + i));
        }
        return str;
    }
}

// MIDI信息显示管理类（保持不变）
class MIDIInfoDisplay {
    constructor() {
        this.midiParser = new MIDIParser();
        this.currentMidiData = null;
        this.isPianoOnly = false;
        this.initUI();
    }

    initUI() {
        this.uploadArea = document.getElementById('uploadArea');
        this.fileInput = document.getElementById('fileInput');
        this.browseBtn = document.getElementById('browseBtn');
        this.fileInfo = document.getElementById('fileInfo');
        this.loading = document.getElementById('loading');
        this.error = document.getElementById('error');
        this.results = document.getElementById('results');
        this.basicInfo = document.getElementById('basicInfo');
        this.trackInfo = document.getElementById('trackInfo');
        this.noteInfo = document.getElementById('noteInfo');
        this.showAllBtn = document.getElementById('showAllBtn');
        this.showPianoBtn = document.getElementById('showPianoBtn');
        this.playPianoBtn = document.getElementById('playPianoBtn');
        this.controlPanel = document.getElementById('controlPanel');
        this.filterInfo = document.getElementById('filterInfo');
        this.filterStatus = document.getElementById('filterStatus');

        this.setupEventListeners();
    }

    setupEventListeners() {
        this.uploadArea.addEventListener('click', () => {
            this.fileInput.click();
        });

        this.browseBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.fileInput.click();
        });

        // 拖拽功能
        this.uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.uploadArea.classList.add('highlight');
        });

        this.uploadArea.addEventListener('dragleave', () => {
            this.uploadArea.classList.remove('highlight');
        });

        this.uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            this.uploadArea.classList.remove('highlight');

            if (e.dataTransfer.files.length) {
                this.fileInput.files = e.dataTransfer.files;
                this.handleFileSelection();
            }
        });

        this.fileInput.addEventListener('change', () => this.handleFileSelection());

        this.showAllBtn.addEventListener('click', () => {
            this.isPianoOnly = false;
            this.updateFilterButtons();
            if (this.currentMidiData) {
                this.renderMidiInfo(this.currentMidiData.file, this.currentMidiData.data);
            }
        });

        this.showPianoBtn.addEventListener('click', () => {
            this.isPianoOnly = true;
            this.updateFilterButtons();
            if (this.currentMidiData) {
                this.renderMidiInfo(this.currentMidiData.file, this.currentMidiData.data);
            }
        });

        this.playPianoBtn.addEventListener('click', () => {
            if (!this.currentMidiData) {
                this.showError('请先上传并解析MIDI文件');
                return;
            }
            // 触发钢琴播放初始化事件
            document.dispatchEvent(new CustomEvent('initPianoPlayback', {
                detail: { midiData: this.currentMidiData, isPianoOnly: this.isPianoOnly }
            }));
        });
    }

    handleFileSelection() {
        if (this.fileInput.files.length === 0) return;

        const file = this.fileInput.files[0];

        // 添加 .sim 文件支持
        if (!file.name.toLowerCase().endsWith('.mid') &&
            !file.name.toLowerCase().endsWith('.midi') &&
            !file.name.toLowerCase().endsWith('.sim')) {
            this.showError('请选择MIDI文件 (.mid 或 .midi) 或 SIM 文件 (.sim)');
            return;
        }

        this.fileInfo.innerHTML = `已选择文件: <strong>${file.name}</strong> (${this.formatFileSize(file.size)})`;

        // 根据文件类型选择不同的解析方法
        if (file.name.toLowerCase().endsWith('.sim')) {
            this.parseSimFile(file);
        } else {
            this.parseMidiFile(file);
        }
    }

    parseMidiFile(file) {
        this.loading.style.display = 'block';
        this.error.style.display = 'none';
        this.results.style.display = 'none';
        this.controlPanel.style.display = 'none';
        this.filterInfo.style.display = 'none';

        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const midiData = this.midiParser.parse(e.target.result);
                this.currentMidiData = {
                    file: file,
                    data: midiData
                };

                this.isPianoOnly = false;
                this.updateFilterButtons();
                this.renderMidiInfo(file, midiData);

                this.loading.style.display = 'none';
                this.results.style.display = 'block';
                this.controlPanel.style.display = 'flex';
            } catch (err) {
                console.error('MIDI解析错误:', err);
                this.showError('无法解析MIDI文件: ' + err.message);
            }
        };

        reader.onerror = () => {
            this.showError('读取文件时发生错误');
        };

        reader.readAsArrayBuffer(file);
    }

    renderMidiInfo(file, midiData) {
        const filteredData = this.filterMidiData(midiData);
        this.renderBasicInfo(file, filteredData);
        this.renderTrackInfo(filteredData);
        this.renderNoteInfo(filteredData);
    }

    filterMidiData(midiData) {
        if (!this.isPianoOnly) {
            return midiData;
        }

        return {
            format: midiData.format,
            tracks: midiData.tracks.filter(track => track.isPiano),
            duration: midiData.duration,
            header: { ...midiData.header }
        };
    }

    renderBasicInfo(file, midiData) {
        const duration = midiData.duration;
        const durationFormatted = this.formatDuration(duration);
        const pianoTrackCount = midiData.tracks.filter(track => track.isPiano).length;
        const totalTrackCount = this.currentMidiData ? this.currentMidiData.data.tracks.length : midiData.tracks.length;

        // 统计总踏板使用情况
        let totalNotes = 0;
        let totalNotesWithPedal = 0;
        midiData.tracks.forEach(track => {
            totalNotes += track.notes.length;
            totalNotesWithPedal += track.notes.filter(note => note.withPedal).length;
        });
        const pedalPercentage = totalNotes > 0 ? ((totalNotesWithPedal / totalNotes) * 100).toFixed(1) : 0;

        let trackInfoHtml = '';
        if (this.isPianoOnly) {
            trackInfoHtml = `<tr>
                <td><strong>音轨数 (筛选后)</strong></td>
                <td>${midiData.tracks.length} / ${totalTrackCount} (${pianoTrackCount} 个钢琴音轨)</td>
            </tr>`;
        } else {
            trackInfoHtml = `<tr>
                <td><strong>音轨数</strong></td>
                <td>${midiData.tracks.length} (${pianoTrackCount} 个钢琴音轨)</td>
            </tr>`;
        }

        this.basicInfo.innerHTML = `
            <table>
                <tr>
                    <td><strong>文件名</strong></td>
                    <td>${file.name}</td>
                </tr>
                <tr>
                    <td><strong>文件大小</strong></td>
                    <td>${this.formatFileSize(file.size)}</td>
                </tr>
                <tr>
                    <td><strong>格式</strong></td>
                    <td>${midiData.format === 0 ? '单音轨' : midiData.format === 1 ? '多音轨同步' : '多音轨独立'}</td>
                </tr>
                ${trackInfoHtml}
                <tr>
                    <td><strong>总时长</strong></td>
                    <td>${durationFormatted}</td>
                </tr>
                <tr>
                    <td><strong>PPQ (每四分音符的tick数)</strong></td>
                    <td>${midiData.header.ppq || '未知'}</td>
                </tr>
                <tr>
                    <td><strong>BPM (每分钟节拍数)</strong></td>
                    <td>${midiData.header.bpm || '未知'}</td>
                </tr>
                <tr>
                    <td><strong>延音踏板使用</strong></td>
                    <td>${totalNotesWithPedal}/${totalNotes} 个音符 (${pedalPercentage}%)</td>
                </tr>
            </table>
        `;
    }

    renderTrackInfo(midiData) {
        let tracksHtml = '';

        midiData.tracks.forEach((track, index) => {
            const trackName = track.name || `音轨 ${index + 1}`;
            const instrument = track.instrument || { name: '未知', program: -1 };
            const notesCount = track.notes.length;
            const isPiano = track.isPiano;

            // 统计踏板使用情况
            const notesWithPedal = track.notes.filter(note => note.withPedal).length;
            const pedalPercentage = notesCount > 0 ? ((notesWithPedal / notesCount) * 100).toFixed(1) : 0;
            const pedalEventsCount = track.pedalEvents ? track.pedalEvents.length : 0;

            const trackClass = isPiano ? 'piano-track' : '';
            const programInfo = instrument.program !== -1 ? ` (音色编号: ${instrument.program})` : '';

            tracksHtml += `
                <div class="track-info ${trackClass}">
                    <div class="track-title">${trackName} ${isPiano ? '🎹' : ''}</div>
                    <table>
                        <tr>
                            <td><strong>乐器</strong></td>
                            <td>${instrument.name}${programInfo} ${isPiano ? '(钢琴)' : ''}</td>
                        </tr>
                        <tr>
                            <td><strong>音符数量</strong></td>
                            <td>${notesCount}</td>
                        </tr>
                        <tr>
                            <td><strong>使用延音踏板的音符</strong></td>
                            <td>${notesWithPedal} (${pedalPercentage}%)</td>
                        </tr>
                        <tr>
                            <td><strong>踏板事件数量</strong></td>
                            <td>${pedalEventsCount}</td>
                        </tr>
                        <tr>
                            <td><strong>通道</strong></td>
                            <td>${track.channel !== undefined ? track.channel + 1 : '未知'}</td>
                        </tr>
                        <tr>
                            <td><strong>音轨类型</strong></td>
                            <td>${isPiano ? '钢琴音轨 🎹' : '其他音轨'}</td>
                        </tr>
                    </table>
                </div>
            `;
        });

        this.trackInfo.innerHTML = tracksHtml;
    }

    renderNoteInfo(midiData) {
        const allNotes = [];

        midiData.tracks.forEach((track, trackIndex) => {
            track.notes.forEach(note => {
                allNotes.push({
                    track: track.name || `音轨 ${trackIndex + 1}`,
                    name: note.name,
                    midi: note.midi,
                    time: note.time,
                    duration: note.duration,
                    velocity: note.velocity,
                    isPiano: track.isPiano,
                    withPedal: note.withPedal || false
                });
            });
        });

        allNotes.sort((a, b) => a.time - b.time);

        let notesHtml = `
            <p>总共 ${allNotes.length} 个音符 ${this.isPianoOnly ? '(仅钢琴音轨)' : ''}</p>
            <div style="max-height: 400px; overflow-y: auto; margin-top: 15px;">
                <table>
                    <thead>
                        <tr>
                            <th>音轨</th>
                            <th>音名</th>
                            <th>MIDI编号</th>
                            <th>开始时间</th>
                            <th>时长</th>
                            <th>强度</th>
                            <th>延音踏板</th>
                            <th>类型</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        allNotes.forEach(note => {
            const typeIcon = note.isPiano ? '🎹' : '';
            const pedalIcon = note.withPedal ? '✅' : '❌';
            const pedalText = note.withPedal ? '是' : '否';
            notesHtml += `
                <tr>
                    <td>${note.track}</td>
                    <td>${note.name}</td>
                    <td>${note.midi}</td>
                    <td>${note.time.toFixed(2)}s</td>
                    <td>${note.duration.toFixed(2)}s</td>
                    <td>${note.velocity.toFixed(2)}</td>
                    <td title="${pedalText}">${pedalIcon}</td>
                    <td>${typeIcon}</td>
                </tr>
            `;
        });

        notesHtml += `
                    </tbody>
                </table>
            </div>
        `;

        this.noteInfo.innerHTML = notesHtml;
    }

    updateFilterButtons() {
        if (this.isPianoOnly) {
            this.showAllBtn.classList.remove('btn-active');
            this.showPianoBtn.classList.add('btn-active');
            this.filterStatus.textContent = '仅钢琴音轨';
            this.filterInfo.style.display = 'block';
        } else {
            this.showAllBtn.classList.add('btn-active');
            this.showPianoBtn.classList.remove('btn-active');
            this.filterStatus.textContent = '所有音轨';
            this.filterInfo.style.display = 'none';
        }
    }

    showError(message) {
        this.loading.style.display = 'none';
        this.error.style.display = 'block';
        this.error.textContent = message;
        this.controlPanel.style.display = 'none';
        this.filterInfo.style.display = 'none';
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';

        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    formatDuration(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    // 添加 SIM 文件解析方法
    parseSimFile(file) {
        this.loading.style.display = 'block';
        this.error.style.display = 'none';
        this.results.style.display = 'none';
        this.controlPanel.style.display = 'none';
        this.filterInfo.style.display = 'none';

        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const content = e.target.result;

                // 使用 SIMParser 解析 .sim 文件
                if (typeof SIMParser === 'undefined') {
                    throw new Error('SIM 解析器未加载');
                }

                const simParser = new SIMParser();
                const result = simParser.parse(content);

                if (result.success) {
                    // 转换为 MIDI 格式以便兼容现有系统
                    const midiData = this.convertSimToMidiFormat(result, file);
                    this.currentMidiData = {
                        file: file,
                        data: midiData
                    };

                    this.isPianoOnly = false;
                    this.updateFilterButtons();
                    this.renderMidiInfo(file, midiData);

                    this.loading.style.display = 'none';
                    this.results.style.display = 'block';
                    this.controlPanel.style.display = 'flex';

                    // 更新UI显示这是SIM文件
                    this.updateUIForSimFile(file, result);
                } else {
                    throw new Error(result.error);
                }
            } catch (err) {
                console.error('SIM解析错误:', err);
                this.showError('无法解析SIM文件: ' + err.message);
            }
        };

        reader.onerror = () => {
            this.showError('读取SIM文件时发生错误');
        };

        reader.readAsText(file);
    }

    // 将SIM数据转换为MIDI格式
    convertSimToMidiFormat(simData, file) {
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
                        midi: this.noteNameToMidi(note.name),
                        startTime: note.time,
                        endTime: note.time + 0.5
                    })),
                    instrument: { name: '钢琴', program: 0 },
                    isPiano: true,
                    pedalEvents: [],
                    channel: 0
                }
            ],
            duration: simData.duration,
            header: {
                ppq: 480,
                bpm: 120
            }
        };
    }

    // 音符名称转换为 MIDI 编号
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

    // 更新UI显示SIM文件信息
    updateUIForSimFile(file, simData) {
        // 在基本信息区域添加SIM文件标识
        const basicInfoElement = document.getElementById('basicInfo');
        if (basicInfoElement) {
            const simIndicator = document.createElement('div');
            simIndicator.className = 'sim-file-indicator';
            simIndicator.innerHTML = `<p style="color: #4CAF50; font-weight: bold;">🎵 已解析 SIM 文件</p>`;
            basicInfoElement.insertBefore(simIndicator, basicInfoElement.firstChild);
        }

        // 更新描述文字
        const description = document.querySelector('.description');
        if (description) {
            description.innerHTML = `
            已解析 SIM 文件，提取了 ${simData.totalNotes} 个音符信息。
            <br>所有解析过程均在本地完成，无需网络连接。
        `;
        }
    }
}

// 初始化MIDI信息显示
document.addEventListener('DOMContentLoaded', function () {
    window.midiInfoDisplay = new MIDIInfoDisplay();
});