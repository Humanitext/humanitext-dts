import express, { Request, Response } from "express";

import axios from "axios";
import { parseStringPromise } from "xml2js";
import { DOMParser } from "xmldom";

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

app.get("/api/dts/collections", (req: Request, res: Response) => {
  if (req.query.id === "kouigenjimonogatari") {
    res.json({
      totalItems: 54,
      member: [
        {
          totalItems: 0,
          "dts:citeStructure": {
            "dts:citeType": "line",
          },
          "dts:extensions": {
            "cts:label": [
              {
                "@value": "桐壺",
                "@language": "jpn",
              },
            ],
            "ns2:language": "jpn",
            "ns1:prefLabel": [
              {
                "@value": "桐壺",
                "@language": "jpn",
              },
            ],
            "cts:description": [
              {
                "@value": "桐壺",
                "@language": "jpn",
              },
            ],
          },
          "dts:passage": "/api/dts/document?id=kouigenjimonogatari.1",
          title: "Carmina",
          "@id": "kouigenjimonogatari.1",
          "@type": "Resource",
          "dts:references": "/api/dts/navigation?id=kouigenjimonogatari.1",
          "dts:citeDepth": 1,
        },
      ],
      title: "校異源氏物語",
      "@id": "kouigenjimonogatari",
      "@type": "Collection",
      "@context": {
        dts: "https://w3id.org/dts/api#",
        cts: "http://chs.harvard.edu/xmlns/cts/",
        ns1: "http://www.w3.org/2004/02/skos/core#",
        "@vocab": "https://www.w3.org/ns/hydra/core#",
        ns2: "http://purl.org/dc/elements/1.1/",
      },
      "dts:extensions": {
        "cts:title": [
          {
            "@value": "校異源氏物語",
            "@language": "jpn",
          },
        ],
        "ns2:language": "jpn",
        "ns1:prefLabel": [
          {
            "@value": "校異源氏物語",
            "@language": "jpn",
          },
        ],
      },
    });
  } else {
    res.json({
      totalItems: 1,
      member: [
        {
          "@id": "kouigenjimonogatari",
          "@type": "Collection",
          totalItems: 54,
          title: "校異源氏物語",
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
