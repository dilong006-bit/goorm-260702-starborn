// NASA APOD 이미지 same-origin 프록시.
// html-to-image 캡처 시 canvas taint(cross-origin)를 막기 위해
// NASA 도메인 이미지만 서버가 대신 받아 동일 출처로 스트림한다. 키 불필요.
export default async function handler(req, res) {
  const src = String(req.query.src ?? "");

  if (!/^https:\/\/([a-z0-9-]+\.)*nasa\.gov\//i.test(src)) {
    return res.status(400).json({ error: "bad_src" });
  }

  try {
    const r = await fetch(src);
    if (!r.ok) return res.status(502).json({ error: "upstream" });

    res.setHeader("content-type", r.headers.get("content-type") ?? "image/jpeg");
    res.setHeader("cache-control", "public, max-age=86400, immutable");

    const buf = Buffer.from(await r.arrayBuffer());
    return res.status(200).send(buf);
  } catch {
    return res.status(502).json({ error: "fetch_failed" });
  }
}
