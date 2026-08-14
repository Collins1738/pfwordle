import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL ?? "";

function authHeaders(token) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function startGame({ word, length, daily } = {}, token) {
  const res = await axios.post(
    `${BASE_URL}/api/game/start`,
    { word, length, daily },
    { headers: authHeaders(token) }
  );
  return res.data;
}

export async function getDaily() {
  const res = await axios.get(`${BASE_URL}/api/daily`);
  return res.data;
}

export async function submitGuess(sessionId, guess, token) {
  const res = await axios.post(
    `${BASE_URL}/api/game/${sessionId}/guess`,
    { guess },
    { headers: authHeaders(token) }
  );
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

export async function resumeGame(token) {
  const res = await axios.get(`${BASE_URL}/api/game/resume`, { headers: authHeaders(token) });
  return res.data;
}
