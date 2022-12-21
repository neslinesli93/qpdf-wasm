#!/bin/bash
set -euo pipefail

fn_git_clean() {
  git clean -xdf
  git checkout .
}

OUT_DIR="$PWD/out"
ROOT="$PWD"
EMCC_FLAGS_DEBUG="-Os -g3"
EMCC_FLAGS_RELEASE="-Oz -flto"

export CPPFLAGS="-I$OUT_DIR/include"
export LDFLAGS="-L$OUT_DIR/lib"
export PKG_CONFIG_PATH="$OUT_DIR/lib/pkgconfig"
export EM_PKG_CONFIG_PATH="$PKG_CONFIG_PATH"
export CFLAGS="$EMCC_FLAGS_RELEASE"
export CXXFLAGS="$CFLAGS"

mkdir -p "$OUT_DIR"

cd "$ROOT/lib/zlib"
fn_git_clean
emconfigure ./configure --prefix="$OUT_DIR" --static
emmake make -j install

cd "$ROOT/lib/jpeg-turbo"
fn_git_clean
patch -p1 < ../../patches/jpeg-turbo.patch
emcmake cmake . \
  -DCMAKE_INSTALL_PREFIX="$OUT_DIR" \
  -DENABLE_SHARED=off \
  -DWITH_SIMD=0 \
  -DCMAKE_BUILD_TYPE=Release \
  -DCMAKE_C_FLAGS="$CFLAGS"
emmake make -j install

cd "$ROOT/lib/qpdf"
fn_git_clean
emcmake cmake -S . -B build \
  -DCMAKE_INSTALL_PREFIX="$OUT_DIR" \
  -DRANDOM_DEVICE="/dev/random"

# `-j` needs to be adjusted manually
# setting to `nproc` crashes my system
cmake --build build -j 4

mkdir -p "$ROOT/dist"
emcc \
  $LDFLAGS \
  $CPPFLAGS \
  $CFLAGS \
  $CXXFLAGS \
  --closure 1 \
  --pre-js "$ROOT/js/pre.js" \
  --post-js "$ROOT/js/post.js" \
  -s WASM_BIGINT=1 \
  -s ALLOW_MEMORY_GROWTH=1 \
  -s EXPORTED_RUNTIME_METHODS='["callMain","FS","NODEFS","WORKERFS","ENV"]' \
  -s INCOMING_MODULE_JS_API='["noInitialRun","noFSInit","locateFile","preRun"]' \
  -s NO_DISABLE_EXCEPTION_CATCHING=1 \
  -s MODULARIZE=1 \
  -o "$ROOT/dist/qpdf.js" \
  "$ROOT/lib/qpdf/build/libqpdf/libqpdf.a" \
  "$ROOT/lib/qpdf/qpdf/qpdf.cc" \
  -I "$ROOT/lib/qpdf/include" \
  -lnodefs.js \
  -lworkerfs.js \
  -lz \
  -ljpeg

cp "$ROOT/js/qpdf.d.ts" "$ROOT/dist"
cp "$ROOT/package.json" "$ROOT/dist"
