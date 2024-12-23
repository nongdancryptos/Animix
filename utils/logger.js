// utils/logger.js

import chalk from 'chalk';

/**
 * Logger object với các phương thức log có màu sắc và định dạng rõ ràng.
 */
const logger = {
    /**
     * Hàm log chung cho tất cả các cấp độ.
     * @param {string} level - Cấp độ log (info, warn, error, success, debug).
     * @param {string} message - Thông điệp log.
     * @param {*} [value] - Giá trị bổ sung để log (tuỳ chọn).
     */
    log: (level, message, value = '') => {
        const now = new Date().toLocaleString('vi-VN', { hour12: false });

        // Định nghĩa màu sắc và biểu tượng cho từng cấp độ log
        const levels = {
            info: { color: chalk.blueBright, icon: 'ℹ️' },
            warn: { color: chalk.hex('#FFA500'), icon: '⚠️' }, // Sử dụng chalk.hex cho màu cam
            error: { color: chalk.red, icon: '❌' },
            success: { color: chalk.green, icon: '✅' },
            debug: { color: chalk.magenta, icon: '🐞' },
        };

        const { color, icon } = levels[level] || { color: chalk.white, icon: '📝' };

        // Định dạng các thành phần của log
        const timestamp = chalk.gray(`[${now}]`);
        const levelTag = color(`[${level.toUpperCase()}]`);
        const iconTag = icon;
        const formattedMessage = `${chalk.greenBright("[ AnimixBot ]")} ${timestamp} ${levelTag} ${iconTag} ${message}`;

        // Xử lý giá trị bổ sung nếu có
        let formattedValue = '';
        if (value) {
            if (typeof value === 'object') {
                formattedValue = `\n${chalk.white(JSON.stringify(value, null, 2))}`;
            } else {
                formattedValue = ` ${chalk.white(value)}`;
            }
        }

        // In ra log
        console.log(`${formattedMessage}${formattedValue}`);
    },

    /**
     * Log thông tin chung.
     * @param {string} message - Thông điệp log.
     * @param {*} [value] - Giá trị bổ sung để log (tuỳ chọn).
     */
    info: (message, value = '') => logger.log('info', message, value),

    /**
     * Log cảnh báo.
     * @param {string} message - Thông điệp log.
     * @param {*} [value] - Giá trị bổ sung để log (tuỳ chọn).
     */
    warn: (message, value = '') => logger.log('warn', message, value),

    /**
     * Log lỗi.
     * @param {string} message - Thông điệp log.
     * @param {*} [value] - Giá trị bổ sung để log (tuỳ chọn).
     */
    error: (message, value = '') => logger.log('error', message, value),

    /**
     * Log thành công.
     * @param {string} message - Thông điệp log.
     * @param {*} [value] - Giá trị bổ sung để log (tuỳ chọn).
     */
    success: (message, value = '') => logger.log('success', message, value),

    /**
     * Log gỡ lỗi.
     * @param {string} message - Thông điệp log.
     * @param {*} [value] - Giá trị bổ sung để log (tuỳ chọn).
     */
    debug: (message, value = '') => logger.log('debug', message, value),
};

export default logger;
