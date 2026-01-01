// Client-side message queue for batching messages before sending to API
// Reduces API calls by collecting messages and flushing periodically

interface QueuedMessage {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  timestamp: Date;
  status: string;
}

class MessageQueue {
  private queue: QueuedMessage[] = [];
  private flushTimer: NodeJS.Timeout | null = null;
  private readonly BATCH_SIZE = 10;
  private readonly FLUSH_INTERVAL = 5000; // 5 seconds
  private isFlushing = false;

  constructor(private onFlush: (messages: QueuedMessage[]) => Promise<void>) {}

  // Add message to queue
  queueMessage(message: QueuedMessage): void {
    this.queue.push(message);

    // Flush if batch size reached
    if (this.queue.length >= this.BATCH_SIZE) {
      this.flush();
    } else {
      // Reset flush timer
      this.resetFlushTimer();
    }
  }

  // Reset the flush timer
  private resetFlushTimer(): void {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
    }

    this.flushTimer = setTimeout(() => {
      this.flush();
    }, this.FLUSH_INTERVAL);
  }

  // Flush queue to API
  async flush(): Promise<void> {
    if (this.isFlushing || this.queue.length === 0) {
      return;
    }

    this.isFlushing = true;

    // Clear timer
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }

    // Take all messages from queue
    const messagesToFlush = [...this.queue];
    this.queue = [];

    try {
      await this.onFlush(messagesToFlush);
    } catch (error) {
      console.error('Failed to flush message queue:', error);
      // On error, put messages back in queue for retry
      this.queue = [...messagesToFlush, ...this.queue];
    } finally {
      this.isFlushing = false;

      // If there are still messages, restart timer
      if (this.queue.length > 0) {
        this.resetFlushTimer();
      }
    }
  }

  // Force flush (e.g., on page unload)
  async forceFlush(): Promise<void> {
    await this.flush();
  }

  // Clear queue
  clear(): void {
    this.queue = [];
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }
  }
}

export { MessageQueue };
export type { QueuedMessage };
