#!/bin/bash

# Script to fix import statements in TypeScript files
# Replaces @extrimian/* imports with @quarkid/* imports

echo "🔧 Fixing import statements in TypeScript files..."

# Find all TypeScript files and fix imports
find /Users/jake/Desktop/blockmed-demo/Paquetes-NPMjs/packages -name "*.ts" -type f | while read -r file; do
    # Check if file contains @extrimian imports
    if grep -q "@extrimian/" "$file"; then
        echo "  Fixing imports in: $file"
        
        # Create a backup
        cp "$file" "$file.backup"
        
        # Replace @extrimian/kms-core with @quarkid/kms-core
        sed -i '' 's/@extrimian\/kms-core/@quarkid\/kms-core/g' "$file"
        
        # Replace @extrimian/kms-client with @quarkid/kms-client
        sed -i '' 's/@extrimian\/kms-client/@quarkid\/kms-client/g' "$file"
        
        # Replace @extrimian/did-core with @quarkid/did-core
        sed -i '' 's/@extrimian\/did-core/@quarkid\/did-core/g' "$file"
        
        # Replace @extrimian/did-registry with @quarkid/did-registry
        sed -i '' 's/@extrimian\/did-registry/@quarkid\/did-registry/g' "$file"
        
        # Replace @extrimian/vc-core with @quarkid/vc-core
        sed -i '' 's/@extrimian\/vc-core/@quarkid\/vc-core/g' "$file"
        
        # Replace @extrimian/agent with @quarkid/agent
        sed -i '' 's/@extrimian\/agent/@quarkid\/agent/g' "$file"
    fi
done

echo "✅ All TypeScript import statements have been updated!"
echo "📝 Backup files created with .backup extension"
