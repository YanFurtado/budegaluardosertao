# syntax=docker/dockerfile:1

# ---------- 1) Compila o site (Vite + React) ----------
FROM node:22-alpine AS build
WORKDIR /app

# Instala as dependências primeiro: esta camada fica em cache enquanto o package*.json não mudar.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
# Faz a checagem de tipos e gera a pasta dist/
RUN npm run build

# ---------- 2) Serve os arquivos prontos com nginx ----------
FROM nginx:1.27-alpine AS runtime

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q --spider http://127.0.0.1/healthz || exit 1

CMD ["nginx", "-g", "daemon off;"]
