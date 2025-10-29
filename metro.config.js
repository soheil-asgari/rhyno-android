// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// اگر تنظیمات سفارشی دیگه‌ای (مثلاً برای SVG) دارید، می‌تونید اینجا اضافه کنید
// در غیر این صورت، همین کافیه

module.exports = config;