import os
import re

directory = 'backend/alpha_metal'

replacements = [
    (r'\bQiskit Metal\b', 'Alpha Paradox'),
    (r'\bqiskit_metal\b', 'alpha_metal'),
    (r'\bQiskit\b', 'Alpha'),
    (r'\bqiskit\b', 'alpha'),
    (r'\bIBM\b', 'Alpha'),
    (r'\bibm\b', 'alpha'),
    (r'\bMetal\b', 'Alpha'),
    (r'\bmetal\b', 'alpha')
]

for root, dirs, files in os.walk(directory):
    for file in files:
        if not file.endswith(('.py', '.json', '.ui', '.qrc', '.md', '.html', '.rst', '.ini')):
            continue
        filepath = os.path.join(root, file)
        
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            new_content = content
            for pattern, repl in replacements:
                new_content = re.sub(pattern, repl, new_content)
                
            if new_content != content:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(new_content)
        except Exception as e:
            print(f"Skipping {filepath}: {e}")
