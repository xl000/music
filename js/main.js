// 主题切换和应用主逻辑模块

// 隐藏模式状态
let isHideMode = false;

// 随机范围控制变量
let durationRandomRange = 0.5; // 默认50%
let velocityRandomRange = 0.5; // 默认50%

// 音频加载完成回调函数
window.audioLoadingComplete = function() {
    console.log("音频加载完成，开始初始化主界面");
    initMainApp();
};

// 主应用初始化函数
function initMainApp() {
    // 初始化主题
    if (window.ThemeManager) {
        ThemeManager.init();
    }

    // 设置主题切换事件
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            if (window.ThemeManager) {
                ThemeManager.toggle();
            }
        });
    }

    // 设置隐藏模式切换事件
    const hideModeToggle = document.getElementById('hideModeToggle');
    if (hideModeToggle) {
        hideModeToggle.addEventListener('click', toggleHideMode);
    }

    // 检测设备类型
    if (window.DeviceDetector) {
        DeviceDetector.detect();
        window.addEventListener('resize', DeviceDetector.detect);
    }

    // 设置音符数量输入框的最大值为琴键总数
    const totalKeys = getTotalKeys();
    const noteCountInput = document.getElementById('noteCount');
    if (noteCountInput) {
        noteCountInput.max = totalKeys;
    }

    // 设置唱名数量的最大值为音符数量
    const randomSolfegeCountInput = document.getElementById('randomSolfegeCount');
    if (randomSolfegeCountInput && noteCountInput) {
        randomSolfegeCountInput.max = parseInt(noteCountInput.value) || 3;
    }

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
    if (typeof checkAllValidations === 'function') {
        checkAllValidations();
    }
    
    // 更新状态消息
    if (window.MessageUtils) {
        MessageUtils.showStatusMessage("音源加载完成，准备就绪");
    }
}

// 初始化函数 - 检查音频状态
async function init() {
    // 如果音频已经加载完成，直接初始化
    if (isAudioReady()) {
        console.log("音频已加载完成，直接初始化");
        initMainApp();
        return;
    }
    
    // 否则等待音频加载完成
    console.log("等待音频加载完成...");
    await new Promise((resolve) => {
        const checkAudio = setInterval(() => {
            if (isAudioReady()) {
                clearInterval(checkAudio);
                resolve();
            }
        }, 100);
    });
    
    // 音频加载完成后初始化
    initMainApp();
}

// 确保在DOM加载完成后执行初始化
document.addEventListener('DOMContentLoaded', function() {
    // 延迟初始化，确保音频加载界面先显示
    setTimeout(init, 100);
});

