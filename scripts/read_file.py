import sys
import os
import pandas as pd
from pdfminer.high_level import extract_text
from PIL import Image
import pytesseract

def read_pdf(file_path):
    try:
        text = extract_text(file_path)
        if not text.strip():
            return "No text found in PDF"
        lines = text.splitlines()
        numbered_lines = [f"{i+1}: {line.strip()}" for i, line in enumerate(lines) if line.strip()]
        return "\n".join(numbered_lines)
    except Exception as e:
        return f"PDF read error: {e}"

def read_csv(file_path):
    try:
        df = pd.read_csv(file_path)
        return df.to_string(index=False)
    except Exception as e:
        return f"CSV read error: {e}"

def read_image(file_path):
    try:
        img = Image.open(file_path)
        text = pytesseract.image_to_string(img)
        return text.strip() or "No text found in image"
    except Exception as e:
        return f"Image read error: {e}"

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("No file path provided")
        sys.exit(1)

    file_path = sys.argv[1]
    if not os.path.exists(file_path):
        print(f"File not found: {file_path}")
        sys.exit(1)

    ext = os.path.splitext(file_path)[1].lower()
    if ext == ".pdf":
        output = read_pdf(file_path)
    elif ext == ".csv":
        output = read_csv(file_path)
    elif ext in [".png", ".jpg", ".jpeg", ".bmp", ".tiff"]:
        output = read_image(file_path)
    else:
        output = f"Unsupported file type: {ext}"

    print(output)
