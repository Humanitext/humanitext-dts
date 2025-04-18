import axios from "axios";
import { DOMParser } from "xmldom";

export const getDocument = async (id: string): Promise<Document | null> => {
  const collection = String(id).split(".")[0].split(":")[1];
  const work = String(id).split(".")[1].split(":")[0];
  const vol = String(id).split(".")[1].split(":")[1];
  /*
  const url = `https://raw.githubusercontent.com/Humanitext/dts-data/refs/heads/main/xml/Inscription/${vol.padStart(
    2,
    "0"
  )}.xml`;
  */
  //const url = `https://raw.githubusercontent.com/Humanitext/humanitext-dts-data/refs/heads/main/xml/Aristotle/${work}/${vol}.xml`;
  const url = `https://humanitext-dts-data.vercel.app/xml/${collection}/${work}/${vol}.xml`;

  try {
    const response = await axios.get(url);
    const xmlData = response.data;

    // DOMParserでパース
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlData, "application/xml");
    return xmlDoc;
  } catch (error) {
    return null;
  }
};
