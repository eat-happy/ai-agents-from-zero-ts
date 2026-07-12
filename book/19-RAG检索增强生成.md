# 19 - RAG 检索增强生成


<!-- TS-TRACK-BANNER -->
> **TypeScript 轨道说明**：本章由 [ai-agents-from-zero](https://github.com/didilili/ai-agents-from-zero) 原文迁移。中文概念保留；代码示例已改为 **TypeScript / LangChain.js / LangGraph.js**。
> 可运行精校示例见仓库根目录 `examples/` 与 `apps/shop-query-agent/`。自动迁移的代码块若与最新 SDK API 有差异，以可运行示例为准。


---

**本章课程目标：**

- 把 [第 2 章 RAG-搭建企业私有/个人知识库](2-RAG-搭建企业私有&个人知识库.md) 里建立的 RAG 与知识库直觉，继续推进到 LangChain 代码实现层。
- 掌握 LangChain 中构建 RAG 最常见的几类组件：**文档加载器、文本分割器、嵌入模型、向量数据库、检索器、提示词模板与聊天模型**。
- 跑通并理解本章全部案例：**多种文档加载、文本切分、Redis 向量检索、完整 RAG 智能运维助手**，把 [第 18 章 向量数据库与 Embedding 实战](18-向量数据库与Embedding实战.md) 的内容真正串成一个可落地的问答系统。

**学习建议：** RAG 最好分成两段看：离线把文档处理成可检索知识，在线根据用户问题召回并组装上下文。读本章时可以用两种颜色标出来：哪些代码属于“建库”，哪些代码属于“问答”。文档加载、切分、Embedding、向量库、Prompt 这些组件的位置清楚了，换任何框架都能读懂。

**官方文档与资源**：详见 [工具导航与参考资料索引 - RAG与向量检索](工具导航与参考资料索引.md#RAG与向量检索)。

---

## 1、RAG 简介

### 1.1 定义

> 如果你已经读过 [第 2 章](2-RAG-搭建企业私有&个人知识库.md)，那么这里可以不再从“知识库产品怎么用”重新讲起，而是直接把 RAG 放回代码语境里理解。

**RAG（Retrieval-Augmented Generation，检索增强生成）**，本质上是一种“**先检索，再生成**”的应用架构。用户提问后，系统不会立刻只靠大模型自身记忆回答，而是先从外部知识库中检索相关材料，再把这些材料与问题一起交给大模型生成答案。

到了工程实现层，本章更关心的是下面这些问题：

- 外部知识在代码里以什么对象表示
- 文档为什么要先加载、再切块、再向量化
- 向量库和检索器分别负责哪一步
- 检索结果最终怎么进入 Prompt 或消息上下文

所以可以把本章看作：**把第 2 章里的知识库问答体验，翻译成 LangChain 里的数据结构与组件流水线。**

### 1.2 RAG 的作用

这一点在 [第 2 章](2-RAG-搭建企业私有&个人知识库.md) 里已经从产品角度讲过：

RAG 主要是在解决 **知识冻结、私有知识缺失、最新信息不可用、回答缺少依据** 这类问题。

本章不再重复展开，而是把重点前移到一个更适合开发者的问题上：**既然已经知道要用 RAG，那么代码里到底是哪些环节决定了回答质量？**

从工程视角看，影响效果最明显的通常不是“有没有接上向量库”这么简单，而是：

- 文档是否被正确加载
- 文本是否被合理切块
- Embedding 是否稳定
- 检索是否召回了真正相关的片段
- Prompt 是否把上下文用对了

和其他方案的关系，仍然可以用下面这张表快速回顾：

| 方案           | 本质                   | 优势                     | 局限                                |
| -------------- | ---------------------- | ------------------------ | ----------------------------------- |
| **直接问模型** | 不接外部知识，直接生成 | 上手最快                 | 容易不知道私有 / 最新知识，幻觉较多 |
| **RAG**        | 先检索资料，再生成     | 更新快、改动小、可追溯   | 依赖文档质量、分块策略、检索效果    |
| **微调**       | 调整模型参数           | 能改变回答风格、任务习惯 | 成本高、更新慢，不适合高频改知识    |
| **RAG + 微调** | 外部知识 + 参数适配    | 兼顾知识与表达           | 成本和系统复杂度更高                |

同时也要知道，**RAG 不是没有代价的万能方案**。在真实项目里，它通常会带来几个现实权衡：

- **响应时延更高**：每次问答前都要多做一次检索，有时还会经过过滤、重排等步骤。
- **Token 消耗更高**：检索结果会进入 Prompt，召回内容越多，送给模型的上下文越长。
- **效果依赖链路质量**：文档质量、切块策略、Embedding 质量、检索效果、Prompt 约束方式，都会影响最终回答。

### 1.3 RAG 的标准流程

> 在 [第 2 章](2-RAG-搭建企业私有&个人知识库.md) 里，我们已经从产品与平台角度看过两阶段流程；这里换到 LangChain 代码视角，再把它重述一遍。

LangChain 官方文档通常也把 RAG 拆成两大阶段：**索引（Indexing）**、**检索与生成（Retrieval and Generation）**。

这不是为了重复，而是为了把“平台里的按钮和配置项”翻译成“代码里的组件与数据流”。

![RAG 完整数据流程：离线完成文档加载、切分、向量化和入库，在线完成问题检索、上下文组装与答案生成](images/19/19-1-3-1.png)

#### 1.3.1 索引阶段：先把知识库准备好

索引阶段面对的是“**原始文档**”，例如 Word、PDF、Markdown、TXT、CSV、JSON 等文件。它的目标不是回答问题，而是把这些文档处理成“**未来方便检索**”的形态。

> 你在第 2 章里看到的“上传文件、分段、建知识库”，放到代码里，基本就是这一阶段。

这一阶段通常包括：

1. **加载（Load）**：把原始文件读成 LangChain 的 `Document` 对象。
2. **分割（Split）**：把长文档切成较小的片段，便于后续向量化和检索。
3. **向量化（Embed）**：把每个文档片段转成向量。
4. **存储（Store）**：把“片段内容 + 向量 + 元数据”写入向量数据库。

![索引阶段细节示意](images/19/19-1-3-2.png)

这里有两个很容易忽略的点：

- **索引通常是离线做的**。  
  比如每天定时重建一次知识库，或在文档更新后增量写入；它不一定跟用户问答发生在同一时刻。

- **索引不只是“存文本”**。  
  它真正要存的是“**文本片段 + 向量表示 + metadata**”，这样后面才可能做相似检索、来源展示、条件过滤。

> **什么是 metadata？**  
> `metadata` 是和文档片段绑定的附加信息，例如文件路径 `source`、页码 `page`、标题、作者、日期、分类等。  
> 在 RAG 里，真正参与向量化的是正文 `page_content`；`metadata` 更多用于**来源展示、过滤条件、结果解释**。

#### 1.3.2 检索与生成阶段：每次提问时动态查资料

当用户真正发起问题时，系统进入第二阶段。这对应的就是第 2 章里“基于知识库提问 / 生成回答”的那部分能力，只不过这里我们要看清楚它在代码里究竟分成了哪几步：

1. 用户输入问题。
2. 把问题也向量化。
3. 去向量库里找最相似的文档片段。
4. 把这些片段作为 `context` 放进 Prompt。
5. 再把 `context + question` 一起发给大模型生成答案。

![检索阶段：查询向量化、相似检索、上下文组装与生成](images/19/19-1-3-3.png)

这一阶段的核心不是“再去建库”，而是“**拿已经建好的索引来查资料**”。也就是说：

- **索引阶段**：提前备好资料库。
- **检索阶段**：每次提问时现场查资料。

#### 1.3.3 管道式 RAG 与 Agent 式 RAG

本教程这一章，重点是最经典、最容易上手的 **管道式 RAG**。它与 LangChain 官方文档中的 **2-Step RAG** 是同一类思路：**先检索、再生成**，流程由代码固定，而非由模型临时决策。

它的特点很明确：每次用户提问，系统都会先检索一次；是否检索不由模型临时决定，而是由你的代码流程提前写死；整体结构通常也是“检索器 + 提示词模板 + 聊天模型”的固定流水线。

这类方案适用于：企业知识库问答、文档问答、规范 / 手册 / FAQ 检索增强。

如果要让“模型自己决定要不要检索、什么时候检索、检索几次”，那就更接近 **Agent 式 RAG**（对应官方文档中的 **Agentic RAG**）。更完整的智能体编排会在后续 [第 21 章 Agent 智能体](21-Agent智能体.md) 等章节展开；先把本章这种**两阶段、单次检索、单次生成**的主线学扎实更重要。

#### 1.3.4 一个更贴近生产环境的增强版流程

如果只是入门，先把握前面的“两阶段”即可；但从真实项目角度看，很多 RAG 系统会在“检索与生成”之间再补几步，让结果更稳。第 2 章里你已经在 Dify 里看到了 Top K、Rerank、混合检索这些参数，这里可以把它们和代码链路对上：

1. **先召回候选片段**：检索器不一定只有向量检索，也可能是关键词、混合检索。
2. **再做过滤或重排**：按 `metadata` 过滤范围，或用 reranker 对候选片段重新打分。
3. **最后再进 Prompt**：把更少但更相关的片段送给模型，而不是把一大堆噪声上下文都塞进去。
4. **生成后保留来源**：真实项目里常常会返回文件名、页码、片段来源，便于核验。
5. **持续做评测与观测**：离线看召回命中率、答案质量，线上看检索链路和生成链路谁在掉链子。

所以，**RAG 不等于“向量库 + 大模型”这么简单**。更完整的理解应该是：**数据处理、检索策略、上下文组织、答案生成、来源追踪与效果评测**共同组成了一条工程链路。

---

## 2、RAG 文本处理核心知识

### 2.1 LangChain 组件与标准流程

RAG 并不是某一个单独类就能完成的功能，它更像一条由多个组件拼起来的流水线。LangChain 的价值，正是在于它把这些组件都统一成了较一致的接口，方便我们按步骤搭起来。

本章最常见的组件分工如下：

| 组件           | 作用                                              | 常见类 / 说明                                                    |
| -------------- | ------------------------------------------------- | ---------------------------------------------------------------- |
| **Document**   | LangChain 中统一的文档对象                        | 由 `page_content` + `metadata` 组成                              |
| **文档加载器** | 从 TXT、PDF、Word、Markdown、JSON、CSV 等读入文档 | `TextLoader`、`PyPDFLoader`、`UnstructuredWordDocumentLoader` 等 |
| **文本分割器** | 把长文档切成较小片段                              | `RecursiveCharacterTextSplitter` 最常见                          |
| **嵌入模型**   | 把文本片段转成向量                                | 本项目常见 `DashScopeEmbeddings`                                 |
| **向量数据库** | 存储向量并支持相似检索                            | Redis / RedisStack、Chroma、FAISS 等                             |
| **检索器**     | 用户提问时从向量库召回相关片段                    | 常见由 `vector_store.as_retriever()` 得到                        |
| **提示词模板** | 把检索结果和用户问题组织成 Prompt                 | `PromptTemplate`、`ChatPromptTemplate`                           |
| **聊天模型**   | 基于上下文生成最终答案                            | `ChatOpenAI`、`init_chat_model()` 等                             |

用面试里的说法，可以这样概括整个流程：

1. 用**文档加载器**把原始文件转成 `Document`。
2. 用**文本分割器**把长文档切成多个片段。
3. 用**嵌入模型**把片段转成向量，并写入**向量数据库**。
4. 用户提问时，把问题拿去做向量检索，得到相关片段。
5. 把片段作为上下文，和用户问题一起填进 Prompt。
6. 调用大模型，得到最终答案。

![RAG 从检索到生成的完整数据流](images/19/19-2-1-1.svg)

#### 2.1.1 from_documents 与 add_texts：两种常见的入库方式

你在本仓库里会同时看到两种写法：`from_documents(...)`、`add_texts(...)`

它们都能把内容写入向量库，但适合的输入形态和工程语义不一样。

| 方法                 | 更适合什么场景                      | 你手里通常有什么数据       | 常见理解                   |
| -------------------- | ----------------------------------- | -------------------------- | -------------------------- |
| **`from_documents`** | 已经完成“加载 + 分割”之后的一步入库 | `Document` 列表            | 更像“把文档片段整批建库”   |
| **`add_texts`**      | 已经有向量库实例，需要持续追加内容  | 字符串列表 + 可选 metadata | 更像“往现有索引里追加文本” |

可以把它们看作两种数据入口，并不冲突，只取决于**你手里现在是 `Document` 列表还是纯文本列表**：

- **文档流驱动**：`Loader -> Splitter -> List[Document] -> from_documents(...)`（典型 RAG 建索引）
- **纯文本流驱动**：`texts + metadata -> add_texts(...)`（接口落库、增量追加、脱离 Loader 的实验）

#### 2.1.2 结合本章案例理解

本仓库里正好有两个很典型的案例，可以把这两个方法的区别讲得很清楚。

**第一类：`from_documents`，对应完整 RAG 链路**

在综合案例 EmbeddingRagLLM.ts 里，流程是：

1. 用 `Docx2txtLoader` 加载 `alibaba-java.docx`
2. 用 `CharacterTextSplitter` 切分文档
3. 得到一批切好的 `Document`
4. 调用 `Redis.from_documents(...)` 直接写入向量库

这种写法非常贴近“真正的 RAG 业务流程”，因为：

- 你的知识原本就在文档里
- 文档先经过加载和切分
- 入库时保留了 `Document` 结构
- 后续可以自然衔接 `as_retriever()`

也就是说，`from_documents(...)` 更像是“**把已经准备好的知识片段整批建成索引**”。

**第二类：`add_texts`，对应单独演示向量库存取**

在 `RedisVectorStore.ts` 里，案例没有先走 Loader 和 Splitter，而是直接给出一组字符串 `texts` 与对应的 `metadata`，再按两步完成写入：

1. 先创建 `RedisVectorStore`；
2. 再调用 `add_texts(texts, metadata)` 写入。

这种写法更像是在演示：

- 向量库本身如何使用
- 纯文本如何批量入库
- 已有索引如何继续追加内容

所以它更适合拿来理解“**向量存储层怎么工作**”，也更适合做一些小规模实验、增量写入、脱离文档加载器的独立入库逻辑。

#### 2.1.3 再往后一步：检索案例和它们是什么关系

`RedisVectorStore_SimilaritySearch.ts` 虽然和上面两个文件放在一起，但它所在的其实是 **RAG 的检索阶段**，不是索引阶段。

它和前面两种写入方式的关系是：

1. 先通过 `from_documents(...)` 或 `add_texts(...)` 把数据写进向量库
2. 再通过 `similarity_search_with_score(...)` 去查库

所以这三个案例可以连起来理解成：

- `RedisVectorStore.ts`：怎么把文本写进去
- `RedisVectorStore_SimilaritySearch.ts`：怎么把相关内容查出来
- `EmbeddingRagLLM.ts`：怎么把“查出来的内容”再喂给大模型完成回答

这样看，三者就不是零散的小例子，而是 RAG 完整链路的三个片段。

#### 2.1.4 入门时怎么选

如果你是刚开始学，建议按下面的顺序理解：

1. **先把 `add_texts(...)` 看懂**  
   因为它更直接，容易理解“文本 -> 向量 -> 向量库”这件事。

2. **再看 `from_documents(...)`**  
   因为它更贴近真实 RAG 项目，能把“文档加载、文本切分、向量化入库”串起来。

3. **最后把它们放回完整案例里理解**  
   你会发现：RAG 的重点从来不只是“把内容存进去”，而是“存进去以后，如何在提问时检索出来，并和 Prompt、LLM 结合起来”。

【案例源码】`cases-langchain/10-rag/RedisVectorStore.ts`（写入文本并存入 Redis）

[RedisVectorStore.py](cases-langchain/10-rag/RedisVectorStore.ts ":include :type=code")

【案例源码】`cases-langchain/10-rag/RedisVectorStore_SimilaritySearch.ts`（相似性检索）

[RedisVectorStore_SimilaritySearch.py](cases-langchain/10-rag/RedisVectorStore_SimilaritySearch.ts ":include :type=code")

### 2.2 文档加载器（Document Loaders）

RAG 的第一步，往往不是“接模型”，而是“**把你的知识读进来**”。文档加载器的职责，就是把不同来源的数据统一转换成 LangChain 的 `Document` 格式。

LangChain 官方对文档加载器的定位很明确：它们为不同数据源提供了统一读取接口，最终都转成 `Document`。因此，无论你面对的是本地文件、企业文档平台、网页、数据库还是第三方系统，后续都能用统一方式进入切分、向量化和检索流程。

先记住两个统一接口就够了：

- `load()`：一次性加载全部文档
- `lazy_load()`：按需流式加载，适合大文件或大批量数据

#### 2.2.1 统一成 Document 的意义

`Document` 是 LangChain 在 RAG 里的基础数据结构，它通常有两个核心字段：

- `page_content`：正文内容
- `metadata`：来源、页码、文件名、分类等附加信息

有些实现或版本里，你还会看到可选的 `id` 字段，用来标识文档或文档片段。这样设计的好处是，后面的分割器、向量库、检索器都不需要关心“这段内容最初来自 PDF 还是 CSV”，它们只需要面向统一的 `Document` 处理即可。

这也是为什么你会经常看到这样的链路：

**原始文件 -> Loader -> List[Document] -> TextSplitter -> VectorStore**

![文档加载器继承关系示意](images/19/19-2-2-1.jpeg)

#### 2.2.2 如何选择加载器

选择加载器时，不要一开始就背几十个类名，先抓住两个原则：

1. **先按文件类型选**
   - TXT 用 `TextLoader`
   - PDF 用 `PyPDFLoader`
   - Word 用 `UnstructuredWordDocumentLoader` 或 `Docx2txtLoader`
   - Markdown 用 `UnstructuredMarkdownLoader`
   - JSON 用 `JSONLoader`
   - CSV 用 `CSVLoader`

2. **再按解析精度和成本选**
   - 想快速跑通案例，优先选依赖少、接口直接的加载器
   - 想保留更丰富版面结构、标题层级、表格信息，再考虑更强的解析器

比如本章综合案例 `EmbeddingRagLLM.ts` 用的是 `Docx2txtLoader`，因为它足够直接、适合快速把 `alibaba-java.docx` 读入并跑通端到端 RAG；

而单独的 Word 加载案例 `RagLoadDocDemo.ts` 则使用了 `UnstructuredWordDocumentLoader`，更适合说明“不同文件格式可以统一进入 RAG 流程”。

如果以后你在真实项目里遇到更复杂的 PDF、扫描件、表格型文档，通常还会引入 OCR、版面分析工具、专门的 PDF 解析服务等更强的方案。这部分已经超出本章案例范围，但你需要先建立一个判断：**RAG 效果好不好，很多时候不是模型先出问题，而是文档解析质量先决定了一半。**

#### 2.2.3 文档加载器案例

下面这些案例都在 `10-rag/docloads/` 目录下，建议你按文件格式逐个跑一遍。学习重点不是死记类名，而是观察：**无论加载什么文件，输出都会进入同一种 `Document` 结构。**

- **TXT（纯文本）**

【案例源码】`cases-langchain/10-rag/docloads/RagLoadTxtDemo.ts`

[RagLoadTxtDemo.py](cases-langchain/10-rag/docloads/RagLoadTxtDemo.ts ":include :type=code")

- **PDF**

【案例源码】`cases-langchain/10-rag/docloads/RagLoadPdfDemo.ts`

[RagLoadPdfDemo.py](cases-langchain/10-rag/docloads/RagLoadPdfDemo.ts ":include :type=code")

- **Word（.docx）**

【案例源码】`cases-langchain/10-rag/docloads/RagLoadDocDemo.ts`

[RagLoadDocDemo.py](cases-langchain/10-rag/docloads/RagLoadDocDemo.ts ":include :type=code")

- **Markdown**

【案例源码】`cases-langchain/10-rag/docloads/RagLoadMarkdownDemo.ts`

[RagLoadMarkdownDemo.py](cases-langchain/10-rag/docloads/RagLoadMarkdownDemo.ts ":include :type=code")

- **JSON**

【案例源码】`cases-langchain/10-rag/docloads/RagLoadJsonDemo.ts`

[RagLoadJsonDemo.py](cases-langchain/10-rag/docloads/RagLoadJsonDemo.ts ":include :type=code")

- **CSV**

【案例源码】`cases-langchain/10-rag/docloads/RagLoadCSVDemo.ts`

[RagLoadCSVDemo.py](cases-langchain/10-rag/docloads/RagLoadCSVDemo.ts ":include :type=code")

### 2.3 文本分割器（Text Splitters）

文档加载之后，通常还不能直接拿去建 RAG。原因很简单：**原始文档经常太长**。

这会带来两个现实问题：

- **检索效果差**：整篇文档太大，向量表达会过于粗糙，难以精确定位到真正相关的小段内容。
- **生成成本高**：就算检索回来整篇文档，也很可能塞不进模型上下文，或者把大量无关内容一并送给模型。

所以，RAG 中几乎都会有“**切块（chunking）**”这一步。

LangChain 官方也明确建议：面对通用文本时，`RecursiveCharacterTextSplitter` 往往是最推荐的入门分割器。它会尽量优先保留较大的语义单位，例如段落、句子；如果某一段还太长，再继续往更小层级切。

#### 2.3.1 为什么要切块

切块的本质，就是把大文档拆成多个更容易参与检索的小段。这样做之后，系统更容易只召回真正相关的片段，也更容易控制每次送给模型的上下文长度；无关内容变少后，干扰会下降，后面做来源标注和精确引用也会更方便。

在真实项目里，切块策略会直接影响 RAG 的最终效果。很多时候不是模型不行，而是：

- 块切得太大，相关信息被淹没
- 块切得太小，语义被切碎
- 没有重叠，导致一句话被拦腰截断

所以，**分割策略本身就是 RAG 质量的重要一环。**

还有一个很关键的现实点：即使某些大模型已经支持长上下文，也不意味着“把整篇文档直接塞进去”就是好方案。因为上下文越长，越容易混入无关信息，也越容易让真正关键的内容被稀释。RAG 里的“切块 + 检索”，本质上是在帮模型先做一轮信息筛选。

#### 2.3.2 常见分割器与适用场景

| 分割器                             | 作用                                                                 |
| ---------------------------------- | -------------------------------------------------------------------- |
| **RecursiveCharacterTextSplitter** | 通用首选，优先保持较大语义单位，必要时递归切得更细                   |
| **CharacterTextSplitter**          | 按指定分隔符切，简单直接                                             |
| **MarkdownHeaderTextSplitter**     | 按 Markdown 标题层级切分                                             |
| **HTMLHeaderTextSplitter**         | 按 HTML 标题结构切分                                                 |
| **TokenTextSplitter**              | 按 token 数控制块大小，更贴近模型上下文限制                          |
| **语义切分（Semantic Chunking）**  | 按语义变化切分，尽量让相关内容保留在同一块中，但成本更高、实现更复杂 |
| **代码类分割器**                   | 按函数、类、逻辑块切分代码文本                                       |

本章案例主线，还是以 **`RecursiveCharacterTextSplitter`** 为主，因为它最适合帮助你建立“分块”这件事的直觉。

这里补充一个真实项目里的判断：切分策略不是越高级越好，而是要看“值不值得”。像语义切分这种方案，理论上更有机会保留完整语义，但它往往需要额外的向量计算或更复杂的实现。对于初学者和大多数入门项目来说，先把 `RecursiveCharacterTextSplitter` 用好，通常比一开始就追求复杂切分更重要。

#### 2.3.3 重点参数理解

`RecursiveCharacterTextSplitter` 最常用的是下面几个参数：

| 参数              | 含义           | 实践理解                                      |
| ----------------- | -------------- | --------------------------------------------- |
| `chunk_size`      | 单块最大长度   | 块太大不利于检索，块太小又容易语义碎片化      |
| `chunk_overlap`   | 相邻块重叠长度 | 防止句子、语义被截断，常见取块大小的 10%～20% |
| `length_function` | 长度计算方式   | 默认常用 `len`，即按字符数；也可按 token 数   |
| `separators`      | 优先切分分隔符 | 决定先按段落、换行、句号还是更细粒度去切      |

对初学者来说，先把下面这条经验记住就够用了：

- **通用文档问答**：优先用 `RecursiveCharacterTextSplitter`
- **先调 `chunk_size` 和 `chunk_overlap`**
- **跑通后再逐步优化切分规则**

真实项目里，不存在一个“永远最优”的块大小。它和文档类型、语言、问答粒度、模型上下文长度都有关系。学习时先跑通主链路，再基于效果调参，是更现实的路线。

![chunk_size 每个块之间有一部分重叠](images/19/19-2-3-1.png)

#### 2.3.4 文本分割器案例

- **分割纯文本**

【案例源码】`cases-langchain/10-rag/textsplit/RecursiveTextSplitter.ts`

[RecursiveTextSplitter.py](cases-langchain/10-rag/textsplit/RecursiveTextSplitter.ts ":include :type=code")

- **分割纯文本（V2：验证重叠与完整性）**

【案例源码】`cases-langchain/10-rag/textsplit/RecursiveTextSplitterV2.ts`

[RecursiveTextSplitterV2.py](cases-langchain/10-rag/textsplit/RecursiveTextSplitterV2.ts ":include :type=code")

- **分割 Document 对象（先加载再分割）**

【案例源码】`cases-langchain/10-rag/textsplit/RecursiveDocumentSplitter.ts`

[RecursiveDocumentSplitter.py](cases-langchain/10-rag/textsplit/RecursiveDocumentSplitter.ts ":include :type=code")

这三个案例分别对应三种入口：

- `split_text()`：字符串 -> 字符串列表
- `create_documents()`：字符串列表 -> `Document` 列表
- `split_documents()`：`Document` 列表 -> 更小的 `Document` 列表

其中在真实 RAG 项目里，最常见的往往是最后一种，也就是：

**loader.load() -> split_documents() -> embeddings -> vector store**

### 2.4 进阶方向速览

入门管道跑通之后，真实项目里的优化通常会沿着下面几条线展开：

- **混合检索（Hybrid）**：关键词检索（如 BM25）与向量检索结合，缓解“专有名词、编号、错误码”等仅靠向量不够准的问题。
- **重排序（Rerank）**：先向量召回较多候选片段，再用交叉编码器等模型对「问题—片段」重新打分，提高最终送入 Prompt 的质量。
- **查询改写**：多查询扩展、HyDE 等，用额外一步改善问句与文档的匹配（常与 Agent 或固定预处理脚本结合）。
- **评测与观测**：准备一批「问题—期望引用片段或标准答」做回归；线上可用 [LangSmith](https://docs.langchain.com/langsmith/observability-llm-tutorial) 等工具追踪检索与生成全链路，定位是检索差还是 Prompt / 模型问题。

![RRF 重排序示意：融合多路检索结果的排名，缓解单一路径召回不稳的问题](images/19/19-2-4-1.png)

![高级 RAG 五维增强体系：从查询、索引、检索器、生成器和管道五个方向优化效果](images/19/19-2-4-2.png)

进一步看，生产级 RAG 的优化通常可以从五个方向入手：

| 方向   | 常见做法                            | 主要解决什么                     |
| ------ | ----------------------------------- | -------------------------------- |
| 查询侧 | 查询改写、多查询、HyDE              | 用户问法和文档说法对不上         |
| 索引侧 | 合理切块、Overlap、元数据、解析质量 | 入库内容太碎、太脏或缺少过滤字段 |
| 检索侧 | 向量检索、BM25、混合检索、RRF       | 单一路径召回不稳定               |
| 排序侧 | Rerank、阈值过滤、Top K 调整        | 候选片段多但质量参差不齐         |
| 生成侧 | 引用来源、上下文压缩、答案约束      | 回答不可信或上下文太长           |

学习时先把 Redis 向量检索链路跑通；等项目规模变大，再考虑 Milvus 这类专业向量库里的 HNSW、BM25、Analyzer、标量过滤和混合检索能力。

这些主题与 [第 21 章 Agent 智能体](21-Agent智能体.md)、后续 LangGraph 相关章节可以形成连续深入路线。

---

## 3、RAG 综合案例：智能运维助手

### 3.1 需求说明

本章综合案例的目标，不是做一个抽象的“百科问答”，而是做一个更贴近真实业务的场景：**智能运维助手**。

假设我们手里有一份错误码说明文档，例如 `alibaba-java.docx`，里面记录了各种错误码及含义。现在希望用户输入错误码后，系统能够：

- 理解用户的问题
- 去知识库里找到对应的错误码说明
- 基于检索到的内容生成可读答案

这类需求在真实项目里非常常见，因为：

- 企业内部的错误码通常是**私有知识**
- 文档会持续更新
- 不能指望通用大模型天然知道所有内部编码含义

所以它适合用 RAG 来做。

本案例的技术主线是：

- **文档来源**：`alibaba-java.docx`
- **嵌入模型**：阿里百炼向量模型
- **向量库**：Redis / RedisStack
- **大模型**：通义 / DeepSeek 等聊天模型
- **框架**：LangChain

### 3.2 Before：未使用 RAG 的局限

如果不做 RAG，只是直接问模型：

> `00000 和 A0001 分别是什么意思？`

模型可能出现几种情况：

- 根本不知道这些编码属于哪个系统
- 按通用语义胡乱猜测
- 给出似是而非、但无法核验的回答

这不是模型“笨”，而是因为这类知识通常不在它训练时稳定可得的公共语料里。也正因为如此，企业项目里很少把“私有知识问答”完全交给裸模型处理。

所以，真正的问题不是“模型会不会回答”，而是：**它回答时有没有看到你自己的业务文档。**

### 3.3 After：使用 RAG 的完整流程

【案例源码】`cases-langchain/10-rag/EmbeddingRagLLM.ts`

[EmbeddingRagLLM.py](cases-langchain/10-rag/EmbeddingRagLLM.ts ":include :type=code")

这个综合案例，基本把本章前面讲过的内容都串起来了。它的实际流程是：

1. 用 **`Docx2txtLoader`** 加载 `alibaba-java.docx`
2. 用 **`CharacterTextSplitter`** 把文档切成块
3. 用 **`DashScopeEmbeddings`** 把片段向量化
4. 用 **Redis 向量库** 存储这些片段
5. 用 **`as_retriever()`** 生成检索器
6. 用 **`PromptTemplate`** 组织 `context + question`
7. 用 **聊天模型** 基于检索结果生成最终答案

其中最值得注意的一行是：

```typescript
// [TS-PORT] Auto-migrated from Python example for TypeScript track. Prefer examples/ and POLISHED-CASES when APIs differ.
rag_chain = {"context": retriever, "question": RunnablePassthrough()} | prompt | llm


```

上面这一行用的是 [第 15 章 LCEL 与链式调用](15-LCEL与链式调用.md) 里的 **LCEL 管道**写法：把字典、`RunnablePassthrough`、Prompt 与 LLM 用 `|` 串成可执行链。它几乎就是“管道式 RAG”的缩影：

- `retriever` 根据用户问题去查知识库，产出 `context`
- `RunnablePassthrough()` 把原始问题继续往后传
- `prompt` 把 `context + question` 组装成提示词
- `llm` 读取提示词并生成答案

#### 3.3.1 贴近真实项目的原因

这个案例虽然规模不大，但已经具备了真实 RAG 项目的几个关键特征：

- **知识来自业务文档，而不是写死在 Prompt 里**
- **知识先入库，再在问答时动态检索**
- **回答依赖上下文，不再完全依赖模型记忆**
- **同一个问题，可以对比“有知识库”和“无知识库”的差异**

这正是很多企业项目的第一阶段形态：先做一个“能用、可验证、可扩展”的 RAG 原型，再逐步优化：

- 切块策略
- 检索条数 `k`
- Prompt 约束方式
- 来源展示
- 召回重排
- 多轮对话结合记忆

#### 3.3.2 本案例还有哪些值得你注意

1. **综合案例用的是 `CharacterTextSplitter`**  
   这能帮助你快速跑通流程；但在通用文本场景里，实际项目中更常见的首选仍然是 `RecursiveCharacterTextSplitter`。

2. **Prompt 里明确写了“如果文本中没有相关信息，请直接说明”**  
   这是 RAG 里常见的约束写法。因为检索不是百分百准确，Prompt 应该引导模型“基于上下文回答”，而不是脱离上下文自行发挥。

3. **脚本做了“有 RAG / 无 RAG”的对比演示**  
   这一点适合教学，也适合项目早期验证价值。只有做对比，你才更容易判断：问题究竟出在模型本身，还是出在检索链路。

4. **Redis 只是这个案例里的向量存储后端**  
   RAG 的本质不是绑定 Redis，而是“检索增强生成”这条流程。以后你换成 Chroma、FAISS、Milvus、PgVector，整体思路并不会变。

---

**章节思考题：**

1. 一个完整 RAG 系统里，哪些步骤属于离线建库，哪些属于在线问答？

   **参考思路：** 离线建库包括文档加载、清洗、切分、Embedding、入向量库；在线问答包括问题向量化、召回、重排、上下文组装、模型生成和答案返回。两段分清，排障会简单很多。

2. 文本切分为什么不是越细越好，也不是越大越好？

   **参考思路：** 太细会丢上下文，太大又会引入噪声并浪费 token。好的切分要兼顾语义完整、召回精度和上下文成本，必要时还要保留标题、层级和来源信息。

3. 如果 RAG 答案出现幻觉，你会如何判断是检索问题还是生成问题？

   **参考思路：** 先看召回片段是否包含答案依据。如果没召回到，查文档、切分、Embedding 和检索参数；如果召回到了但模型乱答，查 Prompt、引用约束、上下文排序和输出要求。

4. 为什么 RAG 需要保留来源和 metadata？

   **参考思路：** 来源能让答案可追溯，metadata 能支持过滤、排序、权限控制和排障。企业场景里，只答对还不够，还要知道依据来自哪里、是否有权限使用。

**本章小结：**

- **RAG 的本质**：不是训练模型，而是先检索外部知识，再让模型基于知识生成答案。
- **RAG 的两阶段**：索引阶段负责“准备知识库”，检索阶段负责“每次提问时动态查资料”（与官方文档中的 **2-Step RAG** 一致）。
- **本章的新增重点**：相比 [第 18 章](18-向量数据库与Embedding实战.md)，这一章补上了“文档从哪来、如何切块、如何把检索结果喂给模型”。
- **本章案例主线**：从多格式文档加载，到文本切分，再到 Redis 检索和智能运维助手，构成完整的入门版 RAG 系统；但真正上线时，效果还取决于文档质量、切块策略、召回、重排、Prompt 约束和评估闭环是否做扎实。
- 学完本章后，你应当能够：用“**索引阶段**”和“**检索与生成阶段**”两段式描述 RAG 的标准流程；知道文档加载器、文本分割器、Embedding、向量库、检索器、Prompt、聊天模型在 RAG 中各自负责哪一步；区分 **管道式 RAG** 和 **Agent 式 RAG** 的差别，并理解 RAG 质量由“文档、检索、生成、评估”共同决定。

**建议下一步：** 先把本章的文档加载、文本切分、综合案例至少各跑通一个，再回头对照 [第 18 章 向量数据库与 Embedding 实战](18-向量数据库与Embedding实战.md)，把“向量化 → 入库 → 检索”这条底层链路重新连一遍；如果你准备继续学习“什么时候固定写死检索流程，什么时候让系统自己决定是否检索”，就顺势进入 [第 21 章 Agent 智能体](21-Agent智能体.md)。
