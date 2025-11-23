// 工具函数模块 - 输入检查、报错/弹窗信息、主题切换、设备检测

// 输入验证相关功能
const ValidationUtils = {
    // 验证音符数量
    validateNoteCount(value, totalKeys, errorElement) {
        if (isNaN(value) || value === '' || value === null) {
            this.showError(errorElement, `请输入1～${totalKeys}之间的数字`);
            return false;
        }

        if (value < 1 || value > totalKeys) {
            this.showError(errorElement, `只允许填入1～${totalKeys}之间的数字`);
            return false;
        }

        this.hideError(errorElement);
        return true;
    },

    // 验证随机唱名数量
    validateRandomSolfegeCount(value, randomMode, maxSolfegeCount, errorElement) {
        if (isNaN(value) || value === '' || value === null) {
            this.showError(errorElement, "请输入有效数字");
            return false;
        }

        if (randomMode === 'allowRepeat') {
            if (value < 1) {
                this.showError(errorElement, "请输入大于等于1的数字");
                return false;
            }
            this.hideError(errorElement);
            return true;
        } else {
            if (isNaN(maxSolfegeCount) || maxSolfegeCount === '' || maxSolfegeCount === null) {
                this.showError(errorElement, "请先输入有效的音符数量");
                return false;
            }

            if (value < 1 || value > maxSolfegeCount) {
                this.showError(errorElement, `请输入1～${maxSolfegeCount}之间的数字`);
                return false;
            }

            this.hideError(errorElement);
            return true;
        }
    },

    // 新增：验证音符时长
    validateNoteDuration(value, errorElement) {
        if (isNaN(value) || value === '' || value === null) {
            this.showError(errorElement, "请输入有效数字");
            return false;
        }

        if (value < 0 || value > 4) {
            this.showError(errorElement, "请输入0～4之间的数字");
            return false;
        }

        this.hideError(errorElement);
        return true;
    },

    // 添加力度验证
    validateNoteVelocity: function (value, errorElement) {
        if (isNaN(value) || value === '' || value === null) {
            this.showError(errorElement, "请输入有效的力度值");
            return false;
        }
    
        if (value < 0 || value > 127) {
            this.showError(errorElement, "力度值必须在0～127之间");
            return false;
        }
    
        this.hideError(errorElement);
        return true;
    },

    // 验证唱名输入是否重复且符合格式要求
    validateSolfegeInput(index, value, solfegeLabels, noteCount, isInput = false) {
        const errorElement = document.getElementById(`solfegeError${index}`);
        const inputElement = document.getElementById(`solfegeInput${index}`);

        this.hideError(errorElement);

        if (!value || value.trim() === '') {
            solfegeLabels[index] = '';
            return true;
        }

        const trimmedValue = value.trim();

        // 检查输入格式：只允许字母、数字、汉字
        const validFormat = /^[a-zA-Z0-9\u4e00-\u9fa5]+$/;
        if (!validFormat.test(trimmedValue)) {
            if (!isInput) {
                inputElement.value = '';
                solfegeLabels[index] = '';
                this.showError(errorElement, '唱名只能包含字母、数字或汉字');
            } else {
                this.showError(errorElement, '唱名只能包含字母、数字或汉字');
            }
            return false;
        }

        // 检查是否与其他唱名重复（不区分大小写）
        let isDuplicate = false;
        for (let i = 0; i < noteCount; i++) {
            if (i !== index && solfegeLabels[i] &&
                solfegeLabels[i].toLowerCase() === trimmedValue.toLowerCase()) {
                isDuplicate = true;
                break;
            }
        }

        if (isDuplicate) {
            if (!isInput) {
                inputElement.value = '';
                solfegeLabels[index] = '';
                this.showError(errorElement, '唱名已存在');
            } else {
                this.showError(errorElement, '唱名重复，请修改');
            }
            return false;
        } else {
            solfegeLabels[index] = trimmedValue;
            return true;
        }
    },

    // 显示错误信息
    showError(errorElement, message) {
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.classList.add('show');
        }
    },

    // 隐藏错误信息
    hideError(errorElement) {
        if (errorElement) {
            errorElement.textContent = '';
            errorElement.classList.remove('show');
        }
    }
};

