import glob
import os

from app.ocr.extractor import extract_text

files = sorted(glob.glob("/app/data/uploads/**/*", recursive=True), key=os.path.getmtime, reverse=True)
files = [f for f in files if os.path.isfile(f)]

print("Most recent file:", files[0])
with open(files[0], "rb") as fh:
    data = fh.read()
print("Size:", len(data), "bytes")
print("Running OCR now...")
text = extract_text(data)
print("SUCCESS. First 300 chars:")
print(text[:300])