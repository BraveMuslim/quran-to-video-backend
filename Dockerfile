FROM node:18

# Install FFmpeg
RUN apt-get update && apt-get install -y ffmpeg

WORKDIR /app

COPY package.json .
COPY server.js .

RUN npm install

EXPOSE 10000

CMD ["node", "server.js"]
