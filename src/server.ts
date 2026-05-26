import app from "./app";
import config from "./config";
import { initDB } from "./db";

const port = config.port;

const main = async () => {
  try {
    await initDB();

    app.listen(port, () => {
      console.log(`App running on the port ${port}`);
    });
  } catch (error:unknown) {
    console.error(error);
  }
};

main();
