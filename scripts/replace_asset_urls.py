#!/usr/bin/env python3
"""
Created by: Koen Rane
Date: 10-06-2025
Script to replace all assets.turntrout.com URLs with new CDN URLs.
Run this after uploading assets to new hosting.
"""

import os
import re
import argparse
from typing import Dict, List

def find_and_replace_urls(directory: str, old_base: str, new_base: str, dry_run: bool = False) -> Dict[str, int]:
    """Find and replace asset URLs in all relevant files."""
    
    # File extensions to process
    extensions = {'.ts', '.tsx', '.js', '.jsx', '.scss', '.css', '.md', '.py', '.fish', '.json', '.txt', '.html'}
    
    results = {}
    total_replacements = 0
    
    for root, dirs, files in os.walk(directory):
        # Skip unnecessary directories
        dirs[:] = [d for d in dirs if d not in {'.git', 'node_modules', '.next', 'dist', 'build', 'downloaded_assets'}]
        
        for file in files:
            if any(file.endswith(ext) for ext in extensions):
                file_path = os.path.join(root, file)
                
                try:
                    with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                        content = f.read()
                    
                    # Replace URLs
                    new_content = content.replace(old_base, new_base)
                    replacements = content.count(old_base)
                    
                    if replacements > 0:
                        results[file_path] = replacements
                        total_replacements += replacements
                        
                        if not dry_run:
                            with open(file_path, 'w', encoding='utf-8') as f:
                                f.write(new_content)
                            print(f"✓ Updated {file_path}: {replacements} replacements")
                        else:
                            print(f"📝 Would update {file_path}: {replacements} replacements")
                            
                except Exception as e:
                    print(f"Error processing {file_path}: {e}")
    
    return results, total_replacements

def main():
    parser = argparse.ArgumentParser(description='Replace assets.turntrout.com URLs with your CDN')
    parser.add_argument('new_base_url', 
                       help='Your new base URL (e.g., https://cdn.yoursite.com)')
    parser.add_argument('--old-base-url', default='https://assets.turntrout.com',
                       help='Old base URL to replace (default: https://assets.turntrout.com)')
    parser.add_argument('--dry-run', action='store_true',
                       help='Show what would be replaced without making changes')
    
    args = parser.parse_args()
    
    # Ensure new URL doesn't end with slash
    new_base = args.new_base_url.rstrip('/')
    old_base = args.old_base_url.rstrip('/')
    
    print(f"🔄 {'Simulating' if args.dry_run else 'Replacing'} URLs...")
    print(f"   From: {old_base}")
    print(f"   To:   {new_base}")
    print()
    
    results, total = find_and_replace_urls(".", old_base, new_base, args.dry_run)
    
    print(f"\n📊 Summary:")
    print(f"   Files affected: {len(results)}")
    print(f"   Total replacements: {total}")
    
    if args.dry_run:
        print(f"\n🏃 Dry run complete - no files were modified")
        print(f"   Run without --dry-run to apply changes")
    else:
        print(f"\n✅ URL replacement complete!")
        
    if len(results) > 0:
        print(f"\n📁 Files modified:")
        for file_path, count in results.items():
            print(f"   {file_path}: {count} replacements")

if __name__ == "__main__":
    main() 