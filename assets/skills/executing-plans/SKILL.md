---
name: executing-plans
version: 0.1.0
description: Use when partner provides a complete implementation plan to execute in controlled batches with review checkpoints - loads plan, reviews critically, executes tasks in batches, reports for review between batches
applies_to: [all]
priority: P0
usage_frequency: daily
depends_on: [writing-plans]
related: [subagent-driven-development, verification-before-completion]
---

# Executing Plans

## Overview

Load plan, review critically, execute tasks in batches, report for review between batches.

**Core principle:** Batch execution with checkpoints for architect review.

**Announce at start:** "I'm using the executing-plans skill to implement this plan."

## The Process

### Step 1: Load and Review Plan
1. Read plan file
2. Review critically - identify any questions or concerns about the plan
3. If concerns: Raise them with your human partner before starting
4. If no concerns: Create TodoWrite and proceed

### Step 2: Execute Batch
**Default: First 3 tasks**

For each task:
1. Mark as in_progress
2. Follow each step exactly (plan has bite-sized steps)
3. Run verifications as specified
4. Mark as completed

### Step 3: Report
When batch complete:
- Show what was implemented
- Show verification output
- Say: "Ready for feedback."

### Step 4: Continue
Based on feedback:
- Apply changes if needed
- Execute next batch
- Repeat until complete

### Step 5: Complete Development

After all tasks complete and verified:
- Announce: "I'm using the finishing-a-development-branch skill to complete this work."
- **REQUIRED SUB-SKILL:** Use superpowers:finishing-a-development-branch
- Follow that skill to verify tests, present options, execute choice

## When to Stop and Ask for Help

**STOP executing immediately when:**
- Hit a blocker mid-batch (missing dependency, test fails, instruction unclear)
- Plan has critical gaps preventing starting
- You don't understand an instruction
- Verification fails repeatedly

**Ask for clarification rather than guessing.**

## When to Revisit Earlier Steps

**Return to Review (Step 1) when:**
- Partner updates the plan based on your feedback
- Fundamental approach needs rethinking

**Don't force through blockers** - stop and ask.

## Remember
- Review plan critically first
- Follow plan steps exactly
- Don't skip verifications
- Reference skills when plan says to
- Between batches: just report and wait
- Stop when blocked, don't guess

## 反例（执行计划时不要这样）

| 反模式 | 原因 | 正确做法 |
|---|---|---|
| 跳过 verification step 直接做下一步 | 错误累积，最后调试代价巨大 | 严格按 plan 的 verify 命令走 |
| 看到 plan 有 bug 自己悄悄改 | 失去与计划撰写方的同步 | 中断并报告，让 plan 作者更新 |
| 一次跑完 20 步再统一报告 | 失去 checkpoint 价值 | 每 3-5 步报一次 |
| Step 实际花费 > 估算的 3 倍仍不停 | 信号没被捕获 | 第 2 倍时就停下来汇报 |
| 「我觉得这步可以省」 | 计划失效 | 任何省略都必须用户/plan 作者同意 |
