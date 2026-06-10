import serverEntry from "@tanstack/react-start/server-entry"

export default {
  ...serverEntry,
  async queue(batch: MessageBatch<unknown>) {
    for (const message of batch.messages) {
      console.info("Renke sync retry message received", message.body)
      message.ack()
    }
  },
}
