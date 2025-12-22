# Estágio de Build
FROM node:20-alpine AS builder

WORKDIR /app

# Instalar dependências necessárias
RUN apk add --no-cache openssl libc6-compat

# 1. Copiar arquivos de configuração da RAIZ
COPY package*.json ./
COPY tsconfig.base.json ./

# 2. Copiar arquivos específicos do CLIENT
COPY packages/client/package*.json ./packages/client/

# 3. Instalar tudo (o npm resolve as dependências do workspace)
RUN npm install

# 4. Copiar o código de todo o repositório
COPY . .

# 5. Entrar na pasta do cliente e buildar
WORKDIR /app/packages/client
RUN npm run build

# Estágio de Produção
FROM nginx:alpine
# Copia o resultado do build da subpasta para o Nginx
COPY --from=builder /app/packages/client/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
