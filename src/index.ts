
import {config} from "dotenv";
config();
import {connectDB} from "./db/db.js";
import {app} from "./app.js";


connectDB().then(() => {
     app.listen(8000, "0.0.0.0" , () => {
          console.log(`Server running on port ${process.env.PORT}`);
     })
})
