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

export default function LeaderboardPage() {
  const { type } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRow, setSelectedRow] = useState(null);

  const isWeekly = type === "weekly";

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

  return (
    <>
      {selectedRow && <BoardModal row={selectedRow} onClose={() => setSelectedRow(null)} />}

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
                    cursor={!isWeekly && row.guesses?.length ? "pointer" : "default"}
                    onClick={!isWeekly && row.guesses?.length ? (e) => { e.stopPropagation(); setSelectedRow(row); } : undefined}
                    _hover={!isWeekly && row.guesses?.length ? { bg: isYou ? t.accent + "22" : t.bg } : {}}
                    transition="background 0.1s"
                  >
                    <Text fontSize="sm" w="28px" textAlign="center" flexShrink={0} color={t.muted} fontFamily={t.font}>
                      {medals[i] || `#${i + 1}`}
                    </Text>
                    <Avatar.Root size="sm" flexShrink={0}>
                      <Avatar.Image src={row.avatar_url} />
                      <Avatar.Fallback>{row.name?.[0]}</Avatar.Fallback>
                    </Avatar.Root>
                    <VStack gap={0} align="flex-start" flex={1} minW={0}>
                      <HStack gap={1.5} w="100%">
                        <Text fontSize="sm" color={isYou ? t.accent : t.text} fontFamily={t.font} fontWeight={isYou ? "700" : "600"} noOfLines={1}>
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
                      <Text fontSize="xs" color={t.accent} fontFamily={t.font} fontWeight="700" flexShrink={0}>
                        {row.total_score ?? 0} pts
                      </Text>
                    )}
                    {!isWeekly && row.guesses?.length > 0 && (
                      <VStack gap={0.5} align="center" flexShrink={0}>
                        <Box opacity={0.75}>
                          <MiniBoard guesses={row.guesses} maxGuesses={maxGuesses} wordLength={wordLength} size={5} />
                        </Box>
                        {row.score != null && (
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
