export function editorMarkup(header) {
  return `${header}<main id="main" class="editor-shell desk-v2" data-mode="read">
    <aside class="editor-sidebar" aria-label="写作目录">
      <div class="desk-title"><span class="eyebrow">YOUR WRITING DESK</span><h2>写作台<span>✳</span></h2></div>
      <button class="solid-button" id="new-post" aria-haspopup="menu">＋ 新建 <span>⌄</span></button>
      <label class="desk-search"><span class="sr-only">搜索文档</span><span aria-hidden="true">⌕</span><input id="desk-search" type="search" placeholder="搜索文档与正文…" autocomplete="off"><kbd>/</kbd></label>
      <div class="tree-caption"><span>我的目录</span><div><button id="collapse-tree" title="折叠全部目录" aria-label="折叠全部目录">⇤</button><button id="manage-categories" title="管理栏目" aria-label="管理栏目">⚙</button></div></div>
      <nav id="editor-tree" aria-label="栏目、文件夹与文档"></nav>
      <div id="structure-pending" hidden><span id="structure-count"></span><button id="publish-structure" class="quiet-button">发布目录 ↗</button><button id="undo-move" class="text-link" hidden>撤销移动</button></div>
      <div class="desk-utilities"><button id="show-favorites">☆ 收藏</button><button id="show-trash">回收站 <span id="trash-count">0</span></button></div>
      <div class="desk-bottom"><button class="text-link" id="connect-github">连接 GitHub ↗</button><button class="text-link" id="export-backup">导出全部内容 ↓</button><button class="text-link" id="help-toggle">写作指南与快捷键 ↗</button><span id="connection-status">未连接 · 可在本机写作</span></div>
    </aside>
    <section class="editor-workspace">
      <div class="editor-topbar"><button id="toggle-tree" class="icon-button" title="显示或隐藏目录" aria-label="显示或隐藏目录">☰</button><nav id="desk-breadcrumb" aria-label="当前位置"></nav><div class="document-actions" hidden><div class="view-switch" aria-label="文档视图"><button data-view="read" aria-pressed="true">阅读</button><button data-view="edit" aria-pressed="false">编辑</button><button data-view="preview" aria-pressed="false">预览</button></div><button id="document-menu" class="quiet-button" aria-label="文档更多操作" aria-haspopup="menu">···</button><button id="publish-post" class="solid-button">发布文章 ↗</button></div></div>
      <div id="collection-view"></div>
      <div id="document-view" hidden>
        <div id="draft-conflict" class="draft-conflict" hidden>远端文章有更新。此处保留你的本机草稿；发布将覆盖远端正文。可从更多操作打开公开版本对照。</div>
        <header id="reader-heading"></header>
        <div class="post-settings"><label class="title-label"><span class="sr-only">文章标题</span><input id="post-title" placeholder="给这篇笔记一个标题…" maxlength="180"></label><input id="post-summary" aria-label="文章摘要" placeholder="用一句话介绍这篇笔记…" maxlength="400"><div class="settings-row"><label>栏目 <select id="post-category"></select></label><label>文件夹 <select id="post-folder"></select></label><label>语言 <select id="post-language"><option value="zh-CN">中文</option><option value="en">English</option></select></label><label>标签 <input id="post-tags" placeholder="用逗号分隔"></label><button class="quiet-button" id="more-settings">更多设置 ▾</button></div><div id="extra-settings" hidden><label>固定网址 ID <input id="post-slug" placeholder="my-new-note" pattern="[a-z0-9-]+"></label><label>日期 <input id="post-date" type="date"></label><label>GitHub 评论 Issue <input id="post-issue" type="number" min="1" placeholder="首次发布自动创建"></label><button id="delete-post" class="danger-button">移入回收站</button></div></div>
        <div class="format-toolbar" aria-label="Markdown 格式工具"><button data-insert="heading" title="标题">H₂</button><button data-insert="bold" title="粗体"><b>B</b></button><button data-insert="italic" title="斜体"><em>I</em></button><span></span><button data-insert="link" title="链接">↗ 链接</button><button id="upload-image" title="上传图片">▧ 图片</button><input id="image-file" type="file" accept="image/png,image/jpeg,image/webp,image/gif" hidden><button data-insert="code" title="代码">&lt;/&gt;</button><button data-insert="math" title="公式">∑</button><button data-insert="table" title="表格">▦</button><button data-insert="diagram" title="流程图">◇</button><button data-insert="footnote" title="参考文献">[1]</button><div class="toolbar-right"><label><input id="sync-scroll" type="checkbox" checked> 同步滚动</label><button id="mobile-pane">切换预览</button></div></div>
        <div class="split-editor"><section class="source-pane"><div class="pane-label"><span>MARKDOWN</span><span>⌘ / Ctrl S 保存</span></div><div id="code-editor"></div></section><section class="preview-pane"><div class="pane-label"><span id="preview-label">READING / 阅读</span><span id="word-count"></span></div><div id="markdown-preview" class="prose"></div></section></div>
      </div>
      <div class="editor-statusbar"><span id="save-status" role="status">正在打开写作台…</span><span id="publish-status" aria-live="polite"></span><span id="publish-warning" role="status"></span></div>
    </section>
  </main><input id="markdown-import" type="file" accept=".md,.markdown,text/markdown,text/plain" multiple hidden><dialog id="editor-dialog"></dialog><div id="desk-context-menu" role="menu" aria-label="文档操作" hidden></div><div class="toast" id="toast" role="status" hidden></div>`;
}
