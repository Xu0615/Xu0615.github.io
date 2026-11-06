> 这是 Data Scaling 专题的开篇序言。先整理问题，再让阅读和实验逐步填满它。

## 从数量走向结构

关于数据，我希望同时记录两个视角：规模如何变化，以及数据本身如何组成。数量、质量、配比与重复，都值得被拆开讨论。

## 想持续追问的问题

- 在固定预算下，如何比较不同的数据选择？
- 总体指标改善时，哪些子任务发生了变化？
- 一个经验规律适用于什么范围？在什么条件下可能失效？
- 如何记录数据处理过程，让一次实验能够被理解和复现？

## 阅读的起点

Kaplan 等人的工作研究了语言模型损失与模型规模、数据量和训练计算量之间的经验关系。[^kaplan] Chinchilla 工作进一步研究了给定计算预算时，模型参数量与训练 token 数的分配。[^chinchilla]

这两篇文章可以作为入口。后续笔记会区分论文中的结果、实验设定，以及在其他场景下仍需验证的推断。

## 记录的方法

给每次比较留下完整上下文：数据来源、处理方法、混合比例、训练预算、评估集，以及没有被解决的问题。

[^kaplan]: Kaplan et al. (2020). [Scaling Laws for Neural Language Models](https://arxiv.org/abs/2001.08361).
[^chinchilla]: Hoffmann et al. (2022). [Training Compute-Optimal Large Language Models](https://arxiv.org/abs/2203.15556).
