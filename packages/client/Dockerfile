# Estágio de Build
FROM node:20-alpine AS builder

WORKDIR /app

# Instalar dependências necessárias
RUN apk add --no-cache openssl libc6-compat

# COPIAR ARQUIVOS DA RAIZ (Necessário para o TS e para as dependências)
COPY package*.json ./
COPY tsconfig.base.json ./

# COPIAR ARQUIVOS DO CLIENTE
COPY packages/client/package*.json ./packages/client/

# Instalar dependências (na raiz ou na subpasta conforme seu setup)
RUN npm install

# Copiar o restante do código
COPY . .

# EXECUTAR O BUILD APONTANDO PARA A PASTA CORRETA
# Ajustamos o WORKDIR temporariamente para rodar o build do cliente
WORKDIR /app/packages/client
RUN npm run build

# Estágio de Produção com Nginx
FROM nginx:alpine
# O caminho aqui deve bater com onde o Vite gera os arquivos (geralmente dist)
COPY --from=builder /app/packages/client/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