// 切换隐藏模式函数
function toggleHideMode() {
    isHideMode = !isHideMode;
    const body = document.body;
    const hideModeBtn = document.getElementById('hideModeToggle');

    if (isHideMode) {
        body.classList.add('hide-mode');
        if (hideModeBtn) hideModeBtn.textContent = '解除隐藏';
        // 确保钢琴键标签也被隐藏
        document.querySelectorAll('.key-label').forEach(label => {
            if (label) label.style.display = 'none';
        });
        if (window.MessageUtils) {
            MessageUtils.showSuccess("已进入隐藏模式");
        }
    } else {
        body.classList.remove('hide-mode');
        if (hideModeBtn) hideModeBtn.textContent = '开启隐藏';
        // 恢复显示钢琴键标签
        document.querySelectorAll('.key-label').forEach(label => {
            if (label) label.style.display = 'block';
        });
        if (window.MessageUtils) {
            MessageUtils.showSuccess("已退出隐藏模式");
        }
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

    if (parts.length >= 2 && parts[1] !== '') {
        result.duration = parseFloat(parts[1]) || getNoteDuration();
    }

    if (parts.length >= 3 && parts[2] !== '') {
        result.velocity = parseInt(parts[2]) || getDefaultVelocity();
    }

    return result;
}

// 在setupEventListeners函数中添加按钮点击事件设置
function setupEventListeners() {
    // 获取必要的DOM元素
    const randomBtn = document.getElementById('randomBtn');
    const resetBtn = document.getElementById('resetBtn');
    const noteCountInput = document.getElementById('noteCount');
    const randomModeSelect = document.getElementById('randomMode');
    const randomSolfegeCountInput = document.getElementById('randomSolfegeCount');
    
    // 检查必要的DOM元素是否存在
    if (!randomBtn || !resetBtn || !noteCountInput || !randomModeSelect || !randomSolfegeCountInput) {
        console.error("必要的DOM元素未找到，无法设置事件监听器");
        return;
    }
    
    // 先设置按钮的禁用状态点击提示
    setupButtonClickHandlers();

    // 然后再设置其他事件监听器
    randomBtn.addEventListener('click', playRandomSequence);
    resetBtn.addEventListener('click', resetSelection);

    // 点播按钮事件监听
    const playbackBtn = document.getElementById('playbackBtn');
    if (playbackBtn) {
        playbackBtn.addEventListener('click', playSolfegeSequence);
    }

    // 音符数量变化监听
    noteCountInput.addEventListener('change', () => {
        const value = noteCountInput.value === '' ? NaN : parseInt(noteCountInput.value);
        const noteCountError = document.getElementById('noteCountError');
        if (noteCountError && window.ValidationUtils) {
            if (ValidationUtils.validateNoteCount(value, getTotalKeys(), noteCountError)) {
                if (!isNaN(value)) {
                    updateNoteCount(value);
                }
            }
        }
        if (typeof checkAllValidations === 'function') {
            checkAllValidations();
        }
    });

    // 输入时实时验证
    noteCountInput.addEventListener('input', () => {
        const value = noteCountInput.value === '' ? NaN : parseInt(noteCountInput.value);
        const noteCountError = document.getElementById('noteCountError');
        if (noteCountError && window.ValidationUtils) {
            ValidationUtils.validateNoteCount(value, getTotalKeys(), noteCountError, true);
        }
        if (!isNaN(value)) {
            randomSolfegeCountInput.max = value;
        }
        const solfegeValue = randomSolfegeCountInput.value === '' ? NaN : parseInt(randomSolfegeCountInput.value);
        const randomSolfegeCountError = document.getElementById('randomSolfegeCountError');
        if (randomSolfegeCountError && window.ValidationUtils) {
            ValidationUtils.validateRandomSolfegeCount(solfegeValue, randomModeSelect.value, parseInt(noteCountInput.value), randomSolfegeCountError);
        }
        if (typeof checkAllValidations === 'function') {
            checkAllValidations();
        }
    });

    // 随机唱名数量输入实时验证
    randomSolfegeCountInput.addEventListener('change', () => {
        const value = randomSolfegeCountInput.value === '' ? NaN : parseInt(randomSolfegeCountInput.value);
        const randomSolfegeCountError = document.getElementById('randomSolfegeCountError');
        if (randomSolfegeCountError && window.ValidationUtils) {
            ValidationUtils.validateRandomSolfegeCount(value, randomModeSelect.value, parseInt(noteCountInput.value), randomSolfegeCountError);
        }
        if (typeof checkAllValidations === 'function') {
            checkAllValidations();
        }
    });

    // 随机方式变化实时验证
    randomModeSelect.addEventListener('change', () => {
        const value = randomSolfegeCountInput.value === '' ? NaN : parseInt(randomSolfegeCountInput.value);
        const randomSolfegeCountError = document.getElementById('randomSolfegeCountError');
        if (randomSolfegeCountError && window.ValidationUtils) {
            ValidationUtils.validateRandomSolfegeCount(value, randomModeSelect.value, parseInt(noteCountInput.value), randomSolfegeCountError);
        }
        if (typeof checkAllValidations === 'function') {
            checkAllValidations();
        }
    });

    randomSolfegeCountInput.addEventListener('input', () => {
        const value = randomSolfegeCountInput.value === '' ? NaN : parseInt(randomSolfegeCountInput.value);
        const randomSolfegeCountError = document.getElementById('randomSolfegeCountError');
        if (randomSolfegeCountError && window.ValidationUtils) {
            ValidationUtils.validateRandomSolfegeCount(value, randomModeSelect.value, parseInt(noteCountInput.value), randomSolfegeCountError);
        }
        if (typeof checkAllValidations === 'function') {
            checkAllValidations();
        }
    });

    // 新增：音符类型变化监听
    const noteTypeSelect = document.getElementById('noteType');
    if (noteTypeSelect) {
        noteTypeSelect.addEventListener('change', () => {
            if (typeof checkAllValidations === 'function') {
                checkAllValidations();
            }
        });
    }

    // 音符时长输入验证和格式化显示
    const noteDurationInput = document.getElementById('noteDuration');
    const noteDurationError = document.getElementById('noteDurationError');

    // 新增：音符力度输入验证
    const noteVelocityInput = document.getElementById('noteVelocity');
    const noteVelocityError = document.getElementById('noteVelocityError');

    // 格式化显示音符时值
    function formatNoteDurationDisplay() {
        if (!noteDurationInput) return;
        
        const value = noteDurationInput.value === '' ? NaN : parseFloat(noteDurationInput.value);
        if (!isNaN(value)) {
            noteDurationInput.value = formatDurationDisplay(value);
        }
    }

    if (noteDurationInput) {
        noteDurationInput.addEventListener('change', () => {
            const value = noteDurationInput.value === '' ? NaN : parseFloat(noteDurationInput.value);
            if (noteDurationError && window.ValidationUtils) {
                if (ValidationUtils.validateNoteDuration(value, noteDurationError)) {
                    formatNoteDurationDisplay();
                }
            }
            if (typeof checkAllValidations === 'function') {
                checkAllValidations();
            }
        });

        noteDurationInput.addEventListener('input', () => {
            const value = noteDurationInput.value === '' ? NaN : parseFloat(noteDurationInput.value);
            if (noteDurationError && window.ValidationUtils) {
                ValidationUtils.validateNoteDuration(value, noteDurationError);
            }
            if (typeof checkAllValidations === 'function') {
                checkAllValidations();
            }
        });
    }

    // 新增力度验证
    if (noteVelocityInput && noteVelocityError && window.ValidationUtils) {
        noteVelocityInput.addEventListener('input', () => {
            const value = noteVelocityInput.value === '' ? NaN : parseInt(noteVelocityInput.value);
            ValidationUtils.validateNoteVelocity(value, noteVelocityError);
            if (typeof checkAllValidations === 'function') {
                checkAllValidations();
            }
        });

        noteVelocityInput.addEventListener('change', () => {
            const value = noteVelocityInput.value === '' ? NaN : parseInt(noteVelocityInput.value);
            ValidationUtils.validateNoteVelocity(value, noteVelocityError);
            if (typeof checkAllValidations === 'function') {
                checkAllValidations();
            }
        });
    }

    // 初始格式化显示
    formatNoteDurationDisplay();

    // 新增：时值随机范围旋钮事件监听
    const durationRandomRangeKnob = document.getElementById('durationRandomRangeKnob');
    const durationRandomRangeDecrease = document.getElementById('durationRandomRangeDecrease');
    const durationRandomRangeIncrease = document.getElementById('durationRandomRangeIncrease');

    if (durationRandomRangeKnob) {
        durationRandomRangeKnob.addEventListener('click', (e) => {
            handleRandomRangeKnobClick(e, 'duration');
        });
    }

    if (durationRandomRangeDecrease) {
        durationRandomRangeDecrease.addEventListener('click', () => {
            setDurationRandomRange(Math.max(0.1, durationRandomRange - 0.1));
        });
    }

    if (durationRandomRangeIncrease) {
        durationRandomRangeIncrease.addEventListener('click', () => {
            setDurationRandomRange(Math.min(1.0, durationRandomRange + 0.1));
        });
    }

    // 新增：力度随机范围旋钮事件监听
    const velocityRandomRangeKnob = document.getElementById('velocityRandomRangeKnob');
    const velocityRandomRangeDecrease = document.getElementById('velocityRandomRangeDecrease');
    const velocityRandomRangeIncrease = document.getElementById('velocityRandomRangeIncrease');

    if (velocityRandomRangeKnob) {
        velocityRandomRangeKnob.addEventListener('click', (e) => {
            handleRandomRangeKnobClick(e, 'velocity');
        });
    }

    if (velocityRandomRangeDecrease) {
        velocityRandomRangeDecrease.addEventListener('click', () => {
            setVelocityRandomRange(Math.max(0.1, velocityRandomRange - 0.1));
        });
    }

    if (velocityRandomRangeIncrease) {
        velocityRandomRangeIncrease.addEventListener('click', () => {
            setVelocityRandomRange(Math.min(1.0, velocityRandomRange + 0.1));
        });
    }

    // 初始验证
    if (typeof checkAllValidations === 'function') {
        checkAllValidations();
    }
}

// 检查所有验证是否通过
function checkAllValidations() {
    const noteCountInput = document.getElementById('noteCount');
    const randomSolfegeCountInput = document.getElementById('randomSolfegeCount');
    const noteDurationInput = document.getElementById('noteDuration');
    const noteVelocityInput = document.getElementById('noteVelocity');
    const randomModeSelect = document.getElementById('randomMode');
    
    if (!noteCountInput || !randomSolfegeCountInput || !noteDurationInput || !noteVelocityInput || !randomModeSelect) {
        return false;
    }
    
    const noteCountValue = noteCountInput.value === '' ? NaN : parseInt(noteCountInput.value);
    const solfegeCountValue = randomSolfegeCountInput.value === '' ? NaN : parseInt(randomSolfegeCountInput.value);
    const noteDurationValue = noteDurationInput.value === '' ? NaN : parseFloat(noteDurationInput.value);
    const noteVelocityValue = noteVelocityInput.value === '' ? NaN : parseInt(noteVelocityInput.value);

    const noteCountError = document.getElementById('noteCountError');
    const randomSolfegeCountError = document.getElementById('randomSolfegeCountError');
    const noteDurationError = document.getElementById('noteDurationError');
    const noteVelocityError = document.getElementById('noteVelocityError');

    let noteCountValid = true;
    let solfegeCountValid = true;
    let noteDurationValid = true;
    let noteVelocityValid = true;

    if (window.ValidationUtils) {
        if (noteCountError) {
            noteCountValid = ValidationUtils.validateNoteCount(noteCountValue, getTotalKeys(), noteCountError);
        }
        if (randomSolfegeCountError) {
            solfegeCountValid = ValidationUtils.validateRandomSolfegeCount(solfegeCountValue, randomModeSelect.value, noteCountValue, randomSolfegeCountError);
        }
        if (noteDurationError) {
            noteDurationValid = ValidationUtils.validateNoteDuration(noteDurationValue, noteDurationError);
        }
        if (noteVelocityError) {
            noteVelocityValid = ValidationUtils.validateNoteVelocity(noteVelocityValue, noteVelocityError);
        }
    }

    const notesSelected = window.selectedNotes ? window.selectedNotes.length === window.noteCount : false;

    let allSolfegeFilled = true;
    let hasDuplicateSolfege = false;

    if (window.solfegeLabels && window.noteCount) {
        for (let i = 0; i < window.noteCount; i++) {
            if (!window.solfegeLabels[i] || window.solfegeLabels[i].trim() === '') {
                allSolfegeFilled = false;
            } else {
                for (let j = 0; j < window.noteCount; j++) {
                    if (i !== j && window.solfegeLabels[j] &&
                        window.solfegeLabels[i].toLowerCase() === window.solfegeLabels[j].toLowerCase()) {
                        hasDuplicateSolfege = true;
                        break;
                    }
                }
            }
            if (hasDuplicateSolfege) break;
        }
    }

    const playbackButtonsEnabled = noteCountValid && solfegeCountValid && noteDurationValid && noteVelocityValid &&
        notesSelected && allSolfegeFilled && !hasDuplicateSolfege;

    const playButtonEnabled = notesSelected;

    updateButtonStates(playbackButtonsEnabled, playButtonEnabled);

    return noteCountValid && solfegeCountValid && noteDurationValid && noteVelocityValid;
}

// 更新按钮状态
function updateButtonStates(playbackButtonsEnabled, playButtonEnabled) {
    const playbackBtn = document.getElementById('playbackBtn');
    const randomBtn = document.getElementById('randomBtn');
    const resetBtn = document.getElementById('resetBtn');

    if (playbackBtn) {
        playbackBtn.disabled = !playbackButtonsEnabled;
    }
    if (randomBtn) {
        randomBtn.disabled = !playbackButtonsEnabled;
    }
    if (resetBtn) {
        resetBtn.disabled = false;
    }
}

// 添加按钮点击事件处理
function setupButtonClickHandlers() {
    const playbackBtn = document.getElementById('playbackBtn');
    const randomBtn = document.getElementById('randomBtn');
    const resetBtn = document.getElementById('resetBtn');

    if (!playbackBtn || !randomBtn || !resetBtn) {
        console.error("按钮元素未找到，无法设置点击事件");
        return;
    }

    const buttons = [playbackBtn, randomBtn];
    const otherButtons = [resetBtn];

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
        if (!button) return;
        
        button.addEventListener('click', function (e) {
            if (this.disabled) {
                e.preventDefault();
                e.stopPropagation();

                let reason = "按钮当前不可用";

                const noteCountInput = document.getElementById('noteCount');
                const noteCountValue = noteCountInput && noteCountInput.value !== '' ? parseInt(noteCountInput.value) : NaN;
                const totalKeys = getTotalKeys();
                
                if (isNaN(noteCountValue) || noteCountValue < 1 || noteCountValue > totalKeys) {
                    reason = "请先输入有效的音符数量（1-" + totalKeys + "）";
                } else {
                    const randomSolfegeCountInput = document.getElementById('randomSolfegeCount');
                    const randomModeSelect = document.getElementById('randomMode');
                    const noteDurationInput = document.getElementById('noteDuration');
                    const noteVelocityInput = document.getElementById('noteVelocity');
                    
                    const solfegeCountValue = randomSolfegeCountInput && randomSolfegeCountInput.value !== '' ? parseInt(randomSolfegeCountInput.value) : NaN;
                    const randomMode = randomModeSelect ? randomModeSelect.value : 'nonRepeat';
                    const noteDurationValue = noteDurationInput && noteDurationInput.value !== '' ? parseFloat(noteDurationInput.value) : NaN;
                    const noteVelocityValue = noteVelocityInput && noteVelocityInput.value !== '' ? parseInt(noteVelocityInput.value) : NaN;

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

                    // 在按钮点击处理函数中添加力度验证
                    if (isNaN(noteVelocityValue) || noteVelocityValue < 0 || noteVelocityValue > 127) {
                        reason = "请先输入有效的音符力度（0-127）";
                    } else if (window.selectedNotes && window.selectedNotes.length !== noteCountValue) {
                        reason = "请先选择所有" + noteCountValue + "个音符";
                    } else {
                        let missingSolfege = false;
                        let duplicateSolfege = false;

                        if (window.solfegeLabels && window.noteCount) {
                            for (let i = 0; i < window.noteCount; i++) {
                                if (!window.solfegeLabels[i] || window.solfegeLabels[i].trim() === '') {
                                    missingSolfege = true;
                                    break;
                                } else {
                                    for (let j = 0; j < window.noteCount; j++) {
                                        if (i !== j && window.solfegeLabels[j] &&
                                            window.solfegeLabels[i].toLowerCase() === window.solfegeLabels[j].toLowerCase()) {
                                            duplicateSolfege = true;
                                            break;
                                        }
                                    }
                                }
                                if (duplicateSolfege) break;
                            }
                        }

                        if (missingSolfege) {
                            reason = "请为所有音符填入唱名";
                        } else if (duplicateSolfege) {
                            reason = "存在重复的唱名，请修改";
                        }
                    }
                }

                if (window.MessageUtils) {
                    MessageUtils.showAlert(reason);
                }
                return false;
            }
        });
    });

    if (otherButtonsNew[0]) {
        otherButtonsNew[0].addEventListener('click', resetSelection);
    }
}

