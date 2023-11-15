const {
  ActionRowBuilder,
  SlashCommandBuilder,
  EmbedBuilder,
  ButtonStyle,
  ButtonBuilder,
  ComponentType,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} = require("discord.js");
const characterInfo = require("../characterDetails.json");
const characterList = require("../characters.json");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("character")
    .setDescription("Shows information for a character")
    .addStringOption((option) =>
      option
        .setName("character")
        .setDescription("Type the character name")
        .setRequired(true)
        .setAutocomplete(true)
    ),

  async autocomplete(interaction) {
    const focusedValue = interaction.options.getFocused();
    const choices = characterList.map((item) => item.name);
    const filtered = choices.filter((choice) =>
      choice.toUpperCase().includes(focusedValue.toUpperCase())
    );
    await interaction.respond(
      filtered.map((choice) => ({ name: choice, value: choice })).slice(0, 25)
    );
  },

  async execute(interaction) {
    const chosenCharacter = interaction.options.getString("character");
    const characterData = characterInfo[chosenCharacter];

    const optionOverview = createStringSelectMenuOption(
      "Overview",
      "Overview Description",
      "📋",
      true
    );
    const optionSkills = createStringSelectMenuOption(
      "Skills",
      "Skills Description",
      "✨",
      false
    );
    const optionInsight = createStringSelectMenuOption(
      "Insight",
      "Insight Description",
      "1174155091054444597", // Custom Emoji ID
      false
    );
    const optionPortray = createStringSelectMenuOption(
      "Portray",
      "Portray Description",
      "📜",
      false
    );

    const selectCategory = new StringSelectMenuBuilder()
      .setCustomId("selectCategory")
      .setPlaceholder("Choose Category")
      .addOptions(optionOverview, optionSkills, optionInsight, optionPortray);

    const btnUltimate = createButton("Ultimate", "✨", ButtonStyle.Primary);
    const btnSkill1 = createButton("Skill 1", "✨", ButtonStyle.Secondary);
    const btnSkill2 = createButton("Skill 2", "✨", ButtonStyle.Secondary);

    const embed = new EmbedBuilder()
      .setTitle(characterData.name)
      .setURL('https://www.prydwen.gg/re1999/characters')
      .setDescription("**" + characterData.overview + "**")
      .setColor("#C27C0E")
      .setThumbnail(characterData.thumbnail)
      .addFields(
        { name: "Rarity", value: characterData.rarity, inline: true },
        { name: "Afflatus", value: characterData.afflatus, inline: true },
        { name: "Damage Type", value: characterData.damageType, inline: true }
      );

    const categoryRow = new ActionRowBuilder().addComponents(selectCategory);
    const buttonRow = new ActionRowBuilder().addComponents(
      btnUltimate,
      btnSkill1,
      btnSkill2
    );

    const reply = await interaction.reply({
      embeds: [embed],
      components: [categoryRow],
    });

    // Collector
    const filter = (i) => i.user.id === interaction.user.id;
    const buttonCollector = reply.createMessageComponentCollector({
      componentType: ComponentType.Button,
      filter,
      time: 60_000,
    });
    const categoryCollector = reply.createMessageComponentCollector({
      componentType: ComponentType.StringSelect,
      filter,
      time: 60_000,
    });

    categoryCollector.on("collect", (interaction) => {
      handleSelectMenuInteraction(
        interaction,
        characterData,
        optionOverview,
        optionSkills,
        optionInsight,
        optionPortray,
        btnUltimate,
        btnSkill1,
        btnSkill2,
        categoryRow,
        buttonRow
      );
    });
    buttonCollector.on("collect", (interaction) => {
      handleButtonInteraction(
        interaction,
        characterData,
        btnUltimate,
        btnSkill1,
        btnSkill2,
        categoryRow,
        buttonRow
      );
    });

    categoryCollector.on("end", () => {
      disableInteractions(selectCategory, btnUltimate, btnSkill1, btnSkill2);
      categoryRow.components = [selectCategory];
      interaction.editReply({
        components: [categoryRow],
      });
    });
    buttonCollector.on("end", () => {
      disableInteractions(selectCategory, btnUltimate, btnSkill1, btnSkill2);
      buttonRow.components = [btnUltimate, btnSkill1, btnSkill2];
      interaction.editReply({
        components: [categoryRow, buttonRow],
      });
    });
  },
};

