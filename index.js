const TelegramApi = require('node-telegram-bot-api');
const {againOptions, gameOptions} = require("./options");
const sequelize = require('./db');
const userModel = require('./models')

const TOKEN = '7637674415:AAGT8WzQaD3KZv7jRwgiNHkgZ9PIMxqw3Sk'

const bot = new TelegramApi(TOKEN, {polling: true})

const chats = {}

const startGame = async (chatId) => {
    chats[chatId] = Math.floor(Math.random() * 10);
    await bot.sendMessage(chatId, `Cейчас я загадаю число от 0 до 9, а ты должен угадать его!`, gameOptions);
}

const start = async () => {
    try {
        await sequelize.authenticate();
        await sequelize.sync()
    } catch (e) {
        console.log('Подключение к бд поломалось', e);
        await bot.sendMessage(chatId, "Произошла ошибка. Попробуй ещё раз!");
    }

    await bot.setMyCommands([
            {command: '/start', description: 'Начальное приветствие'},
            {command: '/info', description: 'Информация о пользователе'},
            {command: '/game', description: 'Игра "Угадай число"'},
            {command: '/clear_results', description: 'Сбросить результаты'},
        ]
    )

    bot.on('message', async msg => {
        const chatId = msg.chat.id;
        const text = msg.text;

        const [user] = await userModel.findOrCreate({
            where: {
                chatId: chatId.toString()
            }
        });

        try {
            switch (text) {
                case '/start':
                    return bot.sendMessage(chatId, 'Привет 👀!');
                case '/info':
                    return bot.sendMessage(
                        chatId,
                        `Тебя зовут: ${msg.from.first_name} ${msg.from.last_name || ''}\n\n` +
                        `🏆 Правильных ответов: ${user.right}\n\n` +
                        `❌ Неправильных ответов: ${user.wrong}`,
                        { parse_mode: "Markdown" }
                    );                case '/game':
                    return await startGame(chatId);
                case '/clear_results':
                    await userModel.update({right: 0, wrong: 0}, {where: {chatId: chatId.toString()}});
                    return bot.sendMessage(chatId, 'Результаты игры сброшены.');
                default:
                    return bot.sendMessage(chatId, 'Я не понимаю эту команду 😒.');
            }
        } catch (e) {
            await bot.sendMessage(chatId, 'Произошла ошибка, попробуйте еще раз!');
        }
    })

    bot.on('callback_query', async msg => {
        const data = msg.data;
        const chatId = msg.message.chat.id;

        if (data === '/again') {
            delete chats[chatId];
            await startGame(chatId);
            return;
        }

        if (!(chatId in chats)) {
            await bot.sendMessage(chatId, 'Начни новую игру командой /game или нажатием на кнопку "Играть еще раз"!');
            return;
        }

        const user = await userModel.findOne({
            where: {
                chatId: chatId.toString()
            }
        });

        const isCorrect = Number(data) === chats[chatId];

        const resultMessage = isCorrect
            ? `🎉 Поздравляю! Ты угадал число ${chats[chatId]}`
            : `😢 К сожалению, ты не угадал. Бот загадал ${chats[chatId]}`;

        await userModel.update(
            {
                right: user.right + (isCorrect ? 1 : 0),
                wrong: user.wrong + (!isCorrect ? 1 : 0),
            },
            {where: {chatId: chatId.toString()}}
        );

        delete chats[chatId];

        await bot.sendMessage(chatId, resultMessage, againOptions);
    })
}

start();