
from bs4 import BeautifulSoup
import json
import re

with open("portfolio/index.html", "r", encoding="utf-8") as f:
    soup = BeautifulSoup(f.read(), "html.parser")

texts = []
for node in soup.find_all(text=True):
    if node.parent.name not in ["script", "style", "meta", "link"]:
        text = node.strip()
        if text and len(text) > 2 and not re.match(r"^[0-9\W]+$", text):
            texts.append(text)

with open("texts.json", "w", encoding="utf-8") as f:
    json.dump(texts, f, ensure_ascii=False, indent=2)
