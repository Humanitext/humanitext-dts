import { Router, Request, Response } from "express";
import { getDocument } from "../utils/xmlParser"; // ユーティリティ関数として外部ファイルに分離
//import { getDocument } from "../utils/localXmlParser"; // ユーティリティ関数として外部ファイルに分離

import { DOMParser, XMLSerializer } from "xmldom";

export const documentRouter = Router();

const createNewDocument = (foundSeg: ParentNode | null) => {
  const parser = new DOMParser();

  // 新しいXMLドキュメントを作成
  const newDoc = parser.parseFromString(
    `<TEI xmlns="http://www.tei-c.org/ns/1.0"><dts:fragment xmlns:dts="https://w3id.org/dts/api#"></dts:fragment></TEI>`,
    "application/xml"
  );

  const fragmentNode = newDoc.getElementsByTagName("dts:fragment")[0]; // 新しいドキュメントのルート要素

  if (foundSeg && foundSeg.nodeType === 1) {
    // `foundSeg`をElement型にキャスト
    const element = foundSeg as Element;

    // 新しい要素を作成
    const newElement = newDoc.createElement(element.nodeName);

    // 属性をコピー
    if (element.attributes) {
      for (let j = 0; j < element.attributes.length; j++) {
        const attr = element.attributes[j];
        newElement.setAttribute(attr.name, attr.value);
      }
    }

    // 子要素を再帰的にコピー
    copyChildNodes(element, newElement, newDoc);

    // 新しいドキュメントに追加
    fragmentNode.appendChild(newElement);
  }

  return newDoc;
};

// 子要素を再帰的にコピーする関数
const copyChildNodes = (source: Node, target: Node, doc: Document) => {
  for (let i = 0; i < source.childNodes.length; i++) {
    const child = source.childNodes[i];

    if (child.nodeType === 1) {
      // Elementノードの場合
      const elementChild = child as Element;
      const newChild = doc.createElement(elementChild.nodeName);

      // 属性をコピー
      if (elementChild.attributes) {
        for (let j = 0; j < elementChild.attributes.length; j++) {
          const attr = elementChild.attributes[j];
          newChild.setAttribute(attr.name, attr.value);
        }
      }

      // 子要素を再帰的にコピー
      copyChildNodes(elementChild, newChild, doc);

      target.appendChild(newChild);
    } else if (child.nodeType === 3) {
      // テキストノードの場合
      const textNode = doc.createTextNode(child.nodeValue || "");
      target.appendChild(textNode);
    }
  }
};

documentRouter.get("/", async (req: Request, res: Response) => {
  const { ref, id } = req.query;

  console.log("id", id);

  if (!id) {
    res.status(400).json({ error: "id is required" });
    return;
  }

  const xmlDoc = await getDocument(id as string);

  if (!xmlDoc) {
    res.status(500).json({ error: "Failed to load or parse XML" });
    return;
  }

  if (!ref) {
    // return xml
    res.set("Content-Type", "application/xml");

    const serializer = new XMLSerializer();

    const xmlString = serializer.serializeToString(xmlDoc);

    res.send(xmlString);
  } else {
    const segs = xmlDoc.getElementsByTagName("*");
    let foundSeg = null;

    // 'corresp' 属性をチェックして、該当するものを探す
    for (let i = 0; i < segs.length; i++) {
      const seg = segs[i];
      const corresp = seg.getAttribute("xml:id");

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

    const newDoc = createNewDocument(foundSeg);

    // 新しいツリーをシリアライズ
    const serializer = new XMLSerializer();
    const xmlString = serializer.serializeToString(newDoc);

    res.set("Content-Type", "application/xml");
    res.send(xmlString);
  }
});
