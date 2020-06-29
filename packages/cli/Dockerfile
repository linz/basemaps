FROM osgeo/gdal:ubuntu-small-latest

WORKDIR /usr/src/app

RUN curl -sL https://deb.nodesource.com/setup_12.x | bash - && apt-get install nodejs -y

COPY dist/* ./

ENTRYPOINT [ "node", "./index.js" ]
