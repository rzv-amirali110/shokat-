FROM node:22-alpine

WORKDIR /usr/src/app

# نصب ابزارهای مورد نیاز برای کامپایل و اجرای SQLite و Prisma
RUN apk add --no-cache openssl python3 make g++

COPY package*.json ./
COPY prisma ./prisma/

RUN npm config set registry http://nexus.ir:8081/repository/npm_rub/ --global 
RUN npm ci

COPY . .

# فقط تولید Prisma Client در زمان بیلد
RUN npx prisma generate

EXPOSE 3000

# ساخت اسکیما و جداول روی dev.db در زمان روشن شدن و سپس اجرای پروژه
CMD ["sh", "-c", "npx prisma db push && npm start"]