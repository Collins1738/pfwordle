import { useState, useEffect, useCallback } from "react";
import { Box, VStack, Text, Heading, Button, Avatar, HStack } from "@chakra-ui/react";
import Board from "./components/Board";
import Keyboard from "./components/Keyboard";
import EmployeeCard from "./components/EmployeeCard";
import Leaderboard from "./components/Leaderboard";
import ResultScreen from "./components/ResultScreen";
import StatsModal from "./components/StatsModal";
import { startGame, submitGuess, getDebugAnswer, resumeGame } from "./api";
import { useAuth } from "./useAuth";

const BASE_URL = import.meta.env.VITE_API_URL ?? "";

export default function App() {
  const { user, logout, getToken } = useAuth();
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [guesses, setGuesses] = useState([]);
  const [currentGuess, setCurrentGuess] = useState("");
  const [status, setStatus] = useState("idle");
  const [showResult, setShowResult] = useState(false);
  const [answer, setAnswer] = useState(null);
  const [message, setMessage] = useState("");
  const [employee, setEmployee] = useState(null);
  const [duration, setDuration] = useState(null);
  const [letterStatuses, setLetterStatuses] = useState({});
  const [wordLength, setWordLength] = useState(5);
  const [maxGuesses, setMaxGuesses] = useState(6);
  const [debugAnswer, setDebugAnswer] = useState(null);
  const [debugOpen, setDebugOpen] = useState(false);
  const isDev = import.meta.env.DEV || import.meta.env.VITE_DEBUG === "true";

  const currentRow = guesses.length;

  async function newGame(options = {}) {
    try {
      const token = getToken();
      const data = await startGame(options, token);
      setSessionId(data.sessionId);
      setWordLength(data.wordLength);
      setMaxGuesses(data.maxGuesses);
      setGuesses([]);
      setCurrentGuess("");
      setStatus("playing");
      setShowResult(false);
      setAnswer(null);
      setEmployee(null);
      setDuration(null);
      setMessage("");
      setLetterStatuses({});
      setLetterStatuses({});
      setDebugAnswer(null);
      if (isDev) {
        getDebugAnswer(data.sessionId).then(d => setDebugAnswer(d.answer)).catch(() => {});
      }
    } catch (e) {
      setMessage("Failed to start game. Is the server running?");
    }
  }

  useEffect(() => {
    // Wait until auth is resolved, then try resume or start fresh
    if (user === undefined) return; // still loading auth
    async function init() {
      const token = getToken();
      if (token) {
        try {
          const data = await resumeGame(token);
          if (data.hasGame) {
            setSessionId(data.sessionId);
            setWordLength(data.wordLength);
            setMaxGuesses(data.maxGuesses);
            setGuesses(data.guesses || []);
            setCurrentGuess("");
            setStatus(data.status);
            if (data.status === "won" || data.status === "lost") {
              setShowResult(true);
            }
            // Rebuild letter statuses from restored guesses
            if (data.guesses?.length) {
              const priority = { correct: 3, present: 2, absent: 1 };
              const updated = {};
              data.guesses.forEach(({ result }) => {
                result?.forEach(({ letter, status: s }) => {
                  if (!updated[letter] || priority[s] > (priority[updated[letter]] ?? 0)) updated[letter] = s;
                });
              });
              setLetterStatuses(updated);
            }
            return;
          }
        } catch { /* fall through */ }
      }
      newGame({});
    }
    init();
  }, [user]);

  const updateLetterStatuses = useCallback((newGuesses) => {
    const priority = { correct: 3, present: 2, absent: 1 };
    const updated = {};
    newGuesses.forEach(({ result }) => {
      result.forEach(({ letter, status }) => {
        const cur = updated[letter];
        if (!cur || priority[status] > (priority[cur] ?? 0)) {
          updated[letter] = status;
        }
      });
    });
    setLetterStatuses(updated);
  }, []);

  const handleKey = useCallback(async (key) => {
    if (status !== "playing") return;
    setMessage("");

    if (key === "⌫" || key === "Backspace") {
      setCurrentGuess(g => g.slice(0, -1));
      return;
    }

    if (key === "ENTER" || key === "Enter") {
      if (currentGuess.length < wordLength) {
        setMessage(`Need ${wordLength} letters`);
        return;
      }
      try {
        const data = await submitGuess(sessionId, currentGuess, getToken());
        const newGuesses = [...guesses, { guess: data.guess, result: data.result }];
        setGuesses(newGuesses);
        setCurrentGuess("");
        updateLetterStatuses(newGuesses);
        if (data.status === "won" || data.status === "lost") {
          const finalWordLength = data.answer?.length || wordLength;
          const flipDelay = (finalWordLength - 1) * 0.1 + 0.5 + 0.3; // last tile + buffer
          setStatus(data.status);
          setAnswer(data.answer);
          setEmployee(data.employee || null);
          setDuration(data.durationSeconds ?? null);
          setMessage("");
          setShowResult(false);
          setTimeout(() => setShowResult(true), flipDelay * 1000);
        }
      } catch (e) {
        setMessage(e?.response?.data?.error || "Invalid guess");
      }
      return;
    }

    if (/^[a-zA-Z]$/.test(key) && currentGuess.length < wordLength) {
      setCurrentGuess(g => g + key.toUpperCase());
    }
  }, [status, currentGuess, guesses, sessionId, wordLength, updateLetterStatuses]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      handleKey(e.key);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKey]);

  const msgColor = status === "won" ? "#538d4e" : status === "lost" ? "#b59f3b" : "white";

  return (
    <Box minH="100vh" bg="#121213" display="flex" flexDir="column" alignItems="center">
      {showResult && (status === "won" || status === "lost") && (
        <ResultScreen
          won={status === "won"}
          answer={answer}
          guesses={guesses}
          maxGuesses={maxGuesses}
          wordLength={wordLength}
          employee={employee}
          durationSeconds={duration}
          onPlayAgain={() => newGame({})}
          onShowStats={() => { setShowResult(false); setShowStats(true); }}
        />
      )}
      {/* DEV floater */}
      {isDev && debugAnswer && (
        <Box position="fixed" top="12px" right="12px" zIndex={9999}>
          <Box
            bg="#1a1a2e"
            border="1px dashed #444"
            borderRadius="md"
            overflow="hidden"
            cursor="pointer"
            onClick={() => setDebugOpen(o => !o)}
            px={3} py={1}
            opacity={0.9}
          >
            <Text fontSize="xs" color="#888" fontFamily="monospace" userSelect="none">
              🔧 <Text as="span" color="#f0c040" fontWeight="bold">{debugAnswer}</Text>
              <Text as="span" color="#555" ml={2}>{debugOpen ? "▲" : "▼"}</Text>
            </Text>
          </Box>
          {debugOpen && (
            <Box bg="#1a1a2e" border="1px dashed #444" borderTop="none" borderRadius="0 0 md md" px={3} py={2} display="flex" flexDir="column" gap={1}>
              <Box
                as="button"
                onClick={(e) => { e.stopPropagation(); setDebugOpen(false); newGame({}); }}
                bg="#2a2a4a"
                color="#a0a0ff"
                border="1px solid #444"
                borderRadius="sm"
                px={2} py={1}
                fontSize="xs"
                fontFamily="monospace"
                cursor="pointer"
                w="100%"
                _hover={{ bg: "#33336a" }}
              >
                ↺ new random word
              </Box>
              <Box
                as="a"
                href="/roster"
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                bg="#1a2e1a"
                color="#6fcf6f"
                border="1px solid #444"
                borderRadius="sm"
                px={2} py={1}
                fontSize="xs"
                fontFamily="monospace"
                cursor="pointer"
                w="100%"
                textAlign="center"
                textDecoration="none"
                display="block"
                _hover={{ bg: "#223322" }}
              >
                👥 view roster
              </Box>
            </Box>
          )}
        </Box>
      )}

      {showLeaderboard && <Leaderboard onClose={() => setShowLeaderboard(false)} />}
      {showStats && <StatsModal onClose={() => setShowStats(false)} token={getToken()} maxGuesses={maxGuesses} />}

      {/* Header */}
      <Box w="100%" maxW="520px" borderBottom="1px solid" borderColor="#3a3a3c" py={3} px={4}>
        <HStack justifyContent="space-between" alignItems="center">
          {/* Left icons */}
          <HStack gap={2}>
            <Box
              as="button" onClick={() => setShowLeaderboard(true)}
              color="#818384" fontSize="xl" cursor="pointer" title="Leaderboard"
              _hover={{ color: "white" }} transition="color 0.15s"
            >🏆</Box>
            <Box
              as="button" onClick={() => setShowStats(true)}
              color="#818384" fontSize="xl" cursor="pointer" title="My Stats"
              _hover={{ color: "white" }} transition="color 0.15s"
            >📊</Box>
          </HStack>

          {/* Title */}
          <Box textAlign="center">
            <Heading size="lg" letterSpacing="0.2em" color="white" fontWeight="bold">
              PERMITDLE
            </Heading>
            <Text fontSize="xs" color="#818384">Guess today's Permitflow employee</Text>
          </Box>

          {/* Auth */}
          {user === undefined ? (
            <Box w="32px" />
          ) : user ? (
            <Box position="relative" role="group">
              <Avatar.Root size="sm" cursor="pointer" title={user.name}>
                <Avatar.Image src={user.avatar} />
                <Avatar.Fallback>{user.name?.[0]}</Avatar.Fallback>
              </Avatar.Root>
              <Box
                position="absolute" right={0} top="110%" bg="#1a1a1b"
                border="1px solid #3a3a3c" borderRadius="md" p={2} minW="120px"
                display="none" _groupHover={{ display: "block" }} zIndex={10}
              >
                <Text color="#818384" fontSize="xs" mb={1} noOfLines={1}>{user.email}</Text>
                <Box
                  as="button" color="#ff4444" fontSize="xs" cursor="pointer"
                  onClick={logout} w="100%" textAlign="left"
                >Sign out</Box>
              </Box>
            </Box>
          ) : (
            <Box
              as="a" href={`${BASE_URL}/auth/google`}
              bg="#538d4e" color="white" px={3} py={1} borderRadius="md"
              fontSize="xs" fontWeight="bold" textDecoration="none"
              _hover={{ bg: "#4a7a45" }} transition="bg 0.15s"
            >
              Sign in
            </Box>
          )}
        </HStack>
      </Box>

      <VStack gap={0} w="100%" maxW="520px" px={3}>
        {/* Message bar */}
        <Box h="36px" display="flex" alignItems="center" justifyContent="center" mt={1}>
          {message && (
            <Box bg="#222" color={msgColor} px={4} py={1} borderRadius="md"
              fontWeight="bold" fontSize="sm" border="1px solid" borderColor={msgColor}>
              {message}
            </Box>
          )}
        </Box>

        {/* Board */}
        <Board
          guesses={guesses}
          currentGuess={currentGuess}
          currentRow={currentRow}
          wordLength={wordLength}
          maxGuesses={maxGuesses}
        />

        {/* Keyboard */}
        <Keyboard onKey={handleKey} letterStatuses={letterStatuses} />

        <Box h="72px" />
      </VStack>
    </Box>
  );
}
