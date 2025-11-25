// 主题切换和应用主逻辑模块

// 隐藏模式状态
let isHideMode = false;

// 随机范围控制变量
let durationRandomRange = 0.5; // 默认50%
let velocityRandomRange = 0.5; // 默认50%

// 初始化函数 - 修改为异步，等待音频加载完成
async function init() {
    try {
        // 显示加载界面，隐藏主内容
        document.body.classList.remove('loaded');
        
        // 首先初始化音频加载
        MessageUtils.showStatusMessage("正在加载音源...");
        await initAudioLoad(); // 等待音频加载完成
        
        // 音频加载完成后，显示主内容
        document.body.classList.add('loaded');
        MessageUtils.showSuccess("音源加载完成！");
        
        // 初始化主题管理器
        ThemeManager.init();

        // 设置主题切换事件
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                ThemeManager.toggle();
            });
        }

        // 设置隐藏模式切换事件
        const hideModeToggle = document.getElementById('hideModeToggle');
        if (hideModeToggle) {
            hideModeToggle.addEventListener('click', toggleHideMode);
        }

        // 检测设备类型
        DeviceDetector.detect();
        window.addEventListener('resize', DeviceDetector.detect);

        // 设置音符数量输入框的最大值为琴键总数
        const totalKeys = getTotalKeys();
        noteCountInput.max = totalKeys;

        // 设置唱名数量的最大值为音符数量
        randomSolfegeCountInput.max = parseInt(noteCountInput.value);

        // 初始化随机范围旋钮
        setDurationRandomRange(0.5); // 默认50%
        setVelocityRandomRange(0.5); // 默认50%

        // 更新旋钮指示器位置
        updateRandomRangeKnobIndicators();

        createPiano();
        setupEventListeners();
        updateNoteCount(3);

        // 页面加载后自动重置选择
        resetSelection();

        // 添加箭头滚动功能
        setupScrollArrows();

        // 自动点击两次右箭头
        setTimeout(() => {
            const rightArrow = document.querySelector('.right-arrow');
            if (rightArrow) {
                rightArrow.click();
                setTimeout(() => {
                    rightArrow.click();
                }, 500);
            }
        }, 1000);

        // 初始验证
        checkAllValidations();
        
    } catch (error) {
        console.error("初始化失败:", error);
        MessageUtils.showError("初始化失败: " + error.message);
        
        // 即使音频加载失败，也显示主界面（但功能可能受限）
        document.body.classList.add('loaded');
    }
}

// 切换隐藏模式函数
function toggleHideMode() {
    isHideMode = !isHideMode;
    const body = document.body;
    const hideModeBtn = document.getElementById('hideModeToggle');

    if (isHideMode) {
        body.classList.add('hide-mode');
        hideModeBtn.textContent = '解除隐藏';
        // 确保钢琴键标签也被隐藏
        document.querySelectorAll('.key-label').forEach(label => {
            label.style.display = 'none';
        });
        MessageUtils.showSuccess("已进入隐藏模式");
    } else {
        body.classList.remove('hide-mode');
        hideModeBtn.textContent = '开启隐藏';
        // 恢复显示钢琴键标签
        document.querySelectorAll('.key-label').forEach(label => {
            label.style.display = 'block';
        });
        MessageUtils.showSuccess("已退出隐藏模式");
    }
}

// 格式化时值显示，尽量使用整数
function formatDurationDisplay(duration) {
    // 如果是整数，显示整数
    if (duration % 1 === 0) {
        return duration.toString();
    }
    // 如果小数部分只有一位且不为0，显示一位小数
    const decimalPart = duration - Math.floor(duration);
    if (decimalPart * 10 % 1 === 0) {
        return duration.toFixed(1);
    }
    // 否则显示两位小数
    return duration.toFixed(2);
}

// 解析单个音项（支持最小代价显示格式）
function parseSingleNote(item) {
    const parts = item.split('_');
    const result = {
        solfege: parts[0] || '',
        duration: getNoteDuration(),
        velocity: getDefaultVelocity()
    };

    // 根据下划线数量判断参数显示情况
    if (parts.length === 1) {
        // 只有唱名：使用固定时长和固定力度
        result.duration = getNoteDuration();
        result.velocity = getDefaultVelocity();
    } else if (parts.length === 2) {
        // 唱名_时长：时长随机+力度固定模式
        result.duration = parseFloat(parts[1]) || getNoteDuration();
        result.velocity = getDefaultVelocity();
    } else if (parts.length === 3) {
        if (parts[1] === '') {
            // 唱名__力度：时长固定+力度随机模式（跳过时长）
            result.duration = getNoteDuration();
            result.velocity = parseInt(parts[2]) || getDefaultVelocity();
        } else {
            // 唱名_时长_力度：时长随机+力度随机模式
            result.duration = parseFloat(parts[1]) || getNoteDuration();
            result.velocity = parseInt(parts[2]) || getDefaultVelocity();
        }
    }

    return result;
}

