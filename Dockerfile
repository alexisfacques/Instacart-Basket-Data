FROM nbgallery/jupyter-alpine

# Create app directory
WORKDIR /usr/src/app

# Installing curl
RUN apk --update add curl && \
    rm -rf /var/cache/apk/*

# Installing unzip
RUN apk --update add p7zip

# Installing Java 1.7
RUN apk --update add openjdk7-jre

# Installing node & npm
RUN apk --update add nodejs

# Installing TypeScript Kernel for Jupyter
RUN npm install -g itypescript && \
    its --ts-install=global

# Jupyter configuration (password: dmv)
COPY ./jupyter/jupyter_notebook_config.json /root/.jupyter/jupyter_notebook_config.json

# Downloading spmf Java library
RUN curl -o spmf.jar http://www.philippe-fournier-viger.com/spmf/spmf.jar

# Install app dependencies
COPY package.json .
COPY tsconfig.json .

RUN npm install

# Bundle app sources
COPY ./output ./
COPY ./src ./src
COPY notebook.ipynb .

RUN npm run tsc

# Jupyter notebook server
EXPOSE 9999

CMD npm run jupyter
