import express, { Request, Response } from "express";

import axios from "axios";
import { DOMParser } from "xmldom";

const COLLECTION_TITLE = "校異源氏物語";
const COLLECTION_ID = "kouigenjimonogatari";

const app = express();
const port = process.env.PORT || 3000;

app.get("/", (req: Request, res: Response) => {
  // res.send("Hello World!");
  // redirect to the API documentation
  res.redirect("/api/dts");
});

app.get("/api/dts", (req: Request, res: Response) => {
  res.json({
    navigation: "/api/dts/navigation",
    "@id": "/api/dts",
    "@type": "EntryPoint",
    collections: "/api/dts/collections",
    "@context": "dts/EntryPoint.jsonld",
    documents: "/api/dts/document",
  });
});

app.get("/api/dts/collections", async (req: Request, res: Response) => {
  if (req.query.id === COLLECTION_ID) {
    const url = "https://genji.dl.itc.u-tokyo.ac.jp/data/info.json";

    try {
      const response = await axios.get(url);
      const data = response.data;

      const members: any = [];

      for (const selection of data.selections) {
        for (const item of selection.members) {
          const vol = item.metadata.find((m: any) => m.label === "vol").value;

          const memberId = `${COLLECTION_ID}.${vol}`;

          members.push({
            totalItems: 0,
            "dts:citeStructure": {
              "dts:citeType": "line",
            },
            "dts:extensions": {
              "cts:label": [
                {
                  "@value": item.label,
                  "@language": "jpn",
                },
              ],
              "ns2:language": "jpn",
              "ns1:prefLabel": [
                {
                  "@value": item.label,
                  "@language": "jpn",
                },
              ],
              "cts:description": [
                {
                  "@value": item.label,
                  "@language": "jpn",
                },
              ],
            },
            "dts:passage": `/api/dts/document?id=${memberId}`,
            title: item.label,
            "@id": memberId,
            "@type": "Resource",
            "dts:references": `/api/dts/navigation?id=${memberId}`,
            "dts:citeDepth": 1,
          });
        }
      }

      res.json({
        totalItems: data.length,
        member: members,
        title: COLLECTION_TITLE,
        "@id": COLLECTION_ID,
        "@type": "Collection",
        "@context": {
          dts: "https://w3id.org/dts/api#",
          "@vocab": "https://www.w3.org/ns/hydra/core#",
        },
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to load or parse JSON" });
    }
  } else {
    res.json({
      totalItems: 1,
      member: [
        {
          "@id": COLLECTION_ID,
          "@type": "Collection",
          totalItems: 54,
          title: COLLECTION_TITLE,
        },
      ],
      title: "None",
      "@id": "default",
      "@type": "Collection",
      "@context": {
        dts: "https://w3id.org/dts/api#",
        "@vocab": "https://www.w3.org/ns/hydra/core#",
      },
    });
  }
});

app.get("/api/dts/navigation", async (req: Request, res: Response) => {
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

  const vol = String(id).split(".")[1];

  const url = `https://kouigenjimonogatari.github.io/xml/lw/${vol.padStart(
    2,
    "0"
  )}.xml`;

  try {
    // XMLファイルを取得
    const response = await axios.get(url);
    const xmlData = response.data;

    // DOMParserを使ってXMLをパース
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlData, "application/xml");

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
  } catch (error) {
    // エラーハンドリング
    res.status(500).json({ error: "Failed to load or parse XML" });
  }
});

app.get("/api/dts/document", (req: Request, res: Response) => {
  const { ref } = req.query;
  // ドキュメントの特定のパッセージを返す
  res.json({
    "@id": "/api/dts/document",
    ref: ref || "defaultRef",
    content: "<TEI>Example Text</TEI>",
  });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
