#!/usr/bin/env node
/**
 * 顧客ワイヤー（Phase2 画面設計の正本）をモックの public/ にコピーする。
 *
 * 使い方:
 *   git -C ../ship_sams-project pull --ff-only   # 先に正本を最新化しておく（本スクリプトは pull しない）
 *   npm run wireframes:sync
 *
 * 取込元は環境変数 WIREFRAME_SOURCE で変更できる。
 *
 * - 正本は読むだけで、書き換えない
 * - 相対参照（../_data/*.js 等）を壊さないよう、フォルダ構成とファイル名を保ってコピーする
 * - アダプタが登録されたワイヤーにだけ、連携用 script を </head> の直前に注入する
 * - 一覧画面用に manifest.json を出力する
 *
 * 出力: public/wireframes/phase2/（.gitignore 対象。顧客の了承なしに公開しない）
 */
import { execFileSync } from 'child_process';
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'fs';
import { dirname, join, relative, resolve, sep } from 'path';
import { WIREFRAME_ADAPTERS } from './wireframe-adapters.mjs';

const ROOT = resolve(import.meta.dirname, '..');
const SOURCE = resolve(
  process.env.WIREFRAME_SOURCE || join(ROOT, '..', 'ship_sams-project', 'docs', 'design', 'screen', 'phase2'),
);
const DEST = join(ROOT, 'public', 'wireframes', 'phase2');
const BRIDGE_DIR = join(ROOT, 'public', 'wireframe-bridge');

/** コピーしないもの。OLD は旧版置き場、.md は正本側の管理用メモ */
const isExcluded = (name, isDir) => (isDir ? name === 'OLD' : name === '.DS_Store' || name.endsWith('.md'));

const warnings = [];
const warn = (msg) => warnings.push(msg);

const toPosix = (p) => p.split(sep).join('/');

/** 版数と、その後ろの注記（例: _v1.0（案））。key・画面名・版数の抽出で共通に使う */
const VERSION_SUFFIX = /_v(\d+(?:\.\d+)*)(?:（[^）]*）|\([^)]*\))?$/;

const safeDecode = (ref) => {
  try {
    return decodeURI(ref);
  } catch {
    return ref;
  }
};

function walk(dir) {
  const files = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (isExcluded(entry.name, entry.isDirectory())) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walk(full));
    else files.push(full);
  }
  return files;
}

function git(args) {
  try {
    // --no-optional-locks: git status が正本の .git/index を書き換えないようにする
    return execFileSync('git', ['--no-optional-locks', '-C', SOURCE, ...args], { encoding: 'utf8' }).trim();
  } catch {
    return '';
  }
}

/** ファイル名から種別を判定する */
function kindOf(fileName) {
  if (/^(操作UI|UI操作ワイヤー)/.test(fileName)) return 'interactive';
  if (/操作マニュアル|リーフレット/.test(fileName)) return 'document';
  return 'static';
}

/** 画面名: 種別の接頭辞・日付・版数を除いたもの */
function screenNameOf(baseName) {
  return baseName
    .replace(/^(操作UI|UI操作ワイヤー|UIワイヤー|画面ワイヤー①_SE向け)_/, '')
    .replace(/^\d{6}_/, '')
    .replace(VERSION_SUFFIX, '');
}

function injectScripts(html, htmlPath, adapterFile) {
  const fromDir = dirname(htmlPath);
  const rel = (file) => toPosix(relative(fromDir, join(BRIDGE_DIR, file)));
  const tags =
    `<script src="${rel(join('adapters', adapterFile))}"></script>` + `<script src="${rel('bridge.js')}"></script>`;
  // 説明部分を本文の描画前に隠すため head に入れる（bridge.js 側は DOMContentLoaded 後に本文を触る）
  const at = html.indexOf('</head>');
  return at < 0 ? tags + html : html.slice(0, at) + tags + html.slice(at);
}

