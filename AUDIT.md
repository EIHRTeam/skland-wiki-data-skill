# Skill 审查报告：skland-wiki-data

审查日期：2026-05-05
审查依据：skill-creator 规则

---

## 一、结构合规 ✓

| 检查项 | 状态 | 备注 |
|--------|------|------|
| SKILL.md frontmatter（name + description） | ✓ | 中英文版本均有 |
| SKILL.md < 500 行 | ✓ | 68 行，远低于上限 |
| references/ 目录 | ✓ | 8 个文件，渐进式排列 |
| scripts/ 目录 | ✓ | 4 个脚本，全部通过语法检查 |
| assets/ 目录 | ✓ | 3 个 fixture 文件 |
| agents/ 目录 | ✓ | `openai.yaml`（Codex 适配） |
| CI/CD 发布流程 | ✓ | GitHub Actions，含冒烟测试 |

---

## 二、Description 触发力 — 需改进

当前 description 是**事实罗列型**，skill-creator 建议 description 应稍微"pushy"以对抗 Claude 的**低触发倾向**。

### 当前 description（中文版）

> 处理 SKLand Wiki 公开数据格式……在 wiki JSON 与 XML 之间转换、解析或渲染 wiki 物品数据、构建基于 XML 的编辑/DataSource/管线工作流、检查或操作 DocumentModel 类型系统、或验证 XML 结构时使用。

### 问题

只描述了"做什么"，缺少用户可能使用的**口语化触发短语**。Claude 在简单查询时可能跳过此 skill。

### 建议补充的触发上下文

- 用户提到 "skland"、"wiki 数据"、"item/info"
- 用户拿到一个 JSON 文件想看内容
- 用户想把 wiki 内容存到 git 仓库里做版本管理
- 用户问 XML 标签的含义或颜色代码

---

## 三、参考文件层级 — 两个问题

### 问题 1：两个"顺序阅读"列表重复

SKILL.md 中存在两个重叠的阅读指引：

```
## 最简工作流          ← 表格，按任务匹配
1. 00-overview
2. 任务对应的参考文档

## 按顺序阅读这些参考文档  ← 又一个列表
1. 00-overview
2. 06-terminology
3. 02-xml-format
4. 任务特定参考文档
```

两个列表指向相同的文件但顺序不同，会让模型困惑。**建议合并为一个**，保留"先读 00 + 06，再按任务读"的逻辑。

### 问题 2：大文件缺目录

| 文件 | 行数 | 是否需要目录 |
|------|------|-------------|
| `03-document-model-ir.md` | 314 行 | **是** — 已超 300 行建议 |
| `02-xml-format-and-cheatsheet.md` | 270 行 | 接近，可选 |

---

## 四、写作风格 — 偏刚性

skill-creator 的核心原则："Try to explain to the model **why** things are important in lieu of heavy-handed musty MUSTs."

当前 SKILL.md 的"硬性规则"部分全部是命令式：

- "不要编写未经验证的结论"
- "不要重命名协议标识符"
- "禁止使用 probably、maybe……"

### 问题

没有解释 **why**。模型不理解动机时，在边界情况下会机械执行或完全忽略。

### 建议改写示例

| 当前 | 建议 |
|------|------|
| 不要编写未经验证的结论 | `@eihrteam/xml` 的实现行为是最终仲裁者。如果文档和代码冲突，以代码为准。未经验证的结论会导致下游工具产生错误输出。 |
| 不要重命名协议标识符 | 协议标识符（字段名、XML 标签名、函数名）是跨系统通信的契约。重命名会导致 API 调用失败或数据丢失。用英文解释含义，但保留原始字面量。 |
| 禁止使用 probably、maybe…… | 这些词表示你不确定。如果你不确定，读者更不确定。要么验证，要么明确说"未确认"。 |

---

## 五、测试与评估 — 完全缺失

| 检查项 | 状态 |
|--------|------|
| `evals/evals.json` | ❌ 不存在 |
| 测试用例 | ❌ 无 |
| 评估工作区 | ❌ 无 |
| description 优化 | ❌ 未执行 |

这是最大的缺口。skill-creator 的核心循环是 **draft → test → review → improve → repeat**，当前 skill 跳过了测试环节。

---

## 六、其他细节

| 项目 | 状态 | 备注 |
|------|------|------|
| 使用示例 | ❌ 缺失 | SKILL.md 无 input/output 示例 |
| CLAUDE.md 与 SKILL.md 术语一致性 | ⚠ | CLAUDE.md 用"硬约束"，SKILL.md 用"硬性规则"，reference 用"不要推断" |
| `agents/openai.yaml` | ✓ | 仅 Codex 接口元数据，结构正确 |
| `draft/skill-zh-cn/` 与原版同步 | ✓ | 已反映 1272 权威来源更新 |

---

## 优先级汇总

| 优先级 | 改进项 | 原因 |
|--------|--------|------|
| **P0** | 创建 evals 并跑测试 | skill-creator 核心循环，无法跳过 |
| **P1** | 优化 description 触发力 | 直接影响 skill 被调用的概率 |
| **P1** | 合并两个阅读列表 | 消除模型困惑 |
| **P2** | 软化写作风格，补充 why | 提升模型在边界情况下的判断力 |
| **P2** | 为 03-document-model-ir.md 添加目录 | 超过 300 行建议 |
| **P3** | 补充使用示例 | 帮助模型理解预期输出格式 |
