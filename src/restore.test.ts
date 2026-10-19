import { describe, expect, test } from "bun:test"
import type { Issue } from "./github.ts"
import { workflowLabels } from "./labels.ts"
import {
  type LabelEvent,
  preStartLabel,
  restoreIssue,
} from "./restore.ts"

const LABEL_REQUEST = workflowLabels[0].name
const LABEL_DONE = workflowLabels[2].name
const LABEL_IN_PROGRESS = workflowLabels[1].name
const LABEL_VERIFIED = workflowLabels[3].name

function labeled(name: string, createdAt: string): LabelEvent {
  return { event: "labeled", name, createdAt: createdAt }
}

function unlabeled(name: string, createdAt: string): LabelEvent {
  return { event: "unlabeled", name, createdAt: createdAt }
}

describe("preStartLabel", () => {
  test("引数を変えない", () => {
    const events: LabelEvent[] = [
      labeled(LABEL_IN_PROGRESS, "2020-01-01T00:00:00.000Z"),
      unlabeled(LABEL_REQUEST, "2020-01-01T00:00:01.000Z"),
    ]
    const copy = JSON.stringify(events)
    preStartLabel(events)
    expect(JSON.stringify(events)).toBe(copy)
  })

  test("実装依頼だけの窓", () => {
    const events = [
      labeled(LABEL_IN_PROGRESS, "2020-01-01T00:00:02.000Z"),
      unlabeled(LABEL_REQUEST, "2020-01-01T00:00:01.000Z"),
    ]
    expect(preStartLabel(events)).toBe(LABEL_REQUEST)
  })

  test("実装完了だけの窓", () => {
    const events = [
      labeled(LABEL_IN_PROGRESS, "2020-01-01T00:00:00.000Z"),
      unlabeled(LABEL_DONE, "2020-01-01T00:00:04.000Z"),
    ]
    expect(preStartLabel(events)).toBe(LABEL_DONE)
  })

  test("窓に業務ラベルの unlabeled が無いときは null", () => {
    const events = [
      labeled(LABEL_IN_PROGRESS, "2020-01-01T00:00:00.000Z"),
    ]
    expect(preStartLabel(events)).toBe(null)
  })

  test("labeled 実装中が無いとき", () => {
    expect(() =>
      preStartLabel([unlabeled(LABEL_REQUEST, "2020-01-01T00:00:00.000Z")]),
    ).toThrow("着手前のラベルを特定できません")
  })

  test("窓に実装依頼と実装完了の両方", () => {
    const events = [
      labeled(LABEL_IN_PROGRESS, "2020-01-01T00:00:00.000Z"),
      unlabeled(LABEL_REQUEST, "2020-01-01T00:00:01.000Z"),
      unlabeled(LABEL_DONE, "2020-01-01T00:00:02.000Z"),
    ]
    expect(() => preStartLabel(events)).toThrow("着手前のラベルを特定できません")
  })

  test("窓に動作確認OK", () => {
    const events = [
      labeled(LABEL_IN_PROGRESS, "2020-01-01T00:00:00.000Z"),
      unlabeled(LABEL_VERIFIED, "2020-01-01T00:00:01.000Z"),
    ]
    expect(() => preStartLabel(events)).toThrow("着手前のラベルを特定できません")
  })

  test("外した時刻が付いた時刻より 1 秒後でも 5 秒以内なら組にする", () => {
    const events = [
      labeled(LABEL_IN_PROGRESS, "2020-01-01T00:00:00.000Z"),
      unlabeled(LABEL_REQUEST, "2020-01-01T00:00:01.000Z"),
    ]
    expect(preStartLabel(events)).toBe(LABEL_REQUEST)
  })

  test("差が 5 秒を超える unlabeled は組にしない", () => {
    const events = [
      labeled(LABEL_IN_PROGRESS, "2020-01-01T00:00:00.000Z"),
      unlabeled(LABEL_REQUEST, "2020-01-01T00:00:06.000Z"),
    ]
    expect(preStartLabel(events)).toBe(null)
  })

  test("最後の labeled 実装中を使う", () => {
    const events = [
      labeled(LABEL_IN_PROGRESS, "2020-01-01T00:00:00.000Z"),
      unlabeled(LABEL_REQUEST, "2020-01-01T00:00:01.000Z"),
      labeled(LABEL_IN_PROGRESS, "2020-01-01T00:01:00.000Z"),
      unlabeled(LABEL_DONE, "2020-01-01T00:01:02.000Z"),
    ]
    expect(preStartLabel(events)).toBe(LABEL_DONE)
  })
})

