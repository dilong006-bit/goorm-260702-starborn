import { defineConfig, loadEnv, type Plugin, type Connect } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";
import fs from "node:fs";
import type { ServerResponse } from "node:http";

const ROOT = path.dirname(fileURLToPath(import.meta.url));

/**
 * 로컬 개발용: Vite 개발 서버가 /api/* 요청을 받으면
 * 해당 Vercel 서버리스 함수(api/<name>.js)를 in-process로 실행한다.
 * (프로덕션에서는 Vercel 플랫폼이 api/*.js를 그대로 서버리스로 실행)
 */
function vercelApiDev(env: Record<string, string>): Plugin {
  return {
    name: "vercel-api-dev",
    apply: "serve", // dev 전용
    configureServer(server) {
      // .env.local 등의 값을 서버 측 process.env로 주입 (클라이언트 번들에는 미포함)
      for (const [k, v] of Object.entries(env)) {
        if (process.env[k] === undefined) process.env[k] = v;
      }

      server.middlewares.use(async (req, res, next) => {
        if (!req.url || !req.url.startsWith("/api/")) return next();

        const url = new URL(req.url, "http://localhost");
        const name = url.pathname.replace(/^\/api\//, "").replace(/\/+$/, "");

        // api/<name>.js 또는 api/<name>.jsx 찾기
        const candidates = [
          path.join(ROOT, "api", `${name}.js`),
          path.join(ROOT, "api", `${name}.jsx`),
          path.join(ROOT, "api", name, "index.js"),
        ];
        const file = candidates.find((p) => fs.existsSync(p));
        if (!file) return next();

        try {
          const query = Object.fromEntries(url.searchParams.entries());
          const body =
            req.method && !["GET", "HEAD"].includes(req.method)
              ? await readJsonBody(req)
              : {};

          // Vercel 핸들러 시그니처에 맞춘 req/res 어댑터
          const vreq = Object.assign(req, { query, body });
          const vres = adaptResponse(res);

          // 핸들러 수정 시 반영되도록 캐시 무효화(파일 mtime)
          const mtime = fs.statSync(file).mtimeMs;
          const mod = await import(`${pathToFileURL(file).href}?t=${mtime}`);
          await mod.default(vreq, vres);
        } catch (err) {
          // eslint-disable-next-line no-console
          console.error(`[vercel-api-dev] ${name} 실행 오류:`, err);
          if (!res.headersSent) {
            res.statusCode = 500;
            res.setHeader("content-type", "application/json; charset=utf-8");
            res.end(JSON.stringify({ error: "dev_handler_crashed" }));
          }
        }
      });
    },
  };
}

function adaptResponse(res: ServerResponse) {
  const r = res as ServerResponse & {
    status: (code: number) => typeof r;
    json: (obj: unknown) => typeof r;
  };
  r.status = (code: number) => {
    r.statusCode = code;
    return r;
  };
  r.json = (obj: unknown) => {
    if (!r.headersSent)
      r.setHeader("content-type", "application/json; charset=utf-8");
    r.end(JSON.stringify(obj));
    return r;
  };
  return r;
}

function readJsonBody(req: Connect.IncomingMessage): Promise<unknown> {
  return new Promise((resolve) => {
    let raw = "";
    req.on("data", (c) => (raw += c));
    req.on("end", () => {
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch {
        resolve({});
      }
    });
    req.on("error", () => resolve({}));
  });
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // prefix "" → .env.local의 모든 변수 로드(서버 전용 키 포함). config는 Node에서만 실행됨.
  const env = loadEnv(mode, ROOT, "");
  return {
    plugins: [react(), vercelApiDev(env)],
  };
});
