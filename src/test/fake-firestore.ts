// In-memory stand-in for the parts of the Firestore Admin API the account code uses:
// documents, equality queries with limit, count, batches and transactions.
// Transactions apply writes immediately; there is no concurrency to isolate in tests.

type Data = Record<string, unknown>

let autoId = 0

class DocSnapshot {
  constructor(
    readonly ref: DocRef,
    private readonly value: Data | undefined
  ) {}
  get id() {
    return this.ref.id
  }
  get exists() {
    return this.value !== undefined
  }
  data() {
    return this.value === undefined ? undefined : { ...this.value }
  }
}

class DocRef {
  constructor(
    private readonly store: FakeFirestore,
    readonly collectionName: string,
    readonly id: string
  ) {}
  private get docs() {
    return this.store.collectionData(this.collectionName)
  }
  async get() {
    return new DocSnapshot(this, this.docs.get(this.id))
  }
  async set(data: Data, options?: { merge?: boolean }) {
    this.setSync(data, options)
  }
  async update(data: Data) {
    this.updateSync(data)
  }
  async delete() {
    this.docs.delete(this.id)
  }
  setSync(data: Data, options?: { merge?: boolean }) {
    const base = options?.merge ? this.docs.get(this.id) ?? {} : {}
    this.docs.set(this.id, { ...base, ...data })
  }
  updateSync(data: Data) {
    const current = this.docs.get(this.id)
    if (!current) throw new Error(`No document to update: ${this.collectionName}/${this.id}`)
    this.docs.set(this.id, { ...current, ...data })
  }
}

class Query {
  constructor(
    protected readonly store: FakeFirestore,
    readonly collectionName: string,
    private readonly filters: [string, unknown][] = [],
    private readonly max?: number
  ) {}
  where(field: string, op: string, value: unknown) {
    if (op !== '==') throw new Error(`Fake Firestore supports only ==, got ${op}`)
    return new Query(this.store, this.collectionName, [...this.filters, [field, value]], this.max)
  }
  limit(n: number) {
    return new Query(this.store, this.collectionName, this.filters, n)
  }
  async get() {
    const docs = [...this.store.collectionData(this.collectionName).entries()]
      .filter(([, data]) => this.filters.every(([field, value]) => data[field] === value))
      .slice(0, this.max)
      .map(([id, data]) => new DocSnapshot(new DocRef(this.store, this.collectionName, id), data))
    return { docs, empty: docs.length === 0, size: docs.length }
  }
  count() {
    return {
      get: async () => {
        const { size } = await this.get()
        return { data: () => ({ count: size }) }
      },
    }
  }
}

class CollectionRef extends Query {
  doc(id?: string) {
    return new DocRef(this.store, this.collectionName, id ?? `auto${++autoId}`)
  }
}

class Batch {
  private readonly ops: (() => void)[] = []
  set(ref: DocRef, data: Data, options?: { merge?: boolean }) {
    this.ops.push(() => ref.setSync(data, options))
    return this
  }
  update(ref: DocRef, data: Data) {
    this.ops.push(() => ref.updateSync(data))
    return this
  }
  delete(ref: DocRef) {
    this.ops.push(() => void ref.delete())
    return this
  }
  async commit() {
    for (const op of this.ops) op()
  }
}

class Transaction extends Batch {
  async get(target: DocRef | Query) {
    return target.get()
  }
  async apply() {
    await this.commit()
  }
}

export class FakeFirestore {
  private readonly collections = new Map<string, Map<string, Data>>()
  /** Number of batch commits so far; tests use it to inject failures */
  commits = 0
  failOnCommit?: number

  collectionData(name: string) {
    let docs = this.collections.get(name)
    if (!docs) {
      docs = new Map()
      this.collections.set(name, docs)
    }
    return docs
  }

  collection(name: string) {
    return new CollectionRef(this, name)
  }

  batch() {
    const batch = new Batch()
    const commit = batch.commit.bind(batch)
    batch.commit = async () => {
      this.commits++
      if (this.commits === this.failOnCommit) throw new Error('Injected commit failure')
      await commit()
    }
    return batch
  }

  async runTransaction<T>(fn: (tx: Transaction) => Promise<T>): Promise<T> {
    const tx = new Transaction()
    const result = await fn(tx)
    await tx.apply()
    return result
  }

  /** Test helper: the data of every document in a collection, keyed by ID */
  dump(name: string): Record<string, Data> {
    return Object.fromEntries(this.collectionData(name))
  }
}
