import express, { Request, Response } from "express";

import { dtsRouter } from "./api/dts"; // DTSのエンドポイント
import { documentRouter } from "./api/document"; // ドキュメントのエンドポイント

import { navigationRouter } from "./api/navigation"; // ナビゲーションのエンドポイント

import { collectionRouter } from "./api/collection"; // コレクションのエンドポイント

const app = express();
const port = process.env.PORT || 3000;

app.get("/", (req: Request, res: Response) => {
  res.redirect("/api/dts");
});

app.get('/', (req, res, next) => {
  res.set({ 'Access-Control-Allow-Origin': '*' }); // ここでヘッダーにアクセス許可の情報を追加
  
  // 何らかの処理
});

app.use("/api/dts", dtsRouter);
app.use("/api/dts/document", documentRouter);
app.use("/api/dts/navigation", navigationRouter);
app.use("/api/dts/collections", collectionRouter);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
