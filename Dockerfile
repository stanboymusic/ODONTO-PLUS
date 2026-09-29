FROM alpine:3.20
ARG PB_VERSION=0.39.10
RUN apk add --no-cache ca-certificates unzip wget \
 && wget -q "https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_amd64.zip" -O /tmp/pb.zip \
 && unzip /tmp/pb.zip -d /pb && rm /tmp/pb.zip && chmod +x /pb/pocketbase
COPY pb_migrations /pb/pb_migrations
COPY pb_public /pb/pb_public
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
EXPOSE 8080
CMD ["/entrypoint.sh"]