// 设置事件监听器
function setupEventListeners() {
    // 设置按钮的禁用状态点击提示
    setupButtonClickHandlers();

    // 设置其他事件监听器
    randomBtn.addEventListener('click', playRandomSequence);
    resetBtn.addEventListener('click', resetSelection);

    // 点播按钮事件监听
    document.getElementById('playbackBtn').addEventListener('click', playSolfegeSequence);

    // 音符数量变化监听
    noteCountInput.addEventListener('change', () => {
        const value = noteCountInput.value === '' ? NaN : parseInt(noteCountInput.value);
        if (ValidationUtils.validateNoteCount(value, getTotalKeys(), noteCountError)) {
            if (!isNaN(value)) {
                updateNoteCount(value);
            }
        }
        checkAllValidations();
    });

    // 输入时实时验证
    noteCountInput.addEventListener('input', () => {
        const value = noteCountInput.value === '' ? NaN : parseInt(noteCountInput.value);
        ValidationUtils.validateNoteCount(value, getTotalKeys(), noteCountError, true);
        if (!isNaN(value)) {
            randomSolfegeCountInput.max = value;
        }
        const solfegeValue = randomSolfegeCountInput.value === '' ? NaN : parseInt(randomSolfegeCountInput.value);
        ValidationUtils.validateRandomSolfegeCount(solfegeValue, randomModeSelect.value, parseInt(noteCountInput.value), randomSolfegeCountError);
        checkAllValidations();
    });

    // 随机唱名数量输入实时验证
    randomSolfegeCountInput.addEventListener('change', () => {
        const value = randomSolfegeCountInput.value === '' ? NaN : parseInt(randomSolfegeCountInput.value);
        ValidationUtils.validateRandomSolfegeCount(value, randomModeSelect.value, parseInt(noteCountInput.value), randomSolfegeCountError);
        checkAllValidations();
    });

    // 随机方式变化实时验证
    randomModeSelect.addEventListener('change', () => {
        const value = randomSolfegeCountInput.value === '' ? NaN : parseInt(randomSolfegeCountInput.value);
        ValidationUtils.validateRandomSolfegeCount(value, randomModeSelect.value, parseInt(noteCountInput.value), randomSolfegeCountError);
        checkAllValidations();
    });

    randomSolfegeCountInput.addEventListener('input', () => {
        const value = randomSolfegeCountInput.value === '' ? NaN : parseInt(randomSolfegeCountInput.value);
        ValidationUtils.validateRandomSolfegeCount(value, randomModeSelect.value, parseInt(noteCountInput.value), randomSolfegeCountError);
        checkAllValidations();
    });

    // 音符类型变化监听
    const noteTypeSelect = document.getElementById('noteType');
    noteTypeSelect.addEventListener('change', () => {
        checkAllValidations();
    });

    // 音符时长输入验证和格式化显示
    const noteDurationInput = document.getElementById('noteDuration');
    const noteDurationError = document.getElementById('noteDurationError');

    // 音符力度输入验证
    const noteVelocityInput = document.getElementById('noteVelocity');
    const noteVelocityError = document.getElementById('noteVelocityError');

    // 格式化显示音符时值
    function formatNoteDurationDisplay() {
        const value = noteDurationInput.value === '' ? NaN : parseFloat(noteDurationInput.value);
        if (!isNaN(value)) {
            noteDurationInput.value = formatDurationDisplay(value);
        }
    }

    noteDurationInput.addEventListener('change', () => {
        const value = noteDurationInput.value === '' ? NaN : parseFloat(noteDurationInput.value);
        if (ValidationUtils.validateNoteDuration(value, noteDurationError)) {
            formatNoteDurationDisplay();
        }
        checkAllValidations();
    });

    noteDurationInput.addEventListener('input', () => {
        const value = noteDurationInput.value === '' ? NaN : parseFloat(noteDurationInput.value);
        ValidationUtils.validateNoteDuration(value, noteDurationError);
        checkAllValidations();
    });

    // 力度验证
    noteVelocityInput.addEventListener('input', () => {
        const value = noteVelocityInput.value === '' ? NaN : parseInt(noteVelocityInput.value);
        ValidationUtils.validateNoteVelocity(value, noteVelocityError);
        checkAllValidations();
    });

    noteVelocityInput.addEventListener('change', () => {
        const value = noteVelocityInput.value === '' ? NaN : parseInt(noteVelocityInput.value);
        ValidationUtils.validateNoteVelocity(value, noteVelocityError);
        checkAllValidations();
    });

    // 初始格式化显示
    formatNoteDurationDisplay();

    // 时值随机范围旋钮事件监听
    document.getElementById('durationRandomRangeKnob').addEventListener('click', (e) => {
        handleRandomRangeKnobClick(e, 'duration');
    });

    document.getElementById('durationRandomRangeDecrease').addEventListener('click', () => {
        setDurationRandomRange(Math.max(0.1, durationRandomRange - 0.1));
    });

    document.getElementById('durationRandomRangeIncrease').addEventListener('click', () => {
        setDurationRandomRange(Math.min(1.0, durationRandomRange + 0.1));
    });

    // 力度随机范围旋钮事件监听
    document.getElementById('velocityRandomRangeKnob').addEventListener('click', (e) => {
        handleRandomRangeKnobClick(e, 'velocity');
    });

    document.getElementById('velocityRandomRangeDecrease').addEventListener('click', () => {
        setVelocityRandomRange(Math.max(0.1, velocityRandomRange - 0.1));
    });

    document.getElementById('velocityRandomRangeIncrease').addEventListener('click', () => {
        setVelocityRandomRange(Math.min(1.0, velocityRandomRange + 0.1));
    });

    // 初始验证
    checkAllValidations();
}

