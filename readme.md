# **RainbowUtilities**
## Version 1.0.0
This is a versatile Discord bot designed to enhance server management, moderation, and user interaction. It comes packed with essential features to keep your community safe and engaged.


## **Features**

- ****Announce Command****: Easily send important announcements to your server channels.

- ****Moderation Commands****: Comprehensive moderation tools including:

  - `ban`: Permanently remove users from your server.

  - `kick`: Temporarily remove users from your server.

  - `mute`: Silence users for a specified duration.

  - Other moderation utilities (e.g., warn, unmute, timeout - _assuming these are part of "etc"_).

- ****Purge Command****: Quickly delete a specified number of messages from a channel.

- ****Poll Command****: Create interactive polls for your community to vote on.

- ****Settings Command****: Configure various bot settings directly from Discord.

- ****Setup Command****: Initial setup command to configure essential server-specific settings (e.g., log channels, mute roles).

- ****Automod****: Automated moderation system to detect and act on spam, excessive caps, and other undesirable content.

- ****DM Sessions****: Facilitates private direct message conversations between users and server staff within a dedicated thread.


## **Setup**

To get your bot up and running, follow these steps:

1. ****Clone the repository**** (if applicable).

2. Install Dependencies:

   Navigate to the project directory in your terminal and run:

       npm install

3. Environment Variables (.env file):

   Create a file named .env in the root directory of your project and add the following environment variables:

       DISCORD_TOKEN=YOUR_BOT_TOKEN_HERE
       DISCORD_CLIENT_ID=YOUR_BOT_CLIENT_ID_HERE

   - `DISCORD_TOKEN`: Your bot's token from the Discord Developer Portal. Keep this secret!

   - `DISCORD_CLIENT_ID`: Your bot's client ID (application ID) from the Discord Developer Portal.

4. Configuration Files:

   Ensure you have the following JSON configuration files in a data directory (create it if it doesn't exist):

   - `data/config.json`: Contains default bot settings.

         {
             "defaultSettings": {
                 "moderatorRoles": [],
                 "logChannel": null,
                 "muteRole": null,
                 "autoMod": {
                     "enabled": true,
                     "spamThreshold": 5,
                     "timeWindow": 10000,
                     "capsThreshold": 0.8,
                     "maxMentions": 3
                 },
                 "warningActions": {
                     "3": "timeout_1h",
                     "5": "timeout_24h",
                     "7": "ban"
                 }
             }
         }

   - `data/serverConfig.json`: This file will be automatically created if it doesn't exist when the bot starts, and it will store guild-specific settings. Initially, it might look like this (or be empty if no guilds are configured yet):

         {
             "guilds": {}
         }

5. ****Run the Bot****:

   - ****For Production (Standard Run)****:

         npm start

   - For Development (with Nodemon or similar):

     If you have a dev script configured (e.g., using nodemon for automatic restarts on file changes), you can use:

         npm run dev


## **Usage**

Once the bot is running and invited to your server, you can use the slash commands. Commands like `/setup` will help you configure the bot for your specific server needs.
