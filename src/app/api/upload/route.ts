import { NextRequest, NextResponse } from "next/server";
import cloudinary from "@/utils/cloudinary";
import { Readable } from "stream";

// Helper function to convert ReadableStream to Node.js Readable
async function streamToBuffer(stream: ReadableStream): Promise<Buffer> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }
  
  return Buffer.concat(chunks);
}

export async function POST(req: NextRequest) {
  try {
    // Check if request is multipart form data
    const contentType = req.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json({ error: "Request must be multipart/form-data" }, { status: 400 });
    }

    // Parse the form data
    const formData = await req.formData();
    const file = formData.get("file") as File;
    
    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Check file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "File must be an image" }, { status: 400 });
    }

    // Convert the file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Cloudinary
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { resource_type: "image", folder: "events" },
        (error, result) => {
          if (error) {
            console.error("Cloudinary upload error:", error);
            resolve(NextResponse.json({ error: "Failed to upload image" }, { status: 500 }));
          } else {
            resolve(
              NextResponse.json({
                url: result?.secure_url,
                public_id: result?.public_id,
              })
            );
          }
        }
      );

      // Create a readable stream from the buffer and pipe to cloudinary
      const readable = new Readable();
      readable._read = () => {}; // Required but we don't need to implement this
      readable.push(buffer);
      readable.push(null);
      readable.pipe(uploadStream);
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
