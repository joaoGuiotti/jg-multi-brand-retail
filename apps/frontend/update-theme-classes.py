import re
import os
from pathlib import Path

# Mapeamento de substituições
replacements = {
    # Backgrounds
    r'\bbg-white\b': 'bg-surface',
    r'\bbg-gray-50\b': 'bg-surface-secondary',
    r'\bbg-gray-100\b': 'bg-surface-tertiary',
    r'\bhover:bg-gray-100\b': 'hover:bg-surface-hover',
    r'\bhover:bg-gray-50\b': 'hover:bg-surface-hover',
    
    # Text
    r'\btext-gray-900\b': 'text-content',
    r'\btext-gray-800\b': 'text-content',
    r'\btext-gray-700\b': 'text-content-secondary',
    r'\btext-gray-600\b': 'text-content-secondary',
    r'\btext-gray-500\b': 'text-content-secondary',
    r'\btext-gray-400\b': 'text-content-tertiary',
    
    # Borders
    r'\bborder-gray-200\b': 'border-outline',
    r'\bborder-gray-300\b': 'border-outline-hover',
    r'\bdivide-gray-200\b': 'divide-outline',
}

def update_file(file_path):
    """Update a single file with theme classes"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_content = content
    
    # Apply all replacements
    for pattern, replacement in replacements.items():
        content = re.sub(pattern, replacement, content)
    
    # Only write if changed
    if content != original_content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False

def main():
    # Base directory
    base_dir = Path(r'c:\DEV\github\antigravity-test-app-01\apps\frontend\src\app')
    
    # Find all HTML files
    html_files = list(base_dir.rglob('*.html'))
    
    updated_count = 0
    for html_file in html_files:
        # Skip already updated files
        if 'header' in str(html_file) or 'sidebar' in str(html_file):
            continue
            
        if update_file(html_file):
            print(f'Updated: {html_file.relative_to(base_dir)}')
            updated_count += 1
    
    print(f'\nTotal files updated: {updated_count}')

if __name__ == '__main__':
    main()
