const { ExpressAdapter } = require("@bull-board/express");
const { createBullBoard } = require("@bull-board/api");
const { BullAdapter } = require("@bull-board/api/bullAdapter");
const EmailSendQueue = require("./queues/EmailSendQueues");
const DeletePresription = require("./queues/DeletePresription");
const DeleteLabTest = require("./queues/DeleteLabTest");

const setupBullBoard = (app) => {
  const serverAdapter = new ExpressAdapter();
  serverAdapter.setBasePath("/admin/queues");

  createBullBoard({
    queues: [
      new BullAdapter(EmailSendQueue),
      new BullAdapter(DeletePresription),
      new BullAdapter(DeleteLabTest),
    ],
    serverAdapter,
  });

  app.use("/admin/queues", serverAdapter.getRouter());
};

module.exports = setupBullBoard;
