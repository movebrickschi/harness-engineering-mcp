---
name: brainstorming
version: 0.1.0
description: Use when creating or developing, before writing code or implementation plans - refines rough ideas into fully-formed designs through collaborative questioning, alternative exploration, and incremental validation. Don't use during clear 'mechanical' processes
applies_to: [all]
priority: P0
usage_frequency: daily
depends_on: []
related: [writing-plans, dev-understand]
---

# Brainstorming Ideas Into Designs

## Overview

Help turn ideas into fully formed designs and specs through natural collaborative dialogue.

Start by understanding the current project context, then ask questions one at a time to refine the idea. Once you understand what you're building, present the design in small sections (200-300 words), checking after each section whether it looks right so far.

## The Process

**Understanding the idea:**
- Check out the current project state first (files, docs, recent commits)
- Ask questions one at a time to refine the idea
- Prefer multiple choice questions when possible, but open-ended is fine too
- Only one question per message - if a topic needs more exploration, break it into multiple questions
- Focus on understanding: purpose, constraints, success criteria

**Exploring approaches:**
- Propose 2-3 different approaches with trade-offs
- Present options conversationally with your recommendation and reasoning
- Lead with your recommended option and explain why

**Presenting the design:**
- Once you believe you understand what you're building, present the design
- Break it into sections of 200-300 words
- Ask after each section whether it looks right so far
- Cover: architecture, components, data flow, error handling, testing
- Be ready to go back and clarify if something doesn't make sense

## After the Design

**Documentation:**
- Write the validated design to `docs/plans/YYYY-MM-DD-<topic>-design.md`
- Use elements-of-style:writing-clearly-and-concisely skill if available
- Commit the design document to git

**Implementation (if continuing):**
- Ask: "Ready to set up for implementation?"
- Use superpowers:using-git-worktrees to create isolated workspace
- Use superpowers:writing-plans to create detailed implementation plan

## Key Principles

- **One question at a time** - Don't overwhelm with multiple questions
- **Multiple choice preferred** - Easier to answer than open-ended when possible
- **YAGNI ruthlessly** - Remove unnecessary features from all designs
- **Explore alternatives** - Always propose 2-3 approaches before settling
- **Incremental validation** - Present design in sections, validate each
- **Be flexible** - Go back and clarify when something doesn't make sense

## 反例（不要这样用）

| 反模式 | 原因 | 正确做法 |
|---|---|---|
| 接到"加一个登录按钮"就拉 brainstorming | 机械操作，不需要探索 | 直接 dev-flow-oneliner-fe，30 秒搞定 |
| brainstorming 阶段就开始写代码 | 探索阶段不应产物 | 只产 markdown / 草图 / 选项对比 |
| 一上来就给"最终方案" | 没探索就跳到答案 | 至少给 2-3 个备选，让对方选 |
| 把 brainstorming 输出当 PRD | 探索 ≠ 规范 | 探索通过后再用 writing-plans 出 PRD |
| brainstorming 时反复加新功能 | 走样到 YAGNI 反面 | 严格收敛到最小价值 |
