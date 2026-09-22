import { readFile } from "node:fs/promises";

const token = process.env.QIITA_ACCESS_TOKEN;
const expectedUser = process.env.QIITA_EXPECTED_USER || "t-ry";

if (!token) {
  console.error(
    JSON.stringify({
      published: false,
      message: "QIITA_ACCESS_TOKEN is not configured in .env",
    }),
  );
  process.exit(1);
}

async function qiita(path, options = {}) {
  const response = await fetch(`https://qiita.com/api/v2${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message =
      payload.message ||
      payload.type ||
      `Qiita API returned ${response.status}`;
    throw new Error(message);
  }
  return payload;
}

async function main() {
  const markdown = await readFile("docs/qiita-draft.md", "utf8");
  const [heading, ...bodyLines] = markdown.split("\n");
  if (!heading.startsWith("# ") || bodyLines.length === 0) {
    throw new Error("Qiita draft must start with a level-one heading");
  }

  const title = heading.slice(2).trim();
  const body = bodyLines.join("\n").trimStart();
  const user = await qiita("/authenticated_user");
  if (user.id !== expectedUser) {
    throw new Error(
      `Qiita account mismatch: expected ${expectedUser}, received ${user.id}`,
    );
  }

  const items = await qiita("/authenticated_user/items?page=1&per_page=100");
  const existing = items.find((item) => item.title === title);
  if (existing) {
    const item = await qiita(`/items/${existing.id}`, {
      method: "PATCH",
      body: JSON.stringify({
        title,
        body,
        private: false,
        tags: ["AI", "React", "JavaScript", "ハッカソン", "OrcaRouter"].map(
          (name) => ({ name, versions: [] }),
        ),
      }),
    });
    console.log(
      JSON.stringify({ published: true, updated: true, url: item.url }),
    );
    return;
  }

  const item = await qiita("/items", {
    method: "POST",
    body: JSON.stringify({
      title,
      body,
      private: false,
      tags: ["AI", "React", "JavaScript", "ハッカソン", "OrcaRouter"].map(
        (name) => ({ name, versions: [] }),
      ),
    }),
  });

  console.log(
    JSON.stringify({ published: true, existing: false, url: item.url }),
  );
}

main().catch((error) => {
  console.error(JSON.stringify({ published: false, message: error.message }));
  process.exitCode = 1;
});
