const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Replies with Pong and bot latency!'),
    async execute(interaction) {
        const sent = await interaction.reply({ content: 'Pong!', fetchReply: true });
        await interaction.followUp({ content: `🏓 Latency: ${sent.createdTimestamp - interaction.createdTimestamp}ms` });
    },
};
