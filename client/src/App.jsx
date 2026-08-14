import { useState, useEffect, useCallback } from "react";
import { Box, VStack, Text, Heading, Button } from "@chakra-ui/react";
import Board from "./components/Board";
import Keyboard from "./components/Keyboard";
import EmployeeCard from "./components/EmployeeCard";
import { startGame, submitGuess, getDebugAnswer } from "./api";

export default function App() {
  const [sessionId, setSessionId] = useState(null);
  const [guesses, setGuesses] = useState([]);
  const [currentGuess, setCurrentGuess] = useState("");
  const [status, setStatus] = useState("idle");
  const [showCard, setShowCard] = useState(false);
  const [answer, setAnswer] = useState(null);
  const [message, setMessage] = useState("");
  const [employee, setEmployee] = useState(null);
  const [letterStatuses, setLetterStatuses] = useState({});
  const [wordLength, setWordLength] = useState(5);
  const [maxGuesses, setMaxGuesses] = useState(6);
  const [debugAnswer, setDebugAnswer] = useState(null);
  const [debugOpen, setDebugOpen] = useState(false);
  const isDev = import.meta.env.DEV;

  const currentRow = guesses.length;

  async function newGame(options = {}) {
    try {
      const data = await startGame(options);
      setSessionId(data.sessionId);
      setWordLength(data.wordLength);
      setMaxGuesses(data.maxGuesses);
      setGuesses([]);
      setCurrentGuess("");
      setStatus("playing");
      setShowCard(false);
      setAnswer(null);
      setEmployee(null);
      setMessage("");
      setLetterStatuses({});
      setDebugAnswer(null);
      if (isDev) {
        getDebugAnswer(data.sessionId).then(d => setDebugAnswer(d.answer)).catch(() => {});
      }
    } catch (e) {
      setMessage("Failed to start game. Is the server running?");
    }
  }

  useEffect(() => { newGame({}); }, []);

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
        const data = await submitGuess(sessionId, currentGuess);
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
          setMessage("");
          setShowCard(false);
          setTimeout(() => setShowCard(true), flipDelay * 1000);
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
      {showCard && (status === "won" || status === "lost") && (
        <EmployeeCard
          answer={answer}
          employee={employee}
          status={status}
          onPlayAgain={() => newGame({})}
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

      {/* Header */}
      <Box w="100%" maxW="520px" borderBottom="1px solid" borderColor="#3a3a3c" py={3} textAlign="center">
        <Heading size="lg" letterSpacing="0.2em" color="white" fontWeight="bold">
          PERMITDLE
        </Heading>
        <Text fontSize="xs" color="#818384" mt={1}>Guess today's Permitflow employee</Text>
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
