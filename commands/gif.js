const { SlashCommandBuilder } = require('discord.js');
const fetch = require('node-fetch'); // Add this!
const { TENOR_KEY } = process.env; // Ensure you have TENOR_KEY in your .env file

if (!TENOR_KEY) {
  throw new Error('TENOR_KEY is not defined in your environment variables.');
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('gif')
    .setDescription('Get a random GIF about a topic')
    .addStringOption(option =>
      option.setName('query')
        .setDescription('The topic to search for')
        .setRequired(true)
    ),

  async execute(interaction) {
    const query = interaction.options.getString('query');
    const url = `https://tenor.googleapis.com/v2/search?q=${encodeURIComponent(query)}&key=${TENOR_KEY}&limit=1&random=true`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (data.results && data.results.length > 0) {
        const gifUrl = data.results[0].media_formats.gif.url;
        await interaction.reply(gifUrl);
      } else {
        await interaction.reply(`❌ No GIFs found for "${query}".`);
      }
    } catch (error) {
      console.error(error);
      await interaction.reply('⚠️ Error fetching GIF. Try again later.');
    }
  }
};
