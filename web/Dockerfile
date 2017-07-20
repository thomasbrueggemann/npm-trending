FROM ubuntu:16.04
MAINTAINER Thomas Brüggemann <mail@thomasbrueggemann.com>
LABEL Description="npm-trending.com Website" Vendor="Thomas Brüggemann" Version="1.0.0"

# INSTALL DEPENDENCIES
RUN apt-get update -y && apt-get install -y curl
RUN curl -sL https://deb.nodesource.com/setup_6.x | bash -
RUN apt-get install -y nodejs

# DOWNLOAD CODE
COPY ./ /srv
WORKDIR /srv

EXPOSE 8732

RUN npm install
ENV PORT=8732
ENTRYPOINT exec npm start
