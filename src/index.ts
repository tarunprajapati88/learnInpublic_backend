
import {config} from "dotenv";
config();
import {connectDB} from "./db/db.ts";
import {app} from "./app.ts";


connectDB().then(() => {
     app.listen(8000, "0.0.0.0" , () => {
          console.log(`Server running on port ${process.env.PORT}`);
     })
})
