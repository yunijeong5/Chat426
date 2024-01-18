# base image is nodejs
FROM node:alpine

# install pm2
RUN npm install -g pm2

# set working directory
WORKDIR /usr/app

COPY ./package.json ./
RUN npm install 

# Make sure to delete node_modules on host before building the image
COPY ./ ./

# expose the port where my app will run on
# EXPOSE 5001

# default command
CMD [ "npm", "run", "docker-start" ]

