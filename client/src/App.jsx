import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Box, VStack, Text, Heading, Avatar, HStack } from "@chakra-ui/react";
import Board from "./components/Board";
import Keyboard from "./components/Keyboard";
import EmployeeCard from "./components/EmployeeCard";
import Leaderboard from "./components/Leaderboard";
import ResultScreen from "./components/ResultScreen";
import { startGame, submitGuess, getDebugAnswer, resumeGame } from "./api";
import { useAuth } from "./useAuth";
import { t } from "./theme";

const BASE_URL = import.meta.env.VITE_API_URL ?? "";

export default function App({ mode = "daily" }) {
  const { user, logout, getToken } = useAuth();
  const navigate = useNavigate();
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
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
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [blurDraining, setBlurDraining] = useState(false);
  const isDev = import.meta.env.DEV || import.meta.env.VITE_DEBUG === "true";

  const currentRow = guesses.length;

  async function newGame(options = {}) {
    try {
      const token = getToken();
      const data = await startGame({ mode, ...options }, token);
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
      setDebugAnswer(null);
      setAvatarUrl(data.avatarUrl || null);
      setBlurDraining(false);
      if (isDev) {
        getDebugAnswer(data.sessionId).then(d => setDebugAnswer(d.answer)).catch(() => {});
      }
    } catch (e) {
      setMessage("Failed to start game. Is the server running?");
    }
  }

  // On mount: resume daily game if possible, otherwise start fresh
  useEffect(() => {
    async function init() {
      if (mode === "daily") {
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
              if (data.status === "won" || data.status === "lost") setShowResult(true);
              setAvatarUrl(data.avatarUrl || null);
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
      }
      await newGame();
    }
    init();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const updateLetterStatuses = useCallback((newGuesses) => {
    const priority = { correct: 3, present: 2, absent: 1 };
    const updated = {};
    newGuesses.forEach(({ result }) => {
      result.forEach(({ letter, status }) => {
        const cur = updated[letter];
        if (!cur || priority[status] > (priority[cur] ?? 0)) updated[letter] = status;
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
          const flipDelay = (finalWordLength - 1) * 0.1 + 0.5 + 0.3;
          setStatus(data.status);
          setAnswer(data.answer);
          setEmployee(data.employee || null);
          setDuration(data.durationSeconds ?? null);
          setMessage("");
          setShowResult(false);
          if (data.status === "won" && avatarUrl) {
            // After tile flips, drain the blur to 0 over 1s, then show result
            const blurDrainDuration = 1000;
            setTimeout(() => setBlurDraining(true), flipDelay * 1000);
            setTimeout(() => setShowResult(true), flipDelay * 1000 + blurDrainDuration + 200);
          } else {
            setTimeout(() => setShowResult(true), flipDelay * 1000);
          }
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

  const msgColor = status === "won" ? t.accent : status === "lost" ? t.accentAlt : t.text;

  return (
    <Box minH="100vh" bg={t.bg} display="flex" flexDir="column" alignItems="center" fontFamily={t.font}>
      {/* Mode toggle bar */}
      <Box w="100%" maxW="520px" display="flex" borderBottom="1px solid" borderColor={t.border}>
        {["daily", "practice"].map(m => (
          <Box
            key={m} flex={1} textAlign="center" py={2} cursor="pointer"
            bg={mode === m ? t.surface : "transparent"}
            color={mode === m ? t.accent : t.muted}
            fontWeight={mode === m ? "700" : "500"}
            fontFamily={t.font}
            fontSize="sm" letterSpacing="0.05em" textTransform="capitalize"
            borderBottom={mode === m ? `2px solid ${t.accent}` : "2px solid transparent"}
            transition="all 0.15s"
            onClick={() => { if (mode !== m) navigate(`/${m}`); }}
          >
            {m === "daily" ? "📅 Daily" : "🎯 Practice"}
          </Box>
        ))}
      </Box>

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
          onShowStats={() => { setShowResult(false); navigate(`/stats?mode=${mode}`); }}
        />
      )}

      {/* DEV floater */}
      {isDev && debugAnswer && (
        <Box position="fixed" top="12px" right="12px" zIndex={9999}>
          <Box
            bg="#1a1a2e" border="1px dashed #444" borderRadius="md"
            overflow="hidden" cursor="pointer"
            onClick={() => setDebugOpen(o => !o)}
            px={3} py={1} opacity={0.9}
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
                bg="#2a2a4a" color="#a0a0ff" border="1px solid #444" borderRadius="sm"
                px={2} py={1} fontSize="xs" fontFamily="monospace" cursor="pointer" w="100%"
                _hover={{ bg: "#33336a" }}
              >
                ↺ new random word
              </Box>
              <Box
                as="a" href="/roster" target="_blank" rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                bg="#1a2e1a" color="#6fcf6f" border="1px solid #444" borderRadius="sm"
                px={2} py={1} fontSize="xs" fontFamily="monospace" cursor="pointer" w="100%"
                textAlign="center" textDecoration="none" display="block"
                _hover={{ bg: "#223322" }}
              >
                👥 view roster
              </Box>
            </Box>
          )}
        </Box>
      )}

      {showLeaderboard && <Leaderboard onClose={() => setShowLeaderboard(false)} />}

      {/* Header */}
      <Box w="100%" maxW="520px" borderBottom="1px solid" borderColor={t.border} bg={t.surface} py={3} px={4}>
        <HStack justifyContent="space-between" alignItems="center">
          <HStack gap={2}>
            <Box
              as="button" onClick={() => setShowLeaderboard(true)}
              color={t.muted} fontSize="xl" cursor="pointer" title="Leaderboard"
              _hover={{ color: t.accent }} transition="color 0.15s"
            >🏆</Box>
            <Box
              as="button" onClick={() => navigate(`/stats?mode=${mode}`)}
              color={t.muted} fontSize="xl" cursor="pointer" title="My Stats"
              _hover={{ color: t.accent }} transition="color 0.15s"
            >📊</Box>
          </HStack>

          <Box textAlign="center">
            <Heading size="lg" letterSpacing="0.1em" color={t.text} fontWeight="700" fontFamily={t.font} cursor="pointer" onClick={() => navigate("/")}>
              PERMITDLE
            </Heading>
            <Text fontSize="xs" color={t.muted} fontFamily={t.font}>Guess today's Permitflow employee</Text>
          </Box>

          {user === undefined ? (
            <Box w="32px" />
          ) : user ? (
            <Box position="relative">
              <Avatar.Root
                size="sm" cursor="pointer"
                onClick={() => setShowUserMenu(o => !o)}
                title={user.name}
                outline={showUserMenu ? `2px solid ${t.accent}` : "none"}
                borderRadius="full"
              >
                <Avatar.Image src={user.avatar} />
                <Avatar.Fallback>{user.name?.[0]}</Avatar.Fallback>
              </Avatar.Root>
              {showUserMenu && (
                <>
                  <Box position="fixed" inset={0} zIndex={9} onClick={() => setShowUserMenu(false)} />
                  <Box
                    position="absolute" right={0} top="calc(100% + 8px)"
                    bg={t.surface} border={`1px solid ${t.border}`} borderRadius={t.radiusMd}
                    p={3} minW="160px" zIndex={10} boxShadow="0 4px 20px rgba(0,100,200,0.1)"
                  >
                    <Text color={t.text} fontFamily={t.font} fontSize="sm" fontWeight="600" noOfLines={1} mb={0.5}>{user.name}</Text>
                    <Text color={t.muted} fontFamily={t.font} fontSize="xs" noOfLines={1} mb={3}>{user.email}</Text>
                    <Box
                      as="button" w="100%" textAlign="center"
                      bg="#fff0f0" border="1px solid #ffcccc" borderRadius={t.radius}
                      py={1.5} px={3} color="#e05252" fontSize="xs" fontWeight="700"
                      fontFamily={t.font}
                      cursor="pointer"
                      onClick={() => { logout(); setShowUserMenu(false); }}
                      _hover={{ bg: "#ffe0e0" }}
                    >
                      Sign out
                    </Box>
                  </Box>
                </>
              )}
            </Box>
          ) : (
            <Box
              as="a" href={`${BASE_URL}/auth/google`}
              bg={t.accent} color={t.white} px={3} py={1} borderRadius={t.radius}
              fontFamily={t.font}
              fontSize="xs" fontWeight="700" textDecoration="none"
              boxShadow={`0 3px 0 ${t.accentDark}`}
              _hover={{ opacity: 0.9 }} transition="all 0.1s"
            >
              Sign in
            </Box>
          )}
        </HStack>
      </Box>

      <VStack gap={0} w="100%" maxW="520px" px={3}>
        <Box h="36px" display="flex" alignItems="center" justifyContent="center" mt={1} position="relative">
          {message && (
            <Box bg="white" color={msgColor} px={4} py={1} borderRadius="10px"
              fontWeight="700" fontFamily="'Fredoka', sans-serif" fontSize="sm"
              border="2px solid" borderColor={msgColor}
              boxShadow="0 2px 8px rgba(0,100,200,0.1)" fontFamily={t.font}>
              {message}
            </Box>
          )}
          {!message && avatarUrl && guesses.length >= 1 && (() => {
            const proxyUrl = `${BASE_URL}/api/avatar?url=${encodeURIComponent(avatarUrl)}`;
            const naturalBlur = guesses.length === 1 ? 8 : Math.max(0, 6 - guesses.length);
            const blurPx = blurDraining ? 0 : naturalBlur;
            return (
              <Box w="36px" h="36px" borderRadius="full" overflow="hidden" border={`2px solid ${t.accent}`} flexShrink={0}>
                <Box
                  as="img" src={proxyUrl} w="100%" h="100%" objectFit="cover" display="block"
                  style={{
                    filter: `blur(${blurPx}px)`,
                    transform: "scale(1.3)",
                    transition: blurDraining ? "filter 1s ease-out" : "none",
                  }}
                />
              </Box>
            );
          })()}
        </Box>

        <Board
          guesses={guesses}
          currentGuess={currentGuess}
          currentRow={currentRow}
          wordLength={wordLength}
          maxGuesses={maxGuesses}
        />

        <Keyboard onKey={handleKey} letterStatuses={letterStatuses} />

        <Box h="72px" />
      </VStack>
    </Box>
  );
}
