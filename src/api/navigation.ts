import { Router, Request, Response } from "express";
import { getDocument } from "../utils/xmlParser"; // ユーティリティ関数として外部ファイルに分離

export const navigationRouter = Router();

navigationRouter.get("/", async (req: Request, res: Response) => {
  const id = req.query.id;

  if (!id) {
    res.status(400).json({ error: "id is required" });
    return;
  }

  const targets: string[] = [];

  if (req.query.ref) {
    if (Array.isArray(req.query.ref)) {
      targets.push(...(req.query.ref as string[]));
    } else {
      targets.push(req.query.ref as string);
    }
  }

  const xmlDoc = await getDocument(id as string);

  if (!xmlDoc) {
    res.status(500).json({ error: "Failed to load or parse XML" });
    return;
  }

  // querySelectorAllを使って 'seg' タグを取得し、'corresp'属性を返す
  const member = Array.from(xmlDoc.getElementsByTagName("seg"))
    .map((seg) => {
      const ref = seg.getAttribute("corresp");

      if (ref === null) {
        return;
      }

      if (targets.length === 0 || targets.includes(ref)) {
        return {
          ref: ref,
        };
      }
    })
    .filter((m) => m !== undefined);

  // const member: any = [];

  // パースされたデータを処理（例: ナビゲーションデータを作成）
  const navigationData = {
    passage: `/api/dts/document?id=${id}{&ref}`,
    level: 1,
    citeType: "line",
    "@id": `/api/dts/navigation?level=1&id=${id}${
      targets.length > 0 ? `&ref=${targets.join(",")}` : ""
    }`,
    citeDepth: 1,
    "@context": {
      hydra: "https://www.w3.org/ns/hydra/core#",
      "@vocab": "https://w3id.org/dts/api#",
    },
    "hydra:member": member,
  };

  // ナビゲーション情報を返す
  res.json(navigationData);
});
