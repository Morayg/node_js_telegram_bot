const TelegramBot = require('node-telegram-bot-api');
var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var url = 'mongodb://localhost:27017/tb1'

// replace the value below with the Telegram token you receive from @BotFather
const token = '428346731:AAG02e5MXsewWGMraXDKDJJlSGoyJOhXYzc';

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, {polling: true});

// Matches "/echo [whatever]"
bot.onText(/\/echo (.+)/, (msg, match) => {
  // 'msg' is the received Message from Telegram
  // 'match' is the result of executing the regexp above on the text content
  // of the message

  var chatId = msg.chat.id;
  var resp = match[1]; // the captured "whatever"

  // send back the matched "whatever" to the chat
  bot.sendMessage(chatId, resp);
  //bot.sendMessage(chatId, chatId);
});

bot.onText(/\/name (.*)/, (msg, match) => {
     var chatId = msg.chat.id;
     var resp = match[1];
     MongoClient.connect(url, function(err, db) {
          assert.equal(null, err);
          var collection = db.collection('names');
          collection.insert({name: resp, chatId: chatId});
          bot.sendMessage(chatId, 'Привет, ' + resp + '!');
          db.close();
     });
});

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

test1