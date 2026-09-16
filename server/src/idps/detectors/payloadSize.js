/**
 * Payload Size Detector
 * Detects requests exceeding safe payload size limits
 */
class PayloadSizeDetector {
  constructor() {
    this.maxSize = 1048576; // 1MB default
  }

  detect(data) {
    const { body, headers } = data;

    // Get content-length from headers if available
    const contentLength = headers && headers['content-length']
      ? parseInt(headers['content-length'], 10)
      : null;

    // Calculate body size
    const bodySize = body ? JSON.stringify(body).length : 0;

    // Use the larger of the two
    const totalSize = contentLength || bodySize;

    if (totalSize > this.maxSize) {
      return {
        matched: true,
        category: 'PAYLOAD_SIZE_EXCEEDED',
        severity: 'MEDIUM',
        score: 15,
        description: `Payload size exceeded (${totalSize} bytes > ${this.maxSize} bytes)`
      };
    }

    return { matched: false };
  }

  setMaxSize(size) {
    this.maxSize = size;
  }
}

module.exports = PayloadSizeDetector;
