const { SlashCommandBuilder } = require('discord.js');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ai')
        .setDescription('Ask Gemini AI a question')
        .addStringOption(option =>
            option.setName('prompt')
                .setDescription('What do you want to ask Gemini?')
                .setRequired(true)
        ),

    async execute(interaction) {
        const prompt = interaction.options.getString('prompt');
        const userTag = interaction.user.tag;

        await interaction.deferReply();

        try {
            const model = ai.getGenerativeModel({ model: 'gemini-1.5-flash' });
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text().slice(0, 1500); // Shorten AI reply to leave room for prompt + username

            const replyMessage = `**🧑 Prompt by ${userTag}:**\n> ${prompt}\n\n**🤖 Gemini AI Response:**\n${text}`;

            await interaction.editReply(replyMessage);
        } catch (error) {
            console.error(error);
            await interaction.editReply('❌ Failed to get a response from Gemini.');
        }
    },
};
