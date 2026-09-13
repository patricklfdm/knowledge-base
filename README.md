# Patrick 的全栈开发知识库

中文工程教材，采用 Markdown + Obsidian + Quartz 5。公开正文在 `content/`；路线从 [全栈基础](content/roadmaps/fullstack-foundations.md) 开始。私密材料须存放于整个仓库之外。

开发与验收见 [检查命令](docs/knowledge-base/VALIDATION.md)，接手从 [AGENTS.md](AGENTS.md) 与 [STATE](docs/knowledge-base/codex/STATE.md) 开始。使用 `.nvmrc` 对应 Node，并准备 [Java 示例要求的 JDK 21.0.11](examples/java-basics/README.md)。已有 `JAVA_HOME` 须指向该 JDK；也可给门禁命令单独设置 `KB_JAVA_HOME`，不改全局默认版本。然后运行：

```sh
npm ci
npm ci --prefix examples/typed-trips
npm run quartz -- plugin install --from-config
npm run kb:verify
```

本地预览：`npm run quartz -- build --serve`。当前用户要求验证后自动推送既有 v5，直到另行说明；浏览器验收暂缓，具体范围见 [执行规则](docs/knowledge-base/codex/OPERATING_MODEL.md)。本地检查通过不代表同 SHA 部署成功。

---

# Quartz v5

> “[One] who works with the door open gets all kinds of interruptions, but [they] also occasionally gets clues as to what the world is and what might be important.” — Richard Hamming

Quartz is a set of tools that helps you publish your [digital garden](https://jzhao.xyz/posts/networked-thought) and notes as a website for free.

🔗 Read the documentation and get started: https://quartz.jzhao.xyz/

[Join the Discord Community](https://discord.gg/cRFFHYye7t)

## Sponsors

<p align="center">
  <a href="https://github.com/sponsors/jackyzha0">
    <img src="https://cdn.jsdelivr.net/gh/jackyzha0/jackyzha0/sponsorkit/sponsors.svg" />
  </a>
</p>