// 弹窗和信息提示功能
const MessageUtils = {
    // 显示状态消息
    showStatusMessage(message, duration = 2000) {
        const statusElement = document.getElementById('statusMessage');
        if (statusElement) {
            statusElement.textContent = message;
            if (duration > 0) {
                setTimeout(() => {
                    if (statusElement.textContent === message) {
                        statusElement.textContent = "";
                    }
                }, duration);
            }
        }
    },

    // 显示警告消息
    showWarning(message, duration = 3000) {
        this.showStatusMessage(message, duration);
    },

    // 显示错误消息
    showError(message, duration = 0) {
        const statusElement = document.getElementById('statusMessage');
        if (statusElement) {
            statusElement.innerHTML = `<span style="color:#ff5555">${message}</span>`;
            if (duration > 0) {
                setTimeout(() => {
                    if (statusElement.innerHTML.includes(message)) {
                        statusElement.textContent = "";
                    }
                }, duration);
            }
        }
    },

    // 显示成功消息
    showSuccess(message, duration = 2000) {
        const statusElement = document.getElementById('statusMessage');
        if (statusElement) {
            statusElement.innerHTML = `<span style="color:#55ff55">${message}</span>`;
            if (duration > 0) {
                setTimeout(() => {
                    if (statusElement.innerHTML.includes(message)) {
                        statusElement.textContent = "";
                    }
                }, duration);
            }
        }
    },

    // 显示确认对话框
    showConfirm(message) {
        return confirm(message);
    },

    // 显示警告对话框
    showAlert(message) {
        alert(message);
    }
};

// 主题切换功能
const ThemeManager = {
    themes: ['default-theme', 'pink-theme'],
    currentThemeIndex: 0,
    themeNames: ['蓝色主题', '粉色主题'],

    // 初始化主题
    init() {
        const savedTheme = localStorage.getItem('pianoTrainerTheme');
        if (savedTheme) {
            document.body.classList.add(savedTheme);
            this.currentThemeIndex = this.themes.indexOf(savedTheme);
        } else {
            document.body.classList.add(this.themes[0]);
        }
        this.updateThemeButton();
    },

    // 切换主题
    toggle() {
        document.body.classList.remove(this.themes[this.currentThemeIndex]);
        this.currentThemeIndex = (this.currentThemeIndex + 1) % this.themes.length;
        document.body.classList.add(this.themes[this.currentThemeIndex]);

        localStorage.setItem('pianoTrainerTheme', this.themes[this.currentThemeIndex]);
        this.updateThemeButton();
    },

    // 更新主题按钮文本
    updateThemeButton() {
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.textContent = this.themeNames[this.currentThemeIndex];
        }
    },

    // 获取当前主题
    getCurrentTheme() {
        return this.themes[this.currentThemeIndex];
    }
};

// 设备检测功能
const DeviceDetector = {
    // 检测设备类型
    detect() {
        const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
        const isTablet = window.matchMedia("(min-width: 768px) and (max-width: 1024px)").matches;
        const isMobile = window.matchMedia("(max-width: 767px)").matches;

        document.body.classList.remove('desktop-view', 'tablet-landscape-view', 'mobile-view');

        if (isMac || (!isTablet && !isMobile)) {
            document.body.classList.add('desktop-view');
        } else if (isTablet && window.innerWidth > window.innerHeight) {
            document.body.classList.add('tablet-landscape-view');
        } else {
            document.body.classList.add('mobile-view');
        }
    },

    // 获取设备类型
    getDeviceType() {
        if (document.body.classList.contains('desktop-view')) return 'desktop';
        if (document.body.classList.contains('tablet-landscape-view')) return 'tablet';
        if (document.body.classList.contains('mobile-view')) return 'mobile';
        return 'unknown';
    },

    // 检查是否是移动设备
    isMobile() {
        return this.getDeviceType() === 'mobile';
    },

    // 检查是否是平板设备
    isTablet() {
        return this.getDeviceType() === 'tablet';
    },

    // 检查是否是桌面设备
    isDesktop() {
        return this.getDeviceType() === 'desktop';
    }
};

// 工具函数集合
const GeneralUtils = {
    // 防抖函数
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // 节流函数
    throttle(func, limit) {
        let inThrottle;
        return function (...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    // 生成随机数
    randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },

    // 数组洗牌
    shuffleArray(array) {
        const newArray = [...array];
        for (let i = newArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
        }
        return newArray;
    }
};

// 导出所有工具函数
window.ValidationUtils = ValidationUtils;
window.MessageUtils = MessageUtils;
window.ThemeManager = ThemeManager;
window.DeviceDetector = DeviceDetector;
window.GeneralUtils = GeneralUtils;