export type WorkItem = {
  id: string
}

export type Runner = {
  poll: () => Promise<WorkItem | null>
  process: (item: WorkItem) => Promise<void>
}

export const defaultRunner: Runner = {
  async poll() {
    return null
  },
  async process() {},
}
