FROM node:20

ARG BACKEND_URL=http://backend:4000
ENV BACKEND_URL=${BACKEND_URL}

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start"]
