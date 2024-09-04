import { Router, Request, Response } from "express";

import axios from "axios";

const COLLECTION_TITLE = "校異源氏物語";
const COLLECTION_ID = "kouigenjimonogatari";

export const collectionRouter = Router();

collectionRouter.get("/", async (req: Request, res: Response) => {
  const url = "https://genji.dl.itc.u-tokyo.ac.jp/data/info.json";

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

  if (req.query.id === COLLECTION_ID) {
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
  } else {
    res.json({
      totalItems: 1,
      member: [
        {
          "@id": COLLECTION_ID,
          "@type": "Collection",
          totalItems: members.length,
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
