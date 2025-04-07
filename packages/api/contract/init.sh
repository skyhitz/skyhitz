#!/bin/bash

set -e

NETWORK="$1"

CTR="contract-$NETWORK"

PATH=./target/bin:$PATH

cd ./contract

if [[ -f "./.vars/$CTR" ]]; then
  echo "Found existing contract directory; already initialized."
  exit 0
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

echo "Using $NETWORK network"
echo "  RPC URL: $SOROBAN_RPC_URL"
echo "  Friendbot URL: $FRIENDBOT_URL"

echo Add the $NETWORK network to cli client
stellar network add \
  --rpc-url "$SOROBAN_RPC_URL" \
  --network-passphrase "$SOROBAN_NETWORK_PASSPHRASE" "$NETWORK"

ARGS="--network $NETWORK --source $ISSUER_SEED --ignore-checks"

echo Install dependencies

yarn install

echo Build contracts

stellar contract build 

# echo Deploy the voting contracts
echo Deploy contract $CTR
  DEPLOYED_CTR_ID="$(
    stellar contract deploy $ARGS \
      --wasm ./target/wasm32-unknown-unknown/release/skyhitz.wasm
  )"
  echo "Contract deployed succesfully with ID: $DEPLOYED_CTR_ID"
  mkdir -p .vars
  echo -n "$DEPLOYED_CTR_ID" > .vars/$CTR

  mkdir -p client

  # we do not use bindings for now but they're sometimes useful - they contain a lot of code that interacts with blockchain
  # plus we may switch to using them one day
  # echo Build Bindings for $CTR
  stellar contract bindings typescript \
    --wasm ./target/wasm32-unknown-unknown/release/skyhitz.wasm \
    --output-dir ./client \
    --network $NETWORK \
    --overwrite

  cp ./client/src/index.ts ./client.ts

  rm -rf ./client
cd ../

