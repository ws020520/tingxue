# 归棠小说阅读器 v3 整合版

技术栈：Vue 3 + Vite + Pinia + Dexie + IndexedDB。

这一版把旧单文件版功能重新整合到工程化版本：书架、导入、DOCX、文件夹、阅读器、目录分卷、封面工坊、设置、GitHub 同步、旧版 library.json 迁移、AI 续写、润色、订正、改写、扩写、缩写、对白增强、章节诊断、AI 对话、创作记忆、人物卡、风格样本、伏笔线索、AI 草稿箱。

## 本地运行

```bash
npm install
npm run dev
```

## 部署到 GitHub Pages

```bash
npm install
npm run build
```

把 `dist/` 里的内容上传到 GitHub Pages 发布目录。

## 注意

- API Key、GitHub Token 只在应用设置页输入，保存在本地 IndexedDB，不要写入源码。
- DOCX 使用浏览器本地解析，不上传文件。
- 旧版单文件 HTML 已放在 `public/legacy-index.html` 作为参考，不参与运行。
