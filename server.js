const express = require("express");
const fs = require("fs/promises");
const path = require("path");
const bcrypt = require("bcrypt");
const session = require("express-session");

const app = express();
app.use(express.json());

// Session configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET || "your-secret-key-change-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Set to true if using HTTPS
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);

const usersFile = path.resolve("./users.json");
const messagesFile = path.resolve("./messages.json");

async function readJSON(file) {
  try {
    const data = await fs.readFile(file, "utf-8");
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function writeJSON(file, data) {
  try {
    await fs.writeFile(file, JSON.stringify(data, null, 2), "utf-8");
  } catch (error) {
    console.error(`Error writing to ${file}:`, error);
    throw error;
  }
}

// Authentication middleware
function requireAuth(req, res, next) {
  if (req.session && req.session.userId) {
    return next();
  }
  return res.status(401).json({ error: "لطفاً ابتدا وارد شوید." });
}

// ثبت‌نام
app.post("/api/register", async (req, res) => {
  const { username, password } = req.body;

  if (typeof username !== "string" || username.trim() === "") {
    return res.status(400).json({ error: "نام کاربری معتبر نیست." });
  }
  if (typeof password !== "string" || password.length < 8) {
    return res.status(400).json({ error: "رمز عبور باید حداقل 8 کاراکتر باشد." });
  }

  const users = await readJSON(usersFile);
  if (users.find(u => u.username === username)) {
    return res.status(409).json({ error: "این نام کاربری قبلاً ثبت شده است." });
  }

  try {
    const hashed = await bcrypt.hash(password, 10);
    const userId = Date.now();
    users.push({ id: userId, username, password: hashed });
    await writeJSON(usersFile, users);

    res.json({ message: "ثبت‌نام با موفقیت انجام شد." });
  } catch (error) {
    console.error("Registration error:", error);
    return res.status(500).json({ error: "خطا در ثبت‌نام. لطفاً دوباره تلاش کنید." });
  }
});

// ورود
app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "نام کاربری و رمز عبور باید وارد شود." });
  }

  const users = await readJSON(usersFile);
  const user = users.find(u => u.username === username);

  if (!user) {
    return res.status(401).json({ error: "نام کاربری یا رمز عبور اشتباه است." });
  }

  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    return res.status(401).json({ error: "نام کاربری یا رمز عبور اشتباه است." });
  }

  // Create session
  req.session.userId = user.id;
  req.session.username = user.username;

  res.json({
    message: "ورود با موفقیت انجام شد.",
    user: { id: user.id, username: user.username },
  });
});

// Logout endpoint
app.post("/api/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: "خطا در خروج از سیستم." });
    }
    res.clearCookie("connect.sid");
    res.json({ message: "خروج با موفقیت انجام شد." });
  });
});

// Get current user
app.get("/api/user", (req, res) => {
  if (req.session && req.session.userId) {
    return res.json({
      authenticated: true,
      user: {
        id: req.session.userId,
        username: req.session.username,
      },
    });
  }
  return res.json({ authenticated: false });
});

// دریافت پیام‌ها
app.get("/api/messages", async (req, res) => {
  const messages = await readJSON(messagesFile);
  
  // If user is logged in, return only their messages
  // If not logged in (admin viewing all), return all messages
  if (req.session && req.session.userId) {
    const userMessages = messages.filter(m => m.userId === req.session.userId);
    return res.json(userMessages);
  }
  
  // For admin or unauthenticated requests, return all messages
  res.json(messages);
});

// ارسال پیام کاربر
app.post("/api/messages", requireAuth, async (req, res) => {
  const { userMessage } = req.body;
  if (typeof userMessage !== "string" || userMessage.trim() === "") {
    return res.status(400).json({ error: "متن پیام نامعتبر است." });
  }
  
  // User must be logged in (requireAuth ensures this)
  const userId = req.session.userId;
  const username = req.session.username;
  
  const messages = await readJSON(messagesFile);
  messages.push({
    id: Date.now(),
    userId: userId,
    username: username,
    userMessage: userMessage.trim(),
    adminReply: null,
  });
  await writeJSON(messagesFile, messages);
  res.status(201).json({ message: "پیام با موفقیت ارسال شد." });
});

// پاسخ ادمین
app.post("/api/messages/reply", async (req, res) => {
  const { id, reply } = req.body;
  if (typeof id !== "number" && typeof id !== "string") {
    return res.status(400).json({ error: "شناسه پیام نامعتبر است." });
  }
  if (typeof reply !== "string" || reply.trim() === "") {
    return res.status(400).json({ error: "پاسخ نمی‌تواند خالی باشد." });
  }
  const messages = await readJSON(messagesFile);
  const msg = messages.find(m => m.id == id);
  if (!msg) {
    return res.status(404).json({ error: "پیام مورد نظر پیدا نشد." });
  }
  msg.adminReply = reply.trim();
  await writeJSON(messagesFile, messages);
  res.json({ message: "پاسخ با موفقیت ثبت شد." });
});

// سرو فایل‌های ایستا مثل HTML/CSS/JS
app.use(express.static("public"));

// اجرای سرور
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
