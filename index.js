const TelegramApi  =  require ( 'node-telegram-bot-api' ) ;
const { againOptions, gameOptions } = require("./options");

const  TOKEN = '7637674415:AAGT8WzQaD3KZv7jRwgiNHkgZ9PIMxqw3Sk'

const bot = new TelegramApi(TOKEN, {polling: true})

const chats = {}

const startGame = async (chatId) => {
    await bot.sendMessage(chatId, `Cейчас я загадаю число от 0 до 9, а ты должен угадать его!`);
    const randomNumber = Math.floor(Math.random() * 10);
    chats[chatId] = randomNumber;
    await bot.sendMessage(chatId, `Отгадывай!`, gameOptions);
}

const start = () => {
    bot.setMyCommands([
            {command: '/start', description: 'Начальное приветствие'},
            {command: '/info', description: 'Информация о пользователе'},
            {command: '/game', description: 'Игра угадай число'},
        ]
    )

    bot.on('message', async msg => {
        const text = msg.text;
        const chatId = msg.chat.id;
        if (text === '/start') {
            return  bot.sendMessage(chatId, 'Привет');
        }
        if (text === '/info') {
            return bot.sendMessage(chatId, `Тебя зовут: ${msg.from.first_name} ${msg.from.last_name}`);
        }
        if (text === '/game') {
            startGame(chatId);
        }
        return bot.sendMessage(chatId, 'Я тебя не понимаю, попробуй еще раз!');
    })

    bot.on('callback_query', async msg => {
        const data = msg.data;
        const chatId = msg.message.chat.id;
        if (data === '/again') {
            startGame(chatId);
        }
        if (data === chats[chatId]) {
            return bot.sendMessage(chatId, `Поздравляю, ты угадал цифру  ${chats[chatId]}`, againOptions);
        } else {
            bot.sendMessage(chatId, `К сожалению ты не угадал, бот загадал цифру ${chats[chatId]}`, againOptions);
        }
        console.log(msg);
    })
}

start();