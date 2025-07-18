const userMessages = new Map();

/**
 * Auto-moderation configuration
 */
const autoModConfig = {
    spamThreshold: 5,        // Messages within time window
    timeWindow: 10000,       // Time window in milliseconds (10 seconds)
    duplicateThreshold: 3,   // Same message repeated
    capsThreshold: 0.8,      // Percentage of caps in message
    minMessageLength: 5      // Minimum message length to check caps
};

/**
 * Add a message to the spam detection system
 * @param {string} userId - The user ID
 * @param {string} content - The message content
 */
function addMessage(userId, content) {
    const now = Date.now();
    
    if (!userMessages.has(userId)) {
        userMessages.set(userId, []);
    }
    
    const messages = userMessages.get(userId);
    
    // Add new message
    messages.push({
        content: content,
        timestamp: now
    });
    
    // Clean old messages (outside time window)
    const cutoff = now - autoModConfig.timeWindow;
    const recentMessages = messages.filter(msg => msg.timestamp > cutoff);
    
    userMessages.set(userId, recentMessages);
}

/**
 * Check if a user is spamming
 * @param {string} userId - The user ID
 * @returns {boolean} - Whether the user is spamming
 */
function checkSpam(userId) {
    const messages = userMessages.get(userId) || [];
    const now = Date.now();
    const cutoff = now - autoModConfig.timeWindow;
    
    // Filter recent messages
    const recentMessages = messages.filter(msg => msg.timestamp > cutoff);
    
    // Check message count threshold
    if (recentMessages.length >= autoModConfig.spamThreshold) {
        return true;
    }
    
    // Check for duplicate messages
    const duplicateCount = checkDuplicateMessages(recentMessages);
    if (duplicateCount >= autoModConfig.duplicateThreshold) {
        return true;
    }
    
    return false;
}

/**
 * Check for duplicate messages
 * @param {Array} messages - Array of message objects
 * @returns {number} - Number of duplicate messages
 */
function checkDuplicateMessages(messages) {
    if (messages.length < 2) return 0;
    
    const contentCounts = {};
    
    messages.forEach(msg => {
        const content = msg.content.toLowerCase().trim();
        contentCounts[content] = (contentCounts[content] || 0) + 1;
    });
    
    // Return the highest count of duplicate messages
    return Math.max(...Object.values(contentCounts));
}

/**
 * Check if a message contains excessive caps
 * @param {string} content - The message content
 * @returns {boolean} - Whether the message has excessive caps
 */
function checkExcessiveCaps(content) {
    if (content.length < autoModConfig.minMessageLength) {
        return false;
    }
    
    const letters = content.replace(/[^a-zA-Z]/g, '');
    if (letters.length === 0) return false;
    
    const upperCase = content.replace(/[^A-Z]/g, '');
    const capsRatio = upperCase.length / letters.length;
    
    return capsRatio >= autoModConfig.capsThreshold;
}

/**
 * Check if a message contains prohibited words
 * @param {string} content - The message content
 * @returns {boolean} - Whether the message contains prohibited words
 */
function checkProhibitedWords(content) {
    // Basic prohibited words list - can be expanded
    const prohibitedWords = [
        // Add prohibited words here
        // Example: 'spam', 'scam', etc.
    ];
    
    const lowercaseContent = content.toLowerCase();
    
    return prohibitedWords.some(word => 
        lowercaseContent.includes(word.toLowerCase())
    );
}

/**
 * Check if a message contains excessive mentions
 * @param {string} content - The message content
 * @returns {boolean} - Whether the message has excessive mentions
 */
function checkExcessiveMentions(content) {
    const mentionRegex = /<@[!&]?\d+>/g;
    const mentions = content.match(mentionRegex) || [];
    
    return mentions.length > 3; // More than 3 mentions
}

/**
 * Comprehensive message check
 * @param {string} userId - The user ID
 * @param {string} content - The message content
 * @returns {Object} - Check results
 */
function checkMessage(userId, content) {
    const results = {
        isSpam: false,
        hasExcessiveCaps: false,
        hasProhibitedWords: false,
        hasExcessiveMentions: false,
        shouldTakeAction: false
    };
    
    addMessage(userId, content);
    
    results.isSpam = checkSpam(userId);
    results.hasExcessiveCaps = checkExcessiveCaps(content);
    results.hasProhibitedWords = checkProhibitedWords(content);
    results.hasExcessiveMentions = checkExcessiveMentions(content);
    
    results.shouldTakeAction = results.isSpam || 
                               results.hasExcessiveCaps || 
                               results.hasProhibitedWords || 
                               results.hasExcessiveMentions;
    
    return results;
}

/**
 * Clear user messages (for testing or manual reset)
 * @param {string} userId - The user ID
 */
function clearUserMessages(userId) {
    userMessages.delete(userId);
}

/**
 * Get auto-moderation statistics
 * @returns {Object} - Statistics object
 */
function getAutoModStats() {
    return {
        trackedUsers: userMessages.size,
        totalMessages: Array.from(userMessages.values()).reduce((total, messages) => total + messages.length, 0),
        config: autoModConfig
    };
}

module.exports = {
    addMessage,
    checkSpam,
    checkExcessiveCaps,
    checkProhibitedWords,
    checkExcessiveMentions,
    checkMessage,
    clearUserMessages,
    getAutoModStats
};
