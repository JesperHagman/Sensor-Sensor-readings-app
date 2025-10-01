# ---------- build the Angular app ----------
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# Build for production
RUN npm run build

# ---------- serve with nginx ----------
FROM nginx:1.25-alpine
# Copy our nginx config (this is the file that was missing)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# If your Angular output goes to dist/frontend/browser (Angular 17 default),
# keep the next line. If your build outputs to dist/frontend (no /browser),
# change the COPY to: COPY --from=build /app/dist/frontend /usr/share/nginx/html
COPY --from=build /app/dist/frontend/browser /usr/share/nginx/html

EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"]
