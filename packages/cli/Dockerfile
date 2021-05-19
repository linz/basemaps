FROM osgeo/gdal:ubuntu-small-3.3.0

WORKDIR /usr/src/app

RUN curl -sL https://deb.nodesource.com/setup_14.x | bash - && apt-get install nodejs -y

COPY dist/* ./

ENTRYPOINT [ "node", "./index.js" ]
