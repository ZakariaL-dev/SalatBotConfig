const TelegramBot = require("node-telegram-bot-api");
const axios = require("axios");
const cron = require("node-cron");

const TOKEN = process.env.BOT_TOKEN;
const bot = new TelegramBot(TOKEN, {
  polling: {
    interval: 300,
    autoStart: true,
    params: {
      timeout: 10,
    },
  },
});
const MY_CHAT_ID = process.env.MY_CHAT_ID; // الـ ID الخاص بك

async function getPrayerTimes() {
  try {
    const response = await axios.get(
      "http://api.aladhan.com/v1/timingsByCity",
      {
        params: { city: "Algiers", country: "Algeria", method: 3 },
      },
    );
    return response.data.data.timings;
  } catch (error) {
    return null;
  }
}

// 1. تذكير يومي على الساعة 08:00 صباحاً
cron.schedule("0 8 * * *", async () => {
  const timings = await getPrayerTimes();
  if (timings) {
    bot.sendMessage(
      MY_CHAT_ID,
      `🌅 *أوقات الصلاة لليوم (الجزائر العاصمة):*\n` +
        `الفجر: ${timings.Fajr}\nالظهر: ${timings.Dhuhr}\nالعصر: ${timings.Asr}\nالمغرب: ${timings.Maghrib}\nالعشاء: ${timings.Isha}`,
      { parse_mode: "Markdown" },
    );
  }
});

// 2. تنبيه عند دخول وقت كل صلاة (يتحقق كل دقيقة)
cron.schedule("* * * * *", async () => {
  const timings = await getPrayerTimes();
  if (!timings) return;

  const now = new Date();
  const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  const prayers = [
    { name: "الفجر", time: timings.Fajr },
    { name: "الظهر", time: timings.Dhuhr },
    { name: "العصر", time: timings.Asr },
    { name: "المغرب", time: timings.Maghrib },
    { name: "العشاء", time: timings.Isha },
  ];

  prayers.forEach((prayer) => {
    if (prayer.time === currentTime) {
      bot.sendMessage(MY_CHAT_ID, `📢 *حان الآن وقت صلاة ${prayer.name}*`);
    }
  });
});

bot.onText(/\/start/, (msg) =>
  bot.sendMessage(msg.chat.id, "مرحبا! البوت شغال وسيقوم بتنبيهك عند كل صلاة."),
);
bot.onText(/\/prayers/, async (msg) => {
  const timings = await getPrayerTimes();
  if (timings) {
    bot.sendMessage(
      msg.chat.id,
      `🕌 أوقات اليوم:\nالفجر: ${timings.Fajr}\nالظهر: ${timings.Dhuhr}\nالعصر: ${timings.Asr}\nالمغرب: ${timings.Maghrib}\nالعشاء: ${timings.Isha}`,
    );
  }
});

console.log("The bot is currently working and monitoring prayer times...");

const express = require("express");
const app = express();
app.get("/", (req, res) => res.send("Bot is running!"));
app.listen(process.env.PORT || 3000);
