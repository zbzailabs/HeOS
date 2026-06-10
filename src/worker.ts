import serverEntry from "@tanstack/react-start/server-entry"

import { handleRenkeSyncPost } from "./routes/api/providers/renke/sync"

export default {
  ...serverEntry,
  async scheduled() {
    const response = await handleRenkeSyncPost()

    if (!response.ok) {
      throw new Error(`Renke scheduled sync failed with HTTP ${response.status}.`)
    }
  },
  async queue(batch: MessageBatch<unknown>) {
    for (const message of batch.messages) {
      console.info("Renke sync retry message received", message.body)
      const response = await handleRenkeSyncPost()

      if (!response.ok) {
        throw new Error(`Renke queue sync failed with HTTP ${response.status}.`)
      }

      message.ack()
    }
  },
}
