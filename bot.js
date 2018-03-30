const fetch = require("node-fetch");
const Discord = require('discord.js');
const emojis = require("discord-emoji");
const generateur = require('./generateur.js');
const translate = require('google-translate-api');
const fs = require('fs');

const bot = new Discord.Client();
const cmd_trigger = '!';

const token = 'YOUR_DISCORD_TOKEN';
const blogger_api_key = 'YOUR_BLOGGER_API_KEY';

const sound_directory = './sounds/';
const available_sounds = {};

const buildUrlParams = params => 
	Object.keys(params).map(p => p + '=' + encodeURIComponent(params[p])).join('&');
const log = e => console.log(e);
const log_err = e => console.error(e);
const log_json = e => log(JSON.stringify(e, null, 2));
const ucfirst = str => str.charAt(0).toUpperCase() + str.substr(1);
const lcfirst = str => str.charAt(0).toLowerCase() + str.substr(1);
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1) + min);
const rand_in = (arr) => arr[rand(0, arr.length - 1)];
const void_fn = () => null;

const send_message = (channel, str, options) =>
	channel.send(str, options).then(void_fn, log_err).catch(log_err);
const delete_message = message =>
	message.delete().then(void_fn, log_err).catch(log_err);
const reply = (message, str) =>
	message.reply(str).then(void_fn, log_err).catch(log_err);

const getEmoji = (name, collection) => {
	var emoji;
	if (collection) {
		emoji = collection.find('name', name);
	}
	return emoji
		|| emojis.people[name]
		|| emojis.emoji[name]
		|| emojis.nature[name]
		|| emojis.food[name]
		|| emojis.activity[name]
		|| emojis.travel[name]
		|| emojis.objects[name]
		|| emojis.symbols[name]
		|| emojis.flags[name];
};
const play = (voiceChannel, sounds) => {
	if (!sounds.forEach) {
		sounds = [sounds];
	}
	if (voiceChannel && voiceChannel.speakable) {
		voiceChannel.join()
			.then(connection => {
				let play_rec = (sounds) => {
					let sound = sounds.shift();
					if (!sound) {
						voiceChannel.leave();
						return;
					}
					if (available_sounds[sound]) {
						connection
							.playFile(sound_directory + available_sounds[sound])
							.on('error', e => {
								log_err(e);
								play_rec(sounds);
							})
							.on('end', e => {
								play_rec(sounds);
							});
					} else {
						play_rec(sounds);
					}
				};
				play_rec(sounds);
			})
			.catch(log_err);
		return true;
	}
	return false;
};
const add_reactions = (message, reactions) => {
	reactions = reactions || [];
	if (!reactions.length) {
		return;
	}
	let react = (i) => {
		message.react(reactions[i])
			.then(void_fn, log_err)
			.catch(log_err);
		if (i + 1 < reactions.length) {
			setTimeout(function () {
				react(i + 1);
			}, 1000);
		}
	};
	react(0);
};
let emojis_love = [emojis.food.eggplant, emojis.symbols.heart, emojis.people.heart_eyes, emojis.people.smirk, emojis.people.kiss_mm, emojis.people.couple_mm, emojis.nature.fire, emojis.travel.wedding, emojis.travel.love_hotel];
let emojis_disgust = [emojis.people.neutral_face, emojis.people.expressionless, emojis.people.angry, emojis.people.sweat, emojis.people.rolling_eyes, emojis.people.thumbsdown, emojis.people.no_good, emojis.people.face_palm];
let emojis_gg = [emojis.people.ok_hand, emojis.nature.fire, ['🇷', '🇪', '🇰', '🇹'], ['🇧', '🇺', '🇷', '🇳']];

fs.readdir(sound_directory, (err, files) => {
	if (err)
		log_err(err);
	files.forEach(file => {
		let key = file.replace(/\.[a-z1-9]+$/i, '');
		available_sounds[key] = file;
	});
});

