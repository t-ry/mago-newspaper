import express from "express";
import { randomUUID } from "node:crypto";
import { ZodError } from "zod";
import {
  createSchema,
  editSchema,
  revisionSchema,
  orderSchema,
  validateEditorial,
} from "../shared/schema.js";
import { AppError, generateWithOrca, demoEditorial } from "./orca.js";
import { createDemoOrder } from "./orders.js";
import { renderPdf } from "./pdf.js";

export function createApp({
  apiKey = process.env.ORCAROUTER_API_KEY,
  model = process.env.ORCAROUTER_MODEL || "openai/gpt-4o-mini",
  pdfRenderer = renderPdf,
  aiGenerator = generateWithOrca,
} = {}) {
  const app = express();
  const sessions = new Map();
  app.disable("x-powered-by");
  app.use("/api", (req, res, next) => {
    res.set("Cache-Control", "no-store");
    res.set("X-Content-Type-Options", "nosniff");
    const origin = req.headers.origin;
    if (origin) {
      try {
        if (new URL(origin).host !== req.headers.host) throw new Error();
      } catch {
        return res
          .status(403)
          .json({ error: "別のサイトからのリクエストは受け付けません。" });
      }
    }
    const now = Date.now();
    for (const [id, session] of sessions)
      if (now - session.touched > 2 * 60 * 60 * 1000 && !session.busy)
        sessions.delete(id);
    let sid = req.headers.cookie
      ?.split(";")
      .map((s) => s.trim())
      .find((s) => s.startsWith("mago_session="))
      ?.slice(13);
    if (!sessions.has(sid)) {
      if (sessions.size >= 100)
        return res
          .status(503)
          .json({
            error: "デモの利用上限です。しばらく待ってお試しください。",
          });
      sid = randomUUID();
      sessions.set(sid, { touched: now, papers: new Map(), busy: false });
      res.cookie("mago_session", sid, {
        httpOnly: true,
        sameSite: "strict",
        secure: req.secure,
        maxAge: 2 * 60 * 60 * 1000,
        path: "/",
      });
    }
    req.session = sessions.get(sid);
    req.session.touched = now;
    next();
  });
  app.use("/api", express.json({ limit: "24mb" }));
  app.get("/api/config", (req, res) =>
    res.json({
      aiConfigured: Boolean(apiKey),
      model,
      postalMode: "demo",
      maxPhotos: 12,
    }),
  );
  app.post("/api/newspapers", async (req, res) => {
    const input = createSchema.parse(req.body);
    if (req.session.busy)
      throw new AppError(429, "新聞を編集中です。完了するまでお待ちください。");
    if (req.session.papers.size >= 5)
      throw new AppError(429, "このセッションでは5部まで作成できます。");
    req.session.busy = true;
    try {
      const editorial =
        input.mode === "demo"
          ? demoEditorial(input)
          : await aiGenerator(input, { apiKey, model });
      const paper = {
        ...editorial,
        id: randomUUID(),
        revision: 1,
        approvedRevision: null,
        childName: input.childName,
        issueDate: new Intl.DateTimeFormat("ja-JP", {
          timeZone: "Asia/Tokyo",
          year: "numeric",
          month: "long",
          day: "numeric",
        }).format(new Date()),
        photos: input.photos,
        source: input.mode === "demo" ? "demo" : "orcarouter",
        model: input.mode === "demo" ? null : model,
        order: null,
      };
      req.session.papers.set(paper.id, paper);
      res.status(201).json(paper);
    } finally {
      req.session.busy = false;
    }
  });
  app.use("/api/newspapers/:id", (req, res, next) => {
    const paper = req.session.papers.get(req.params.id);
    if (!paper)
      throw new AppError(
        404,
        "新聞が見つかりません。セッションの有効期限が切れた可能性があります。",
      );
    req.paper = paper;
    next();
  });
  const checkRevision = (paper, revision) => {
    if (paper.revision !== revision)
      throw new AppError(
        409,
        "新聞が更新されています。最新の内容を確認してください。",
      );
  };
  const checkApproved = (paper) => {
    if (paper.approvedRevision !== paper.revision)
      throw new AppError(409, "この版の新聞を先に承認してください。");
  };
  app.get("/api/newspapers/:id", (req, res) => res.json(req.paper));
  app.patch("/api/newspapers/:id", (req, res) => {
    const input = editSchema.parse(req.body);
    const paper = req.paper;
    checkRevision(paper, input.revision);
    if (paper.order || paper.orderPending)
      throw new AppError(
        409,
        "注文済み、または注文処理中の新聞は変更できません。新しい号を作成してください。",
      );
    let editorial;
    try {
      editorial = validateEditorial(input, paper.photos);
    } catch {
      throw new AppError(400, "記事または掲載写真の指定が不正です。");
    }
    Object.assign(paper, editorial, {
      revision: paper.revision + 1,
      approvedRevision: null,
    });
    res.json(paper);
  });
  app.post("/api/newspapers/:id/approve", (req, res) => {
    checkRevision(req.paper, revisionSchema.parse(req.body).revision);
    req.paper.approvedRevision = req.paper.revision;
    res.json(req.paper);
  });
  app.get("/api/newspapers/:id/pdf", async (req, res) => {
    checkApproved(req.paper);
    const revision = req.paper.revision;
    const pdf = await pdfRenderer(
      structuredClone({ ...req.paper, orderPending: undefined }),
    );
    checkRevision(req.paper, revision);
    checkApproved(req.paper);
    res
      .set("Content-Type", "application/pdf")
      .set("Content-Disposition", 'inline; filename="mago-newspaper.pdf"')
      .send(pdf);
  });
  app.post("/api/newspapers/:id/orders", async (req, res) => {
    const input = orderSchema.parse(req.body);
    const paper = req.paper;
    checkRevision(paper, input.revision);
    checkApproved(paper);
    if (paper.order) return res.json(paper.order);
    if (paper.orderPending) return res.json(await paper.orderPending);
    const pending = (async () => {
      const pdf = await pdfRenderer(
        structuredClone({ ...paper, orderPending: undefined }),
      );
      const order = await createDemoOrder(paper, input.recipient, pdf);
      paper.order = order;
      return order;
    })();
    paper.orderPending = pending;
    try {
      res.json(await pending);
    } finally {
      delete paper.orderPending;
    }
  });
  app.use("/api", (req, res) =>
    res.status(404).json({ error: "APIが見つかりません。" }),
  );
  app.use((error, req, res, next) => {
    if (!req.path.startsWith("/api")) return next(error);
    if (error instanceof ZodError)
      return res
        .status(400)
        .json({
          error:
            "入力内容を確認してください。写真形式・枚数・文字数・宛先に誤りがあります。",
        });
    if (error.type === "entity.too.large")
      return res
        .status(413)
        .json({
          error: "写真の合計サイズが大きすぎます。枚数を減らしてください。",
        });
    if (error instanceof SyntaxError)
      return res
        .status(400)
        .json({ error: "リクエストの形式が正しくありません。" });
    res
      .status(error.status || 500)
      .json({
        error: error.status
          ? error.message
          : "処理に失敗しました。少し待って再度お試しください。",
      });
  });
  return app;
}
