import re

try:
    with open('D:/CHIRANKSHI/Store-Builder/uploads/themes/nexus-mall/out/index.html', encoding='utf-8') as f:
        content = f.read()

    found = []
    for m in re.finditer(r'href=[\"\']([^\"\']*category=[^\"\']*)[\"\']', content):
        if m.group(1) not in found:
            found.append(m.group(1))
            print(m.group(1))

    if not found:
        print("No category links found!")
except Exception as e:
    print(f"Error: {e}")
