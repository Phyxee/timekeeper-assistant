const { ActionRowBuilder, SlashCommandBuilder, EmbedBuilder, ButtonStyle, ButtonBuilder, ComponentType, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require('discord.js');
const characterInfo = require('../characterDetails.json');
const characterList = require('../characters.json')

module.exports = {
  data: new SlashCommandBuilder()
    .setName('character')
    .setDescription('Shows information for a character')
    .addStringOption(option => 
      option.setName('character')
      .setDescription('Type the character name')
      .setRequired(true)
      .setAutocomplete(true)
    ),
  
  async autocomplete(interaction) {
    const focusedValue = interaction.options.getFocused();
    const choices = characterList.map(item => item.name);
    //const choices = ['A Knight','Eternity','Lilya','Regulus'];
    const filtered = choices.filter(choice => choice.toUpperCase().includes(focusedValue.toUpperCase()));
    await interaction.respond(
      filtered.map(choice => ({ name: choice, value: choice })).slice(0, 25),
    );
  },

  async execute(interaction) {
    const chosenCharacter = interaction.options.getString('character');
    const characterData = characterInfo[chosenCharacter];

    const optionOverview = createStringSelectMenuOption('Overview', 'Overview Description', '📋', true);
    const optionSkills = createStringSelectMenuOption('Skills', 'Skills Description', '✨', false);
    const optionPortray = createStringSelectMenuOption('Portray', 'Portray Description', '📜', false);

    const selectCategory = new StringSelectMenuBuilder()
      .setCustomId('selectCategory')
      .setPlaceholder('Choose Category')
      .addOptions(
        optionOverview,
        optionSkills,
        optionPortray
      );

    const btnUltimate = createButton('Ultimate', '✨', ButtonStyle.Primary);
    const btnSkill1 = createButton('Skill 1', '✨', ButtonStyle.Secondary);
    const btnSkill2 = createButton('Skill 2', '✨', ButtonStyle.Secondary);

    const embed = new EmbedBuilder()
      .setTitle(characterData.name)
      .setDescription('**' + characterData.overview + '**')
      .setColor('#C27C0E')
      .setThumbnail(characterData.characterThumbnail)
      .addFields(
        { name: 'Rarity', value: characterData.rarity, inline: true },
        { name: 'Afflatus', value: characterData.afflatus, inline: true },
        { name: 'Damage Type', value: characterData.damageType, inline: true },
      );

    const categoryRow = new ActionRowBuilder().addComponents(selectCategory);
    const buttonRow = new ActionRowBuilder().addComponents(btnUltimate, btnSkill1, btnSkill2);

    const reply = await interaction.reply({
      embeds: [embed],
      components: [categoryRow]
    });


    // Collector
    const filter = (i) => i.user.id === interaction.user.id;
    const buttonCollector = reply.createMessageComponentCollector({
      componentType: ComponentType.Button,
      filter,
      time: 60_000
    });
    const categoryCollector = reply.createMessageComponentCollector({
      componentType: ComponentType.StringSelect,
      filter,
      time: 60_000
    });

    categoryCollector.on('collect', (interaction) => {
      handleSelectMenuInteraction(interaction, characterData, optionOverview, optionSkills, optionPortray, btnUltimate, btnSkill1, btnSkill2, categoryRow, buttonRow);
    });

    buttonCollector.on('collect', (interaction) => {
      handleButtonInteraction(interaction, characterData, btnUltimate, btnSkill1, btnSkill2, categoryRow, buttonRow);
    });

    categoryCollector.on('end', () => {
      categoryRow.components = [selectCategory]
      interaction.editReply({
        components: [categoryRow]
      });
    });

    buttonCollector.on('end', () => {
      disableButtons(selectCategory, btnUltimate, btnSkill1, btnSkill2);
      buttonRow.components = [btnUltimate, btnSkill1, btnSkill2];
      interaction.editReply({
        components: [buttonRow]
      });
    });
  },
};


// Handler
function handleSelectMenuInteraction(interaction, characterData, optionOverview, optionSkills, optionPortray, btnUltimate, btnSkill1, btnSkill2, categoryRow, buttonRow) {
  if (interaction.isStringSelectMenu()) {
    const chosenValue = interaction.values[0];
    if (chosenValue === 'Overview') {
      optionOverview.setDefault(true);
      optionSkills.setDefault(false);
      optionPortray.setDefault(false);

      const embed = new EmbedBuilder()
        .setTitle(characterData.name)
        .setDescription('**' + characterData.overview + '**')
        .setColor('#C27C0E')
        .setThumbnail(characterData.characterThumbnail)
        .addFields(
          { name: 'Rarity', value: characterData.rarity, inline: true },
          { name: 'Afflatus', value: characterData.afflatus, inline: true },
          { name: 'Damage Type', value: characterData.damageType, inline: true },
        );

      interaction.update({
        embeds: [embed],
        components: [categoryRow]
      });

    } else if (chosenValue === 'Skills') {
      btnUltimate.setStyle(ButtonStyle.Primary);
      btnSkill1.setStyle(ButtonStyle.Secondary);
      btnSkill2.setStyle(ButtonStyle.Secondary);
      optionOverview.setDefault(false);
      optionSkills.setDefault(true);
      optionPortray.setDefault(false);

      const embed = new EmbedBuilder()
        .setAuthor({ name: characterData.name, iconURL: characterData.characterThumbnail })
        .setTitle(characterData.ultimateName)
        .setDescription(characterData.ultimate)
        .setColor('#C27C0E')
        .setThumbnail(characterData.ultimateThumbnail);

      interaction.update({
        embeds: [embed],
        components: [categoryRow, buttonRow]
      });

    } else if (chosenValue === 'Portray') {
      optionOverview.setDefault(false);
      optionSkills.setDefault(false);
      optionPortray.setDefault(true);

      const embed = new EmbedBuilder()
        .setAuthor({ name: characterData.name, iconURL: characterData.characterThumbnail })
        .setTitle(characterData.name + ' Portray Details')
        .setDescription(characterData.portray)
        .setColor('#C27C0E');

      interaction.update({
        embeds: [embed],
        components: [categoryRow]
      });
    }
  }
}

function handleButtonInteraction(interaction, characterData, btnUltimate, btnSkill1, btnSkill2, categoryRow, buttonRow) {
  const resetButtons = () => {
    btnUltimate.setStyle(ButtonStyle.Secondary);
    btnSkill1.setStyle(ButtonStyle.Secondary);
    btnSkill2.setStyle(ButtonStyle.Secondary);
  };

  resetButtons();

  if (interaction.customId == 'Ultimate') {
    btnUltimate.setStyle(ButtonStyle.Primary);
    const embed = new EmbedBuilder()
      .setAuthor({ name: characterData.name, iconURL: characterData.characterThumbnail })
      .setTitle(characterData.ultimateName)
      .setDescription(characterData.ultimate)
      .setColor('#C27C0E')
      .setThumbnail(characterData.ultimateThumbnail);

    interaction.update({
      embeds: [embed],
      components: [categoryRow, buttonRow]
    });

  } else if (interaction.customId == 'Skill 1') {
    btnSkill1.setStyle(ButtonStyle.Primary);
    const embed = new EmbedBuilder()
      .setAuthor({ name: characterData.name, iconURL: characterData.characterThumbnail })
      .setTitle(characterData.skill1Name)
      .setColor('#C27C0E')
      .setThumbnail(characterData.skill1Thumbnail)
      .addFields(
        { name: '✦✧✧', value: characterData.skill1['1'], inline: true },
        { name: '✦✦✧', value: characterData.skill1['2'], inline: true },
        { name: '✦✦✦', value: characterData.skill1['3'], inline: true },
      );

    interaction.update({
      embeds: [embed],
      components: [categoryRow, buttonRow]
    });

  } else if (interaction.customId == 'Skill 2') {
    btnSkill2.setStyle(ButtonStyle.Primary);
    const embed = new EmbedBuilder()
      .setAuthor({ name: characterData.name, iconURL: characterData.characterThumbnail })
      .setTitle(characterData.skill2Name)
      .setColor('#C27C0E')
      .setThumbnail(characterData.skill2Thumbnail)
      .addFields(
        { name: '✦✧✧', value: characterData.skill2['1'], inline: true },
        { name: '✦✦✧', value: characterData.skill2['2'], inline: true },
        { name: '✦✦✦', value: characterData.skill2['3'], inline: true },
      );

    interaction.update({
      embeds: [embed],
      components: [categoryRow, buttonRow]
    });
  }
}


// Utils
function createStringSelectMenuOption(label, description, emoji, isDefault) {
  return new StringSelectMenuOptionBuilder()
    .setLabel(label)
    .setDescription(description)
    .setValue(label)
    .setEmoji(emoji)
    .setDefault(isDefault)
}

function createButton(customId, emoji, style) {
  return new ButtonBuilder()
    .setCustomId(customId)
    .setLabel(customId)
    .setEmoji(emoji)
    .setStyle(style);
}

function disableButtons(selectCategory, btnUltimate, btnSkill1, btnSkill2) {
  selectCategory.setDisabled(true);
  btnUltimate.setDisabled(true);
  btnSkill1.setDisabled(true);
  btnSkill2.setDisabled(true);
}
