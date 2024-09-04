import express, { Request, Response } from "express";

import axios from "axios";
import { DOMParser, XMLSerializer } from "xmldom";

const COLLECTION_TITLE = "校異源氏物語";
const COLLECTION_ID = "kouigenjimonogatari";

const app = express();
const port = process.env.PORT || 3000;

app.get("/", (res: Response) => {
  res.redirect("/api/dts");
});

app.get("/api/dts", (res: Response) => {
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

const getDocument = async (id: string) => {
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
    return xmlDoc;
  } catch (error) {
    // エラーハンドリング
    // res.status(500).json({ error: "Failed to load or parse XML" });
    return null;
  }
};

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

app.get("/api/dts/document", async (req: Request, res: Response) => {
  const { ref } = req.query;

  const id = req.query.id;

  if (!id) {
    res.status(400).json({ error: "id is required" });
    return;
  }

  const xmlDoc = await getDocument(id as string);

  if (!xmlDoc) {
    res.status(500).json({ error: "Failed to load or parse XML" });
    return;
  }

  // const ref = req.query.ref;

  if (!ref) {
    // return xml
    res.set("Content-Type", "application/xml");

    const serializer = new XMLSerializer();

    const xmlString = serializer.serializeToString(xmlDoc);

    res.send(xmlString);
  } else {
    const segs = xmlDoc.getElementsByTagName("seg");
    let foundSeg = null;

    // 'corresp' 属性をチェックして、該当するものを探す
    for (let i = 0; i < segs.length; i++) {
      const seg = segs[i];
      const corresp = seg.getAttribute("corresp");

      if (corresp === ref) {
        foundSeg = seg;
        break;
      }
    }

    // segが見つからない場合
    if (!foundSeg) {
      res.status(404).json({ error: "Not Found" });
      return;
    }

    const parser = new DOMParser();

    // 新しいツリーを構築: 最上位から親要素を辿り、seg要素のみを含むツリーを作成
    const newDoc = parser.parseFromString(
      `<TEI xmlns="http://www.tei-c.org/ns/1.0"><dts:fragment xmlns:dts="https://w3id.org/dts/api#"></TEI>`,
      "application/xml"
    ); // 新しいXMLドキュメントを作成
    let currentNode = newDoc.getElementsByTagName("dts:fragment")[0]; // 新しいドキュメントのルート要素

    const elementStack: any[] = []; // 親要素を一時的に格納するスタック

    // seg要素の親を辿り、すべての親要素をスタックに追加
    let parent: ParentNode | null = foundSeg;
    while (parent && parent.nodeType === 1) {
      // parentがElement（nodeType 1）の場合のみ処理
      elementStack.push(parent);

      // 親が 'text' 要素の場合、ループを終了
      if (parent.nodeName === "text") {
        break;
      }

      parent = parent.parentNode;
    }

    // スタックに積んだ親要素を逆順にたどり、新しいツリーに再構築
    while (elementStack.length > 0) {
      const element = elementStack.pop();
      if (!element) continue; // elementがundefinedになる可能性に対応

      const newElement = newDoc.createElement(element.nodeName); // 新しい要素を作成

      // 属性もコピー
      if (element.attributes) {
        for (let j = 0; j < element.attributes.length; j++) {
          const attr = element.attributes[j];
          newElement.setAttribute(attr.name, attr.value);
        }
      }

      // テキストノードをコピー
      if (element.childNodes) {
        for (let k = 0; k < element.childNodes.length; k++) {
          const child = element.childNodes[k];
          if (child.nodeType === 3) {
            // テキストノード（nodeType 3）
            const textNode = newDoc.createTextNode(child.nodeValue || "");
            newElement.appendChild(textNode);
          }
        }
      }

      // 子要素を追加
      currentNode.appendChild(newElement);
      currentNode = newElement;
    }

    // 新しいツリーをシリアライズ
    const serializer = new XMLSerializer();
    const xmlString = serializer.serializeToString(newDoc);

    res.set("Content-Type", "application/xml");
    res.send(xmlString);
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
