import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log("➡️ /api/verify hit");

  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const { address } = req.body;
    if (!address) {
      return res.status(400).json({ error: "Address is required" });
    }

    // 1. Load the compilation data
    const compPath = path.join(process.cwd(), "public", "hello_compData.json");
    const raw = fs.readFileSync(compPath, "utf8");
    const comp = JSON.parse(raw);
    const compilerInput = JSON.parse(comp.compilerInput);

    // 2. Format the files for Sourcify API
    // Sourcify expects an object where keys are filenames and values are the content
    const files: Record<string, string> = {
      "metadata.json": typeof comp.metadata === "string" 
        ? comp.metadata 
        : JSON.stringify(comp.metadata),
    };

    Object.entries(compilerInput.sources).forEach(([file, data]: any) => {
      files[file] = data.content;
    });

    console.log("🚀 Sending to Sourcify...");

    // 3. Direct API Call
    const sourcifyResponse = await fetch("https://sourcify.dev/server/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        address: address,
        chain: "11155111", // Sepolia
        files: files,
      }),
    });

    const result = await sourcifyResponse.json();

    if (!sourcifyResponse.ok) {
      throw new Error(result.error || "Sourcify verification failed");
    }

    console.log("✅ Sourcify result:", result);
    return res.status(200).json({ success: true, result });

  } catch (err: any) {
    console.error("🔥 VERIFY CRASH:", err);
    return res.status(500).json({
      error: err.message,
    });
  }
}