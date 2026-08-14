import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

// word: specific word (company name mode)
// length: pick random word of that length
// daily: use today's Permitflow name
export async function startGame({ word, length, daily } = {}) {
  const res = await axios.post(`${BASE_URL}/api/game/start`, { word, length, daily });
  return res.data;
}

export async function getDaily() {
  const res = await axios.get(`${BASE_URL}/api/daily`);
  return res.data;
}

export async function submitGuess(sessionId, guess) {
  const res = await axios.post(`${BASE_URL}/api/game/${sessionId}/guess`, { guess });
  return res.data;
}

export async function getGameState(sessionId) {
  const res = await axios.get(`${BASE_URL}/api/game/${sessionId}`);
  return res.data;
}

export async function getDebugAnswer(sessionId) {
  const res = await axios.get(`${BASE_URL}/api/game/${sessionId}/debug`);
  return res.data;
}
