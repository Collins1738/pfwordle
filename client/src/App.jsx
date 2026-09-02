import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Box, VStack, Text, Heading, Avatar, HStack } from "@chakra-ui/react";
import Board from "./components/Board";
import Keyboard from "./components/Keyboard";
import EmployeeCard from "./components/EmployeeCard";

import ResultScreen from "./components/ResultScreen";
import UserMenuDropdown from "./components/UserMenuDropdown";
import { startGame, submitGuess, getDebugAnswer, resumeGame, getGameState, getDailyLeaderboard } from "./api";
import { useAuth } from "./useAuth";
import { t } from "./theme";
import { DEV_ACCOUNTS } from "./constants";


const BASE_URL = import.meta.env.VITE_API_URL ?? "";

// Avatar with server-side blur: the server applies blur so the client never has the full image
// until the game is over. On win, we load the full image and animate CSS blur from ~3px → 0.
function AvatarCanvas({ blurredUrl, fullUrl, isBlacked, blurDraining, accent, borderBlurPx = 0 }) {
  const [drainStarted, setDrainStarted] = useState(false);
  const [fullLoaded, setFullLoaded] = useState(false);
  // Two slots for crossfading between blur levels
  const [layers, setLayers] = useState([{ url: null, opacity: 1, zIndex: 2, key: 0 }, { url: null, opacity: 0, zIndex: 1, key: 1 }]);
  const activeLayer = useRef(0); // which layer is currently on top

  // When blurredUrl changes, load new image into the inactive layer (on top),
  // fade it in, then snap the old layer away — old stays at full opacity so no dark gap.
  useEffect(() => {
    if (!blurredUrl || blurDraining) return;
    const next = activeLayer.current === 0 ? 1 : 0;
    const cur = activeLayer.current;
    // Load new url into next layer, invisible, behind current (zIndex)
    setLayers(prev => {
      const l = [...prev];
      l[next] = { ...l[next], url: blurredUrl, opacity: 0, zIndex: 2 };
      l[cur]  = { ...l[cur],  zIndex: 1 };
      return l;
    });
    // Fade new layer in (old stays fully visible underneath)
    const t1 = setTimeout(() => {
      setLayers(prev => {
        const l = [...prev];
        l[next] = { ...l[next], opacity: 1 };
        return l;
      });
    }, 30);
    // Once new is fully visible, snap old away
    const t2 = setTimeout(() => {
      activeLayer.current = next;
      setLayers(prev => {
        const l = [...prev];
        l[cur] = { ...l[cur], opacity: 0, zIndex: 1 };
        l[next] = { ...l[next], zIndex: 2 };
        return l;
      });
    }, 600);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [blurredUrl, blurDraining]);

  // Drain: wait for full image to load, then animate blur away
  useEffect(() => {
    if (blurDraining) {
      setFullLoaded(false);
      setDrainStarted(false);
    }
  }, [blurDraining]);

  const imgStyle = {
    display: "block",
    objectFit: "cover",
    borderRadius: "50%",
    position: "absolute",
    inset: 0,
    width: "36px",
    height: "36px",
    pointerEvents: "none",
  };

  return (
    // Outer ring: clips the glow at its edge
    <Box
      w="42px" h="42px" borderRadius="full" overflow="hidden"
      flexShrink={0} position="relative"
      display="flex" alignItems="center" justifyContent="center"
      style={{ background: "transparent" }}
    >
    {/* Inner circle: image + animated glow border */}
    <Box
      w="36px" h="36px" borderRadius="full" overflow="hidden"
      position="relative"
      style={{
        background: "black",
        boxShadow: `0 0 0 2px ${accent}, 0 0 ${borderBlurPx}px ${borderBlurPx}px ${accent}`,
        transition: "box-shadow 0.6s ease-out",
      }}
    >
      {/* Two crossfading blur layers — hidden while isBlacked */}
      {!isBlacked && layers.map(layer => layer.url && (
        <img
          key={layer.key}
          src={layer.url}
          style={{
            ...imgStyle,
            opacity: layer.opacity,
            zIndex: layer.zIndex,
            transition: "opacity 0.5s ease-out",
          }}
        />
      ))}
      {/* Full image — loads hidden, animates CSS blur from 8px→0 on win */}
      {fullUrl && blurDraining && (
        <img
          src={fullUrl}
          onLoad={() => { setFullLoaded(true); setTimeout(() => setDrainStarted(true), 30); }}
          style={{
            ...imgStyle,
            opacity: fullLoaded ? 1 : 0,
            filter: drainStarted ? "blur(0px)" : "blur(8px)",
            transition: drainStarted ? "filter 1s ease-out" : "none",
          }}
        />
      )}
      {/* Black overlay before first guess */}
      <Box
        position="absolute" inset={0} bg="black" borderRadius="full"
        style={{ opacity: isBlacked ? 1 : 0, transition: "opacity 0.6s ease-out", pointerEvents: "none" }}
      />
    </Box>
    </Box>
  );
}

export default function App({ mode = "daily" }) {
  const { user, logout, getToken } = useAuth();
  const navigate = useNavigate();



  const [showUserMenu, setShowUserMenu] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [guesses, setGuesses] = useState([]);
  const [currentGuess, setCurrentGuess] = useState("");
  const [status, setStatus] = useState("idle");
  const [showResult, setShowResult] = useState(false);
  const [answer, setAnswer] = useState(null);
  const [message, setMessage] = useState("");
  const [msgVisible, setMsgVisible] = useState(false);
  const [employee, setEmployee] = useState(null);
  const [duration, setDuration] = useState(null);
  const [finalScore, setFinalScore] = useState(null);
  const [letterStatuses, setLetterStatuses] = useState({});
  const [wordLength, setWordLength] = useState(5);
  const [maxGuesses, setMaxGuesses] = useState(6);
  const [debugAnswer, setDebugAnswer] = useState(null);
  const [debugOpen, setDebugOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [medalInfo, setMedalInfo] = useState(null); // null | { medal: 'gold'|'silver'|'bronze', rank: 1|2|3 }
  const [blurDraining, setBlurDraining] = useState(false);
  const [shakingRow, setShakingRow] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const resumedComplete = useRef(false); // true when result screen shown via resume (skip animation)

  const isDevAccount = user && DEV_ACCOUNTS.includes(user.email);

  const [devMode, setDevMode] = useState(false);

  const isDev = !!isDevAccount && devMode;

  function toggleDevMode() {
    setDevMode(next => !next);
  }

  // Fetch debug answer whenever dev mode is toggled on and we have a session
  useEffect(() => {
    if (devMode && sessionId && !debugAnswer) {
      getDebugAnswer(sessionId).then(d => setDebugAnswer(d.answer)).catch(() => {});
    }
  }, [devMode, sessionId]);

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
      setFinalScore(null);
      setMessage("");
      setLetterStatuses({});
      setDebugAnswer(null);
      setAvatarUrl(data.avatarUrl || null);
      setBlurDraining(false);
      setCelebrating(false);
      setMedalInfo(null);
      if (mode === "practice") localStorage.setItem("practiceSessionId", data.sessionId);
      if (isDev) {
        getDebugAnswer(data.sessionId).then(d => setDebugAnswer(d.answer)).catch(() => {});
      }
    } catch (e) {
      setMessage("Failed to start game. Is the server running?");
    }
  }

  function restoreLetterStatuses(guesses) {
    const priority = { correct: 3, present: 2, absent: 1 };
    const updated = {};
    guesses.forEach(({ result }) => {
      result?.forEach(({ letter, status: s }) => {
        if (!updated[letter] || priority[s] > (priority[updated[letter]] ?? 0)) updated[letter] = s;
      });
    });
    setLetterStatuses(updated);
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
              if (data.status === "won" || data.status === "lost") { setShowResult(true); resumedComplete.current = true; }
              setAvatarUrl(data.avatarUrl || null);
              if (data.employee) setEmployee(data.employee);
              if (data.answer) setAnswer(data.answer);
              if (data.durationSeconds != null) setDuration(data.durationSeconds);
              if (data.score != null) setFinalScore(data.score);
              if (data.guesses?.length) restoreLetterStatuses(data.guesses);
              return;
            }
          } catch { /* fall through */ }
        }
      }

      if (mode === "practice") {
        const savedSessionId = localStorage.getItem("practiceSessionId");
        console.log("[practice resume] saved sessionId:", savedSessionId);
        if (savedSessionId) {
          try {
            const res = await getGameState(savedSessionId);
            console.log("[practice resume] server response:", res);
            if (res && res.status && res.status !== "error") {
              setSessionId(savedSessionId);
              setWordLength(res.wordLength);
              setMaxGuesses(res.maxGuesses);
              setGuesses(res.guesses || []);
              setCurrentGuess("");
              setStatus(res.status);
              setAvatarUrl(res.avatarUrl || null);
              if (res.status === "won" || res.status === "lost") {
                // Practice game already complete — clear and start fresh
                localStorage.removeItem("practiceSessionId");
              } else {
                if (res.guesses?.length) restoreLetterStatuses(res.guesses);
                return;
              }
            }
          } catch (e) {
            console.log("[practice resume] failed:", e.message);
            /* session expired, fall through to new game */
          }
        }
      }

      await newGame();
    }
    init().finally(() => setInitializing(false));
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
          const thisScore = data.score ?? null;
          setFinalScore(thisScore);
          setMessage("");
          setShowResult(false);

          // For daily wins: check if this score is a new top-3 high score
          if (mode === "daily" && data.status === "won" && thisScore != null) {
            getDailyLeaderboard().then(board => {
              // board is sorted by score DESC; find top 3 already-finished entries
              const top3 = board.slice(0, 3);
              let medal = null;
              const rank3Score = top3.length >= 3 ? Number(top3[2].score) : -1;
              if (thisScore >= rank3Score || top3.length < 3) {
                const rank1Score = top3.length >= 1 ? Number(top3[0].score) : -1;
                const rank2Score = top3.length >= 2 ? Number(top3[1].score) : -1;
                if (thisScore >= rank1Score) medal = { medal: "gold", rank: 1 };
                else if (thisScore >= rank2Score) medal = { medal: "silver", rank: 2 };
                else medal = { medal: "bronze", rank: 3 };
              }
              setMedalInfo(medal);
            }).catch(() => {});
          }

          if (data.status === "won" && avatarUrl) {
            // After tile flips: drain blur + dance tiles, then show result
            const blurDrainDuration = 1000;
            setTimeout(() => {
              setBlurDraining(true);
              setCelebrating(true);
            }, flipDelay * 1000);
            setTimeout(() => setShowResult(true), flipDelay * 1000 + blurDrainDuration + 500);
          } else {
            setTimeout(() => setShowResult(true), flipDelay * 1000);
          }
        }
      } catch (e) {
        const msg = e?.response?.data?.error || "Invalid guess";
        setMessage(msg);
        setMsgVisible(true);
        // Fade text out at 1.6s, remove box at 2s
        setTimeout(() => setMsgVisible(false), 1600);
        setTimeout(() => setMessage(""), 2000);
        if (msg.toLowerCase().includes("valid word") || msg.toLowerCase().includes("invalid")) {
          setShakingRow(true);
          setTimeout(() => setShakingRow(false), 500);
        }
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

  if (initializing) return <Box minH="100vh" bg={t.bg} />;

  return (
    <Box minH="100vh" bg={t.bg} display="flex" flexDir="column" alignItems="center" fontFamily={t.font}>


      {showResult && (status === "won" || status === "lost") && (
        <ResultScreen
          won={status === "won"}
          answer={answer}
          guesses={guesses}
          maxGuesses={maxGuesses}
          wordLength={wordLength}
          employee={employee}
          durationSeconds={duration}
          score={finalScore}
          instant={resumedComplete.current}
          isDaily={mode === "daily"}
          medalInfo={medalInfo}
          onPlayAgain={mode === "practice" ? () => newGame({}) : null}
          onPractice={null}
          onShowStats={null}
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
              {mode === "daily" && (
                <Box
                  as="button"
                  onClick={async (e) => {
                    e.stopPropagation();
                    const token = getToken();
                    await fetch(`${BASE_URL}/api/dev/reset-daily`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
                    setDebugOpen(false);
                    await newGame({});
                  }}
                  bg="#2e1a1a" color="#ff8080" border="1px solid #444" borderRadius="sm"
                  px={2} py={1} fontSize="xs" fontFamily="monospace" cursor="pointer" w="100%"
                  _hover={{ bg: "#3e1a1a" }}
                >
                  🗑️ reset daily
                </Box>
              )}
            </Box>
          )}
        </Box>
      )}



      {/* Header */}
      <Box w="100%" maxW="520px" borderBottom="1px solid" borderColor={t.border} bg={t.surface} py={3} px={4}>
        <HStack justifyContent="space-between" alignItems="center">
          <HStack gap={2}>


            {isDevAccount && (
              <Box
                as="button"
                onClick={toggleDevMode}
                title={devMode ? "Dev mode on" : "Dev mode off"}
                fontSize="sm"
                px={2} py={0.5}
                borderRadius="full"
                border="1px solid"
                borderColor={devMode ? "#f0c040" : t.border}
                bg={devMode ? "#f0c04022" : "transparent"}
                color={devMode ? "#f0c040" : t.muted}
                cursor="pointer"
                fontFamily="monospace"
                fontWeight="bold"
                transition="all 0.15s"
                _hover={{ borderColor: "#f0c040", color: "#f0c040" }}
              >
                🔧
              </Box>
            )}
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
                    <UserMenuDropdown
                      user={user}
                      isAdmin={!!isDevAccount}
                      onClose={() => setShowUserMenu(false)}
                      showHeader
                    />
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
          {sessionId && avatarUrl && (() => {
            const isBlacked = guesses.length === 0 && !blurDraining;
            const blurredUrl = `${BASE_URL}/api/avatar/session/${sessionId}?g=${guesses.length}`;
            const fullUrl = `${BASE_URL}/api/avatar/session/${sessionId}?g=done`;
            // Border blur: mirror the image blur level (matches BLUR_LEVELS_BY_GUESS on server)
            const BORDER_BLUR = [18, 18, 10, 6, 3, 1]; // by guess count, px
            const borderBlurPx = blurDraining ? 0 : (BORDER_BLUR[guesses.length] ?? 1);
            return (
              <Box position="relative" display="inline-flex" alignItems="center" justifyContent="center">
                <AvatarCanvas
                  blurredUrl={blurredUrl}
                  fullUrl={fullUrl}
                  isBlacked={isBlacked}
                  blurDraining={blurDraining}
                  accent={t.accent}
                  borderBlurPx={borderBlurPx}
                />
                {/* Message overlay — text fades, box snaps away */}
                {message && (
                  <Box
                    position="absolute"
                    left="50%" top="50%"
                    bg="white" color={msgColor} px={4} py={1} borderRadius="10px"
                    fontWeight="700" fontSize="sm" fontFamily={t.font}
                    border="2px solid" borderColor={msgColor}
                    boxShadow="0 2px 8px rgba(0,100,200,0.1)"
                    zIndex={10}
                    style={{
                      transform: "translate(-50%, -50%)",
                      whiteSpace: "nowrap",
                      pointerEvents: "none",
                      opacity: msgVisible ? 1 : 0,
                      transition: "opacity 0.35s ease-out",
                    }}
                  >
                    {message}
                  </Box>
                )}
              </Box>
            );
          })()}
        </Box>

        {status === "idle" ? (
          <Box h={`${maxGuesses * 56 + 24}px`} /> /* placeholder matching board height */
        ) : (
          <Board
            guesses={guesses}
            currentGuess={currentGuess}
            currentRow={currentRow}
            wordLength={wordLength}
            maxGuesses={maxGuesses}
            celebratingRow={celebrating ? guesses.length - 1 : -1}
            shakingRow={shakingRow ? currentRow : -1}
          />
        )}

        {status !== "idle" && <Keyboard onKey={handleKey} letterStatuses={letterStatuses} />}

        <Box h="72px" />
      </VStack>
    </Box>
  );
}