// 检查所有验证是否通过
function checkAllValidations() {
    const noteCountValue = noteCountInput.value === '' ? NaN : parseInt(noteCountInput.value);
    const solfegeCountValue = randomSolfegeCountInput.value === '' ? NaN : parseInt(randomSolfegeCountInput.value);
    const noteDurationValue = document.getElementById('noteDuration').value === '' ? NaN : parseFloat(document.getElementById('noteDuration').value);
    const noteVelocityValue = document.getElementById('noteVelocity').value === '' ? NaN : parseInt(document.getElementById('noteVelocity').value);

    const noteCountValid = ValidationUtils.validateNoteCount(noteCountValue, getTotalKeys(), noteCountError);
    const solfegeCountValid = ValidationUtils.validateRandomSolfegeCount(solfegeCountValue, randomModeSelect.value, noteCountValue, randomSolfegeCountError);
    const noteDurationValid = ValidationUtils.validateNoteDuration(noteDurationValue, document.getElementById('noteDurationError'));
    const noteVelocityValid = ValidationUtils.validateNoteVelocity(noteVelocityValue, document.getElementById('noteVelocityError'));

    const notesSelected = selectedNotes.length === noteCount;

    let allSolfegeFilled = true;
    let hasDuplicateSolfege = false;

    for (let i = 0; i < noteCount; i++) {
        if (!solfegeLabels[i] || solfegeLabels[i].trim() === '') {
            allSolfegeFilled = false;
        } else {
            for (let j = 0; j < noteCount; j++) {
                if (i !== j && solfegeLabels[j] &&
                    solfegeLabels[i].toLowerCase() === solfegeLabels[j].toLowerCase()) {
                    hasDuplicateSolfege = true;
                    break;
                }
            }
        }
        if (hasDuplicateSolfege) break;
    }

    // 移除了音频就绪检查，因为现在只有在音频加载完成后才会显示界面
    const playbackButtonsEnabled = noteCountValid && solfegeCountValid && noteDurationValid && noteVelocityValid &&
        notesSelected && allSolfegeFilled && !hasDuplicateSolfege;

    const playButtonEnabled = notesSelected;

    updateButtonStates(playbackButtonsEnabled, playButtonEnabled);

    return noteCountValid && solfegeCountValid && noteDurationValid && noteVelocityValid;
}

// 更新按钮状态
function updateButtonStates(playbackButtonsEnabled, playButtonEnabled) {
    document.getElementById('playbackBtn').disabled = !playbackButtonsEnabled;
    document.getElementById('randomBtn').disabled = !playbackButtonsEnabled;
    document.getElementById('resetBtn').disabled = false;
}

