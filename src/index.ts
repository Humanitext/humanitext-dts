import express, { Request, Response } from "express";

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

app.get("/api/dts/navigation", (req: Request, res: Response) => {
  // ナビゲーション情報を返す
  res.json({
    "@id": "/api/dts/navigation",
    "@type": "Navigation",
    dtsVersion: "1-alpha",
    passage: "/api/dts/document",
    resource: {
      "@id": "urn:sample:document",
      "@type": "Resource",
      citationTrees: [],
    },
  });
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