// 新增：处理随机范围旋钮点击
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

// 新增：设置时值随机范围
function setDurationRandomRange(value) {
    durationRandomRange = Math.round(value * 10) / 10; // 确保是0.1的倍数
    const durationRandomRangeValue = document.getElementById('durationRandomRangeValue');
    if (durationRandomRangeValue) {
        durationRandomRangeValue.textContent = Math.round(durationRandomRange * 100) + '%';
    }
    updateRandomRangeKnobIndicators();
    if (window.MessageUtils) {
        MessageUtils.showStatusMessage(`时值随机范围已设置为 ${Math.round(durationRandomRange * 100)}% (以基础时值为中心)`);
    }
}

// 新增：设置力度随机范围
function setVelocityRandomRange(value) {
    velocityRandomRange = Math.round(value * 10) / 10; // 确保是0.1的倍数
    const velocityRandomRangeValue = document.getElementById('velocityRandomRangeValue');
    if (velocityRandomRangeValue) {
        velocityRandomRangeValue.textContent = Math.round(velocityRandomRange * 100) + '%';
    }
    updateRandomRangeKnobIndicators();
    if (window.MessageUtils) {
        MessageUtils.showStatusMessage(`力度随机范围已设置为 ${Math.round(velocityRandomRange * 100)}% (以基础力度为中心)`);
    }
}

