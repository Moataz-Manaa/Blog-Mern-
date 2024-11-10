const mongoosse = require("mongoose");

module.exports = async () => {
  try {
    await mongoosse.connect(process.env.DATABASE);
    console.log("Connected to DB");
  } catch (error) {
    console.log("Connection Failed", error);
  }
};
