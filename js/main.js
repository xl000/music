// 主题切换和应用主逻辑模块

// 隐藏模式状态
let isHideMode = false;

// 随机范围控制变量
let durationRandomRange = 0.5; // 默认50%
let velocityRandomRange = 0.5; // 默认50%
let sustainRate = 0.0; // 默认延音率 0%

// 初始化函数
async function init() {
    try {
        // 首先初始化音源加载
        MessageUtils.showStatusMessage("正在初始化音源...");
        await initAudioLoad();

        // 音源加载完成后继续其他初始化
        MessageUtils.showStatusMessage("音源加载完成，初始化界面...");

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
        setSustainRate(0.0); // 默认0%

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

        MessageUtils.showStatusMessage("初始化完成，可以开始使用");

    } catch (error) {
        console.error("初始化失败:", error);
        MessageUtils.showError("初始化失败: " + error.message);
        // 即使失败也切换到主界面
        switchToMainInterface();
    }
}

// 切换隐藏模式函数
function toggleHideMode() {
    isHideMode = !isHideMode;
    const body = document.body;
    const hideModeBtn = document.getElementById('hideModeToggle');

    if (isHideMode) {
        body.classList.add('hide-mode');  // 修改：添加hide-mode类
        hideModeBtn.textContent = '解除隐藏';
        // 确保钢琴键标签也被隐藏
        document.querySelectorAll('.key-label').forEach(label => {
            label.style.display = 'none';
        });
        MessageUtils.showSuccess("已进入隐藏模式");
    } else {
        body.classList.remove('hide-mode');  // 修改：移除hide-mode类
        hideModeBtn.textContent = '开启隐藏';
        // 恢复显示钢琴键标签
        document.querySelectorAll('.key-label').forEach(label => {
            label.style.display = 'block';
        });
        MessageUtils.showSuccess("已退出隐藏模式");
    }
}

function setupScrollArrows() {
    const pianoContainer = document.querySelector('.piano-container');
    const leftArrow = document.querySelector('.left-arrow');
    const rightArrow = document.querySelector('.right-arrow');

    // 设置滚动步长（每次滚动一个八度）
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

    // 在移动设备上添加触摸滑动支持
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
}

// 格式化时值显示，尽量使用整数
function formatDurationDisplay(duration) {
    // 先四舍五入到最多三位小数
    const rounded = Math.round(duration * 1000) / 1000;

    // 转换为字符串并去掉多余的0
    let result = rounded.toString();

    // 如果包含小数点，去掉末尾的0
    if (result.includes('.')) {
        result = result.replace(/0+$/, ''); // 去掉末尾的0
        if (result.endsWith('.')) {
            result = result.slice(0, -1); // 如果以小数点结尾，去掉小数点
        }
    }

    return result;
}


