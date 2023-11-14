const { Events, Collection } = require('discord.js');

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction) {
    if (interaction.isAutocomplete()) {
      handleAutocomplete(interaction);
      return;
    }

    if (!interaction.isChatInputCommand()) return;

    const client = interaction.client;
    const commandName = interaction.commandName;

    // Find command
    const command = client.commands.get(commandName);

    if (!command) {
      await interaction.reply({
        content: `No command matching ${commandName} was found.`,
        ephemeral: true
      });
      return;
    }

    // Cooldowns
    const cooldowns = client.cooldowns;
    const commandCooldowns = cooldowns.get(command.data.name) || new Collection();

    const now = Date.now();
    const userCooldownTimestamp = commandCooldowns.get(interaction.user.id) || 0;
    const defaultCooldownDuration = 5;
    const cooldownAmount = (command.cooldown ?? defaultCooldownDuration) * 1000;

    if (now < userCooldownTimestamp + cooldownAmount) {
      const expiredTimestamp = Math.round((userCooldownTimestamp + cooldownAmount) / 1000);
      const waitTime = expiredTimestamp - Math.floor(now / 1000);

      interaction.reply({
        content: `Please wait. You can use this command again <t:${expiredTimestamp}:R>.`,
        ephemeral: true
      });

      setTimeout(() => {
        interaction.deleteReply();
      }, waitTime * 1000);

      return;
    }

    commandCooldowns.set(interaction.user.id, now);
    setTimeout(() => commandCooldowns.delete(interaction.user.id), cooldownAmount);

    try {
      await command.execute(interaction);
    } catch (error) {
      console.log(error);
      await interaction.reply({
        content: 'An error occurred while fetching the command.',
        ephemeral: true
      });
    }
  },
};

async function handleAutocomplete(interaction) {
  const client = interaction.client;
  const command = client.commands.get(interaction.commandName);

  if (!command) {
    console.log('Command was not found');
    return;
  }

  if (!command.autocomplete) {
    console.log(`No autocomplete handler was found for the ${interaction.commandName} command.`);
    return;
  }

  try {
    await command.autocomplete(interaction);
  } catch (error) {
    console.log(error);
  }
}
