# Utilisation de l'image officielle Node.js comme base
FROM node:18-alpine

# Définition du répertoire de travail dans le conteneur
WORKDIR /usr/src/app

# Copie des fichiers package.json et package-lock.json
COPY package*.json ./

# Installation des dépendances
RUN npm install

# Copie de tout le reste du code dans le conteneur
COPY . .

# Exposition du port sur lequel tourne l'application
EXPOSE 3000

# Lancement de l'application
CMD ["npm", "run", "start:dev"]
