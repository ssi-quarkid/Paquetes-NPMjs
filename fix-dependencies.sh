#!/bin/bash

# Script to replace @extrimian/* dependencies with @quarkid/* in all package.json files

set -e

echo "🔧 Fixing dependency references in package.json files..."

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PACKAGES_DIR="$SCRIPT_DIR/packages"

# Function to fix dependencies in a package.json file
fix_package_json() {
    local file="$1"
    echo "  Fixing: $file"
    
    # Create a backup
    cp "$file" "$file.backup"
    
    # Replace @extrimian/* with @quarkid/* in dependencies and peerDependencies
    # Use sed with different syntax for macOS
    sed -i '' 's/"@extrimian\/did-core"/"@quarkid\/did-core"/g' "$file"
    sed -i '' 's/"@extrimian\/did-registry"/"@quarkid\/did-registry"/g' "$file"
    sed -i '' 's/"@extrimian\/kms-core"/"@quarkid\/kms-core"/g' "$file"
    sed -i '' 's/"@extrimian\/kms-client"/"@quarkid\/kms-client"/g' "$file"
    sed -i '' 's/"@extrimian\/vc-core"/"@quarkid\/vc-core"/g' "$file"
    sed -i '' 's/"@extrimian\/agent"/"@quarkid\/agent"/g' "$file"
    
    # For local dependencies, use "*" as version to ensure local linking works
    sed -i '' 's/"@quarkid\/did-core": "[^"]*"/"@quarkid\/did-core": "*"/g' "$file"
    sed -i '' 's/"@quarkid\/did-registry": "[^"]*"/"@quarkid\/did-registry": "*"/g' "$file"
    sed -i '' 's/"@quarkid\/kms-core": "[^"]*"/"@quarkid\/kms-core": "*"/g' "$file"
    sed -i '' 's/"@quarkid\/kms-client": "[^"]*"/"@quarkid\/kms-client": "*"/g' "$file"
    sed -i '' 's/"@quarkid\/vc-core": "[^"]*"/"@quarkid\/vc-core": "*"/g' "$file"
    sed -i '' 's/"@quarkid\/agent": "[^"]*"/"@quarkid\/agent": "*"/g' "$file"
}

# Find all package.json files in the packages directory
echo "🔍 Finding all package.json files..."
find "$PACKAGES_DIR" -name "package.json" -type f | while read -r pkg_file; do
    fix_package_json "$pkg_file"
done

# Also fix the register app's package.json if it exists
REGISTER_PKG="$SCRIPT_DIR/register/back/package.json"
if [ -f "$REGISTER_PKG" ]; then
    echo "  Fixing register backend package.json"
    fix_package_json "$REGISTER_PKG"
fi

echo "✅ All package.json files have been updated!"
echo ""
echo "📝 Backup files created with .backup extension"
echo "💡 Now run the link-quarkid.sh script to build and link the packages"
