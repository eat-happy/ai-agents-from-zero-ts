/**
 * Auto-ported from Python case for TypeScript track.
 * Source: cases-langchain/09-embedding/Text2Embedding_CosSimilarity.py
 * Prefer the curated runnable examples under /examples when APIs differ.
 */

// [TS-PORT] 由原 Python 示例自动迁移，建议对照 examples/ 目录可运行版本精读
/* 
【案例】通过向量计算语义相似度：余弦相似度

对应教程章节：第 18 章 - 向量数据库与 Embedding 实战 → 5.2 案例：把多句话转成向量，再两两比较

知识点速览：
- 这个案例的重点不是特定模型，而是“向量一旦拿到手，就可以做数学比较”，这是语义检索的底层基础。
- 文本转成向量后，可用余弦相似度衡量两段文本的语义是否接近：值通常在 [-1, 1]，越接近 1 一般表示越相似。
- 公式：cos(theta) = (A·B) / (|A||B|)；在 Python 里常用 np.dot 和 np.linalg.norm 实现。
- 相似度比较常用于检索排序、文本去重、聚类、推荐等任务。
 */

import dashscope
import os
from http import HTTPStatus
import numpy as np
import "dotenv/config"

// dotenv/config loaded

// 准备多句文本，用于观察“语义越接近，相似度通常越高”
texts = ["我喜欢吃苹果", "苹果是我最喜欢吃的水果", "我喜欢用苹果手机"]

embeddings = []
// 这里选用多模态 embedding 接口来处理文本输入，主要是为了演示“拿到向量后如何做比较”
// 若你在真实项目里只处理文本，也完全可以换成常规文本 embedding 模型
for (const text of texts) {
    input_data = [{"text": text}]
    resp = dashscope.MultiModalEmbedding.call(
        model="multimodal-embedding-v1",
        apiKey:process.env.aliQwen-api,
        configuration: { baseURL:"https://dashscope.aliyuncs.com/compatible-mode/v1",
        input=input_data,
    )
    if (resp.status_code == HTTPStatus.OK) {
        embedding = resp.output["embeddings"][0]["embedding"]
        embeddings.append(embedding)


function cosine_similarity(vec1, vec2) {
    /* 计算两个向量的余弦相似度：点积 / (模长之积)，结果越接近 1 一般越相似 */
    dot_product = np.dot(vec1, vec2)
    norm_vec1 = np.linalg.norm(vec1)
    norm_vec2 = np.linalg.norm(vec2)
    return dot_product / (norm_vec1 * norm_vec2)


console.log("文本相似度比较结果:")
console.log("=" * 60)

for (const i of range(len(texts))) {
    for (const j of range(i + 1, len(texts))) {
        similarity = cosine_similarity(embeddings[i], embeddings[j])
        console.log(`文本{i+1} vs 文本{j+1}:`)
        console.log(`  文本{i+1}: {texts[i]}`)
        console.log(`  文本{j+1}: {texts[j]}`)
        console.log(`  余弦相似度: {similarity:.4f}`)
        console.log("-" * 40)

/* 
【输出示例】
文本相似度比较结果:
============================================================
文本1 vs 文本2:
  文本1: 我喜欢吃苹果
  文本2: 苹果是我最喜欢吃的水果
  余弦相似度: 0.9064
----------------------------------------
文本1 vs 文本3:
  文本1: 我喜欢吃苹果
  文本3: 我喜欢用苹果手机
  余弦相似度: 0.7656
----------------------------------------
文本2 vs 文本3:
  文本2: 苹果是我最喜欢吃的水果
  文本3: 我喜欢用苹果手机
  余弦相似度: 0.7421
----------------------------------------
 */
