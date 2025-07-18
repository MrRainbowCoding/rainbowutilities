const { PermissionsBitField } = require('discord.js');

/**
 * Check if a member has permission to use a moderation command
 * @param {GuildMember} member - The member to check permissions for
 * @param {string} commandName - The name of the command being used
 * @returns {boolean} - Whether the member has permission
 */
function checkPermissions(member, commandName) {
    // Bot owner always has permission
    if (member.user.id === process.env.BOT_OWNER_ID) {
        return true;
    }

    // Check Discord permissions based on command
    const permissions = member.permissions;
    
    switch (commandName) {
        case 'kick':
            return permissions.has(PermissionsBitField.Flags.KickMembers);
        
        case 'ban':
            return permissions.has(PermissionsBitField.Flags.BanMembers);
        
        case 'mute':
        case 'warn':
        case 'warnings':
            return permissions.has(PermissionsBitField.Flags.ModerateMembers);
        
        case 'purge':
            return permissions.has(PermissionsBitField.Flags.ManageMessages);
        
        default:
            // For other commands, check if user has any moderation permissions
            return permissions.has(PermissionsBitField.Flags.ModerateMembers) ||
                   permissions.has(PermissionsBitField.Flags.KickMembers) ||
                   permissions.has(PermissionsBitField.Flags.BanMembers) ||
                   permissions.has(PermissionsBitField.Flags.ManageMessages);
    }
}

/**
 * Check if a member has a specific moderator role
 * @param {GuildMember} member - The member to check
 * @param {Array} moderatorRoles - Array of role names that grant moderator permissions
 * @returns {boolean} - Whether the member has a moderator role
 */
function hasModeratorRole(member, moderatorRoles = []) {
    if (!moderatorRoles.length) return false;
    
    return member.roles.cache.some(role => 
        moderatorRoles.includes(role.name) || 
        moderatorRoles.includes(role.id)
    );
}

/**
 * Check if a member can moderate another member (role hierarchy)
 * @param {GuildMember} moderator - The moderator member
 * @param {GuildMember} target - The target member
 * @returns {boolean} - Whether the moderator can moderate the target
 */
function canModerate(moderator, target) {
    // Guild owner can moderate anyone
    if (moderator.guild.ownerId === moderator.user.id) {
        return true;
    }

    // Cannot moderate guild owner
    if (target.guild.ownerId === target.user.id) {
        return false;
    }

    // Check role hierarchy
    return moderator.roles.highest.position > target.roles.highest.position;
}

/**
 * Get the highest role position for a member
 * @param {GuildMember} member - The member to check
 * @returns {number} - The highest role position
 */
function getHighestRolePosition(member) {
    return member.roles.highest.position;
}

module.exports = {
    checkPermissions,
    hasModeratorRole,
    canModerate,
    getHighestRolePosition
};
