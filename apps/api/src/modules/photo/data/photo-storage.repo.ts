/** Image storage in R2. The only file in this module that touches the bucket. */
export const photoStorageRepo = {
  async put(bucket: R2Bucket, key: string, body: ArrayBuffer, contentType: string) {
    await bucket.put(key, body, { httpMetadata: { contentType } });
  },

  async get(bucket: R2Bucket, key: string): Promise<R2ObjectBody | null> {
    return bucket.get(key);
  },

  async delete(bucket: R2Bucket, key: string) {
    await bucket.delete(key);
  },
};
