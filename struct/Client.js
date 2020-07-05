const { Client, Collection } = require('discord.js');

module.exports = class extends Client {

	static client;

	constructor(config) {
		super({
			disableMentions: 'everyone'
		});

		this.commands = new Collection();

		this.timedEvents = new Array();  // store all the events that happen a at set intervals

		this.cooldowns = new Collection();

		this.queue = new Map();

		this.config = config;
	}
};
