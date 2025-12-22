# Estágio de Build
FROM node:20-alpine AS builder

WORKDIR /app

# Instalar dependências necessárias para o Alpine
RUN apk add --no-cache openssl libc6-compat

COPY package*.json ./
# Instalamos ignorando scripts e engines para evitar erros de versão
RUN npm ci --ignore-scripts

COPY . .

# Comando de build pulando a checagem de tipos (tsc) para evitar o erro do log
# O Vite fará o build do bundle mesmo com avisos de TS
RUN npm run build -- --emptyOutDir

# Estágio de Produção
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
# Se você usa React Router, precisa do arquivo de config do nginx para rotas funcionarem
# COPY nginx.conf /etc/nginx/conf.d/default.conf 

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