/** ワイヤーが相対パスで読み込む script の src 一覧 */
const localScriptRefs = (html) =>
  [...html.matchAll(/<script[^>]+src="(?!https?:|data:|\/\/)([^"']+)"/g)].map((m) => m[1]);

/** ワイヤーが相対パスで読み込むファイルが、コピー先に揃っているか */
function checkRelativeRefs(html, htmlRelPath) {
  for (const ref of localScriptRefs(html)) {
    if (!existsSync(join(DEST, dirname(htmlRelPath), safeDecode(ref)))) {
      warn(`参照先が見つかりません: ${htmlRelPath} → ${ref}`);
    }
  }
}

function main() {
  if (!existsSync(SOURCE) || !statSync(SOURCE).isDirectory()) {
    console.error(`取込元が見つかりません: ${SOURCE}\n環境変数 WIREFRAME_SOURCE で場所を指定してください。`);
    process.exit(1);
  }

  const source = {
    path: SOURCE,
    branch: git(['rev-parse', '--abbrev-ref', 'HEAD']),
    commit: git(['rev-parse', '--short', 'HEAD']),
    committedAt: git(['log', '-1', '--format=%cI']),
    // -z で日本語パスを引用符なしで受け取る（引用符付きだと .DS_Store の除外判定が効かない）
    // コピー対象外（.md・OLD）は数えない。リネームは -z だと旧パスが別要素になるため、状態記号付きの要素だけ数える
    uncommitted: git(['status', '--porcelain', '-z', '--', '.', ':!*.md', ':!**/OLD/**'])
      .split('\0')
      .filter((line) => /^[ MADRCU?!]{2} /.test(line) && !line.endsWith('.DS_Store')),
  };
  if (source.uncommitted.length) {
    warn(`正本に未コミットの変更が ${source.uncommitted.length} 件あります（取り込んだ内容がリモートと一致しない可能性があります）`);
  }

  // 一覧を先に作ってから消す（途中で失敗しても出力先が空にならないように）
  const sourceFiles = walk(SOURCE);
  rmSync(DEST, { recursive: true, force: true });
  mkdirSync(DEST, { recursive: true });

  const adapterByKey = new Map(WIREFRAME_ADAPTERS.map((a) => [a.key, a]));
  const usedAdapterKeys = new Set();
  const wireframes = [];
  const htmlFiles = [];

  for (const src of sourceFiles) {
    const relPath = relative(SOURCE, src);
    const dest = join(DEST, relPath);
    mkdirSync(dirname(dest), { recursive: true });
    if (!src.endsWith('.html')) {
      cpSync(src, dest);
      continue;
    }

    const fileName = relPath.split(sep).pop();
    const baseName = fileName.replace(/\.html$/, '');
    const key = toPosix(relPath).replace(/\.html$/, '').replace(VERSION_SUFFIX, '');
    const kind = kindOf(fileName);
    const adapter = adapterByKey.get(key) ?? null;
    const html = readFileSync(src, 'utf8');

    if (adapter) {
      usedAdapterKeys.add(key);
      // グローバルは共有データ（_data/*.js 等）側で定義されることもあるので、読み込む JS も含めて探す
      const code = [html]
        .concat(localScriptRefs(html).map((ref) => join(dirname(src), safeDecode(ref))).filter(existsSync).map((f) => readFileSync(f, 'utf8')))
        .join('\n');
      for (const name of adapter.globals ?? []) {
        if (!new RegExp(`(?:var|let|const|function)\\s+${name.replace(/\$/g, '\\$')}\\b`).test(code)) {
          warn(`アダプタの前提が崩れています: ${fileName} に ${name} がありません（${adapter.adapter} の見直しが必要）`);
        }
      }
      const injected = injectScripts(html, dest, adapter.adapter);
      writeFileSync(dest, injected);
      htmlFiles.push({ relPath, html: injected });
    } else {
      // 連携しないものは読み書きせずそのまま複製する（文字コードを変えないため）
      cpSync(src, dest);
      htmlFiles.push({ relPath, html });
    }

    const parts = toPosix(relPath).split('/');
    wireframes.push({
      key,
      path: toPosix(relPath),
      category: parts[0],
      subCategory: parts.length > 2 ? parts.slice(1, -1).join(' / ') : '',
      fileName,
      screenName: screenNameOf(baseName),
      version: baseName.match(VERSION_SUFFIX)?.[1] ?? '',
      kind,
      adapter: adapter?.adapter ?? null,
      sizeKB: Math.round(statSync(src).size / 1024),
    });
  }

  for (const { relPath, html } of htmlFiles) checkRelativeRefs(html, relPath);
  // 旧版を OLD に移し忘れると、同じ画面が版違いで並ぶ
  const byKey = new Map();
  for (const w of wireframes) byKey.set(w.key, [...(byKey.get(w.key) ?? []), w]);
  for (const [key, list] of byKey) {
    if (list.length > 1) warn(`同じ画面の版が複数あります: ${key}（${list.map((w) => w.fileName).join(' / ')}）`);
  }
  for (const a of WIREFRAME_ADAPTERS) {
    if (!usedAdapterKeys.has(a.key)) warn(`アダプタの対象ワイヤーが正本にありません: ${a.key}（${a.adapter}）`);
  }

  wireframes.sort((a, b) => a.path.localeCompare(b.path, 'ja'));
  const manifest = { syncedAt: new Date().toISOString(), source, wireframes, warnings };
  writeFileSync(join(DEST, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');

  const count = (k) => wireframes.filter((w) => w.kind === k).length;
  console.log(`取込元: ${SOURCE}`);
  console.log(`正本: ${source.branch} @ ${source.commit}（${source.committedAt}）`);
  console.log(
    `コピー: HTML ${wireframes.length} 本（操作 ${count('interactive')} / 静的 ${count('static')} / 説明資料 ${count('document')}）、連携あり ${usedAdapterKeys.size} 本`,
  );
  console.log(`出力先: ${relative(ROOT, DEST)}/`);
  if (warnings.length) {
    console.warn(`\n警告 ${warnings.length} 件:`);
    for (const w of warnings) console.warn(`  - ${w}`);
  }
}

main();
