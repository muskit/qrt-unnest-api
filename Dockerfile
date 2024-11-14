FROM node:18-buster

ARG FUNCTION_DIR=/app
WORKDIR ${FUNCTION_DIR}
ENV NODE_ENV=production

# add tailscale repo
RUN curl -fsSL https://pkgs.tailscale.com/stable/debian/buster.gpg | apt-key add -
RUN curl -fsSL https://pkgs.tailscale.com/stable/debian/buster.list | tee /etc/apt/sources.list.d/tailscale.list

# ensure packages are up to date
RUN apt-get update && apt-get upgrade -y

# aws-lambda-ric
RUN apt-get install -y \
    g++ \
    make \
    cmake \
    unzip \
    libcurl4-openssl-dev
RUN npm i aws-lambda-ric

# google chrome (+ fonts)
RUN apt-get install -y wget gnupg \
    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
    && apt-get update \
    && apt-get install -y google-chrome-stable fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf libxss1 \
        --no-install-recommends

# tailscale
RUN apt-get install -y tailscale

# clean apt caches
RUN rm -rf /var/lib/apt/lists/*
RUN rm -rf /var/cache/apt/archives/*

COPY package*.json ./
RUN npm ci

### AWS DEPLOYMENT ###
# Required for Node runtimes which use npm@8.6.0+ because
# by default npm writes logs under /home/.npm and Lambda fs is read-only
ENV NPM_CONFIG_CACHE=/tmp/.npm

EXPOSE 8080

COPY .env.prod ./
COPY bootstrap ./
COPY src ./src

ENV BROWSER_PATH=/usr/bin/google-chrome-stable
ENTRYPOINT ["./bootstrap"]
CMD ["lambda.handler"]