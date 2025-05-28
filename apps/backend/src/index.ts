import express from 'express';

const app = express();
const port = process.env.PORT || 4000;

app.get('/api/hello', (req, res) => {
    res.json({ message: 'Hello from the backend!' });
});

app.listen(port, () => {
    console.log(`Backend is running at http://localhost:${port}`);
});
