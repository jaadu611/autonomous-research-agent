import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import os from "os";
import { spawn } from "child_process";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Save PDF temporarily
    const arrayBuffer = await file.arrayBuffer();
    const tempPath = path.join(os.tmpdir(), `${Date.now()}-${file.name}`);
    fs.writeFileSync(tempPath, Buffer.from(arrayBuffer));

    // Read PDF content via Python
    const pdfText: string = await new Promise((resolve, reject) => {
      const py = spawn("python", ["./scripts/read_file.py", tempPath]);
      let data = "";
      py.stdout.on("data", (chunk) => (data += chunk.toString()));
      py.stderr.on("data", (err) => console.error(err.toString()));
      py.on("close", (code) => {
        fs.unlinkSync(tempPath); // delete temp file immediately
        if (code === 0) resolve(data);
        else reject(new Error("Python script failed"));
      });
    });

    // Return the full text so frontend can keep it for questions
    return NextResponse.json({
      message: "PDF processed successfully",
      pdfText, // <-- store in frontend, don't save on server
      name: file.name,
      size: file.size,
    });
  } catch (err) {
    console.error("API upload-pdf error:", err);
    return NextResponse.json(
      { error: "Failed to process PDF" },
      { status: 500 }
    );
  }
}
