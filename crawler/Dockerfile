FROM ubuntu:16.04
MAINTAINER Thomas Brüggemann <mail@thomasbrueggemann.com>
LABEL Description="npm-trending.com Crawler" Vendor="Thomas Brüggemann" Version="1.0.0"

# INSTALL DEPENDENCIES
RUN apt-get update -y && apt-get install -y curl
RUN curl -sL https://deb.nodesource.com/setup_6.x | bash -
RUN apt-get install -y nodejs

# DOWNLOAD CODE
COPY ./ /srv
WORKDIR /srv

RUN npm install
ENTRYPOINT exec npm start
