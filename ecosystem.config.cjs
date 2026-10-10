// PM2 — frontend Next.js (next start).
// Chạy từ thư mục frontend trên VPS:  pm2 start ecosystem.config.cjs
// LƯU Ý: các biến NEXT_PUBLIC_* được NHÚNG LÚC `next build`, không phải lúc chạy.
// Vì vậy phải đặt chúng trong frontend/.env.local TRƯỚC khi build (xem runbook).
module.exports = {
  apps: [
    {
      name: 'snake-web',
      cwd: __dirname,
      // Gọi thẳng binary của Next để PM2 quản lý ổn định (tránh wrap qua npm).
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3000',
      exec_mode: 'fork',
      instances: 1,
      autorestart: true,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: '3000',
      },
    },
  ],
};
