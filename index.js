const express = require("express");
const cors = require("cors");
const app = express();
require("dotenv").config();


app.listen(port, () => {
  console.log(`Car Xpress app listening on port ${port}`);
});
