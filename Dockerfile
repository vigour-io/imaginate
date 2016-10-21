FROM node:6.3
LABEL name "imaginator"
RUN apt-get update && apt-get install libcairo2-dev && apt-get clean && rm -rf /var/lib/apt/lists/*
WORKDIR /var/git
RUN git clone https://github.com/vigour-io/imaginate.git
WORKDIR /var/git/imaginate
RUN npm i
ENV IMAGINATOR_PORT=3000
EXPOSE 3000
CMD ["npm", "start"]