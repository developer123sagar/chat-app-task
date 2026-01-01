interface QueuedMessage {
  id: string;
  content: string;
  senderId?: string;
  senderName?: string;
  timestamp: Date;
  status: string;
}

export type FlushCallback = (messages: QueuedMessage[]) => Promise<void>;

export const createMessageQueue = (onFlush: FlushCallback) => {
  let queue: QueuedMessage[] = [];
  let flushTimer: NodeJS.Timeout | null = null;
  const BATCH_SIZE = 10;
  const FLUSH_INTERVAL = 5000; // 5 seconds
  let isFlushing = false;

  // flush queue to API
  const flush = async (): Promise<void> => {
    if (isFlushing || queue.length === 0) {
      return;
    }

    isFlushing = true;

    // clear timer
    if (flushTimer) {
      clearTimeout(flushTimer);
      flushTimer = null;
    }

    // take all messages from queue
    const messagesToFlush = [...queue];
    queue = [];

    try {
      await onFlush(messagesToFlush);
    } catch (error) {
      console.error("Failed to flush message queue:", error);
      // on error, put messages back in queue for retry
      queue = [...messagesToFlush, ...queue];
    } finally {
      isFlushing = false;

      // if there are still messages, restart timer
      if (queue.length > 0) {
        resetFlushTimer();
      }
    }
  };

  // reset the flush timer
  const resetFlushTimer = (): void => {
    if (flushTimer) {
      clearTimeout(flushTimer);
    }

    flushTimer = setTimeout(() => {
      flush();
    }, FLUSH_INTERVAL);
  };

  // add message to queue
  const queueMessage = (message: QueuedMessage): void => {
    queue.push(message);

    // flush if batch size reached
    if (queue.length >= BATCH_SIZE) {
      flush();
    } else {
      // reset flush timer
      resetFlushTimer();
    }
  };

  // force flush (e.g., on page unload)
  const forceFlush = async (): Promise<void> => {
    await flush();
  };

  // clear queue
  const clear = (): void => {
    queue = [];
    if (flushTimer) {
      clearTimeout(flushTimer);
      flushTimer = null;
    }
  };

  return {
    queueMessage,
    forceFlush,
    clear,
  };
};

export type MessageQueueInstance = ReturnType<typeof createMessageQueue>;
export type { QueuedMessage };