describe("restoreIssue", () => {
  function recordingGithub(handlers: {
    getIssue?: () => Promise<Issue>
    listIssueEvents?: () => Promise<LabelEvent[]>
    editLabels?: (
      number: number,
      change: { add?: string[]; remove?: string[] },
    ) => Promise<void>
  }) {
    const calls: {
      getIssue: number[]
      listIssueEvents: number[]
      editLabels: { number: number; change: { add?: string[]; remove?: string[] } }[]
    } = {
      getIssue: [],
      listIssueEvents: [],
      editLabels: [],
    }
    const github = {
      async getIssue(number: number) {
        calls.getIssue.push(number)
        if (handlers.getIssue) {
          return handlers.getIssue()
        }
        reject("unexpected getIssue")
      },
      async listIssueEvents(number: number) {
        calls.listIssueEvents.push(number)
        if (handlers.listIssueEvents) {
          return handlers.listIssueEvents()
        }
        reject("unexpected listIssueEvents")
      },
      async editLabels(
        number: number,
        change: { add?: string[]; remove?: string[] },
      ) {
        calls.editLabels.push({ number, change })
        if (handlers.editLabels) {
          return handlers.editLabels(number, change)
        }
      },
    }
    return { github, calls }
  }

  test("実装中が無い課題", async () => {
    const { github, calls } = recordingGithub({
      getIssue: async () => ({
        number: 1,
        title: "t",
        body: "",
        state: "open",
        labels: [LABEL_REQUEST],
        assignees: [],
        url: "https://example.com/1",
      }),
    })
    await expect(restoreIssue(github, 1)).rejects.toThrow("実装中がありません")
    expect(calls.listIssueEvents).toEqual([])
    expect(calls.editLabels).toEqual([])
  })

  test("戻し先が実装依頼", async () => {
    const events = [
      labeled(LABEL_IN_PROGRESS, "2020-01-01T00:00:00.000Z"),
      unlabeled(LABEL_REQUEST, "2020-01-01T00:00:01.000Z"),
    ]
    const { github, calls } = recordingGithub({
      getIssue: async () => ({
        number: 5,
        title: "t",
        body: "",
        state: "open",
        labels: [LABEL_IN_PROGRESS],
        assignees: [],
        url: "https://example.com/5",
      }),
      listIssueEvents: async () => events,
    })
    await restoreIssue(github, 5)
    expect(calls.editLabels).toEqual([
      {
        number: 5,
        change: { remove: [LABEL_IN_PROGRESS], add: [LABEL_REQUEST] },
      },
    ])
  })

  test("戻し先が実装完了", async () => {
    const events = [
      labeled(LABEL_IN_PROGRESS, "2020-01-01T00:00:00.000Z"),
      unlabeled(LABEL_DONE, "2020-01-01T00:00:02.000Z"),
    ]
    const { github, calls } = recordingGithub({
      getIssue: async () => ({
        number: 2,
        title: "t",
        body: "",
        state: "open",
        labels: [LABEL_IN_PROGRESS],
        assignees: [],
        url: "https://example.com/2",
      }),
      listIssueEvents: async () => events,
    })
    await restoreIssue(github, 2)
    expect(calls.editLabels).toEqual([
      {
        number: 2,
        change: { remove: [LABEL_IN_PROGRESS], add: [LABEL_DONE] },
      },
    ])
  })

  test("null のとき実装中だけ外す", async () => {
    const events = [labeled(LABEL_IN_PROGRESS, "2020-01-01T00:00:00.000Z")]
    const { github, calls } = recordingGithub({
      getIssue: async () => ({
        number: 9,
        title: "t",
        body: "",
        state: "open",
        labels: [LABEL_IN_PROGRESS],
        assignees: [],
        url: "https://example.com/9",
      }),
      listIssueEvents: async () => events,
    })
    await restoreIssue(github, 9)
    expect(calls.editLabels).toEqual([
      { number: 9, change: { remove: [LABEL_IN_PROGRESS] } },
    ])
  })

  test("preStartLabel が拒否したとき editLabels を呼ばない", async () => {
    const events = [
      labeled(LABEL_IN_PROGRESS, "2020-01-01T00:00:00.000Z"),
      unlabeled(LABEL_REQUEST, "2020-01-01T00:00:01.000Z"),
      unlabeled(LABEL_DONE, "2020-01-01T00:00:02.000Z"),
    ]
    const { github, calls } = recordingGithub({
      getIssue: async () => ({
        number: 3,
        title: "t",
        body: "",
        state: "open",
        labels: [LABEL_IN_PROGRESS],
        assignees: [],
        url: "https://example.com/3",
      }),
      listIssueEvents: async () => events,
    })
    await expect(restoreIssue(github, 3)).rejects.toThrow(
      "着手前のラベルを特定できません",
    )
    expect(calls.editLabels).toEqual([])
  })

  test("番号が不正", async () => {
    const { github, calls } = recordingGithub({})
    await expect(restoreIssue(github, 0)).rejects.toThrow("番号が不正です")
    expect(calls.getIssue).toEqual([])
  })
})

function reject(message: string): never {
  throw new Error(message)
}
