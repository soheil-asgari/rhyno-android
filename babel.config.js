// babel.config.js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'], // ۱. پریست اصلی برای Expo
    plugins: [
      // ۲. پلاگین برای خواندن متغیرها از .env
      [
        'module:react-native-dotenv',
        {
          moduleName: '@env',      // نامی که باهاش ایمپورت می‌کنید
          path: '.env',         // فایلی که ازش می‌خونید
          blacklist: null,
          whitelist: null,
          safe: false,
          allowUndefined: true,
        },
      ],
      // ۳. پلاگین Reanimated (اگر نصب دارید، حتما باید آخر باشه)
      'react-native-reanimated/plugin',
    ],
  };
};