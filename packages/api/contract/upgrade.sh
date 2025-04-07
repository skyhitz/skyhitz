#!/bin/bash

set -e

NETWORK="$1"

CTR="contract-$NETWORK"

PATH=./target/bin:$PATH

cd ./contract

if [[ ! -f "./.vars/$CTR" ]]; then
    echo "Contract directory not found; please initialize first."
    exit 1
fi

FRIENDBOT_URL="https://friendbot.stellar.org"

if [[ "$NETWORK" == "testnet" ]]; then
  SOROBAN_RPC_URL="https://soroban-testnet.stellar.org:443"
  SOROBAN_NETWORK_PASSPHRASE="Test SDF Network ; September 2015"
  source ../.dev.vars
elif [[ "$NETWORK" == "mainnet" ]]; then
  SOROBAN_RPC_URL="https://soroban-rpc.mainnet.stellar.gateway.fm:443"
  SOROBAN_NETWORK_PASSPHRASE="Public Global Stellar Network ; September 2015"
fi

if [[ -z "$ISSUER_SEED" ]]; then
  echo "ISSUER_SEED is not defined. Exiting..."
  exit 1
fi

if [[ "$NETWORK" == "testnet" ]]; then
  echo Fund issuer account from friendbot
  curl --silent -X POST "$FRIENDBOT_URL?addr=$ISSUER_ID" >/dev/null
fi

stellar network add \
  --rpc-url "$SOROBAN_RPC_URL" \
  --network-passphrase "$SOROBAN_NETWORK_PASSPHRASE" "$NETWORK"

ARGS="--network $NETWORK --source $ISSUER_SEED"

stellar contract build 

WASM_ID="$(
    stellar contract install --ignore-checks $ARGS \
      --wasm ./target/wasm32-unknown-unknown/release/skyhitz.wasm
)"

echo -n "$WASM_ID" > .vars/wasm-id

echo "Installed contract with wasm ID $WASM_ID"

mkdir -p client

stellar contract bindings typescript \
  --wasm ./target/wasm32-unknown-unknown/release/skyhitz.wasm \
  --output-dir ./client \
  --network $NETWORK \
  --overwrite

cp ./client/src/index.ts ./client.ts

rm -rf ./client

stellar contract invoke $ARGS \
  --id $(cat ./.vars/$CTR) \
  -- \
  upgrade \
  --new_wasm_hash $WASM_ID

stellar contract invoke $ARGS \
  --id $(cat ./.vars/$CTR) \
  -- \
  version