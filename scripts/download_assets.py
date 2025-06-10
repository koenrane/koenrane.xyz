#!/usr/bin/env python3
"""
Created by: Koen Rane
Date: 10-06-2025
Script to download all assets from assets.turntrout.com referenced in the codebase.
Created to migrate to a new CDN/hosting for koenrane.xyz.
"""

import os
import re
import requests
import time
from pathlib import Path
from urllib.parse import urlparse, unquote
from typing import Set, List
import argparse

# Base URL for assets
ASSET_BASE_URL = "https://assets.turntrout.com"

def find_asset_urls(directory: str = ".") -> Set[str]:
    """Scan the codebase for all assets.turntrout.com URLs."""
    asset_urls = set()
    
    # File extensions to scan
    extensions = {'.ts', '.tsx', '.js', '.jsx', '.scss', '.css', '.md', '.py', '.fish', '.json', '.txt', '.html'}
    
    for root, dirs, files in os.walk(directory):
        # Skip node_modules and other unnecessary directories
        dirs[:] = [d for d in dirs if d not in {'.git', 'node_modules', '.next', 'dist', 'build'}]
        
        for file in files:
            if any(file.endswith(ext) for ext in extensions):
                file_path = os.path.join(root, file)
                try:
                    with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                        content = f.read()
                        # Find all assets.turntrout.com URLs
                        urls = re.findall(r'https://assets\.turntrout\.com[^\s\'"<>)]*', content)
                        asset_urls.update(urls)
                except Exception as e:
                    print(f"Error reading {file_path}: {e}")
    
    return asset_urls

def create_local_path(url: str, base_dir: str = "downloaded_assets") -> str:
    """Convert asset URL to local file path."""
    parsed = urlparse(url)
    # Remove leading slash and decode URL encoding
    path = unquote(parsed.path.lstrip('/'))
    return os.path.join(base_dir, path)

def download_asset(url: str, local_path: str, session: requests.Session) -> bool:
    """Download a single asset."""
    try:
        # Create directory if it doesn't exist
        os.makedirs(os.path.dirname(local_path), exist_ok=True)
        
        # Skip if file already exists
        if os.path.exists(local_path):
            print(f"✓ Already exists: {local_path}")
            return True
        
        print(f"Downloading: {url}")
        response = session.get(url, timeout=30)
        response.raise_for_status()
        
        with open(local_path, 'wb') as f:
            f.write(response.content)
        
        print(f"✓ Downloaded: {local_path}")
        return True
        
    except requests.exceptions.RequestException as e:
        print(f"✗ Failed to download {url}: {e}")
        return False
    except Exception as e:
        print(f"✗ Error saving {local_path}: {e}")
        return False

def main():
    parser = argparse.ArgumentParser(description='Download all assets from assets.turntrout.com')
    parser.add_argument('--output-dir', default='downloaded_assets', 
                       help='Directory to save downloaded assets (default: downloaded_assets)')
    parser.add_argument('--delay', type=float, default=0.5,
                       help='Delay between downloads in seconds (default: 0.5)')
    parser.add_argument('--dry-run', action='store_true',
                       help='Only list URLs without downloading')
    
    args = parser.parse_args()
    
    print("🔍 Scanning codebase for asset URLs...")
    asset_urls = find_asset_urls()
    
    print(f"\n📋 Found {len(asset_urls)} unique asset URLs:")
    for url in sorted(asset_urls):
        print(f"  {url}")
    
    if args.dry_run:
        print("\n🏃 Dry run mode - no files downloaded")
        return
    
    print(f"\n📥 Starting download to {args.output_dir}/...")
    
    # Create session for connection reuse
    session = requests.Session()
    session.headers.update({
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    })
    
    successful = 0
    failed = 0
    
    for url in sorted(asset_urls):
        local_path = create_local_path(url, args.output_dir)
        
        if download_asset(url, local_path, session):
            successful += 1
        else:
            failed += 1
        
        # Rate limiting
        time.sleep(args.delay)
    
    print(f"\n✅ Download complete!")
    print(f"   Successful: {successful}")
    print(f"   Failed: {failed}")
    print(f"   Total: {len(asset_urls)}")
    
    if successful > 0:
        print(f"\n📁 Assets downloaded to: {os.path.abspath(args.output_dir)}/")
        print("💡 Next steps:")
        print("   1. Upload these assets to your CDN/hosting")
        print("   2. Run the URL replacement script to update references")

if __name__ == "__main__":
    main() 