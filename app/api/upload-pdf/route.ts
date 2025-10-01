import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Prepare request for Python backend
    const backendFormData = new FormData();
    backendFormData.append("file", file);

    // Call Python FastAPI backend
    const response = await fetch(`${process.env.NEXT_PUBLIC_PY_API}/process`, {
      method: "POST",
      body: backendFormData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Python backend error:", errorText);
      return NextResponse.json(
        { error: "Python backend failed" },
        { status: 500 }
      );
    }

    const result = await response.json();

    return NextResponse.json({
      message: "File processed successfully",
      pdfText: result.output,
      name: file.name,
      size: file.size,
    });
  } catch (err) {
    console.error("API upload-pdf error:", err);
    return NextResponse.json(
      { error: "Failed to process file" },
      { status: 500 }
    );
  }
}