// 新增：更新随机范围旋钮指示器
function updateRandomRangeKnobIndicators() {
    // 时值随机范围旋钮：10%-100%映射到0-360度
    const durationAngle = ((durationRandomRange - 0.1) / 0.9) * 360;
    const durationRandomRangeIndicator = document.getElementById('durationRandomRangeIndicator');
    if (durationRandomRangeIndicator) {
        durationRandomRangeIndicator.style.transform = `translateX(-50%) rotate(${durationAngle}deg)`;
    }

    // 力度随机范围旋钮：10%-100%映射到0-360度
    const velocityAngle = ((velocityRandomRange - 0.1) / 0.9) * 360;
    const velocityRandomRangeIndicator = document.getElementById('velocityRandomRangeIndicator');
    if (velocityRandomRangeIndicator) {
        velocityRandomRangeIndicator.style.transform = `translateX(-50%) rotate(${velocityAngle}deg)`;
    }
}

// 获取琴键总数
function getTotalKeys() {
    // 假设钢琴有88个键，可以根据实际情况调整
    return 88;
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

// 获取音符类型
function getNoteType() {
    const noteTypeSelect = document.getElementById('noteType');
    return noteTypeSelect ? noteTypeSelect.value : 'fixedDurationFixedVelocity';
}

// 创建钢琴键盘
function createPiano() {
    // 这个函数应该在piano.js中实现
    console.log("创建钢琴键盘 - 此功能应在piano.js中实现");
}

// 设置滚动箭头
function setupScrollArrows() {
    const leftArrow = document.querySelector('.left-arrow');
    const rightArrow = document.querySelector('.right-arrow');
    const pianoContainer = document.querySelector('.piano-container');

    if (leftArrow && rightArrow && pianoContainer) {
        leftArrow.addEventListener('click', () => {
            pianoContainer.scrollBy({
                left: -200,
                behavior: 'smooth'
            });
        });

        rightArrow.addEventListener('click', () => {
            pianoContainer.scrollBy({
                left: 200,
                behavior: 'smooth'
            });
        });
    }
}

// 更新音符数量
function updateNoteCount(newCount) {
    if (window.updateNoteCount) {
        window.updateNoteCount(newCount);
    } else {
        console.warn("updateNoteCount函数未在全局作用域中找到");
    }
}

// 重置选择
function resetSelection() {
    if (window.resetSelection) {
        window.resetSelection();
    } else {
        console.warn("resetSelection函数未在全局作用域中找到");
    }
}

// 播放随机序列
function playRandomSequence() {
    if (window.playRandomSequence) {
        window.playRandomSequence();
    } else {
        console.warn("playRandomSequence函数未在全局作用域中找到");
    }
}

// 播放唱名序列
function playSolfegeSequence() {
    if (window.playSolfegeSequence) {
        window.playSolfegeSequence();
    } else {
        console.warn("playSolfegeSequence函数未在全局作用域中找到");
    }
}

// 检查音频是否已加载
function isAudioReady() {
    return window.isAudioLoaded || false;
}

// 按钮状态监听
(function initButtonListener() {
    const randomBtn = document.getElementById('randomBtn');
    if (!randomBtn) return;
    
    let clickHandler = null;

    function updateButtonState() {
        const isDisabled = randomBtn.disabled;

        if (isDisabled && clickHandler) {
            randomBtn.removeEventListener('click', clickHandler);
            clickHandler = null;
        } else if (!isDisabled && !clickHandler) {
            clickHandler = () => {
                if (window.playRandomSequence) {
                    window.playRandomSequence();
                }
            };
            randomBtn.addEventListener('click', clickHandler);
        }
    }

    new MutationObserver(updateButtonState).observe(randomBtn, {
        attributes: true,
        attributeFilter: ['disabled']
    });

    updateButtonState();
})();