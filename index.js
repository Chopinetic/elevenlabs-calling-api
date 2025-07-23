import express from 'express';
import { calling } from './calling.js';
import { getConversationJson, extractTranscript } from './calling.js';


const app = express();
app.use(express.json());



// Endpoint: POST /call
app.post('/call', (req, res) => {
  const { callerid } = req.body;
  calling(callerid);
  res.status(200).json({ message: 'calling invoked' });
});


//get conversation json by convID
app.get('/conversation/:convid', async (req, res) => {
  const convID = req.params.convid;
  try {
    const conversationJson = await getConversationJson(convID);
    res.status(200).json({ json: conversationJson });
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la récupération' });
  }
});



//get transcript by convID
app.get('/transcript/:convid', async (req, res) => {
  const convID = req.params.convid;
  try {
    const conversationJson = await getConversationJson(convID);
    const transcript = extractTranscript(conversationJson);
    res.status(200).json({ transcript });
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la récupération' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});