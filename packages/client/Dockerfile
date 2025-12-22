# Estágio de Build
FROM node:20-alpine AS builder

WORKDIR /app

# Instalar dependências necessárias
RUN apk add --no-cache openssl libc6-compat

# 1. Copiar arquivos de configuração da RAIZ e de TODOS os pacotes
# Precisamos do package do server também para o NPM entender o workspace
COPY package*.json ./
COPY tsconfig.base.json ./
COPY packages/client/package*.json ./packages/client/
COPY packages/server/package*.json ./packages/server/

# 2. Instalar tudo na RAIZ (o npm resolve as dependências do workspace)
# Usamos --include=dev para garantir que o Vite seja instalado
RUN npm install --include=dev

# 3. Copiar o código de todo o repositório
COPY . .

# 4. Buildar usando o comando de workspace (Mais seguro que WORKDIR)
# Certifique-se que o "name" no package.json do cliente é "client"
RUN npm run build --workspace=client

# Estágio de Produção
FROM nginx:alpine
# Copia o resultado do build da subpasta correta
COPY --from=builder /app/packages/client/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
