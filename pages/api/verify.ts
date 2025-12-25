import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";
import { Sourcify } from "@nomicfoundation/hardhat-verify/sourcify.js";
import type { TransactionReceipt } from "viem";
import comp from "@/blockchain_modules/hello_compData.json";

const sourcify = new Sourcify(
  11155111,
  "https://sourcify.dev/server",
  "https://repo.sourcify.dev"
);
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log("➡️ /api/verify hit");

  try {
    console.log("1️⃣ method:", req.method);

    if (req.method !== "POST") {
      console.log("❌ wrong method");
      return res.status(405).json({ error: "Method not allowed" });
    }

    console.log("2️⃣ body:", req.body);

    const { address } = req.body;

    if (!address) {
      console.log("❌ missing address");
      return res.status(400).json({ error: "Address is required" });
    }

    console.log("3️⃣ address ok:", address);

    console.log("4️⃣ loading comp file...");
    const compPath = path.join(process.cwd(), "public", "hello_compData.json");
    console.log("   path:", compPath);

    const raw = fs.readFileSync(compPath, "utf8");
    console.log("5️⃣ file loaded");

    const comp = JSON.parse(raw);
    console.log("6️⃣ json parsed");

    console.log("7️⃣ parsing compiler input");
    const compilerInput = JSON.parse(comp.compilerInput);
    console.log("8️⃣ sources:", Object.keys(compilerInput.sources));

    console.log("9️⃣ calling sourcify.verify");

    const result = await sourcify.verify(address, {
      "metadata.json": comp.metadata,
      ...Object.fromEntries(
        Object.entries(compilerInput.sources).map(
          ([file, data]: any) => [file, data.content]
        )
      ),
    });

    console.log("🔟 sourcify result:", result);

    return res.status(200).json({ success: true });
  } catch (err: any) {
    console.error("🔥 VERIFY CRASH:", err);
    return res.status(500).json({
      error: err.message,
      stack: err.stack,
    });
  }
}