// 设置按钮点击事件处理
function setupButtonClickHandlers() {
    const buttons = [
        document.getElementById('playbackBtn'),
        document.getElementById('randomBtn')
    ];

    const otherButtons = [
        document.getElementById('resetBtn')
    ];

    buttons.forEach(button => {
        const newButton = button.cloneNode(true);
        button.parentNode.replaceChild(newButton, button);
    });

    const playbackButtons = [
        document.getElementById('playbackBtn'),
        document.getElementById('randomBtn')
    ];

    const otherButtonsNew = [
        document.getElementById('resetBtn')
    ];

    playbackButtons.forEach(button => {
        button.addEventListener('click', function (e) {
            if (this.disabled) {
                e.preventDefault();
                e.stopPropagation();

                let reason = "按钮当前不可用";

                const noteCountValue = noteCountInput.value === '' ? NaN : parseInt(noteCountInput.value);
                if (isNaN(noteCountValue) || noteCountValue < 1 || noteCountValue > getTotalKeys()) {
                    reason = "请先输入有效的音符数量（1-" + getTotalKeys() + "）";
                } else {
                    const solfegeCountValue = randomSolfegeCountInput.value === '' ? NaN : parseInt(randomSolfegeCountInput.value);
                    const randomMode = randomModeSelect.value;
                    const noteDurationValue = document.getElementById('noteDuration').value === '' ? NaN : parseFloat(document.getElementById('noteDuration').value);
                    const noteVelocityValue = document.getElementById('noteVelocity').value === '' ? NaN : parseInt(document.getElementById('noteVelocity').value);

                    if (randomMode === 'allowRepeat') {
                        if (isNaN(solfegeCountValue) || solfegeCountValue < 1) {
                            reason = "请先输入有效的随机唱名数量（大于等于1）";
                        }
                    } else {
                        if (isNaN(solfegeCountValue) || solfegeCountValue < 1 || solfegeCountValue > noteCountValue) {
                            reason = "请先输入有效的随机唱名数量（1-" + noteCountValue + "）";
                        }
                    }

                    if (isNaN(noteDurationValue) || noteDurationValue < 0 || noteDurationValue > 4) {
                        reason = "请先输入有效的音符时长（0-4秒）";
                    } 

                    if (isNaN(noteVelocityValue) || noteVelocityValue < 0 || noteVelocityValue > 127) {
                        reason = "请先输入有效的音符力度（0-127）";
                    }
                    
                    else if (selectedNotes.length !== noteCount) {
                        reason = "请先选择所有" + noteCount + "个音符";
                    } else {
                        let missingSolfege = false;
                        let duplicateSolfege = false;

                        for (let i = 0; i < noteCount; i++) {
                            if (!solfegeLabels[i] || solfegeLabels[i].trim() === '') {
                                missingSolfege = true;
                                break;
                            } else {
                                for (let j = 0; j < noteCount; j++) {
                                    if (i !== j && solfegeLabels[j] &&
                                        solfegeLabels[i].toLowerCase() === solfegeLabels[j].toLowerCase()) {
                                        duplicateSolfege = true;
                                        break;
                                    }
                                }
                            }
                            if (duplicateSolfege) break;
                        }

                        if (missingSolfege) {
                            reason = "请为所有音符填入唱名";
                        } else if (duplicateSolfege) {
                            reason = "存在重复的唱名，请修改";
                        }
                    }
                }

                MessageUtils.showAlert(reason);
                return false;
            }
        });
    });

    otherButtonsNew[0].addEventListener('click', resetSelection);
}

// 处理随机范围旋钮点击
function handleRandomRangeKnobClick(e, type) {
    const knob = e.currentTarget;
    const rect = knob.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    // 计算角度 (0-360度)
    const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI);
    const normalizedAngle = (angle + 360) % 360;

    // 将角度映射到10%-100%范围（10%步长）
    const steps = 10; // 10%, 20%, ..., 100%
    const stepAngle = 360 / steps;
    const step = Math.round(normalizedAngle / stepAngle);
    const newValue = Math.max(0.1, Math.min(1.0, (step / steps) || 0.1));

    if (type === 'duration') {
        setDurationRandomRange(newValue);
    } else {
        setVelocityRandomRange(newValue);
    }
}

// 设置时值随机范围
function setDurationRandomRange(value) {
    durationRandomRange = Math.round(value * 10) / 10; // 确保是0.1的倍数
    document.getElementById('durationRandomRangeValue').textContent = Math.round(durationRandomRange * 100) + '%';
    updateRandomRangeKnobIndicators();
    MessageUtils.showStatusMessage(`时值随机范围已设置为 ${Math.round(durationRandomRange * 100)}% (以基础时值为中心)`);
}

