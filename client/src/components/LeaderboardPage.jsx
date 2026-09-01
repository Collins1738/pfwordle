import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Box, VStack, Text, HStack, Avatar, Spinner, Heading } from "@chakra-ui/react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy } from "@phosphor-icons/react";
import axios from "axios";
import { t } from "../theme";
import { useAuth } from "../useAuth";

const BASE_URL = import.meta.env.VITE_API_URL ?? "";

const STATUS_COLORS = {
  correct: t.correct,
  present: t.present,
  absent:  t.absent,
  empty:   t.border,
};

function MiniBoard({ guesses, maxGuesses = 6, wordLength = 5, size = 8 }) {
  const rows = Array.from({ length: maxGuesses }, (_, i) => guesses[i] || null);
  return (
    <VStack gap="2px">
      {rows.map((g, i) => (
        <HStack key={i} gap="2px">
          {Array.from({ length: wordLength }, (_, j) => {
            const status = g?.result?.[j]?.status || "empty";
            return (
              <Box
                key={j}
                w={`${size}px`} h={`${size}px`}
                bg={STATUS_COLORS[status] || t.border}
                borderRadius="1px"
                flexShrink={0}
              />
            );
          })}
        </HStack>
      ))}
    </VStack>
  );
}

function shortNameFn(name) {
  const parts = (name || "").trim().split(" ");
  return parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1][0]}.` : parts[0];
}

function BoardModal({ row, onClose }) {
  if (!row) return null;
  const guesses = row.guesses || [];
  const wordLength = guesses[0]?.result?.length || 5;
  const maxGuesses = Math.max(6, guesses.length);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{ position: "fixed", inset: 0, background: "rgba(0,50,120,0.4)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center" }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ type: "spring", stiffness: 300, damping: 28 }}
          onClick={e => e.stopPropagation()}
          style={{ width: "100%", maxWidth: "320px", margin: "0 16px" }}
        >
          <Box bg={t.surface} border={`1px solid ${t.border}`} borderRadius="2xl" overflow="hidden">
            <HStack px={4} py={3} borderBottom={`1px solid ${t.border}`} gap={3}>
              <Avatar.Root size="sm">
                <Avatar.Image src={row.avatar_url} />
                <Avatar.Fallback>{row.name?.[0]}</Avatar.Fallback>
              </Avatar.Root>
              <VStack gap={0} align="flex-start" flex={1}>
                <Text fontSize="sm" fontWeight="700" color={t.text} fontFamily={t.font}>{shortNameFn(row.name)}</Text>
                <Text fontSize="xs" color={t.muted} fontFamily={t.font}>
                  {row.status === "won" ? `${row.guess_count} guess${row.guess_count !== 1 ? "es" : ""}` : "Did not get it"}
                </Text>
              </VStack>
              <Box as="button" color={t.muted} onClick={onClose} fontSize="lg" cursor="pointer" lineHeight={1}>✕</Box>
            </HStack>
            <Box p={4} display="flex" flexDir="column" alignItems="center" gap={3}>
              <VStack gap="4px">
                {Array.from({ length: maxGuesses }, (_, i) => {
                  const g = guesses[i];
                  return (
                    <HStack key={i} gap="4px">
                      {Array.from({ length: wordLength }, (_, j) => {
                        const status = g?.result?.[j]?.status || "empty";
                        return (
                          <Box
                            key={j}
                            w="36px" h="36px"
                            bg={STATUS_COLORS[status] || "transparent"}
                            border={status === "empty" ? `2px solid ${t.border}` : "none"}
                            borderRadius="6px"
                            display="flex" alignItems="center" justifyContent="center"
                          >
                            {g?.result?.[j]?.letter && (
                              <Text fontSize="sm" fontWeight="700" color={t.white} fontFamily={t.font}>
                                {g.result[j].letter}
                              </Text>
                            )}
                          </Box>
                        );
                      })}
                    </HStack>
                  );
                })}
              </VStack>
            </Box>
          </Box>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}


function ProfileModal({ row, onClose }) {
  if (!row) return null;
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{ position: "fixed", inset: 0, background: "rgba(0,50,120,0.4)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center" }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ type: "spring", stiffness: 300, damping: 28 }}
          onClick={e => e.stopPropagation()}
          style={{ width: "100%", maxWidth: "320px", margin: "0 16px" }}
        >
          <Box bg={t.surface} border={`1px solid ${t.border}`} borderRadius="2xl" overflow="hidden">
            <HStack px={4} py={3} borderBottom={`1px solid ${t.border}`} gap={3} justifyContent="flex-end">
              <Box as="button" color={t.muted} onClick={onClose} fontSize="lg" cursor="pointer" lineHeight={1}>✕</Box>
            </HStack>
            <VStack px={6} py={6} gap={3} align="center">
              <Avatar.Root size="xl">
                <Avatar.Image src={row.avatar_url} />
                <Avatar.Fallback fontSize="2xl">{row.name?.[0]}</Avatar.Fallback>
              </Avatar.Root>
              <VStack gap={1} align="center">
                <Text fontSize="lg" fontWeight="700" color={t.text} fontFamily={t.font} textAlign="center">
                  {row.employee_full_name || row.name}
                </Text>
                {row.employee_title && (
                  <Text fontSize="sm" color={t.muted} fontFamily={t.font} textAlign="center">{row.employee_title}</Text>
                )}
                {row.employee_department && (
                  <Box bg={t.accent + "22"} px={3} py={0.5} borderRadius="full">
                    <Text fontSize="xs" color={t.accent} fontFamily={t.font} fontWeight="600">{row.employee_department}</Text>
                  </Box>
                )}
              </VStack>
              {(() => {
                // Weekly rows have wins/played/total_score; daily rows have status/guess_count/score
                const isWeeklyRow = row.total_score !== undefined;
                const wins = isWeeklyRow ? row.wins : (row.status === "won" ? 1 : 0);
                const played = isWeeklyRow ? row.played : 1;
                const pts = isWeeklyRow ? row.total_score : (row.score ?? 0);
                return (
                  <HStack gap={4} pt={2}>
                    <VStack gap={0} align="center">
                      <Text fontSize="xl" fontWeight="700" color={t.accent} fontFamily={t.font}>{wins}</Text>
                      <Text fontSize="xs" color={t.muted} fontFamily={t.font}>wins</Text>
                    </VStack>
                    <VStack gap={0} align="center">
                      <Text fontSize="xl" fontWeight="700" color={t.text} fontFamily={t.font}>{played}</Text>
                      <Text fontSize="xs" color={t.muted} fontFamily={t.font}>played</Text>
                    </VStack>
                    <VStack gap={0} align="center">
                      <Text fontSize="xl" fontWeight="700" color={t.text} fontFamily={t.font}>{pts}</Text>
                      <Text fontSize="xs" color={t.muted} fontFamily={t.font}>pts</Text>
                    </VStack>
                  </HStack>
                );
              })()}
            </VStack>
          </Box>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default function LeaderboardPage() {
  const { type } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRow, setSelectedRow] = useState(null);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [shakingLock, setShakingLock] = useState(null);
  const [showLockMsg, setShowLockMsg] = useState(false);

  const isWeekly = type === "weekly";

  // Can the current user see other people's guess breakdowns?
  // Only if they're logged in AND have a completed game today (won or lost).
  const hasPlayedToday = user && data.some(row => row.name === user.name);

  useEffect(() => {
    setLoading(true);
    const url = isWeekly ? `${BASE_URL}/api/leaderboard/weekly` : `${BASE_URL}/api/leaderboard/daily`;
    axios.get(url)
      .then(r => setData(r.data))
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, [type]);

  const medals = ["🥇", "🥈", "🥉"];

  function shortName(name) {
    const parts = (name || "").trim().split(" ");
    return parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1][0]}.` : parts[0];
  }

  function handleRowClick(row, i) {
    if (!isWeekly && row.guesses?.length) {
      if (hasPlayedToday) {
        setSelectedRow(row);
      } else {
        setShakingLock(i);
        setShowLockMsg(true);
        setTimeout(() => setShakingLock(null), 600);
        setTimeout(() => setShowLockMsg(false), 3000);
      }
    }
  }

  return (
    <>
      <style>{`
        @keyframes lock-shake {
          0%   { transform: rotate(0deg); }
          15%  { transform: rotate(-18deg); }
          35%  { transform: rotate(18deg); }
          55%  { transform: rotate(-12deg); }
          75%  { transform: rotate(10deg); }
          90%  { transform: rotate(-5deg); }
          100% { transform: rotate(0deg); }
        }
        .lock-shaking { animation: lock-shake 0.55s ease; }
      `}</style>
      {selectedRow && <BoardModal row={selectedRow} onClose={() => setSelectedRow(null)} />}
      {selectedProfile && <ProfileModal row={selectedProfile} onClose={() => setSelectedProfile(null)} />}

      <Box minH="100vh" bg={t.bg} display="flex" flexDir="column" alignItems="center" fontFamily={t.font}>
        {/* Header */}
        <Box w="100%" maxW="520px" bg={t.surface} borderBottom={`1px solid ${t.border}`} py={3} px={4}>
          <HStack justifyContent="space-between" alignItems="center">
            <Box as="button" onClick={() => navigate("/")} color={t.muted} fontSize="sm" cursor="pointer" fontFamily={t.font} _hover={{ color: t.text }}>
              ← Home
            </Box>
            <HStack gap={2}>
              <Trophy size={18} weight="duotone" color={t.accent} />
              <Heading size="sm" color={t.text} fontFamily={t.font}>
                {isWeekly ? "This Week" : "Today"}
              </Heading>
            </HStack>
            <Box w="48px" />
          </HStack>
        </Box>

        {/* Tab toggle */}
        <Box w="100%" maxW="520px" display="flex" borderBottom={`1px solid ${t.border}`} bg={t.surface}>
          {["daily", "weekly"].map(tab => (
            <Box
              key={tab} flex={1} textAlign="center" py={2} cursor="pointer"
              bg={type === tab ? "white" : "transparent"}
              color={type === tab ? t.accent : t.muted}
              fontWeight={type === tab ? "700" : "500"}
              fontFamily={t.font} fontSize="sm"
              borderBottom={type === tab ? `2px solid ${t.accent}` : "2px solid transparent"}
              transition="all 0.15s"
              onClick={() => navigate(`/leaderboard/${tab}`)}
            >
              {tab === "daily" ? "Today" : "This Week"}
            </Box>
          ))}
        </Box>

        {/* Lock toast */}
        <Box
          position="fixed" bottom="24px" left="50%" zIndex={200}
          style={{
            transform: "translateX(-50%)",
            transition: "opacity 0.3s, transform 0.3s",
            opacity: showLockMsg ? 1 : 0,
            pointerEvents: "none",
          }}
        >
          <Box
            bg={t.text} color="white" px={4} py={2} borderRadius={t.radiusFull}
            fontFamily={t.font} fontSize="sm" fontWeight="600"
            boxShadow="0 4px 16px rgba(0,0,0,0.2)"
            whiteSpace="nowrap"
          >
            🔒 Play today's daily to view (no cheating 😄)
          </Box>
        </Box>

        <VStack w="100%" maxW="520px" px={4} py={4} gap={0} align="stretch">
          {loading ? (
            <Box display="flex" justifyContent="center" py={12}><Spinner color={t.accent} /></Box>
          ) : data.length === 0 ? (
            <Text color={t.muted} textAlign="center" py={12} fontFamily={t.font}>No entries yet 👀</Text>
          ) : (
            <Box bg={t.surface} border={`1px solid ${t.border}`} borderRadius="xl" overflow="hidden">
              {data.map((row, i) => {
                const isYou = user && row.name === user.name;
                const wordLength = row.guesses?.[0]?.result?.length || 5;
                const maxGuesses = Math.max(6, row.guess_count || 6);
                return (
                  <HStack
                    key={i} px={4} py={3} gap={3}
                    borderBottom={i < data.length - 1 ? `1px solid ${t.border}` : "none"}
                    bg={isYou ? t.accent + "11" : "transparent"}
                    cursor={isWeekly || (row.guesses?.length && hasPlayedToday) ? "pointer" : "default"}
                    onClick={isWeekly ? () => setSelectedProfile(row) : (row.guesses?.length ? (e) => { e.stopPropagation(); handleRowClick(row, i); } : undefined)}
                    _hover={isWeekly || (row.guesses?.length && hasPlayedToday) ? { bg: isYou ? t.accent + "22" : t.bg } : {}}
                    transition="background 0.1s"
                  >
                    <Text fontSize="sm" w="28px" textAlign="center" flexShrink={0} color={t.muted} fontFamily={t.font}>
                      {isWeekly ? (medals[i] || `#${i + 1}`) : `#${i + 1}`}
                    </Text>
                    <Avatar.Root size="sm" flexShrink={0} cursor="pointer"
                      onClick={e => { e.stopPropagation(); setSelectedProfile(row); }}>
                      <Avatar.Image src={row.avatar_url} />
                      <Avatar.Fallback>{row.name?.[0]}</Avatar.Fallback>
                    </Avatar.Root>
                    <VStack gap={0} align="flex-start" flex={1} minW={0}>
                      <HStack gap={1.5} w="100%">
                        <Text fontSize="sm" color={isYou ? t.accent : t.text} fontFamily={t.font} fontWeight={isYou ? "700" : "600"} noOfLines={1}
                          cursor="pointer" onClick={e => { e.stopPropagation(); setSelectedProfile(row); }}>
                          {shortName(row.name)}
                          {isYou && <Text as="span" color={t.muted} fontWeight="400"> (you)</Text>}
                        </Text>
                      </HStack>
                      {!isWeekly && row.status === "won" && (
                        <HStack gap={1.5} mt={0.5}>
                          {row.duration_seconds != null && (() => {
                            const d = row.duration_seconds;
                            const tier = d < 60
                              ? { label: "< 1 min", color: t.accent, bg: t.accent + "28" }
                              : d < 300
                              ? { label: "< 5 mins", color: t.accent, bg: t.accent + "18" }
                              : d < 600
                              ? { label: "< 10 mins", color: t.muted, bg: t.border + "66" }
                              : d < 1800
                              ? { label: "< 30 mins", color: t.muted, bg: t.bg }
                              : null;
                            return tier ? (
                              <Box bg={tier.bg} borderRadius="full" px={1.5} py={0.5}>
                                <Text fontSize="9px" color={tier.color} fontFamily={t.font} fontWeight="700">{tier.label}</Text>
                              </Box>
                            ) : null;
                          })()}
                        </HStack>
                      )}
                    </VStack>
                    {!isWeekly && row.status === "lost" && (
                      <Text fontSize="xs" color={t.present} fontFamily={t.font} fontWeight="700" flexShrink={0}>❌</Text>
                    )}
                    {isWeekly && (
                      <VStack gap={0} align="flex-end" flexShrink={0}>
                        <Text fontSize="xs" color={t.accent} fontFamily={t.font} fontWeight="700">
                          {row.total_score ?? 0} pts
                        </Text>
                        <Text fontSize="xs" color={t.muted} fontFamily={t.font}>
                          {row.played} game{row.played !== 1 ? "s" : ""}
                        </Text>
                      </VStack>
                    )}
                    {!isWeekly && row.guesses?.length > 0 && (
                      <VStack gap={0.5} align="center" flexShrink={0}>
                        <Box position="relative">
                          <Box
                            opacity={hasPlayedToday ? 0.75 : 1}
                            style={hasPlayedToday ? {} : { filter: "blur(1.5px)" }}
                          >
                            <MiniBoard guesses={row.guesses} maxGuesses={maxGuesses} wordLength={wordLength} size={5} />
                          </Box>
                          {!hasPlayedToday && (
                            <Box
                              position="absolute" inset={0}
                              display="flex" alignItems="center" justifyContent="center"
                            >
                              <Text
                                fontSize="10px" lineHeight={1}
                                className={shakingLock === i ? "lock-shaking" : ""}
                                display="inline-block"
                              >🔒</Text>
                            </Box>
                          )}
                        </Box>
                        {row.score != null && hasPlayedToday && (
                          <Text fontSize="9px" color={t.accent} fontFamily={t.font} fontWeight="700">{row.score}pts</Text>
                        )}
                      </VStack>
                    )}
                  </HStack>
                );
              })}
            </Box>
          )}
        </VStack>
      </Box>
    </>
  );
}
