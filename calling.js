// calling.js

import dotenv from 'dotenv';
import fetch from 'node-fetch';
import mysql from 'mysql2/promise';
dotenv.config();

export function extractTranscript(conversationJson) {
  if (typeof conversationJson === 'string') {
    try {
      conversationJson = JSON.parse(conversationJson);
    } catch (e) {
      return null;
    }
  }
  return conversationJson && conversationJson.transcript ? conversationJson.transcript : null;
}

export async function getConversationJson(convID) {
  let conversationJson = null;
  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
  });
  const [rows] = await connection.execute(
    'SELECT json FROM CONVERSATION WHERE convID = ?',
    [convID]
  );
  await connection.end();
  if (rows.length > 0) {
    conversationJson = rows[0].json;
  }
  return conversationJson;
}

export async function calling(callerid) {
  console.log('calling', callerid);
  const apiKey = process.env.XI_API_KEY;
  const agentId = process.env.AGENT_ID;
  const agentPhoneNumberId = process.env.AGENT_PHONE_NUMBER_ID;

  const url = 'https://api.elevenlabs.io/v1/convai/sip-trunk/outbound-call';
  const payload = {
    agent_id: agentId,
    agent_phone_number_id: agentPhoneNumberId,
    to_number: callerid
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    console.log('API response:', data);

    // Si l'appel a réussi, on récupère le conversation_id
    if (data && data.success && data.conversation_id) {
      // Fetch conversation details
      const conversationUrl = `https://api.elevenlabs.io/v1/convai/conversations/${data.conversation_id}`;
      const conversationRes = await fetch(conversationUrl, {
        method: 'GET',
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
        },
      });
      const conversation = await conversationRes.json();
      console.log('Conversation details:', conversation);

      // Insert into MySQL
      const connection = await mysql.createConnection({
        host: process.env.MYSQL_HOST,
        user: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD,
        database: process.env.MYSQL_DATABASE,
      });
      // Stocke tout le JSON dans une colonne (par exemple "data")
      await connection.execute(
        'INSERT INTO CONVERSATION (json) VALUES (?)',
        [JSON.stringify(conversation)]
      );
      await connection.end();
    }
    return data;
  } catch (error) {
    console.error('API error:', error);
    throw error;
  }
}
export async function sendTranscriptToAI(convID) {
    const conversationTranscript = await extractTranscript(convID);
    console.log('Conversation transcript:', conversationTranscript);
  
    const apiKeyGPT = process.env.API_KEY_GPT;
    const url = 'https://api.openai.com/v1/chat/completions';
  
    const payload = {
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `You are an assistant that extracts meeting information from a conversation.`,
        },
        {
          role: 'user',
          content: `Here is a conversation transcript:\n\n${conversationTranscript}\n\nIf a meeting is scheduled in this conversation, extract the exact date and time and return only that in the following format: dd/mm/yyyy/hh/mm.\nIf there's no meeting, just reply "no meeting".`,
        },
      ],
      temperature: 0.2,
    };
  
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKeyGPT}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
  
      const data = await response.json();
      const aiMessage = data.choices[0].message.content.trim();
  
      console.log('GPT response:', aiMessage);
  
      return aiMessage; // Either the date string or "no meeting"
    } catch (error) {
      console.error('Error sending to GPT:', error);
      return null;
    }
  }
  