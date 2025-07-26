const { SlashCommandBuilder } = require('discord.js');

const responses = [
    "It is certain.",
    "Without a doubt.",
    "You may rely on it.",
    "Yes – definitely.",
    "As I see it, yes.",
    "Most likely.",
    "Outlook good.",
    "Yes.",
    "Signs point to yes.",
    "Reply hazy, try again.",
    "Ask again later.",
    "Better not tell you now.",
    "Cannot predict now.",
    "Concentrate and ask again.",
    "Don't count on it.",
    "My reply is no.",
    "My sources say no.",
    "Outlook not so good.",
    "Very doubtful."
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('magic8ball')
        .setDescription('Ask the magic 8 ball a question.')
        .addStringOption(option =>
            option.setName('question')
                .setDescription('Your question for the magic 8 ball')
                .setRequired(true)),
                
    async execute(interaction) {
        const question = interaction.options.getString('question');
        const answer = responses[Math.floor(Math.random() * responses.length)];
        
        await interaction.reply({
            embeds: [{
                title: "🎱 Magic 8 Ball",
                description: `**You asked:** ${question}\n**Answer:** ${answer}`,
                color: 0x2f3136
            }]
        });
    }
};
