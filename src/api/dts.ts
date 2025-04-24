import { Router, Request, Response } from "express";

export const dtsRouter = Router();

dtsRouter.get("/", (req: Request, res: Response) => {
  res.json({
    navigation: "/api/dts/navigation",
    "@id": "/api/dts",
    "@type": "EntryPoint",
    collections: "/api/dts/collections",
    "@context": "dts/EntryPoint.jsonld",
    documents: "/api/dts/document",
  });
});
