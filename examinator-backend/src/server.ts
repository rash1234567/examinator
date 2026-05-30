import "dotenv/config";
import app from "./app";

const port = process.env.PORT || 8989;

// app.get("/test", (req, res) => {
//     res.send("Test working");
// });

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

