import React, { useEffect, useRef, useState } from "react";
import {
  Newspaper,
  Plus,
  ArrowUpRight,
  ArrowRight,
  Sparkles,
  X,
  Check,
  Download,
  Send,
  Leaf,
  Heart,
  ChevronRight,
  LoaderCircle,
  Pencil,
  ShieldCheck,
  RefreshCw,
  Images,
  Camera,
} from "lucide-react";
import { newspaperHtml } from "../shared/newspaper.js";
import fontRegular from "@fontsource/noto-serif-jp/400.css?inline";
import fontBold from "@fontsource/noto-serif-jp/700.css?inline";

async function api(path, method = "GET", body) {
  const res = await fetch(`/api${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "通信に失敗しました。");
  }
  return res.json();
}
async function toPhoto(fileOrUrl, id = crypto.randomUUID()) {
  const objectUrl =
    typeof fileOrUrl === "string" ? fileOrUrl : URL.createObjectURL(fileOrUrl);
  try {
    const img = new Image();
    img.src = objectUrl;
    await img.decode();
    const ratio = Math.min(1, 1600 / Math.max(img.width, img.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.width * ratio);
    canvas.height = Math.round(img.height * ratio);
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return { id, dataUrl: canvas.toDataURL("image/jpeg", 0.82) };
  } finally {
    if (typeof fileOrUrl !== "string") URL.revokeObjectURL(objectUrl);
  }
}
const samples = ["/demo/park.svg", "/demo/home.svg", "/demo/walk.svg"];
function PaperPreview({ paper }) {
  const ref = useRef(null);
  const [scale, setScale] = useState(0.7);
  useEffect(() => {
    const observer = new ResizeObserver(([entry]) =>
      setScale(entry.contentRect.width / 794),
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return (
    <div ref={ref} className="paper-view" style={{ height: 1122 * scale }}>
      <iframe
        title="A4新聞プレビュー"
        sandbox="allow-same-origin"
        srcDoc={newspaperHtml(paper, fontRegular + fontBold)}
        style={{ width: 794, height: 1122, transform: `scale(${scale})` }}
      />
    </div>
  );
}

export default function App() {
  const [config, setConfig] = useState(null),
    [photos, setPhotos] = useState([]),
    [childName, setChildName] = useState("はるちゃん"),
    [note, setNote] = useState("");
  const [paper, setPaper] = useState(null),
    [draft, setDraft] = useState(null),
    [busy, setBusy] = useState(""),
    [error, setError] = useState(""),
    [toast, setToast] = useState("");
  const [editing, setEditing] = useState(false),
    [delivery, setDelivery] = useState(false),
    [confirmed, setConfirmed] = useState(false);
  const [recipient, setRecipient] = useState({
    name: "",
    postalCode: "",
    address: "",
  });
  const inputRef = useRef(null),
    cameraRef = useRef(null),
    workRef = useRef(null);
  const approved = paper && paper.approvedRevision === paper.revision;
  useEffect(() => {
    api("/config")
      .then(setConfig)
      .catch((e) => setError(e.message));
  }, []);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 5000);
    return () => clearTimeout(timer);
  }, [toast]);
  async function run(label, work) {
    if (busy) return;
    setBusy(label);
    setError("");
    try {
      await work();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy("");
    }
  }
  async function addFiles(files) {
    if (!files?.length) return;
    await run("写真を読み込んでいます", async () => {
      const list = Array.from(files);
      if (photos.length + list.length > 12)
        throw new Error("写真は合計12枚まで追加できます。");
      if (
        list.some(
          (f) =>
            !["image/jpeg", "image/png", "image/webp"].includes(f.type) ||
            f.size > 10 * 1024 * 1024,
        )
      )
        throw new Error("10MB以内のJPEG・PNG・WebPを選んでください。");
      const added = await Promise.all(list.map((f) => toPhoto(f)));
      setPhotos((previous) => [...previous, ...added]);
    });
    if (inputRef.current) inputRef.current.value = "";
    if (cameraRef.current) cameraRef.current.value = "";
  }
  async function generate(mode) {
    await run(
      mode === "demo"
        ? "サンプル紙面を準備しています"
        : "AI編集長が写真を選び、記事を書いています",
      async () => {
        const source =
          mode === "demo"
            ? await Promise.all(samples.map((url) => toPhoto(url)))
            : photos;
        const result = await api("/newspapers", "POST", {
          mode,
          childName,
          note,
          photos: source,
        });
        setPaper(result);
        setDraft(structuredClone(result));
        setEditing(false);
        setConfirmed(false);
        setDelivery(false);
        setTimeout(
          () =>
            workRef.current?.scrollIntoView({
              behavior: "smooth",
              block: "start",
            }),
          100,
        );
      },
    );
  }
  function newIssue() {
    setPaper(null);
    setDraft(null);
    setPhotos([]);
    setError("");
    setToast("");
    setEditing(false);
    setDelivery(false);
    setConfirmed(false);
  }
  function updateArticle(index, key, value) {
    setDraft((d) => ({
      ...d,
      articles: d.articles.map((a, i) =>
        i === index
          ? {
              ...a,
              [key]: value,
              ...(key === "photoId"
                ? { reason: "親が確認して差し替えた写真です。" }
                : {}),
            }
          : a,
      ),
    }));
  }
  async function save() {
    await run("変更を保存しています", async () => {
      const result = await api(`/newspapers/${paper.id}`, "PATCH", {
        revision: paper.revision,
        headline: draft.headline,
        intro: draft.intro,
        articles: draft.articles,
        message: draft.message,
      });
      setPaper(result);
      setDraft(structuredClone(result));
      setEditing(false);
      setConfirmed(false);
      setToast("変更を保存しました。内容を確認して承認してください。");
    });
  }
  async function approve() {
    await run("承認しています", async () => {
      const result = await api(`/newspapers/${paper.id}/approve`, "POST", {
        revision: paper.revision,
      });
      setPaper(result);
      setToast("この紙面を承認しました。PDFと郵送の準備ができました。");
    });
  }
  async function download() {
    await run("日本語のA4 PDFを作成しています", async () => {
      const res = await fetch(`/api/newspapers/${paper.id}/pdf`);
      if (!res.ok) throw new Error((await res.json()).error);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "孫ニュースペーパ.pdf";
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
      setToast("PDFを保存しました。PDFを開き、A4・倍率100%で印刷できます。");
    });
  }
  async function order(event) {
    event.preventDefault();
    await run("模擬注文を受け付けています", async () => {
      const result = await api(`/newspapers/${paper.id}/orders`, "POST", {
        revision: paper.revision,
        recipient,
      });
      setPaper((p) => ({ ...p, order: result }));
      setDelivery(false);
      setToast(result.message);
    });
  }
  const livePaper = editing ? draft : paper;
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="/" aria-label="孫ニュースペーパ ホーム">
          <span className="brand-icon">
            <Newspaper size={25} />
          </span>
          <span>
            孫ニュース<span className="brand-sub">PAPER FOR FAMILY</span>
          </span>
        </a>
        <div className="family-card">
          <span className="family-avatar">家</span>
          <div>
            <strong>わが家の編集室</strong>
            <small>日常を、家族の一面に。</small>
          </div>
          <Leaf size={15} />
        </div>
        <div className="nav-label">WORKSPACE</div>
        <button
          className="nav-item active"
          onClick={() =>
            workRef.current?.scrollIntoView({ behavior: "smooth" })
          }
        >
          <Newspaper size={19} />
          今週の新聞
          <span className="nav-dot" />
        </button>
        <button className="nav-item" onClick={newIssue}>
          <Plus size={19} />
          新しい号をつくる
        </button>
        <div className="sidebar-note">
          <Heart size={23} strokeWidth={1.3} />
          <h3>
            「元気にしてる？」の
            <br />
            かわりに、この一枚。
          </h3>
          <p>
            離れて暮らす家族へ、
            <br />
            何気ない毎日を届けよう。
          </p>
          <span>MADE WITH LOVE</span>
        </div>
        <div className="sidebar-bottom">
          <span
            className={`connection-dot ${config?.aiConfigured ? "connected" : ""}`}
          />
          {config?.aiConfigured
            ? "OrcaRouter 接続設定済み"
            : "サンプル体験をご利用いただけます"}
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div>
            わが家の編集室
            <ChevronRight size={14} />
            <span>今週の新聞</span>
          </div>
          <span className="edition-tag">
            FAMILY EDITION <Leaf size={13} />
          </span>
        </header>
        <main>
          <section className="page-heading">
            <div>
              <div className="eyebrow">A LITTLE NEWS, A LOT OF LOVE.</div>
              <h1>
                いつもの日々が、
                <br className="mobile-only" />
                うれしい便りに。
              </h1>
              <p>写真を選ぶのはAI。届くのは、家族のぬくもり。</p>
            </div>
            <span className="date-label">
              {new Intl.DateTimeFormat("ja-JP", {
                month: "long",
                day: "numeric",
                weekday: "short",
              }).format(new Date())}
              <small>今日も、いい一日を。</small>
            </span>
          </section>
          <div className="steps">
            <div className={!paper ? "current" : "done"}>
              <span>{paper ? <Check size={14} /> : "01"}</span>写真をあずける
            </div>
            <i />
            <div
              className={
                paper && !approved ? "current" : approved ? "done" : ""
              }
            >
              <span>{approved ? <Check size={14} /> : "02"}</span>新聞を確認する
            </div>
            <i />
            <div className={approved ? "current" : ""}>
              <span>03</span>家族へ届ける
            </div>
          </div>
          {error && (
            <div className="alert" role="alert">
              {error}
              <button aria-label="エラーを閉じる" onClick={() => setError("")}>
                <X size={17} />
              </button>
            </div>
          )}
          {busy && (
            <div className="progress" role="status">
              <LoaderCircle className="spin" size={19} />
              {busy}
              <span>そのままお待ちください</span>
            </div>
          )}
          <div ref={workRef} className="workspace">
            {!paper ? (
              <>
                <section className="upload-card">
                  <div className="section-heading">
                    <span className="square-icon">
                      <Images size={20} />
                    </span>
                    <div>
                      <h2>今週の思い出を、あずけよう。</h2>
                      <p>選ばなくて大丈夫。お気に入りはAIが見つけます。</p>
                    </div>
                  </div>
                  <div
                    className={`dropzone ${photos.length ? "has-photos" : ""}`}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (!busy) addFiles(e.dataTransfer.files);
                    }}
                  >
                    {photos.length ? (
                      <div className="photo-grid">
                        {photos.map((p, i) => (
                          <div className="photo-thumb" key={p.id}>
                            <img
                              src={p.dataUrl}
                              alt={`追加した写真 ${i + 1}`}
                            />
                            <button
                              disabled={!!busy}
                              aria-label={`写真 ${i + 1}を削除`}
                              onClick={() =>
                                setPhotos((v) => v.filter((x) => x.id !== p.id))
                              }
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <>
                        <span className="upload-illustration">
                          <Camera size={38} strokeWidth={1.2} />
                          <span>+</span>
                        </span>
                        <h3>いまを、そのまま新聞に。</h3>
                        <p>撮った写真は、この画面へすぐ取り込まれます。</p>
                      </>
                    )}
                    {photos.length < 12 && (
                      <div
                        className={`capture-actions ${photos.length ? "compact" : ""}`}
                      >
                        <button
                          type="button"
                          className="button primary camera-action"
                          disabled={!!busy}
                          onClick={() => cameraRef.current?.click()}
                        >
                          <Camera size={18} />
                          カメラで撮る
                        </button>
                        <button
                          type="button"
                          className="button secondary"
                          disabled={!!busy}
                          onClick={() => inputRef.current?.click()}
                        >
                          <Images size={17} />
                          端末から選ぶ
                        </button>
                      </div>
                    )}
                    <small>
                      撮影・選択した写真は位置情報を除いてJPEG化 ／ 最大12枚 ／
                      1枚10MBまで
                    </small>
                    <input
                      ref={cameraRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      aria-label="カメラで撮影した写真を取り込む"
                      hidden
                      onChange={(e) => addFiles(e.target.files)}
                    />
                    <input
                      ref={inputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      multiple
                      aria-label="端末から既存の写真を選ぶ"
                      hidden
                      onChange={(e) => addFiles(e.target.files)}
                    />
                  </div>
                  <div className="input-row">
                    <label>
                      お子さまの呼び名
                      <input
                        value={childName}
                        maxLength={16}
                        onChange={(e) => setChildName(e.target.value)}
                        placeholder="例：はるちゃん"
                        disabled={!!busy}
                      />
                    </label>
                    <span className="optional-note">
                      新聞のタイトルに使います。
                    </span>
                  </div>
                  <label className="note-label">
                    今週のひとこと<span>任意</span>
                    <textarea
                      value={note}
                      maxLength={500}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="例：週末は近くの公園へ。どんぐり拾いに夢中でした。"
                      rows={2}
                      disabled={!!busy}
                    />
                  </label>
                  <button
                    className="button primary generate"
                    onClick={() => generate("live")}
                    disabled={
                      !!busy ||
                      !photos.length ||
                      !childName.trim() ||
                      !config?.aiConfigured
                    }
                  >
                    <Sparkles size={18} />
                    AI編集長におまかせする
                    <ArrowRight size={18} />
                  </button>
                  <p className="privacy-note">
                    <ShieldCheck size={14} />
                    写真は選定・記事作成のためOrcaRouterに送信します。
                  </p>
                  {!config?.aiConfigured && (
                    <p className="setup-note">
                      実写真のAI編集はAPIキー設定後に利用できます。
                    </p>
                  )}
                </section>
                <aside className="inspiration">
                  <div className="sample-card">
                    <div className="sample-card-top">
                      <span>こんな新聞が届きます</span>
                      <span className="tiny-label">A4 / 1 PAGE</span>
                    </div>
                    <div className="mini-paper">
                      <div className="mini-kicker">THE LITTLE FAMILY TIMES</div>
                      <h2>孫ニュースペーパ</h2>
                      <div className="mini-rule">
                        はるちゃんの、ちいさな日常通信
                      </div>
                      <h3>
                        小さな発見が、
                        <br />
                        いっぱいの一週間。
                      </h3>
                      <img
                        src="/demo/park.svg"
                        alt="公園で遊ぶ子供のサンプルイラスト"
                      />
                      <div className="mini-columns">
                        <div>
                          <strong>公園で見つけた宝物</strong>
                          <p>
                            何気ない毎日にも、家族に伝えたいニュースがあります。
                          </p>
                        </div>
                        <div>
                          <strong>今日も、よく笑ったね。</strong>
                          <p>
                            その笑顔を、遠くにいるおじいちゃんとおばあちゃんへ。
                          </p>
                        </div>
                      </div>
                      <div className="mini-footer">
                        離れていても、いつも家族。
                      </div>
                    </div>
                    <p className="sample-caption">
                      ※ イラストを使ったサンプル紙面です
                    </p>
                    <button
                      className="text-button"
                      disabled={!!busy || !childName.trim()}
                      onClick={() => generate("demo")}
                    >
                      サンプルで体験する
                      <ArrowUpRight size={17} />
                    </button>
                  </div>
                  <div className="how-note">
                    <span>
                      <Sparkles size={19} />
                    </span>
                    <div>
                      <h3>あなたは、最後に見てあげるだけ。</h3>
                      <p>
                        AIが写真選びと記事づくりをお手伝い。
                        <br />
                        お届けする前に、必ず確認・承認できます。
                      </p>
                    </div>
                  </div>
                </aside>
              </>
            ) : (
              <>
                <section className="preview-section">
                  <div className="preview-toolbar">
                    <div>
                      <span className="square-icon">
                        <Newspaper size={19} />
                      </span>
                      <h2>わが家の、今週号。</h2>
                      <span
                        className={`status-tag ${approved ? "approved" : ""}`}
                      >
                        {paper.order
                          ? "デモ注文済み"
                          : approved
                            ? "承認済み"
                            : "確認待ち"}
                      </span>
                    </div>
                    <span className="tiny-label">A4 縦・1ページ</span>
                  </div>
                  <div className="paper-desk">
                    <PaperPreview paper={livePaper} />
                  </div>
                  <div className="preview-bottom">
                    <span>
                      {paper.source === "demo"
                        ? "サンプル生成（AI未使用）"
                        : `OrcaRouter · ${paper.model}`}
                    </span>
                    <span>第 {paper.revision} 版</span>
                  </div>
                </section>
                <aside className="review-panel">
                  {editing ? (
                    <section className="panel-card editor">
                      <div className="panel-title">
                        <Pencil size={18} />
                        <h2>紙面を編集する</h2>
                      </div>
                      <label>
                        メイン見出し
                        <input
                          maxLength={32}
                          value={draft.headline}
                          onChange={(e) =>
                            setDraft((d) => ({
                              ...d,
                              headline: e.target.value,
                            }))
                          }
                        />
                      </label>
                      <label>
                        はじめの文章
                        <textarea
                          maxLength={120}
                          rows={3}
                          value={draft.intro}
                          onChange={(e) =>
                            setDraft((d) => ({ ...d, intro: e.target.value }))
                          }
                        />
                      </label>
                      {draft.articles.map((a, i) => (
                        <div className="article-editor" key={i}>
                          <div className="editor-number">
                            ARTICLE 0{i + 1}
                            {draft.articles.length > 1 && (
                              <button
                                aria-label={`記事 ${i + 1}を削除`}
                                onClick={() =>
                                  setDraft((d) => ({
                                    ...d,
                                    articles: d.articles.filter(
                                      (_, j) => i !== j,
                                    ),
                                  }))
                                }
                              >
                                <X size={15} />
                              </button>
                            )}
                          </div>
                          <label>
                            掲載写真
                            <select
                              value={a.photoId}
                              onChange={(e) =>
                                updateArticle(i, "photoId", e.target.value)
                              }
                            >
                              {paper.photos.map((p, j) => (
                                <option
                                  key={p.id}
                                  value={p.id}
                                  disabled={draft.articles.some(
                                    (other, k) =>
                                      k !== i && other.photoId === p.id,
                                  )}
                                >
                                  写真 {j + 1}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label>
                            記事の見出し
                            <input
                              maxLength={28}
                              value={a.headline}
                              onChange={(e) =>
                                updateArticle(i, "headline", e.target.value)
                              }
                            />
                          </label>
                          <label>
                            本文
                            <textarea
                              maxLength={180}
                              rows={5}
                              value={a.body}
                              onChange={(e) =>
                                updateArticle(i, "body", e.target.value)
                              }
                            />
                          </label>
                        </div>
                      ))}
                      <label>
                        家族へのひとこと
                        <textarea
                          maxLength={100}
                          rows={3}
                          value={draft.message}
                          onChange={(e) =>
                            setDraft((d) => ({ ...d, message: e.target.value }))
                          }
                        />
                      </label>
                      <button
                        className="button primary"
                        disabled={!!busy}
                        onClick={save}
                      >
                        <Check size={17} />
                        変更を保存
                      </button>
                      <button
                        className="text-button"
                        disabled={!!busy}
                        onClick={() => {
                          setEditing(false);
                          setDraft(structuredClone(paper));
                        }}
                      >
                        変更を取り消す
                      </button>
                    </section>
                  ) : (
                    <>
                      <section className="panel-card">
                        <div className="panel-title">
                          <Sparkles size={19} />
                          <h2>
                            {approved
                              ? "お届けの準備ができました"
                              : "今週号が、できました。"}
                          </h2>
                        </div>
                        <p className="panel-description">
                          {approved
                            ? "この版の新聞は承認済みです。PDFにして印刷するか、模擬郵送を体験できます。"
                            : "写真と記事を確認してください。言葉を少し直したり、写真を差し替えたりできます。"}
                        </p>
                        <div className="selected-label">
                          {paper.source === "demo"
                            ? "サンプルの掲載写真"
                            : "AIが選んだ写真"}
                          <span>{paper.articles.length}枚</span>
                        </div>
                        <div className="selected-photos">
                          {paper.articles.map((a, i) => (
                            <div key={a.photoId}>
                              <img
                                src={
                                  paper.photos.find((p) => p.id === a.photoId)
                                    ?.dataUrl
                                }
                                alt={`掲載写真 ${i + 1}`}
                              />
                              <span>0{i + 1}</span>
                            </div>
                          ))}
                        </div>
                        <details className="selection-reasons">
                          <summary>写真の選定理由を見る</summary>
                          {paper.articles.map((a, i) => (
                            <p key={a.photoId}>
                              <strong>0{i + 1}</strong> {a.reason}
                            </p>
                          ))}
                        </details>
                        {!paper.order && (
                          <button
                            className="button secondary wide"
                            disabled={!!busy}
                            onClick={() => {
                              setDraft(structuredClone(paper));
                              setEditing(true);
                              setDelivery(false);
                            }}
                          >
                            <Pencil size={16} />
                            記事・写真を編集する
                          </button>
                        )}
                        {!approved ? (
                          <>
                            <label className="approval-check">
                              <input
                                type="checkbox"
                                checked={confirmed}
                                onChange={(e) => setConfirmed(e.target.checked)}
                              />
                              <span>
                                写真・記事を確認しました。
                                <br />
                                この内容で家族に届けます。
                              </span>
                            </label>
                            <button
                              className="button primary wide"
                              disabled={!confirmed || !!busy}
                              onClick={approve}
                            >
                              <Check size={18} />
                              この紙面を承認する
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              className="button primary wide"
                              disabled={!!busy}
                              onClick={download}
                            >
                              <Download size={17} />
                              A4 PDFをダウンロード
                            </button>
                            <p className="small-note">
                              PDFを開いて、ご自宅のプリンターで印刷できます。
                            </p>
                            <button
                              className="button secondary wide"
                              disabled={!!busy || !!paper.order}
                              onClick={() => setDelivery((v) => !v)}
                            >
                              <Send size={16} />
                              {paper.order
                                ? "デモ注文を受け付けました"
                                : "印刷・郵送を試す"}
                              <span className="demo-tag">DEMO</span>
                            </button>
                          </>
                        )}
                      </section>
                      {delivery && (
                        <form
                          className="panel-card delivery-form"
                          onSubmit={order}
                        >
                          <h2>お届け先</h2>
                          <p className="demo-notice">
                            模擬注文です。実際の印刷・郵送や請求は発生しません。デモ用の宛先でお試しください。
                          </p>
                          <label>
                            お名前
                            <input
                              required
                              maxLength={60}
                              value={recipient.name}
                              onChange={(e) =>
                                setRecipient((r) => ({
                                  ...r,
                                  name: e.target.value,
                                }))
                              }
                              placeholder="例：山田 花子"
                            />
                          </label>
                          <label>
                            郵便番号
                            <input
                              required
                              inputMode="numeric"
                              pattern="[0-9]{3}-?[0-9]{4}"
                              maxLength={8}
                              value={recipient.postalCode}
                              onChange={(e) =>
                                setRecipient((r) => ({
                                  ...r,
                                  postalCode: e.target.value,
                                }))
                              }
                              placeholder="100-0001"
                            />
                          </label>
                          <label>
                            住所
                            <input
                              required
                              maxLength={180}
                              value={recipient.address}
                              onChange={(e) =>
                                setRecipient((r) => ({
                                  ...r,
                                  address: e.target.value,
                                }))
                              }
                              placeholder="都道府県・市区町村・番地・建物名"
                            />
                          </label>
                          <button
                            className="button primary wide"
                            disabled={!!busy}
                            type="submit"
                          >
                            <Send size={16} />
                            模擬注文を確定する
                          </button>
                        </form>
                      )}
                      {paper.order && (
                        <div className="order-success">
                          <ShieldCheck size={25} />
                          <h3>家族へのお届けを、体験しました。</h3>
                          <p>{paper.order.message}</p>
                          <code>{paper.order.id}</code>
                        </div>
                      )}
                      <div className="review-note">
                        <Leaf size={18} />
                        <p>
                          大きな出来事じゃなくても。
                          <br />
                          いつもの笑顔が、いちばんのニュース。
                        </p>
                      </div>
                      <button
                        className="text-button"
                        disabled={!!busy}
                        onClick={newIssue}
                      >
                        <RefreshCw size={15} />
                        新しい号をつくる
                      </button>
                    </>
                  )}
                </aside>
              </>
            )}
          </div>
          <footer className="page-footer">
            <span>
              孫ニュースペーパ<span>離れていても、いつも家族。</span>
            </span>
            <span>
              CRAFTED WITH AI & FAMILY LOVE <Heart size={12} />
            </span>
          </footer>
        </main>
      </div>
      {toast && (
        <div className="toast" role="status">
          <Check size={18} />
          {toast}
        </div>
      )}
    </div>
  );
}
