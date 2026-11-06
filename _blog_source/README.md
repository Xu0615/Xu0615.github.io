# xuwang · A growing research notebook

Public site: https://xu0615.github.io/blog/

Writing desk: https://xu0615.github.io/blog/editor/

## Writing

1. Open the writing desk. Click a category or folder to browse its documents, including documents in nested folders. The sidebar search includes titles, tags, folder paths and Markdown bodies.
2. Click **＋ 新建** or the **＋** beside any category/folder to create a Markdown document or nested folder, or import `.md` files. Documents open in **阅读** mode. **编辑** opens Markdown and live preview side by side; **预览** expands the rendered document. Each document keeps its own editing undo history for the current session.
3. Drafts, folder changes, favorites and the recoverable trash are saved locally in your browser. Images are staged in IndexedDB. Right-click a document (or use **···**) to rename, duplicate, move, copy Markdown or a published link, export `.md`, favorite, or move it to the trash. **导出全部内容** creates a JSON backup including drafts, folders, trash and staged images, without credentials.
4. Connect GitHub using a fine-grained personal access token scoped only to `Xu0615.github.io`, with **Contents: Read and write** and **Issues: Read and write**. Leave **记住此设备** checked on your own trusted device: the token is encrypted with a non-extractable AES-GCM key and stored in a separate IndexedDB database. The desk reconnects automatically after refresh or reopening the browser. The token is never included in article drafts, exports or commits. **断开并忘记此设备** removes it. Clearing browser data, expiration, or revocation requires connecting again. Same-origin script can use the stored key, so this does not protect against a compromised browser or site. Uncheck the option for memory-only use. The connection check probes an unattached Git blob to verify the token has actual Contents write permission; the account-level push flag alone is insufficient.
5. **发布文章** commits the current article, any referenced new images, the category index, prerendered pages, Markdown sources, and sitemap together. Other local drafts are not published. GitHub Pages rebuilds automatically. A missing Issues permission leaves a visible comment warning but does not block article publishing. Permission, expiry, network and rate-limit errors have distinct messages; temporary network failures do not erase the saved connection. The desk waits for the public content revision and shows a link when it is live.

Drag documents or folders into categories/folders to move them; drag a document to the top/bottom edge of another document to reorder it. Mouse dragging gives target feedback and scrolls the directory at its edges. **移动到…** offers the same destination selection on touch devices and by keyboard. Folder cycles and nesting beyond 20 levels are rejected. Moves preserve article URLs and comment threads; copies get a new URL and independent comment thread. **撤销移动** reverses the latest move until another structural operation supersedes it.

**发布目录** publishes category/folder edits, positions, ordering and deletions without publishing any draft bodies. **发布文章** publishes only the selected draft plus pending directory changes. Removals are listed for confirmation. Trash is local and recoverable; restoring a document preserves its text as a draft that can be published again. Deletion keeps the GitHub discussion and Git history. **管理栏目** adds, renames, rearranges and deletes empty categories; move or delete both documents and folders before removing a category. **更多设置** edits the date and URL ID (new documents only).

Shortcuts: Cmd/Ctrl+S saves, Cmd/Ctrl+Enter publishes, Cmd/Ctrl+E switches editing/preview, F2 renames the selected document/folder, and `/` focuses search. Escape closes menus or cancels dragging. The existing draft store is migrated in place; the encrypted device connection remains separate and unchanged.

Comments are stored in per-article GitHub Issues. Visitors comment using GitHub; the website displays public comments. Public GitHub API limits or connectivity may temporarily affect loading; the direct discussion link remains available. No analytics or advertising services are added to the blog.

Markdown supports code highlighting and copying, KaTeX math (`$...$`, `$$...$$`), images, tables, Mermaid diagrams, footnotes/references, links, and task lists. Raw HTML and executable links are disabled. The writing guide creates a local-only example covering the syntax. Chinese and English content are supported. The reader UI offers language and light/dark controls.

Lesson 1 also supports three trusted interactive teaching figures. Use a fenced block with language `mllm-sae` and exactly one of `flow`, `training`, or `dictionary` as its content. Both the writing desk preview and public article render the same component. The figures are bundled, local-only simulations; they do not run model weights or accept arbitrary executable HTML/JavaScript. Unknown block contents remain inert highlighted code. Static hook tables and explanations remain readable without JavaScript. Implementation: `src/sae-lesson.js` and `src/sae-lesson.css`.

## Source and deployment

The existing academic homepage is preserved. The new site lives under `/blog/` in the same repository and uses its existing GitHub Pages/Jekyll publishing configuration. Additions are static files; no server, OAuth client secret, or third-party CMS is required.

`blog/content.json` is the canonical public content. This source folder begins with an underscore so Jekyll does not publish development files. `content.json` here is only the initial seed. The build always prefers `../blog/content.json` so a design rebuild cannot accidentally reset online edits.

Requirements: Node.js 20.19+ or 22+, pnpm.

```sh
cd _blog_source
pnpm install
pnpm build
pnpm dev
```

Preview: http://127.0.0.1:4173/blog/

After changing the design, copy `dist/` into the repository's `blog/` folder and commit. Do not delete uploaded images or overwrite `blog/content.json` with the initial seed. Existing published images are carried into the build automatically.

```sh
pnpm test
```

Tests cover Markdown and sanitization, bilingual search, folder validation and cycles, draft migration, nested moves and undo, copy identity, trash recovery, publication isolation, static rendering, device connections, atomic Git publishing, and concurrent-edit rejection. No forced branch update is used.

## Recovery

- An expired/revoked token does not erase drafts. Reconnect to publish.
- If another editor changed the public content, publishing stops. Use **同步 GitHub**, compare your local draft with the latest public article, and publish deliberately.
- Browser storage is local to its browser/profile/device. Export a backup before clearing browsing data.
- All published versions are recoverable through Git history.
- Search engines can read complete article HTML without JavaScript. `/blog/sitemap.xml` is generated on every publish; Jekyll's sitewide sitemap also discovers the static article pages. Indexing is controlled by each search engine.

The opening posts are editable topic introductions, not imported private research notes or claims of completed experiments.
