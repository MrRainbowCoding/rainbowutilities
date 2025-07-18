const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('poll')
        .setDescription('Create a poll for users to vote on.')
        .addStringOption(option =>
            option.setName('question')
                .setDescription('The poll question')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('option1')
                .setDescription('First option')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('option2')
                .setDescription('Second option')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('option3')
                .setDescription('Third option (optional)')
                .setRequired(false)
        )
        .addStringOption(option =>
            option.setName('option4')
                .setDescription('Fourth option (optional)')
                .setRequired(false)
        )
        .addStringOption(option =>
            option.setName('option5')
                .setDescription('Fifth option (optional)')
                .setRequired(false)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.SendMessages),
    async execute(interaction) {
        const question = interaction.options.getString('question');
        const options = [
            interaction.options.getString('option1'),
            interaction.options.getString('option2'),
            interaction.options.getString('option3'),
            interaction.options.getString('option4'),
            interaction.options.getString('option5'),
        ].filter(Boolean);

        const emojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣'];
        let description = '';
        options.forEach((opt, i) => {
            description += `${emojis[i]} ${opt}\n`;
        });

        const embed = new EmbedBuilder()
            .setTitle(`📊 ${question}`)
            .setDescription(description)
            .setColor(0x5865F2)
            .setTimestamp();

        const pollMessage = await interaction.reply({ embeds: [embed], fetchReply: true });
        for (let i = 0; i < options.length; i++) {
            await pollMessage.react(emojis[i]);
        }
    },
};
