#!/bin/bash

set -e

echo "🔧 Building contracts..."
cargo build --release --target wasm32-unknown-unknown

echo ""
echo "📝 Generating TypeScript bindings..."
stellar contract bindings typescript \
   --wasm ./target/wasm32-unknown-unknown/release/skyhitz.wasm \
   --output-dir ./client \
   --network mainnet \
   --overwrite

echo ""
echo "📝 Copying bindings to client.ts..."
cp ./client/src/index.ts ./client.ts

echo ""
echo "🧹 Cleaning up..."
rm -rf ./client

echo ""
echo "✅ Bindings generated successfully!"
echo ""
echo "ℹ️  Note: The bindings include types from both contracts:"
echo "   - HitzTokenDataKey: HITZ token storage keys"
echo "   - DataKey: Core contract storage keys"