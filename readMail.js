const { google } = require("googleapis");
const analyzeEmails = require("./summarize");
const axios = require("axios");
const cron = require("node-cron");

// ✅ 从环境变量读取 Telegram 信息
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

// ✅ 从环境变量读取 Gmail 凭证
const credentials = JSON.parse(process.env.GMAIL_CREDENTIALS);
const token = JSON.parse(process.env.GMAIL_TOKEN);

// 初始化 OAuth2
const { client_secret, client_id, redirect_uris } = credentials.installed;

const oAuth2Client = new google.auth.OAuth2(
  client_id,
  client_secret,
  redirect_uris[0]
);

oAuth2Client.setCredentials(token);

// 发送 Telegram 消息
async function sendTelegram(message) {
  await axios.post(
    `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`,
    {
      chat_id: CHAT_ID,
      text: message,
    }
  );
}

async function listEmails() {
  try {
    const gmail = google.gmail({ version: "v1", auth: oAuth2Client });

    const res = await gmail.users.messages.list({
      userId: "me",
      maxResults: 5,
      q: "is:unread",
    });

    const messages = res.data.messages || [];

    if (messages.length === 0) {
      console.log("No unread emails.");
      return;
    }

    let emailText = "";

    for (let msg of messages) {
      const msgData = await gmail.users.messages.get({
        userId: "me",
        id: msg.id,
      });

      const headers = msgData.data.payload.headers;
      const subject =
        headers.find(h => h.name === "Subject")?.value || "No Subject";
      const from =
        headers.find(h => h.name === "From")?.value || "Unknown Sender";

      emailText += `From: ${from}\nSubject: ${subject}\n\n`;

      // 自动标记为已读
      await gmail.users.messages.modify({
        userId: "me",
        id: msg.id,
        requestBody: {
          removeLabelIds: ["UNREAD"],
        },
      });
    }

    const analysis = await analyzeEmails(emailText);

    const finalMessage = `📬 Morning AI Email Report\n\n${analysis}`;

    await sendTelegram(finalMessage);

    console.log("AI report sent to Telegram.");
  } catch (error) {
    console.error("Error:", error.message);
  }
}

// 每天早上 8:00 运行（服务器时间）
cron.schedule("0 8 * * *", () => {
  console.log("Running morning AI email agent...");
  listEmails();
});

// 启动时立即运行一次
listEmails();