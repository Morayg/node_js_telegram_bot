const TelegramBot = require('node-telegram-bot-api');
var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var url = 'mongodb://localhost:27017/tb1';
var all_value = /./;

// replace the value below with the Telegram token you receive from @BotFather
const token = '428346731:AAG02e5MXsewWGMraXDKDJJlSGoyJOhXYzc';
// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, {polling: true});

bot.onText(/\/addnote/, (msg, match) => {
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


bot.onText(/\/showallmenotes/, (msg, match) => {
	var chat_id = msg.chat.id;
	var user_id = msg.from.id;
	MongoClient.connect(url, (err, db) => {
		assert.equal(null, err);
		var collection = db.collection('notes');
		collection.find({user_id: user_id}).toArray(function(err,result) {
			if (err) throw err;
			for (i = 0; i < result.length; i++) {
				bot.sendMessage(chat_id, result[i]['note_body']);
			};
		});
	});
});

bot.onText(/\/show10menotes/, (msg, match) => {
	var skipdecade = 0;
	var next_notes = /\/next/;
	var previous_notes = /\/previous/;
	var chat_id = msg.chat.id;
	var user_id = msg.from.id;
	var result_value;

	function show10notes() {
		MongoClient.connect(url, (err, db) => {
			assert.equal(null, err);
			var collection = db.collection('notes');
			collection.find({user_id: user_id}).limit(10).skip(skipdecade).toArray(function(err,result) {
				result_value = result.length;
				if (err) throw err;
				bot.sendMessage(chat_id, ('Ваши заметки с ' + (skipdecade + 1) + ' по ' + (skipdecade + result_value) + ': '),{reply_markup: {keyboard: [['/next', '/previous']]}});
				for (i = 0; i < result.length; i++) {
					bot.sendMessage(chat_id, result[i]['note_body']);
				};
			});
		});
	};

	//Выводит первую страницу и меню
	show10notes();

	bot.onText(next_notes, (msg,match) => {
		skipdecade = skipdecade + 10;
		show10notes();
		bot.removeTextListener(next_notes);
	});
	bot.onText(previous_notes, (msg,match) => {
		skipdecade = skipdecade - 10;
		show10notes();
		bot.removeTextListener(previous_notes);
	});
});

/*

note_id
user_id
note_created_date
note_update_date
note_folder_name
note_head
note_body
note_attach
note_archived_date

bot.onText(/\/allnames/, (msg, match) => {
     var chatId = msg.chat.id;
     var resp = match[1];
     MongoClient.connect(url, function(err, db) {
          assert.equal(null, err);
          var collection = db.collection('names');
          collection.find({}).toArray(function(err, result) {
               if (err) throw err;
               for (var i = 0; i < result.length; i++) {
               var message = result[i]['name'] + ' - ' + result[i]['chatId'];
               bot.sendMessage(chatId, message);
               //console.log(result[i].toString);
               };
          db.close();
          });
     });
});

bot.onText(/\/find (.*)/, (msg, match) => {
     var chatId = msg.chat.id;
     var resp = match[1];
     MongoClient.connect(url, function(err, db) {
          if (err) throw err;
          assert.equal(null, err);
          var collection = db.collection('names');
          var answer = collection.findOne({name: resp}, function(err, result) {
            if (err) throw err;
            bot.sendMessage(chatId, result['name'] + ' - ' + result['chatId']);
            db.close();
          });
     });
});

bot.onText(/\/delete (.*)/, (msg, match) => {
     var chatId = msg.chat.id;
     var resp = match[1];
     MongoClient.connect(url, function(err, db) {
          if (err) throw err;
          assert.equal(null, err);
          var collection = db.collection('names');
          var answer = collection.deleteOne({name: resp}, function(err, result) {
            if (err) throw err;
            bot.sendMessage(chatId, 'delete:' + result['name'] + ' - ' + result['chatId']);
            db.close();
          });
     });
});


bot.onText(/\/check_attribute (.*)/, (msg, match) => {
     var chatId = msg.chat.id;
     var resp = match[1];
     for (i in msg) {
      bot.sendMessage(chatId, i + ' ' + msg[i])
        if (typeof(msg[i]) == 'object') {
          for (u in msg[i]) {
            bot.sendMessage(chatId, i + ' ' + u + ' ' + msg[i][u]);
          };
        };    
     };
});


*/