// 设置力度随机范围
function setVelocityRandomRange(value) {
    velocityRandomRange = Math.round(value * 10) / 10; // 确保是0.1的倍数
    document.getElementById('velocityRandomRangeValue').textContent = Math.round(velocityRandomRange * 100) + '%';
    updateRandomRangeKnobIndicators();
    MessageUtils.showStatusMessage(`力度随机范围已设置为 ${Math.round(velocityRandomRange * 100)}% (以基础力度为中心)`);
}

// 更新随机范围旋钮指示器
function updateRandomRangeKnobIndicators() {
    // 时值随机范围旋钮：10%-100%映射到0-360度
    const durationAngle = ((durationRandomRange - 0.1) / 0.9) * 360;
    document.getElementById('durationRandomRangeIndicator').style.transform =
        `translateX(-50%) rotate(${durationAngle}deg)`;

    // 力度随机范围旋钮：10%-100%映射到0-360度
    const velocityAngle = ((velocityRandomRange - 0.1) / 0.9) * 360;
    document.getElementById('velocityRandomRangeIndicator').style.transform =
        `translateX(-50%) rotate(${velocityAngle}deg)`;
}

// 获取琴键总数
function getTotalKeys() {
    // 从piano.js中获取琴键总数
    if (typeof getTotalKeys === 'function') {
        return getTotalKeys();
    }
    return 88; // 默认值
}

// 获取音符时长
function getNoteDuration() {
    const noteDurationInput = document.getElementById('noteDuration');
    if (noteDurationInput) {
        const value = parseFloat(noteDurationInput.value);
        return isNaN(value) ? 0.5 : Math.max(0, Math.min(4, value));
    }
    return 0.5;
}

// 获取默认力度
function getDefaultVelocity() {
    const noteVelocityInput = document.getElementById('noteVelocity');
    if (noteVelocityInput) {
        const value = parseInt(noteVelocityInput.value);
        return isNaN(value) ? 100 : Math.max(0, Math.min(127, value));
    }
    return 100;
}

// 格式化音符时长显示
function formatNoteDurationDisplay() {
    const noteDurationInput = document.getElementById('noteDuration');
    if (noteDurationInput) {
        const value = parseFloat(noteDurationInput.value);
        if (!isNaN(value)) {
            noteDurationInput.value = formatDurationDisplay(value);
        }
    }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', function() {
    init().catch(error => {
        console.error("应用初始化失败:", error);
        MessageUtils.showError("应用启动失败: " + error.message);
        
        // 即使初始化失败，也尝试显示主界面
        setTimeout(() => {
            document.body.classList.add('loaded');
        }, 1000);
    });
});

// 按钮状态监听
(function initButtonListener() {
    const randomBtn = document.getElementById('randomBtn');
    let clickHandler = null;

    function updateButtonState() {
        const isDisabled = randomBtn.disabled;

        if (isDisabled && clickHandler) {
            randomBtn.removeEventListener('click', clickHandler);
            clickHandler = null;
        } else if (!isDisabled && !clickHandler) {
            clickHandler = () => playRandomSequence();
            randomBtn.addEventListener('click', clickHandler);
        }
    }

    // 确保元素存在
    if (randomBtn) {
        new MutationObserver(updateButtonState).observe(randomBtn, {
            attributes: true,
            attributeFilter: ['disabled']
        });
        updateButtonState();
    }
})();

// 全局变量声明（确保与piano.js中的变量一致）
let noteCountInput = document.getElementById('noteCount');
let randomModeSelect = document.getElementById('randomMode');
let randomSolfegeCountInput = document.getElementById('randomSolfegeCount');
let noteTypeSelect = document.getElementById('noteType');
let noteCountError = document.getElementById('noteCountError');
let randomSolfegeCountError = document.getElementById('randomSolfegeCountError');
let selectedNotes = ["A4", "B4", "F#4"];
let solfegeLabels = {};
let noteCount = 3;
let randomBtn = document.getElementById('randomBtn');
let resetBtn = document.getElementById('resetBtn');

// 确保DOM加载完成后获取元素
document.addEventListener('DOMContentLoaded', function() {
    // 重新获取元素引用
    noteCountInput = document.getElementById('noteCount');
    randomModeSelect = document.getElementById('randomMode');
    randomSolfegeCountInput = document.getElementById('randomSolfegeCount');
    noteTypeSelect = document.getElementById('noteType');
    noteCountError = document.getElementById('noteCountError');
    randomSolfegeCountError = document.getElementById('randomSolfegeCountError');
    randomBtn = document.getElementById('randomBtn');
    resetBtn = document.getElementById('resetBtn');
});