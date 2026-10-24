import type { IssueView } from "./sdd.ts"
import { workflowLabelNames } from "./sdd.ts"
import { implementationBranch } from "./runner.ts"

const INVALID_STAGE = "段が不正です"

const GATE_STAGES = [
  "explore",
  "requirements",
  "design",
  "confirm",
  "reflect",
  "request",
] as const

export type GateStage = (typeof GATE_STAGES)[number]

export type GateResult =
  | { allowed: true }
  | { allowed: false; reason: string }

function rejectStage(message: string): never {
  throw new Error(message)
}

export function parseGateStage(text: string): GateStage {
  for (const stage of GATE_STAGES) {
    if (text === stage) {
      return stage
    }
  }
  rejectStage(INVALID_STAGE)
}

function hasWorkflowLabel(view: IssueView): boolean {
  return view.issue.labels.some((label) => workflowLabelNames.has(label))
}

function evaluateExplore(view: IssueView): GateResult {
  if (view.issue.state !== "open") {
    return { allowed: false, reason: "課題は閉じている" }
  }
  if (hasWorkflowLabel(view)) {
    return { allowed: false, reason: "実装のラベルが付いている" }
  }
  return { allowed: true }
}

function evaluateRequirements(view: IssueView): GateResult {
  if (view.issue.state !== "open") {
    return { allowed: false, reason: "課題は閉じている" }
  }
  if (hasWorkflowLabel(view)) {
    return { allowed: false, reason: "実装のラベルが付いている" }
  }
  if (view.specs.requirements === "invalid") {
    return { allowed: false, reason: "要件の見出しが不正である" }
  }
  return { allowed: true }
}

function evaluateDesignOrRequest(
  stage: "design" | "request",
  view: IssueView,
  currentBranch: string,
  issueNumber: number,
): GateResult {
  if (view.issue.state !== "open") {
    return { allowed: false, reason: "課題は閉じている" }
  }
  if (hasWorkflowLabel(view)) {
    return { allowed: false, reason: "実装のラベルが付いている" }
  }
  if (view.unanswered.length > 0) {
    return {
      allowed: false,
      reason: "未回答の確認があるため、設計には進まない",
    }
  }
  if (view.nextAnswer !== null) {
    return {
      allowed: false,
      reason: "まだ要求へ反映していない回答があるため、設計には進まない",
    }
  }
  if (view.specs.requirements === "missing") {
    return { allowed: false, reason: "要件が無い" }
  }
  if (view.specs.requirements === "invalid") {
    return { allowed: false, reason: "要件の見出しが不正である" }
  }
  if (view.specs.design === "invalid") {
    return { allowed: false, reason: "設計の見出しが不正である" }
  }
  if (currentBranch !== implementationBranch(issueNumber)) {
    return { allowed: false, reason: "作業ブランチではない" }
  }
  if (stage === "request" && view.specs.design === "missing") {
    return { allowed: false, reason: "設計が無い" }
  }
  return { allowed: true }
}

function evaluateConfirm(view: IssueView): GateResult {
  if (view.unanswered.length > 0) {
    return {
      allowed: false,
      reason: "未回答の確認があるため、次の確認は投稿しない",
    }
  }
  if (view.nextAnswer !== null) {
    return {
      allowed: false,
      reason: "まだ反映していない回答があるため、次の確認は投稿しない",
    }
  }
  return { allowed: true }
}

function evaluateReflect(view: IssueView): GateResult {
  if (view.nextAnswer === null) {
    return { allowed: false, reason: "未反映の回答は無い" }
  }
  return { allowed: true }
}

export function evaluateGate(
  stage: GateStage,
  view: IssueView,
  currentBranch: string,
  issueNumber: number,
): GateResult {
  switch (stage) {
    case "explore":
      return evaluateExplore(view)
    case "requirements":
      return evaluateRequirements(view)
    case "design":
      return evaluateDesignOrRequest("design", view, currentBranch, issueNumber)
    case "request":
      return evaluateDesignOrRequest("request", view, currentBranch, issueNumber)
    case "confirm":
      return evaluateConfirm(view)
    case "reflect":
      return evaluateReflect(view)
  }
}
