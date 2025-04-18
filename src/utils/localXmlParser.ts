import { DOMParser } from "xmldom";
import { readFileSync } from "fs";
import { join } from "path";

export const getDocument = async (id: string): Promise<Document | null> => {
  const vol = String(id).split(".")[1];
  const filePath = join(__dirname, "../xml", `${vol.padStart(2, "0")}.xml`);

  try {
    const xmlData = readFileSync(filePath, "utf-8");

    // DOMParserでパース
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlData, "application/xml");
    return xmlDoc;
  } catch (error) {
    return null;
  }
};
