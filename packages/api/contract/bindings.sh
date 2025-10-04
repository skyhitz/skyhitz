#!/bin/bash

set -e

CTR="contract-mainnet"

stellar contract bindings typescript \
   --wasm ./target/wasm32-unknown-unknown/release/skyhitz.wasm \
   --output-dir ./client \
   --network mainnet \
   --overwrite

cp ./client/src/index.ts ./client.ts

rm -rf ./client
