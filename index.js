const TelegramBot = require('node-telegram-bot-api');
var MongoClient = require('mongodb').MongoClient;
var mongo = require('mongodb');
var assert = require('assert');
var url = 'mongodb://localhost:27017/tb1';
var all_value = /./;


// replace the value below with the Telegram token you receive from @BotFather
const token = '489189460:AAEfNRAinVtaxR4_VYoe3x6sxIfJMcY-mlY';
// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, {polling: true});

function send_main_menu (chat_id) {
	var main_menu_keyboard = {reply_markup: {keyboard: [
		['Добавить заметку', 'Просмотреть все заметки', 'Перейти к просмотру заметок'], ['/settings', '/profile', '/archive']
	], one_time_keyboard: true}};
	bot.sendMessage(chat_id, 'Добро пожаловать в главное меню!', main_menu_keyboard)
};

bot.onText(/\/start/, (msg, match) => {
	var chat_id = msg.chat.id;
	send_main_menu(chat_id);
});

bot.onText(/Добавить заметку/, (msg, match) => {
	bot.sendMessage(msg.chat.id, 'Что необходимо записать в заметку? Отправьте текст заметки');
	bot.onText(all_value, (msg, match) => {
		var chat_id = msg.chat.id;
		var user_id = msg.from.id;
		var note_created_date = msg.date;
		var note_body = msg.text;
		MongoClient.connect(url, function(err, db) {
			assert.equal(null, err);
			var collection = db.collection('notes');
			collection.insert({user_id: user_id, chat_id: chat_id, note_created_date: note_created_date, note_body: note_body});
			bot.sendMessage(chat_id, 'Заметка создана!');
			db.close();
		});
		bot.removeTextListener(all_value);
	});
});

bot.onText(/Просмотреть все заметки/, (msg, match) => {
	var chat_id = msg.chat.id;
	var user_id = msg.from.id;
	MongoClient.connect(url, (err, db) => {
		assert.equal(null, err);
		var collection = db.collection('notes');
		collection.find({user_id: user_id, note_edited_date: { "$exists" : false }}).toArray(function(err,result) {
			if (err) throw err;
			for (i = 0; i < result.length; i++) {
				bot.sendMessage(chat_id, result[i]['note_body']);
			};
		});
	});
});

bot.onText(/Перейти к просмотру заметок/, (msg, match) => {
	var skipdecade = 0;
	var next_notes = /\/next/;
	var previous_notes = /\/previous/;
	var chat_id = msg.chat.id;
	var user_id = msg.from.id;
	var result_value;

	function show10notes() {
		if (skipdecade < 0) {skipdecade = 0};
		MongoClient.connect(url, (err, db) => {
			assert.equal(null, err);
			var collection = db.collection('notes');
			collection.find({user_id: user_id, note_edited_date: { "$exists" : false }}).limit(10).skip(skipdecade).toArray(function(err,result) {
				result_value = result.length;
				if (err) throw err;
				var text_message = 'Ваши заметки с ' + (skipdecade + 1) + ' по ' + (skipdecade + result_value) + ': ';
				bot.sendMessage(chat_id, text_message, {reply_markup: {keyboard: [['/next', '/previous']]}});
				listener_pagenator();
				for (i = 0; i < result.length; i++) {
					var keyboard = {
						reply_markup: JSON.stringify({
						  	inline_keyboard: [
								  [{text: "Изменить текст заметки", callback_data: 'edit_note' + ';;' + result[i]['_id']}, {text: "Отправить заметку в архив", callback_data: 'archive_note' + ';;' + result[i]['_id']}]
							]
						})
					};
					bot.sendMessage(chat_id, result[i]['note_body'], keyboard);
				};
			});
		});
	};

	//Выводит первую страницу и меню
	show10notes();

	function listener_pagenator() {
		bot.onText(next_notes, (msg,match) => {
			skipdecade = skipdecade + 10;
			bot.removeTextListener(next_notes);
			bot.removeTextListener(previous_notes);
			show10notes();
		});
		bot.onText(previous_notes, (msg,match) => {
			skipdecade = skipdecade - 10;
			bot.removeTextListener(next_notes);
			bot.removeTextListener(previous_notes);
			show10notes();
		});
	};
});

bot.on('callback_query', function (msg) {
	var answer = msg.data.split(';;');
	var callback_type = answer[0];
	var id_note = new mongo.ObjectID(answer[1]);
	//console.log(id_note);
	if (callback_type == 'edit_note') {
		//то запускаем редактирование
		try {
			MongoClient.connect(url, (err, db) => {
				assert.equal(null, err);
				var collection = db.collection('notes');
					collection.findOne({_id: id_note}, function(err, message) {
						//console.log(message);
						var chat_id = message.chat_id;
						bot.sendMessage(chat_id, 'Отправьте новый текст заметки: ' + message.note_body);
						bot.onText(all_value, (msg, match) => {
							var chat_id = msg.chat.id;
							var user_id = msg.from.id;
							var note_edited_date = msg.date;
							var note_body = msg.text;
							MongoClient.connect(url, function(err, db) {
								assert.equal(null, err);
								var collection = db.collection('notes');
								collection.update({_id:  id_note}, {$set: {user_id: user_id, chat_id: chat_id, note_edited_date: note_edited_date, note_body: note_body} });
								bot.sendMessage(chat_id, 'Заметка отредактирована!');
								db.close();
							});
							bot.removeTextListener(all_value);
						});
					});
			});
		} catch (err) {
			console.log(err);
		};
	};
	if (callback_type == 'archive_note') {
		try {
			MongoClient.connect(url, (err, db) => {
				assert.equal(null, err);
				var collection = db.collection('notes');
					collection.findOne({_id: id_note}, function(err, message) {
						//console.log(message);
						var chat_id = message.chat_id;
						var chat_id = msg.chat.id;
						var user_id = msg.from.id;
						var note_edited_date = msg.date;
						var note_body = msg.text;
						MongoClient.connect(url, function(err, db) {
							assert.equal(null, err);
							var collection = db.collection('notes');
							collection.update({_id:  id_note}, {chat_id: chat_id, archive_timestamp: Date.now()})
							bot.sendMessage(chat_id, 'Заметка отправлена в архив!');
							db.close();
						});
					});
			});
		} catch (err) {
			console.log(err);
		};
	}
});
