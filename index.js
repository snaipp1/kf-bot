// @ts-nocheck
import "dotenv/config";
import fetch from "node-fetch";
import fs from "fs";

import { Bot, Keyboard, GrammyError, HttpError } from "grammy";
import { hydrateApi, hydrateContext } from "@grammyjs/hydrate";

const bot = new Bot(process.env.BOT_API_KEY ?? "");

bot.use(hydrateContext());
bot.api.config.use(hydrateApi());

bot.api.setMyCommands([
  { command: "start", description: "Запуск бота" },
  { command: "menu", description: "Завпуск меню" },
  { command: "my_id", description: "Узнать свой id" },
]);

bot.command("start", async (ctx) => {
  //   await ctx.react("");
  await ctx.reply("Привет! Я - бот Артамон 🤡");
});

bot.command("menu", async (ctx) => {
  const moodLabels = ["📈 Статистика", "👨🏻‍💻 Пользователи", "🔎 Запросы"];
  const rows = moodLabels.map((label) => {
    return [Keyboard.text(label)];
  });
  const keyboard = Keyboard.from(rows).resized();

  await ctx.reply("Выберите интересующий вас вопрос", {
    reply_markup: keyboard,
  });
});

bot.hears(/Статистика/, async (ctx) => {
  await ctx.replyWithPhoto(
    "https://www.zviazda.by/sites/default/files/styles/150x100/public/indeks.jpg",
    {
      caption: "🧮 Тут отображается статистика",
    }
  );
});
bot.hears(/Пользователи/, async (ctx) => {
  ctx.reply(
    `<b>Пользователи:</b> 
            👤 Пользователь 1 \n
            👤 Пользователь 2\n
            👤 Пользователь 3`,
    {
      parse_mode: "HTML",
    }
  );
});
bot.hears("/Статистика/", async (ctx) => {});

bot.on("message:document", async (ctx) => {
  const file = ctx.message.document;

  try {
    const fileInfo = await ctx.api.getFile(file.file_id);
    const fileUrl = `https://api.telegram.org/file/bot${process.env.BOAT_API_KEY}/${fileInfo.file_path}`;
    console.log("✅ Downloading file from:", fileUrl);

    const response = await fetch(fileUrl);
    const dest = fs.createWriteStream(`./downloads/${file.file_name}`);
    response.body.pipe(dest);

    dest.on("finish", () => {
      console.log(`✅ File saved: ./downloads/${file.file_name}`);
      ctx.reply(
        `Ваш файл сохранен как: <span class="tg-spoiler">✅ ${file.file_name}</span>`,
        {
          parse_mode: "HTML",
        }
      );
    });

    dest.on("error", (err) => {
      console.error("❌ Error saving file:", err);
      ctx.reply("❌ Произошла ошибка при сохранении файла.");
    });
  } catch (error) {
    console.error("❌ Error handling file:", error);
    ctx.reply("<b>❌ Произошла ошибка при сохранении файла.</b>", {
      parse_mode: "HTML",
    });
  }
});

bot.command("my_id", async (ctx) => {
  await ctx.reply(`Ваш id: ${ctx.from.id}`);
});

bot.on("msg").filter(
  (ctx) => {
    return ctx.from.id === 5911072379;
  },
  async (ctx) => {
    await ctx.reply("Приветствую, администратор!", {
      reply_parameters: { message_id: ctx.msg.message_id },
    });
  }
);

bot.on("message", async (ctx) => {
  await ctx.reply("Я чет не врубаюсь)) ...");
});

bot.catch((err) => {
  const ctx = err.ctx;
  console.error(`Error while handling update ${ctx.update.update_id}`);

  const error = err.error;
  if (error instanceof GrammyError) {
    console.error(`🤷🏻‍♂️ Error in reqquest: ${error.description}`);
  } else if (error instanceof HttpError) {
    console.error(`💀 Could not contact Telegram: ${error}`);
  } else {
    console.error(`👽 Unknown error: ${error}`);
  }
});

bot.start();