const commands = {
	help: {
		params: ['commandes'],
		description: 'La fonction help. (duh)',
		run: function (message, params) {
			let list, intro;
			if (params.length) {
				list = params;
				intro = 'voici l\'aide pour les commandes demandées';
			} else {
				list = Object.keys(commands);
				intro = 'voici la liste des commandes';
			}
			reply(
				message,
				intro
				+ ' :\n```Markdown\n'
				+ list
				.map(cmd => commands[cmd] ? '# ' + cmd_trigger + (commands[cmd].name || cmd)
						+ (commands[cmd].params.map(p => ' [' + p + ']').join(''))
						+ ' \n\t ' + (commands[cmd].description || '') : 'Commande inexistante.')
				.join('\n\n')
				+ '```'
				);
		}
	},
	ah: {
		name: 'AH',
		params: [],
		description: 'AH !',
		run: function (message) {
			let voiceChannel = message.member.voiceChannel;
			play(voiceChannel, 'ah')
				|| send_message(message.channel, 'AH ! \n https://www.youtube.com/watch?v=XE6YaLtctcI');
		}
	},
	complimente: {
		params: ['mentions'],
		description: 'Complimente les utilisateurs mentionnés dans le message, si personne n\'est mentionné, complimente quelqu\'un au hasard.',
		run: function (message) {
			let compliments = ["Si mon sexe était à la hauteur de ta beauté, ce serait la tour Eiffel.", "J’adorerais avoir des cheveux aussi envoûtants que les tiens.", "Tes joues ressemblent à deux pommes d’amour.", "Comment fais-tu ? Ton teint est toujours éclatant.", "Si tu étais un délit, tu serais un excès de beauté…", "Ahh, ton sourire me renverse…", "Ton sourire pourrait éclairer le fond de l’océan.", "Tu ressembles à un dieu grec.", "Ouah, tu ne mentais pas quand tu disais aller à la gym…", "Je pourrais te contempler éternellement.", "Un rien te va.", "J’aime ta façon de marcher.", "L’adjectif «radieux» est fait pour toi.", "Tu as un don pour choisir les vêtements à porter.", "Tu as une beauté préraphaélite.", "Tu as une beauté renaissance.", "Rodin n’aurait pas fait mieux que toi.", "Ton visage est parfaitement symétrique, comme un croquis de Léonard de Vinci.", "Je t’admire.", "Tu m’inspires.", "Tu es irremplaçable.", "Avec toi, on ne s’ennuie jamais.", "Je suis totalement désarçonné par ton intelligence.", "Avec toi, j’ai l’impression d’être au sommet de l’Himalaya.", "Tu illumines mes dimanches.", "Ma chérie, tou es ma-gni-faïque !", "Mon appareil photo n’est pas à la hauteur de ta beauté.", "Mon chien t’adore.", "Mon chat t’adore.", "J’ai mis une seconde pour t’aimer, mais je mettrais une éternité à t’oublier.", "Tu pourrais inventer des mots, les gens les utiliseraient.", "Tu es encore mieux qu’une Licorne, une Sirène, un Phoenix et un Elfe réunis.", "Tu es le sucre de mes Corn Flakes Kellogg’s.", "Tu es le champagne qui fait pétiller ma vie.", "Tu as le style et la classe de Mick Jagger.", "Tu as plus de charme que Brad Pitt et Angelina Jolie réunis.", "On devrait donner ton nom à une fleur.", "Les parfums aspirent à rivaliser avec ton odeur.", "Tu es beau à en réveiller les morts.", "Ohh ! Tu arrives à me faire rire même dans les pires situations ! Comment fais-tu ?", "T’as d’beaux yeux, tu sais ?", "Je vous aime tellement que je crois que je vais mourir.", "On a beau tout rêver, tu dépasses le rêve.", "Tu es si beau!", "Tu es le plus fort de tous !", "Ton charme est irrésistible.", "Tu es l’homme idéal, celui que toutes les femmes rêveraient d’avoir !", "Tu es le meilleur de tous. Quoiqu’en disent les autres, ils ne t'arrivent pas à la cheville !", "Tu es tellement courageux.", "Tu es incomparable.", "Tu es intelligent et si séduisant, la combinaison parfaite.", "Ton style est toujours impeccable, tu es sûr de ne pas être mannequin ?", "Tu es trop drôle ! Il n’y a que toi qui sache me faire rire comme ça.", "Tu es l’homme le plus attrayant du monde. Non… De l’univers !", "Je suis si fier de toi, tu n’imagines même pas.", "Tu es toujours plein d’énergie !", "Tu es le plus talentueux et le plus courageux des hommes que je connaisse.", "Tu es à la fois si sensible et créatif… De quoi rendre jaloux les plus grands artistes !", "Tu agis toujours en vrai gentleman quoiqu’il arrive, et c’est ce qui fait ta vraie force !", "Quelle mine, tu reviens de vacances ?", "Tu as gardé ton âme d'enfant.", "Ta gentillesse me réconforte.", "Je te remercie de faire partie de ma vie.", "Je suis fier de te présenter à mes amis et à ma famille.", "J’adore parler avec toi.", "Ton courage me redonne espoir.", "Ton sourire est éclatant.", "Après tant d’années, tu arrives encore à m’étonner, bravo !", "Tu es une personne fiable sur qui je peux compter.", "Plus je te connais, plus je t’apprécie.", "Je t’admire pour ton intelligence.", "Je t’admire pour ton courage.", "Je t’admire pour ta générosité.", "Je t’admire pour ton honnêteté.", "Je t’admire pour ta force de caractère.", "Je t’admire pour ta patience.", "Je t’admire pour ton talent."];
			let signatures = ['Signé'];
			let targets = message.mentions.members.array();
			if (!targets.length) {
				targets = [message.channel.members.filter(m => !m.user.bot && m.user.id !== message.author.id).random()];
			}

			targets.forEach(target => {
				if (!target) {
					return true;
				}

				let sender = message.member.nickname || message.author.username;

				let compliment = '\n' + ucfirst(rand_in(compliments));
				compliment += '\n' + ucfirst(rand_in(signatures));
				compliment += ' ' + sender + '.';

				message.channel
					.send(compliment, {reply: target})
					.then(msg => {
						let emoji;
						if (target.user.id !== message.author.id) {
							if (rand(0, 2)) {
								emoji = rand_in(emojis_love);
							}
						} else {
							emoji = rand_in(emojis_disgust);
						}
						if (emoji) {
							msg.react(emoji)
								.then(void_fn, log_err)
								.catch(log_err);
						}
					}, log_err)
					.catch(log_err);

				if (target.user.id === bot.user.id) {
					reply(message, 'merci beaucoup ! :blush:');
				}
			});
			delete_message(message);
		}
	},
	crie: {
		name: 'crie',
		params: ['sons'],
		description: 'Lorsque l\'utilisateur est dans un channel vocal accessible par le bot, il jouera les sons demandés si ils sont présents dans sa bibliothèque. "' + cmd_trigger + 'crie -liste" pour avoir la liste des sons disponibles.',
		run: function (message, params) {
			if (params[0] && params[0] === '-liste') {
				reply(
					message,
					'voici la liste des sons dans ma bibliothèque :\n'
					+ Object.keys(available_sounds).sort().join('\n')
					);
			} else {
				play(message.member.voiceChannel, params);
			}
		}
	},
	de: {
		name: 'dé',
		params: ['max | min max'],
		description: 'Lance un dé min-max. Défaut : min = 1, max = 6.',
		run: function (message, params) {
			let min, max;
			switch (params.length) {
				case 1:
					min = 1;
					max = (+params[0]) || 6;
					break;
				default:
					min = (+params[0]) || 1;
					max = (+params[1]) || 6;
					break;
			}
			send_message(message.channel, rand(min, max));
		}
	},
	gloryowl: {
		params: ['numero'],
		description: 'Affiche le Glory Owl correspondant à [numero] ou bien le dernier posté si aucun numéro n\'est fourni.',
		run: function (message, params) {
			let url = 'https://www.googleapis.com/blogger/v3/blogs/2158351088139019918/posts';
			let url_params = {
				key: blogger_api_key
			};
			params.forEach(p => {
				if (Number.isInteger(+p)) {
					url_params.q = '#' + p;
				} else {

				}
			});
			if (url_params.q) {
				url += '/search';
			}
			url += '?' + buildUrlParams(url_params);
			let empty_result = {items: []};
			fetch(url)
				.catch(log_err)
				.then(res => res.ok ? res.json() : empty_result, () => empty_result)
				.then(data => {
					if (data.items && data.items.length) {
						let img = data.items[0].content.match(/(https?:\/\/((?!jpg).)*\.jpg)/i);
						if (img) {
							send_message(message.channel, img[0]);
						} else {
							reply(message, 'déso j\'ai pas trouvé :frowning2:');
						}
					} else {
						reply(message, 'déso j\'ai pas trouvé :frowning2:');
					}
				});
		}
	},
	insulte: {
		params: ['mentions'],
		description: 'Insulte les utilisateurs mentionnés dans le message, si personne n\'est mentionné, insulte quelqu\'un au hasard.',
		run: function (message) {
			let intros, intensifiers, names, complements;
			if (rand(1, 3) <= 2) { //Masculin
				intros = ['te fait savoir que tu n\'es qu\'un', 'pense que tu n\'arrives pas à la cheville d\'un', 'dit que tu ressembles à un', 'te méprise,', 't\'insulte cordialement de', 'te considère comme un', 'te présenterait à ses parents comme un', 't\'identifie comme un'];
				intensifiers = ['pauvre', 'misérable', 'pitoyable', 'lamentable', 'fieffé', 'infâme', 'sombre', 'jeune', 'sale', 'sinistre', 'triste', 'monstrueux'];
				names = ["tocard", "navet", "sportif", "con", "témoin de Jehovah", "beauf", "crétin d'automobiliste", "chacal graphomane", "zoophile", "moniteur d'auto-école", "végétarien", "boy scout", "résidu blochérien", "centriste subclaquant", "intégriste", "indice boursier", "connard embouteillé", "branleur", "enculeur de mouches", "bagnolard fétichiste", "fan de Justin Bieber", "gland de puceau", "salaud de pauvre", "sachet de gruau", "débris de prépuce", "constipé du cerveau"];
				complements = ['sans avenir', 'qui ne mérite que le mépris', 'de service', 'des forêts', 'prépubère', 'dont même ses propres parents ne veulent pas', 'collectionnant les IST comme des cartes Pokémon', 'pernicieux', '', '', '', ''];
			} else { //Féminin
				intros = ['te fait savoir que tu n\'es qu\'une', 'pense que tu n\'arrives pas à la cheville d\'une', 'dit que tu ressembles à une', 'te méprise,', 't\'insulte cordialement de', 'te considère comme une', 'te présenterait à ses parents comme une', 't\'identifie comme une'];
				intensifiers = ['espèce de', 'pauvre', 'misérable', 'pitoyable', 'lamentable', 'fieffée', 'infâme', 'sombre', 'jeune', 'sale', 'sinistre', 'triste', 'monstrueuse'];
				names = ["sportive", "conne", "témoin de Jehovah", "vipère lubrique", "hyène dactylographe", "taffiole honteuse", "zoophile", "monitrice d'auto-école", "végétarienne", "girl scout", "centriste subclaquant", "crapule stalinienne", "intégriste", "sous-merde fasciste", "connasse embouteillée", "branleuse", "blatte", "enculeuse de mouches", "bagnolarde fétichiste", "fan de Justin Bieber", "salope de pauvre", "constipée du cerveau"];
				complements = ['sans avenir', 'qui ne mérite que le mépris', 'de service', 'des forêts', 'prépubère', 'dont même ses propres parents ne veulent pas', 'collectionnant les IST comme des cartes Pokémon', 'pernicieuse', '', '', '', ''];
			}

			let targets = message.mentions.members.array();
			if (!targets.length) {
				targets = [
					message.channel.members
						.filter(m => !m.user.bot && m.user.id !== message.author.id)
						.random()
				];
			}

			targets.forEach(target => {
				if (!target) {
					return true;
				}
				let insult = '';
				let rand_outro = rand_in(complements);
				let sender = message.member.nickname || message.author.username;
				if (target.user.id === bot.user.id) {
					sender = bot.user.username;
					target = message.author;
				}

				insult += sender + ' ' + rand_in(intros);
				insult += ' ' + rand_in(intensifiers);
				insult += ' ' + rand_in(names);
				insult += (rand_outro.length ? ' ' + rand_outro : '') + '.';

				message.channel
					.send(insult, {reply: target})
					.then(msg => {
						if (rand(0, 2) === 0) {
							let reactions = rand_in(emojis_gg);
							if (!reactions.forEach) {
								reactions = [reactions];
							}
							add_reactions(msg, reactions);
						}
					}, log_err)
					.catch(log_err);
			});
			delete_message(message);
		}
	},
	jeanne: {
		params: [],
		description: 'Au secours !',
		run: function (message) {
			send_message(message.channel, 'Au secours ! \n https://www.youtube.com/watch?v=v1mxMtr8Mws');
		}
	},
	reagis: {
		name: 'réagis',
		params: ['mot', 'offset'],
		description: 'Réagir à un message. Cette commande peut être raccourcie en "#[mot] [offset]". Défaut : offset = 1.',
		trigger: '#',
		run: function (message, params) {
			params || (params = []);
			let word = (params[0] || '')
				.normalize('NFD')
				.replace(/[\u0300-\u036f]/g, '')
				.replace(/[^a-z0-9\!\?_]/gi, '');
			let offset = Math.max(Math.abs(+params[1] || 1), 1);

			if (!params.length || !word.length) {
				return;
			}

			message.channel.fetchMessages({before: message.id, limit: offset})
				.then(list => {
					let target = list.array().pop();
					if (target) {
						let letter_2_emoji = {
							'_': [emojis.symbols.black_large_square, emojis.symbols.black_medium_square, emojis.symbols.black_medium_small_square, emojis.symbols.black_small_square, emojis.symbols.white_large_square, emojis.symbols.white_medium_square, emojis.symbols.white_medium_small_square, emojis.symbols.white_small_square],
							'0': [emojis.symbols.zero],
							'1': [emojis.symbols.one],
							'2': [emojis.symbols.two],
							'3': [emojis.symbols.three],
							'4': [emojis.symbols.four],
							'5': [emojis.symbols.five],
							'6': [emojis.symbols.six],
							'7': [emojis.symbols.seven],
							'8': [emojis.symbols.height],
							'9': [emojis.symbols.nine],
							'A': ["\ud83c\udde6", emojis.symbols.a],
							'B': ["\ud83c\udde7", emojis.symbols.b],
							'C': ["\ud83c\udde8", emojis.symbols.copyright, emojis.symbols.star_and_crescent],
							'D': ["\ud83c\udde9"],
							'E': ["\ud83c\uddea", emojis.symbols.three],
							'F': ["\ud83c\uddeb"],
							'G': ["\ud83c\uddec"],
							'H': ["\ud83c\udded", emojis.symbols.pisces],
							'I': ["\ud83c\uddee", emojis.symbols.one],
							'J': ["\ud83c\uddef"],
							'K': ["\ud83c\uddf0"],
							'L': ["\ud83c\uddf1"],
							'M': ["\ud83c\uddf2", emojis.symbols.m, emojis.symbols.virgo, emojis.symbols.scorpius, emojis.symbols.eye_in_speech_bubble],
							'N': ["\ud83c\uddf3", emojis.symbols.capricorn],
							'O': ["\ud83c\uddf4", emojis.symbols.o2, emojis.symbols.o],
							'P': ["\ud83c\uddf5", emojis.symbols.parking],
							'Q': ["\ud83c\uddf6"],
							'R': ["\ud83c\uddf7", emojis.symbols.registered],
							'S': ["\ud83c\uddf8", emojis.symbols.heavy_dollar_sign],
							'T': ["\ud83c\uddf9", emojis.symbols.cross],
							'U': ["\ud83c\uddfa", emojis.symbols.ophiuchus],
							'V': ["\ud83c\uddfb", emojis.symbols.aries, emojis.symbols.heavy_check_mark],
							'W': ["\ud83c\uddfc"],
							'X': ["\ud83c\uddfd", emojis.symbols.x, emojis.symbols.heavy_multiplication_x],
							'Y': ["\ud83c\uddfe"],
							'Z': ["\ud83c\uddff"],
							'!': [emojis.symbols.exclamation, emojis.symbols.grey_exclamation],
							'?': [emojis.symbols.question, emojis.symbols.grey_question]
						};
						let reactions = word.toUpperCase().split('').map(l => (letter_2_emoji[l] || []).shift()).filter(l => l != null);
						add_reactions(target, reactions);
					}
					delete_message(message);
				}, log_err)
				.catch(log_err);
		}
	},
	stats: {
		params: [],
		description: 'En dev.',
		run: function (message, params) {

		}
	},
	traduis: {
		params: ['-<source>:<destination>', 'phrase'],
		description: 'Pseudo-traduit une phrase vers la langue demandée. Défaut : source = auto, destination = en, phrase = message précédent.',
		run: function (message, params) {
			params || (params = []);
			let from, to;
			if (params[0] && params[0].indexOf('-') === 0) {
				[from, to] = params.shift().substring(1).split(':');
			}
			to = to || 'en';
			let doTranslate = (input) => {
				translate(input.join(' '), {to: to})
					.then(res => {
						let result = [], real_from, real_to;
						from = from || res.from.language.iso;

						input.forEach((text, i) => {
							translate(text, {from: from, to: to}).then(res => {
								real_from = res.from.language.iso;
								result[i] = res.text || '';
							}).catch(log_err);
						});
						let i = 0;
						let checkIfDone = setInterval(function () {
							if (i > 100 || result.filter(w => !!w).length >= input.length) {
								clearInterval(checkIfDone);
								send_message(message.channel, ucfirst(result.map(w => lcfirst(w)).join(' ')));
							}
							i++;
						}, 100);
					})
					.catch(err => {
						reply(message, 'déso, Google répond pas :frowning2:');
					});
			};
			if (params.length) {
				doTranslate(params);
			} else {
				message.channel
					.fetchMessages({before: message.id, limit: 1})
					.then(list => {
						let target = list.array().pop();
						if (target) {
							doTranslate(target.cleanContent.split(' '));
						}
					}, log_err)
					.catch(log_err);
			}
		}
	},
	vote: {
		params: ['-q "question"', '-r :emoji_1: "réponse 1"', '-r "réponse 2"', '...'],
		description: 'Pose une question sur le channel. Les réponses se font en votant par réaction. Par défaut, les émojis de réponse seront les numéros (:one:, :two:, ...).',
		error: function (message) {
			reply(message, 'Déso, j\'ai pas bien compris :frowning:');
		},
		run: function (message, params) {
			let query = params.join(' ');
			let question = ((query.match(/-q "([^"]+)"/i) || [])[1] || '').trim().replace(/`/g, '');
			if (!question) {
				this.error(message);
				return;
			}
			let answers = {};
			let emojis_default = [
				emojis.symbols.one, emojis.symbols.two, emojis.symbols.three, emojis.symbols.four, emojis.symbols.five, emojis.symbols.six, emojis.symbols.seven, emojis.symbols.height, emojis.symbols.nine,
				"\ud83c\udde6", "\ud83c\udde7", "\ud83c\udde8", "\ud83c\udde9", "\ud83c\uddea", "\ud83c\uddeb", "\ud83c\uddec", "\ud83c\udded",
				"\ud83c\uddee", "\ud83c\uddef", "\ud83c\uddf0", "\ud83c\uddf1", "\ud83c\uddf2", "\ud83c\uddf3", "\ud83c\uddf4", "\ud83c\uddf5",
				"\ud83c\uddf6", "\ud83c\uddf7", "\ud83c\uddf8", "\ud83c\uddf9", "\ud83c\uddfa", "\ud83c\uddfb", "\ud83c\uddfc", "\ud83c\uddfd",
				"\ud83c\uddfe", "\ud83c\uddff"
			];

			let matches = query.match(/-r ((?:[^ "]+ )?"[^"]+")/gi) || [];
			matches.forEach((match, index) => {
				let answer;
				let emoji;
				if ((answer = match.match(/:([^:]+): "([^"]+)"/i)) || (answer = match.match(/<:([^:]+):[0-9]+> "([^"]+)"/i))) {
					emoji = getEmoji(answer[1], message.channel.guild.emojis) ? answer[1] : emojis_default[index];
				} else {
					answer = match.match(/-r (?:([^ "]+) )?"([^"]+)"/i) || [];
					emoji = answer[1] || emojis_default[index];
				}
				if(emoji === '☑' || getEmoji(emoji) === '☑'){
					emoji = emojis_default[index];
				}
				let text = answer[2];
				if (emoji && text) {
					answers[emoji] = text;
				}
			});
			let emojis_answers = Object.keys(answers);
			if (!emojis_answers.length) {
				this.error(message);
				return;
			}

			let sender = message.member.nickname || message.author.username;
			let id_sender = message.author.id;
			message.channel
				.send('@everyone, ' + sender + ' aimerait votre avis sur la question suivante :\n'
					+ '```' + question + '```\n'
					+ 'Les réponses disponibes sont les suivantes :\n\t'
					+ emojis_answers.map(e => (getEmoji(e, message.channel.guild.emojis) || e) + ' : ' + answers[e]).join('\n\t')
					+ '\n\n*' + sender + ' peut fermer le sondage en cliquant sur ☑*'
					)
				.then(bot_message => {
					add_reactions(bot_message, emojis_answers.map(e => getEmoji(e, bot_message.channel.guild.emojis) || e).concat('☑'));
					bot_message
						.awaitReactions(reaction => {
							return reaction._emoji.name === '☑' && !!reaction.users.get(id_sender);
						}, {max: 1})
						.then(() => {
							let results = bot_message.reactions
								.filter(r => emojis_answers.indexOf(r._emoji.name) > -1)
								.sort((a, b) => b.count - a.count);
							send_message(
								bot_message.channel,
								'Résultats du vote : `' + question + '`\n\t'
								+ results.map(r => '- ' + answers[r._emoji.name] + ' *(' + (r.count - 1) + ' votes)*').join('\n\t')
								);
						}, log_err).catch(log_err);
				}, log_err)
				.catch(log_err);

			delete_message(message);
		}
	}
};

// Event to listen to messages sent to the server where the bot is located
bot.on('message', message => {
	// So the bot doesn't reply to bots
	if (message.author.bot)
		return;

	if (message.cleanContent.indexOf(cmd_trigger) === 0) {
		let params = message.cleanContent.substring(1).split(' ');
		let command = params.shift().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "");
		if (commands[command]) {
			commands[command].run(message, params);
		}
	} else if (false && message.cleanContent.indexOf(commands.reagis.trigger) === 0) {
		let params = message.cleanContent.substring(1).split(' ');
		commands.reagis.run(message, params);
	} else {
		if (message.cleanContent.match(/choco[ -]?lunes/i)) {
			let emoji_choco_lune = getEmoji('choco_lunes', message.channel.guild.emojis);
			if (emoji_choco_lune) {
				add_reactions(message, [emoji_choco_lune]);
			}
		}
		if (message.channel.type === 'dm') {
			send_message(message.channel, generateur.generer_une_phrase());
		} else if (message.mentions.everyone || message.mentions.members && message.mentions.members.array().filter(m => m.user.id === bot.user.id).length) {
			let options = {
				avecSujet: rand(0, 1) === 0,
				sujet: '',
				personne: 3
			};
			let je = false;
			let tu = false;
			let possible_subjects = message.channel.members.array().filter(m => !m.user.bot || m.user.id === bot.user.id);
			let subjects_ids = [];
			let subjects = [];
			let iMax = rand(0, Math.min(possible_subjects.length - 1, 3));
			for (let i = 0; i <= iMax; i++) {
				let subject;
				do {
					subject = rand_in(possible_subjects);
				} while (subjects_ids.indexOf(subject.user.id) > -1)
				subjects_ids.push(subject.user.id);

				if (subject.user.id === bot.user.id) {
					je = true;
				} else if (subject.user.id === message.author.id) {
					tu = true;
					subjects.push('__AUTHOR__');
				} else {
					subjects.push(subject.nickname || subject.user.username);
				}
			}

			if (je) {
				options.personne = 1;
			} else if (tu) {
				options.personne = 2;
			} else {
				// IL/ELLE
				options.personne = 3;
			}
			if (subjects_ids.length > 1) {
				// Pluriel
				options.personne += 3;
			}
			options.sujet =
				subjects
				.map(n => {
					if (n === '__AUTHOR__') {
						return subjects_ids.length === 1 ? 'tu' : 'toi';
					}
					return n;
				})
				.reduce((acc, val, i) => acc + (i > 0 ? (i === subjects.length - 1 && !je ? ' et ' : ', ') : '') + val, '');
			if (je) {
				options.sujet += subjects.length ? ' et moi' : 'je';
			}
			let p = generateur.generer_une_phrase(options);

			if (options.avecSujet && tu) {
				reply(message, lcfirst(p));
			} else {
				send_message(message.channel, p);
			}
		}
	}
});

bot.login(token);

