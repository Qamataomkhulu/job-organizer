import type { Express, Request, Response } from "express";
import express from "express";
import { sdk } from "../_core/sdk";
import { ingestResume } from "./service";

export function registerResumeUploadRoute(app: Express) {
  app.post("/api/resume/upload", express.raw({ type: "application/pdf", limit: "10mb" }), async (req: Request, res: Response) => {
    try {
      const user = await sdk.authenticateRequest(req);
      const filenameHeader = req.headers["x-filename"];
      const filename = typeof filenameHeader === "string" ? decodeURIComponent(filenameHeader) : "resume.pdf";
      if (!Buffer.isBuffer(req.body) || req.body.length === 0) return res.status(400).json({ error: "Attach a PDF file." });
      if (req.body.subarray(0, 4).toString() !== "%PDF") return res.status(400).json({ error: "Only PDF résumés are accepted." });
      const resume = await ingestResume(user.id, filename, req.body);
      res.status(201).json({ resume: { id: resume.id, createdAt: resume.createdAt } });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Résumé upload failed." });
    }
  });
}