// 在setupEventListeners函数中添加按钮点击事件设置
function setupEventListeners() {
    // 先设置按钮的禁用状态点击提示
    setupButtonClickHandlers();

    // 添加特效点播按钮事件监听
    const effectBtn = document.getElementById('effectBtn');
    if (effectBtn) {
        effectBtn.addEventListener('click', playEffectSequence);
    }

    // 音符数量变化监听
    noteCountInput.addEventListener('change', () => {
        const value = noteCountInput.value === '' ? NaN : parseInt(noteCountInput.value);
        if (ValidationUtils.validateNoteCount(value, getTotalKeys(), noteCountError)) {
            if (!isNaN(value)) {
                updateNoteCount(value);
                // 当随机方式为"不允许重复音"时，同步随机唱名数量
                if (randomModeSelect.value === 'nonRepeat') {
                    randomSolfegeCountInput.value = value;
                    // 触发验证
                    const solfegeValue = randomSolfegeCountInput.value === '' ? NaN : parseInt(randomSolfegeCountInput.value);
                    ValidationUtils.validateRandomSolfegeCount(solfegeValue, randomModeSelect.value, value, randomSolfegeCountError);
                }
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
            // 当随机方式为"不允许重复音"时，实时同步随机唱名数量
            if (randomModeSelect.value === 'nonRepeat') {
                randomSolfegeCountInput.value = value;
                // 触发实时验证
                const solfegeValue = randomSolfegeCountInput.value === '' ? NaN : parseInt(randomSolfegeCountInput.value);
                ValidationUtils.validateRandomSolfegeCount(solfegeValue, randomModeSelect.value, value, randomSolfegeCountError, true);
            }
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

    // 随机方式变化实时验证和同步
    randomModeSelect.addEventListener('change', () => {
        const value = randomSolfegeCountInput.value === '' ? NaN : parseInt(randomSolfegeCountInput.value);
        const noteCountValue = noteCountInput.value === '' ? NaN : parseInt(noteCountInput.value);

        ValidationUtils.validateRandomSolfegeCount(value, randomModeSelect.value, noteCountValue, randomSolfegeCountError);

        // 当切换到"不允许重复音"模式时，自动同步随机唱名数量
        if (randomModeSelect.value === 'nonRepeat' && !isNaN(noteCountValue)) {
            randomSolfegeCountInput.value = noteCountValue;
            // 重新验证
            ValidationUtils.validateRandomSolfegeCount(noteCountValue, randomModeSelect.value, noteCountValue, randomSolfegeCountError);
        }

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

    // 新增力度验证
    noteVelocityInput.addEventListener('input', () => {
        const value = noteVelocityInput.value === '' ? NaN : parseInt(noteVelocityInput.value);
        // 移除第三个参数true，因为validateNoteVelocity函数已经修改为总是显示错误
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

    // 延音率旋钮事件监听 - 修复：确保在DOM加载完成后添加事件监听
    const sustainRateKnob = document.getElementById('sustainRateKnob');
    const sustainRateDecrease = document.getElementById('sustainRateDecrease');
    const sustainRateIncrease = document.getElementById('sustainRateIncrease');

    if (sustainRateKnob) {
        sustainRateKnob.addEventListener('click', (e) => {
            handleSustainRateKnobClick(e);
        });
    }

    if (sustainRateDecrease) {
        sustainRateDecrease.addEventListener('click', (e) => {
            e.stopPropagation(); // 防止事件冒泡
            const newValue = Math.max(0.0, sustainRate - 0.1);
            setSustainRate(parseFloat(newValue.toFixed(1))); // 确保精度
        });
    }

    if (sustainRateIncrease) {
        sustainRateIncrease.addEventListener('click', (e) => {
            e.stopPropagation(); // 防止事件冒泡
            const newValue = Math.min(1.0, sustainRate + 0.1);
            setSustainRate(parseFloat(newValue.toFixed(1))); // 确保精度
        });
    }

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

// 添加处理延音率旋钮点击的函数
function handleSustainRateKnobClick(e) {
    const knob = e.currentTarget;
    const rect = knob.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    // 计算角度 (0-360度)
    const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI);
    const normalizedAngle = (angle + 360) % 360;

    // 将角度映射到0%-100%范围（10%步长）
    const steps = 10; // 0%, 10%, 20%, ..., 100%
    const stepAngle = 360 / steps;
    const step = Math.round(normalizedAngle / stepAngle);
    const newValue = Math.max(0.0, Math.min(1.0, (step / steps) || 0.0));

    setSustainRate(newValue);
}

// 添加设置延音率的函数
function setSustainRate(value) {
    sustainRate = Math.round(value * 10) / 10; // 确保是0.1的倍数
    document.getElementById('sustainRateValue').textContent = Math.round(sustainRate * 100) + '%';
    updateRandomRangeKnobIndicators();
    MessageUtils.showStatusMessage(`默认延音率已设置为 ${Math.round(sustainRate * 100)}% (0-4倍音符时长)`);
    console.log(`默认延音率已设置为 ${Math.round(sustainRate * 100)}% (0-4倍音符时长)`);

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

// 添加按钮点击事件处理
function setupButtonClickHandlers() {
    const buttons = [
        { id: 'playbackBtn', handler: playSolfegeSequence },
        { id: 'randomBtn', handler: playRandomSequence }
    ];

    buttons.forEach(buttonInfo => {
        const button = document.getElementById(buttonInfo.id);
        const newButton = button.cloneNode(true);
        button.parentNode.replaceChild(newButton, button);

        // 为新按钮添加事件监听器
        document.getElementById(buttonInfo.id).addEventListener('click', function (e) {
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
                    } else if (selectedNotes.length !== noteCount) {
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
            } else {
                // 按钮启用时执行对应的处理函数
                buttonInfo.handler.call(this);
            }
        });
    });

    // 重置按钮单独处理
    const resetBtn = document.getElementById('resetBtn');
    const newResetBtn = resetBtn.cloneNode(true);
    resetBtn.parentNode.replaceChild(newResetBtn, resetBtn);
    document.getElementById('resetBtn').addEventListener('click', resetSelection);
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

    // 延音率旋钮：0%-100%映射到0-360度
    const sustainAngle = (sustainRate) * 360;
    document.getElementById('sustainRateIndicator').style.transform =
        `translateX(-50%) rotate(${sustainAngle}deg)`;

    // 力度随机范围旋钮：10%-100%映射到0-360度
    const velocityAngle = ((velocityRandomRange - 0.1) / 0.9) * 360;
    document.getElementById('velocityRandomRangeIndicator').style.transform =
        `translateX(-50%) rotate(${velocityAngle}deg)`;
}

// 特效点播函数
function playEffectSequence() {
    const solfegeSequenceInput = document.getElementById('solfegeSequence');
    const inputText = solfegeSequenceInput.value.trim();
    
    if (!inputText) {
        MessageUtils.showWarning("点播输入框为空，无法转换");
        return;
    }
    
    try {
        // 调用转换函数
        const convertedSequence = convertSolfegeToAbsolutePitch(inputText);
        
        // 将转换后的内容显示在控制台
        console.log("=== 唱名模式转绝对音高朴素模式 ===");
        console.log("原始输入:", inputText);
        console.log("转换结果:", convertedSequence);
        console.log("当前延音率:", Math.round(getSustainRate() * 100) + "%");
        console.log("转换时间:", new Date().toLocaleString());
        console.log("=== 转换完成 ===");
        
        // 显示成功消息
        MessageUtils.showSuccess("转换完成！结果已存入sessionStorage并在控制台显示");
        
    } catch (error) {
        console.error("转换失败:", error);
        MessageUtils.showError("转换失败: " + error.message);
    }
}

// 初始化应用
init();