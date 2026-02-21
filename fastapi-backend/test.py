import re
text = 'href={`/products?category=${cat.toLowerCase()}`}'
base = "/uploads"
print(re.sub(r'href=\{`\/((?!api/|http|https|_next|favicon|uploads)[^`]+?)`\}', f'href={{`{base}/\\1`}}', text))