// Handler
function handleSelectMenuInteraction(
  interaction,
  characterData,
  optionOverview,
  optionSkills,
  optionInsight,
  optionPortray,
  btnUltimate,
  btnSkill1,
  btnSkill2,
  categoryRow,
  buttonRow
) {
  if (interaction.isStringSelectMenu()) {
    const chosenValue = interaction.values[0];

    if (chosenValue === "Overview") {
      optionOverview.setDefault(true);
      optionSkills.setDefault(false);
      optionInsight.setDefault(false);
      optionPortray.setDefault(false);

      const embed = new EmbedBuilder()
        .setTitle(characterData.name)
        .setURL('https://www.prydwen.gg/re1999/characters')
        .setDescription("**" + characterData.overview + "**")
        .setColor("#C27C0E")
        .setThumbnail(characterData.thumbnail)
        .addFields(
          { name: "Rarity", value: characterData.rarity, inline: true },
          { name: "Afflatus", value: characterData.afflatus, inline: true },
          { name: "Damage Type", value: characterData.damageType, inline: true }
        );

      interaction.update({
        embeds: [embed],
        components: [categoryRow],
      });

    } else if (chosenValue === "Skills") {
      btnUltimate.setStyle(ButtonStyle.Primary);
      btnSkill1.setStyle(ButtonStyle.Secondary);
      btnSkill2.setStyle(ButtonStyle.Secondary);
      optionOverview.setDefault(false);
      optionSkills.setDefault(true);
      optionInsight.setDefault(false);
      optionPortray.setDefault(false);

      const embed = new EmbedBuilder()
        .setAuthor({
          name: characterData.name,
          iconURL: characterData.thumbnail,
        })
        .setTitle(characterData.ultimate.name)
        .setDescription(characterData.ultimate.description)
        .setColor("#C27C0E")
        .setThumbnail(characterData.ultimate.thumbnail);

      interaction.update({
        embeds: [embed],
        components: [categoryRow, buttonRow],
      });

    } else if (chosenValue === "Insight") {
      optionOverview.setDefault(false);
      optionSkills.setDefault(false);
      optionInsight.setDefault(true);
      optionPortray.setDefault(false);

      const embed = new EmbedBuilder()
        .setAuthor({
          name: characterData.name,
          iconURL: characterData.thumbnail,
        })
        .setTitle(characterData.insight.name)
        .setColor("#C27C0E");

      if (characterData.rarity == '6✦' || characterData.rarity == '5✦') {
        embed.addFields(
          { name: '<:i1:1174155084846858360> Insight I', value: characterData.insight.levels[0].description },
          { name: 'Materials', value: characterData.insight.levels[0].materials.join(', ') },
          { name: '<:i2:1174155086977573004> Insight II', value: characterData.insight.levels[1].description },
          { name: 'Materials', value: characterData.insight.levels[1].materials.join(', ') },
          { name: '<:i3:1174155091054444597> Insight III', value: characterData.insight.levels[2].description },
          { name: 'Materials', value: characterData.insight.levels[2].materials.join(', ') }
        )
      } else {
        embed.addFields(
          { name: '<:i1:1174155084846858360> Insight I', value: 'WIP' },
          { name: 'Materials', value: characterData.insight.levels[0].materials.join(', ') },
          { name: '<:i2:1174155086977573004> Insight II', value: 'WIP' },
          { name: 'Materials', value: characterData.insight.levels[1].materials.join(', ') }
        )
      }

      interaction.update({
        embeds: [embed],
        components: [categoryRow],
      });

    } else if (chosenValue === "Portray") {
      optionOverview.setDefault(false);
      optionSkills.setDefault(false);
      optionInsight.setDefault(false);
      optionPortray.setDefault(true);

      const embed = new EmbedBuilder()
        .setAuthor({
          name: characterData.name,
          iconURL: characterData.thumbnail,
        })
        .setTitle(characterData.name + " Portray Details")
        .setDescription(characterData.portray.levels.join('\n'))
        .setColor("#C27C0E");

      interaction.update({
        embeds: [embed],
        components: [categoryRow],
      });
    }
  }
}

function handleButtonInteraction(
  interaction,
  characterData,
  btnUltimate,
  btnSkill1,
  btnSkill2,
  categoryRow,
  buttonRow
) {
  const resetButtons = () => {
    btnUltimate.setStyle(ButtonStyle.Secondary);
    btnSkill1.setStyle(ButtonStyle.Secondary);
    btnSkill2.setStyle(ButtonStyle.Secondary);
  };

  resetButtons();

  if (interaction.customId == "Ultimate") {
    btnUltimate.setStyle(ButtonStyle.Primary);
    const embed = new EmbedBuilder()
      .setAuthor({
        name: characterData.name,
        iconURL: characterData.thumbnail,
      })
      .setTitle(characterData.ultimate.name)
      .setDescription(characterData.ultimate.description)
      .setColor("#C27C0E")
      .setThumbnail(characterData.ultimate.thumbnail);

    interaction.update({
      embeds: [embed],
      components: [categoryRow, buttonRow],
    });
  } else if (interaction.customId == "Skill 1") {
    btnSkill1.setStyle(ButtonStyle.Primary);
    const embed = new EmbedBuilder()
      .setAuthor({
        name: characterData.name,
        iconURL: characterData.thumbnail,
      })
      .setTitle(characterData.skills[0].name)
      .setColor("#C27C0E")
      .setThumbnail(characterData.skills[0].thumbnail)
      .addFields(
        { name: "✦✧✧", value: characterData.skills[0].levels[0], inline: true },
        { name: "✦✦✧", value: characterData.skills[0].levels[1], inline: true },
        { name: "✦✦✦", value: characterData.skills[0].levels[2], inline: true }
      );

    interaction.update({
      embeds: [embed],
      components: [categoryRow, buttonRow],
    });
  } else if (interaction.customId == "Skill 2") {
    btnSkill2.setStyle(ButtonStyle.Primary);
    const embed = new EmbedBuilder()
      .setAuthor({
        name: characterData.name,
        iconURL: characterData.thumbnail,
      })
      .setTitle(characterData.skills[1].name)
      .setColor("#C27C0E")
      .setThumbnail(characterData.skills[1].thumbnail)
      .addFields(
        { name: "✦✧✧", value: characterData.skills[1].levels[0], inline: true },
        { name: "✦✦✧", value: characterData.skills[1].levels[1], inline: true },
        { name: "✦✦✦", value: characterData.skills[1].levels[2], inline: true }
      );

    interaction.update({
      embeds: [embed],
      components: [categoryRow, buttonRow],
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
    .setDefault(isDefault);
}

function createButton(customId, emoji, style) {
  return new ButtonBuilder()
    .setCustomId(customId)
    .setLabel(customId)
    .setEmoji(emoji)
    .setStyle(style);
}

function disableInteractions(selectCategory, btnUltimate, btnSkill1, btnSkill2) {
  selectCategory.setDisabled(true);
  btnUltimate.setDisabled(true);
  btnSkill1.setDisabled(true);
  btnSkill2.setDisabled(true);
}
