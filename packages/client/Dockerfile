# Estágio de Build
FROM node:20-alpine AS builder
WORKDIR /app

# Instalar dependências de sistema
RUN apk add --no-cache openssl libc6-compat

# Copiar arquivos de configuração da RAIZ e de TODOS os pacotes
COPY package*.json ./
COPY tsconfig.base.json ./
COPY packages/client/package*.json ./packages/client/
COPY packages/server/package*.json ./packages/server/

# Instalação correta para Workspaces (isso instalará o Vite)
RUN npm install --include=dev

# Copiar o restante do código
COPY . .

# Executar o build usando o sistema de workspaces do NPM
# O nome 'client' deve bater com o "name" no package.json da pasta client
RUN npm run build --workspace=client

# Estágio de Produção com Nginx
FROM nginx:alpine
COPY --from=builder /app/packages/client/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
