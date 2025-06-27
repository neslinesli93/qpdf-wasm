FROM emscripten/emsdk:3.1.74 AS qpdf

RUN apt update && \
    apt install -y autoconf git pkg-config

WORKDIR /src

COPY shallow-clone.sh /usr/local/bin

RUN shallow-clone.sh https://github.com/madler/zlib.git /src/lib/zlib 21767c654d31d2dccdde4330529775c6c5fd5389
RUN shallow-clone.sh https://github.com/ImageMagick/jpeg-turbo.git /src/lib/jpeg-turbo 7aa2a898c564041a24b09d0a6e780aaa632d08d3

# qpdf version 12.2.0
RUN shallow-clone.sh https://github.com/qpdf/qpdf.git /src/lib/qpdf 856d32c610334855d30e96d25eb5f9636fb62f08

# first, copy files that are needed for the emscripten build, and
# that would require a full recompile if they changed
COPY js js
COPY patches patches
COPY build.sh build.sh

RUN ./build.sh

# then copy files needed only for the final NPM package,
# so the expensive previous layer is cached
COPY types/qpdf.d.ts dist/qpdf.d.ts

FROM node:22

COPY --from=qpdf /src/dist /opt/qpdf
COPY entrypoint.sh /usr/local/bin

USER node

WORKDIR /src

ENTRYPOINT ["entrypoint.sh"]
