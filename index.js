require('dotenv').config();
const { readdirSync } = require('fs');
const { join } = require('path');
const Client = require('./struct/Client');
const { Collection } = require('discord.js');
const client = new Client({ token: process.env.DISCORD_TOKEN, prefix: process.env.DISCORD_PREFIX });
const Embed = require("discord.js").MessageEmbed;


async function helpCommand(message){ // doesnt look at permissions
	if (message.channel.type !== 'text'){
		return message.reply("I can not perform the \`help\` command in DM's")
	}
	let embed = new Embed()
	.setColor('#0099ff')
	.setTitle("Help");
	for (command of message.client.commands.values()){
		if (command.permission !== undefined && !message.member.hasPermission(command.permission)){
			continue  // does not have permission skip this command
		}
		if (command.guildOnly && command.role !== undefined){
			let role = await message.guild.roles.fetch(message.client.config.content_creator_role)
	    let highest_role = message.member.roles.highest
	    if (highest_role.comparePositionTo(role) < 0){  // if the user is not a high enough rank
	      continue  // does not have the role, skip this command
	    }
		}
		embed.addField(message.client.config.prefix+command.name, command.description, false);
	}
	message.channel.send(embed);
}

const commandFiles = readdirSync(join(__dirname, 'commands')).filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
	const command = require(join(__dirname, 'commands', `${file}`));
	client.commands.set(command.name, command);
}

const timedEventFiles = readdirSync(join(__dirname, 'timedevents')).filter(file => file.endsWith('.js'));
for (const file of timedEventFiles) {
	const timedEvent = require(join(__dirname, 'timedevents', `${file}`));
	client.timedEvents.push(timedEvent);
}

client.once('ready', function() {
	console.log('READY!');
	for (timedEvent of client.timedEvents){
    let remainder = (Date.now() - timedEvent.startTime) % timedEvent.frequency;
    let next = (timedEvent.frequency - remainder);
    setTimeout(timedEvent.execute, next, client);
	}
});

client.on('message', async message => {
	if (message.author.bot) return;
	if (!message.content.startsWith(client.config.prefix)) return;
	const args = message.content.slice(client.config.prefix.length).split(/ +/);
	const commandName = args.shift().toLowerCase();
	if (commandName === "help"){
		helpCommand(message);
		return;
	}
	const command = client.commands.get(commandName) || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));
	if (!command) return;
	if (command.guildOnly && message.channel.type !== 'text') return message.reply('I can\'t execute that command inside DMs!');
	if (command.guildOnly && command.permission !== undefined && !message.member.hasPermission(command.permission)) return message.reply(`You need the \`${command.permission}\` pemission to perform ${client.config.prefix+command.name}.`);
	if (command.guildOnly && command.role !== undefined){
		let role = await message.guild.roles.fetch(message.client.config.content_creator_role)
    let highest_role = message.member.roles.highest
    if (highest_role.comparePositionTo(role) < 0){  // if the user is not a high enough rank
      return message.reply(`You need the \`${role.name}\` role to perform ${client.config.prefix+command.name}`);
    }
	}
	if (command.args && !args.length) {
		let reply = `You didn't provide any arguments, ${message.author}!`;
		if (command.usage) reply += `\nThe proper usage would be: \`${client.config.prefix}${command.name} ${command.usage}\``;
		return message.channel.send(reply);
	}
	if (!client.cooldowns.has(command.name)) {
		client.cooldowns.set(command.name, new Collection());
	}
	const now = Date.now();
	const timestamps = client.cooldowns.get(command.name);
	const cooldownAmount = (command.cooldown || 3) * 1000;
	if (timestamps.has(message.author.id)) {
		const expirationTime = timestamps.get(message.author.id) + cooldownAmount;
		if (now < expirationTime) {
			const timeLeft = (expirationTime - now) / 1000;
			return message.reply(`please wait ${timeLeft.toFixed(1)} more second(s) before reusing the \`${command.name}\` command.`);
		}
	}
	timestamps.set(message.author.id, now);
	setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);

	try {
		command.execute(message, args);
	} catch (error) {
		console.error(error);
		message.reply('there was an error trying to execute that command!');
	}

});
client.login(client.config.token);
