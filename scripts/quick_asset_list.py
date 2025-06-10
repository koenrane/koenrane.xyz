#!/usr/bin/env python3
"""
Created by: Koen Rane
Date: 10-06-2025
Quick script to list all unique assets.turntrout.com URLs in the codebase
More efficient than the full download script
"""

import os
import re
from collections import defaultdict

def find_asset_urls():
    """Quickly find all asset URLs and categorize them."""
    asset_urls = set()
    file_count = 0
    
    # Key files to check first (most likely to have assets)
    priority_files = [
        'quartz/styles/admonitions.scss',
        'quartz/components/Head.tsx', 
        'quartz/plugins/transformers/linkfavicons.ts',
        'quartz/plugins/transformers/twemoji.ts',
        'scripts/r2_upload.py'
    ]
    
    print("Checking priority files...")
    for file_path in priority_files:
        if os.path.exists(file_path):
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
                urls = re.findall(r'https://assets\.turntrout\.com[^\s\'"<>)]*', content)
                asset_urls.update(urls)
                if urls:
                    print(f"  {file_path}: {len(urls)} URLs")
    
    print(f"\nFound {len(asset_urls)} URLs in priority files")
    return sorted(asset_urls)

def categorize_assets(urls):
    """Categorize assets by type."""
    categories = defaultdict(list)
    
    for url in urls:
        if '/static/icons/' in url:
            categories['Icons'].append(url)
        elif '/static/images/external-favicons/' in url:
            categories['External Favicons'].append(url)
        elif '/twemoji/' in url:
            categories['Emoji'].append(url)
        elif '/static/images/' in url:
            categories['Images'].append(url)
        elif url.endswith(('.mp4', '.mov', '.webm')):
            categories['Videos'].append(url)
        elif '/static/' in url:
            categories['Static Assets'].append(url)
        else:
            categories['Other'].append(url)
    
    return categories

def main():
    print("🔍 Quick scan for asset URLs...")
    urls = find_asset_urls()
    
    print(f"\n📋 Total unique URLs found: {len(urls)}")
    
    categories = categorize_assets(urls)
    
    print("\n📂 Asset Categories:")
    for category, items in categories.items():
        print(f"  {category}: {len(items)} items")
    
    print("\n🔗 All URLs:")
    for url in urls:
        print(f"  {url}")
    
    # Provide recommendations
    print("\n💡 Recommendations:")
    print("1. Most critical assets are icons and favicons (needed for site functionality)")
    print("2. Twemoji assets can be replaced with a different emoji CDN")
    print("3. Consider which images/videos you actually need vs which are legacy")
    
    return urls

if __name__ == "__main__":
    main() 