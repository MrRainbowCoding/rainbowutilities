# Discord Moderation Bot

## Overview

This is a Discord moderation bot built with Discord.js v14 that provides comprehensive moderation tools for Discord servers. The bot features slash commands for common moderation actions, automatic spam detection, warning systems, and detailed logging capabilities.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Backend Architecture
- **Framework**: Node.js with Discord.js v14
- **Architecture Pattern**: Event-driven command handling
- **File Structure**: Modular design with separate directories for commands, utilities, and data

### Command System
- **Command Loading**: Dynamic command registration from the `/commands` directory
- **Deployment**: Separate command deployment script (`deploy-commands.js`) for registering slash commands
- **Permissions**: Role-based and Discord permission-based authorization system

### Data Storage
- **File-based Storage**: JSON files for configuration and persistent data
- **Warning System**: Local JSON storage for user warnings (`data/warnings.json`)
- **Configuration**: Server-specific settings stored in `data/config.json`
- **Logging**: File-based logging system with guild-specific log files

## Key Components

### Moderation Commands
- **kick.js**: Remove users from the server
- **ban.js**: Permanently ban users with optional message deletion
- **mute.js**: Timeout users using Discord's native timeout feature
- **warn.js**: Issue warnings to users with persistent storage
- **warnings.js**: Manage user warnings (view, clear, remove)
- **purge.js**: Bulk delete messages with user filtering

### Utility Systems
- **permissions.js**: Permission checking for commands and moderator roles
- **logger.js**: Comprehensive logging system for moderation actions
- **automod.js**: Automatic moderation for spam detection and message filtering

### Configuration Management
- **config.json**: Bot-wide configuration settings
- **data/config.json**: Server-specific configuration with default settings
- **Environment Variables**: Discord token and client ID management

## Data Flow

1. **Command Execution**: Slash commands → Permission check → Action execution → Logging
2. **Auto-Moderation**: Message received → Spam detection → Auto-action → Logging
3. **Warning System**: Warning issued → JSON storage → Action thresholds → Automatic punishments
4. **Logging**: Action performed → File logging → Discord channel logging (if configured)

## External Dependencies

### Discord.js Framework
- **Version**: 14.21.0
- **Purpose**: Discord API interaction and bot functionality
- **Features Used**: Slash commands, embeds, permissions, member management

### Node.js Built-ins
- **fs**: File system operations for data persistence
- **path**: File path management
- **Collections**: Discord.js collections for command storage

## Deployment Strategy

### Local Development
- Environment variables for sensitive data (Discord token, client ID)
- Separate command deployment script for testing
- File-based data storage for simplicity

### Production Considerations
- **Scaling**: Single-instance design suitable for moderate server loads
- **Data Persistence**: File-based storage (could be migrated to database)
- **Logging**: Local file logging with rotation capabilities
- **Configuration**: Per-guild settings with fallback to defaults

### Key Features
- **Slash Commands**: Modern Discord interaction system
- **Permission System**: Multi-layer authorization (Discord permissions + custom roles)
- **Auto-Moderation**: Spam detection and automatic enforcement
- **Warning System**: Progressive punishment system
- **Comprehensive Logging**: Action tracking and audit trails
- **Modular Design**: Easy to extend with new commands and features

### Configuration Options
- Moderator roles configuration
- Auto-moderation thresholds and settings
- Warning action thresholds
- Logging channel configuration
- Mute role assignment

The bot is designed to be easily deployable and maintainable, with clear separation of concerns and comprehensive error handling throughout the codebase.