// Optimistic transaction harness: staged writes, retries on concurrent changes, atomic failures.
export function database(initial) {
  const docs = structuredClone(initial);
  let revision = 0;
  return { docs, async run(callback, failCommit = false) {
    for (let attempt = 0; attempt < 10; attempt++) {
      const start = revision;
      const writes = [];
      const tx = {
        async get(ref) {
          if (writes.length) throw new Error('Read after write');
          const value = structuredClone(docs[ref.id]);
          return { exists: () => value != null, data: () => value };
        },
        update(ref, patch) { writes.push([ref.id, patch, false]); },
        set(ref, value) { writes.push([ref.id, value, true]); },
      };
      const result = await callback(tx);
      if (revision !== start) continue;
      if (failCommit) throw new Error('permission-denied');
      for (const [id, value, replace] of writes) docs[id] = replace ? value : { ...docs[id], ...value };
      revision++;
      return result;
    }
    throw new Error('Retry exhausted');
  } };
}
