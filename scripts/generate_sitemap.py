#!/usr/bin/env python3
"""Build sitemap from published Metro projects in Supabase."""
import json
import re
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
config = (ROOT / "admin/config.js").read_text(encoding="utf-8")
url_match = re.search(r"https://[a-z0-9-]+\.supabase\.co", config)
key_match = re.search(r"sb_publishable_[A-Za-z0-9_-]+", config)
if not url_match or not key_match:
    raise SystemExit("Supabase public configuration not found; sitemap unchanged.")
api = url_match.group(0) + "/rest/v1/projects?select=slug&published=eq.true&order=created_at.desc"
req = urllib.request.Request(api, headers={"apikey": key_match.group(0), "Accept": "application/json"})
with urllib.request.urlopen(req, timeout=25) as response:
    projects = json.load(response)
if not isinstance(projects, list):
    raise SystemExit("Unexpected projects response; sitemap unchanged.")

ns = "http://www.sitemaps.org/schemas/sitemap/0.9"
ET.register_namespace("", ns)
root = ET.Element(f"{{{ns}}}urlset")
urls = ["https://metrodesign.studio/", "https://metrodesign.studio/about.html"]
for project in projects:
    slug = project.get("slug")
    if isinstance(slug, str) and slug.strip():
        urls.append("https://metrodesign.studio/projects/?slug=" + urllib.parse.quote(slug.strip(), safe=""))
for url in dict.fromkeys(urls):
    ET.SubElement(ET.SubElement(root, f"{{{ns}}}url"), f"{{{ns}}}loc").text = url
ET.indent(root, space="  ")
(ROOT / "sitemap.xml").write_bytes(b'<?xml version="1.0" encoding="UTF-8"?>\n' + ET.tostring(root, encoding="utf-8"))
print(f"Generated sitemap with {len(set(urls))} URLs ({len(projects)} published projects).")
