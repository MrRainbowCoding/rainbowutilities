const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

/**
 * Log a moderation action to file and Discord channel
 * @param {string} guildId - The ID of the guild
 * @param {Object} actionData - The action data to log
 */
function logAction(guildId, actionData) {
    // Log to file
    logToFile(guildId, actionData);
    
    // Log to Discord channel (if configured)
    // This will be handled by the main bot file
}

/**
 * Log action to file
 * @param {string} guildId - The ID of the guild
 * @param {Object} actionData - The action data to log
 */
function logToFile(guildId, actionData) {
    try {
        const logFile = path.join(logsDir, `${guildId}.log`);
        const logEntry = `[${actionData.timestamp}] ${actionData.action} - ${actionData.moderator} -> ${actionData.user} | Reason: ${actionData.reason}\n`;
        
        fs.appendFileSync(logFile, logEntry);
    } catch (error) {
        console.error('Error logging to file:', error);
    }
}

/**
 * Create a log embed for Discord
 * @param {Object} actionData - The action data
 * @returns {EmbedBuilder} - The embed to send
 */
function createLogEmbed(actionData) {
    const colors = {
        'KICK': 0xFF6B00,
        'BAN': 0xFF0000,
        'TIMEOUT': 0xFFFF00,
        'WARN': 0xFFFF00,
        'PURGE': 0x00FF00,
        'AUTO_TIMEOUT': 0xFF0000
    };

    const embed = new EmbedBuilder()
        .setColor(colors[actionData.action] || 0x0099FF)
        .setTitle(`🔨 ${actionData.action}`)
        .setTimestamp(new Date(actionData.timestamp));

    // Add fields based on action type
    switch (actionData.action) {
        case 'KICK':
        case 'BAN':
        case 'TIMEOUT':
        case 'WARN':
        case 'AUTO_TIMEOUT':
            embed.addFields(
                { name: 'User', value: actionData.user, inline: true },
                { name: 'Moderator', value: actionData.moderator, inline: true },
                { name: 'Reason', value: actionData.reason, inline: false }
            );
            
            if (actionData.duration) {
                embed.addFields({ name: 'Duration', value: actionData.duration, inline: true });
            }
            
            if (actionData.deleteDays) {
                embed.addFields({ name: 'Messages Deleted', value: `${actionData.deleteDays} days`, inline: true });
            }
            
            if (actionData.warningCount) {
                embed.addFields({ name: 'Total Warnings', value: actionData.warningCount.toString(), inline: true });
            }
            break;
            
        case 'PURGE':
            embed.addFields(
                { name: 'Channel', value: actionData.channel, inline: true },
                { name: 'Moderator', value: actionData.moderator, inline: true },
                { name: 'Messages Deleted', value: actionData.amount.toString(), inline: true },
                { name: 'Target User', value: actionData.targetUser, inline: true }
            );
            break;
    }

    return embed;
}

/**
 * Get recent log entries for a guild
 * @param {string} guildId - The ID of the guild
 * @param {number} limit - Maximum number of entries to return
 * @returns {Array} - Array of log entries
 */
function getRecentLogs(guildId, limit = 10) {
    try {
        const logFile = path.join(logsDir, `${guildId}.log`);
        
        if (!fs.existsSync(logFile)) {
            return [];
        }
        
        const logData = fs.readFileSync(logFile, 'utf8');
        const lines = logData.trim().split('\n');
        
        return lines.slice(-limit).reverse(); // Get last N entries and reverse to show newest first
    } catch (error) {
        console.error('Error reading log file:', error);
        return [];
    }
}

/**
 * Clear log file for a guild
 * @param {string} guildId - The ID of the guild
 */
function clearLogs(guildId) {
    try {
        const logFile = path.join(logsDir, `${guildId}.log`);
        
        if (fs.existsSync(logFile)) {
            fs.unlinkSync(logFile);
        }
    } catch (error) {
        console.error('Error clearing log file:', error);
    }
}

module.exports = {
    logAction,
    logToFile,
    createLogEmbed,
    getRecentLogs,
    clearLogs
};
