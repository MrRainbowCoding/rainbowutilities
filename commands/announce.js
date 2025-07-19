const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('announce')
        .setDescription('Send an announcement to a specified channel.')
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('The channel to send the announcement to')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('message')
                .setDescription('The announcement message')
                .setRequired(true)),
    async execute(interaction) {
        const channel = interaction.options.getChannel('channel');
        const message = interaction.options.getString('message');

        if (!channel.isTextBased()) {
            return interaction.reply({ content: 'Please select a text channel.', ephemeral: true });
        }

        await channel.send(`! ADMIN ANNOUNCEMENT !\n\n${message}\n\n@everyone`);
        await interaction.reply({ content: `Announcement sent to ${channel}.`, ephemeral: true });
    },
};