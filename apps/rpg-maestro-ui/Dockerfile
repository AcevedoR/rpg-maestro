FROM nginx
RUN rm /etc/nginx/conf.d/default.conf
COPY ./apps/rpg-maestro-ui/nginx.conf /etc/nginx/conf.d
COPY ./dist/apps/rpg-maestro-ui/ /usr/share/nginx/html/

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]