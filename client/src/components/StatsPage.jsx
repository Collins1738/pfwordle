import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Box, Text, VStack, HStack, Spinner, Avatar } from "@chakra-ui/react";
import axios from "axios";
import { t } from "../theme";

const BASE_URL = import.meta.env.VITE_API_URL ?? "";

function StatBox({ value, label }) {
  return (
    <VStack gap={0} flex={1} align="center">
      <Text fontSize="2xl" fontWeight="black" color={t.text} lineHeight={1}>{value}</Text>
      <Text fontSize="10px" color={t.muted} textAlign="center" mt={1} lineHeight="1.2">{label}</Text>
    </VStack>
  );
}



function rankLabel(rank) {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return `#${rank}`;
}

export default function StatsPage({ token, maxGuesses = 6, mode = "daily", user = null }) {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [weeklyHistory, setWeeklyHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    const headers = { Authorization: `Bearer ${token}` };
    Promise.all([
      axios.get(`${BASE_URL}/api/stats?mode=${mode}`, { headers }).then(r => setStats(r.data)).catch(() => setStats(null)),
      mode === "daily"
        ? axios.get(`${BASE_URL}/api/stats/weekly-history`, { headers }).then(r => setWeeklyHistory(r.data)).catch(() => setWeeklyHistory([]))
        : Promise.resolve(),
    ]).finally(() => setLoading(false));
  }, [token, mode]);

  const maxCount = stats?.distribution?.reduce((m, r) => Math.max(m, parseInt(r.count)), 1) || 1;

  return (
    <Box minH="100vh" bg={t.bg} display="flex" flexDirection="column" alignItems="center" px={4} py={6} fontFamily={t.font}>
      {/* Header */}
      <Box w="100%" maxW="420px" mb={6}>
        <HStack justifyContent="space-between" alignItems="center">
          <Box
            as="button"
            onClick={() => navigate(-1)}
            color={t.muted}
            fontSize="sm"
            cursor="pointer"
            display="flex"
            alignItems="center"
            gap={1}
            _hover={{ color: t.text }}
          >
            ← Back
          </Box>
          <Text fontSize="sm" fontWeight="bold" color={t.text} letterSpacing="0.12em" textTransform="uppercase" fontFamily={t.font}>
            {mode === "practice" ? "🎯 Practice Stats" : "🗓️ Daily Stats"}
          </Text>
          <Box w="48px" />
        </HStack>
      </Box>

      {/* Content */}
      <Box w="100%" maxW="420px">
        {loading ? (
          <Box display="flex" justifyContent="center" py={12}><Spinner color={t.accent} /></Box>
        ) : !stats || !token ? (
          <Text color={t.muted} textAlign="center" py={12} fontSize="sm" fontFamily={t.font}>
            Sign in to track your stats 👀
          </Text>
        ) : (
          <VStack gap={8} align="stretch">
            <HStack gap={2} justify="center">
              <StatBox value={stats.played} label="Played" />
              <StatBox value={`${stats.winPct}`} label="Win %" />
              <StatBox value={stats.currentStreak} label={`Current\nStreak`} />
              <StatBox value={stats.maxStreak} label={`Max\nStreak`} />
            </HStack>

            <Box>
              <Text fontSize="xs" fontWeight="bold" color={t.text} letterSpacing="0.12em" textTransform="uppercase" mb={4} fontFamily={t.font}>
                Guess Distribution
              </Text>
              <VStack gap={2} align="stretch">
                {Array.from({ length: maxGuesses }, (_, i) => {
                  const row = stats.distribution?.find(r => parseInt(r.guess_count) === i + 1);
                  const count = row ? parseInt(row.count) : 0;
                  const pct = Math.max(8, Math.round((count / maxCount) * 100));
                  return (
                    <HStack key={i} gap={2} align="center">
                      <Text color={t.muted} fontSize="sm" w="12px" textAlign="right" flexShrink={0}>{i + 1}</Text>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ delay: 0.1 + i * 0.05, duration: 0.4, ease: "easeOut" }}
                        style={{ background: count > 0 ? t.accent : t.border, borderRadius: 4, minWidth: 24, display: "flex", alignItems: "center", justifyContent: "flex-end", padding: "2px 6px" }}
                      >
                        <Text fontSize="xs" color={t.white} fontWeight="bold">{count}</Text>
                      </motion.div>
                    </HStack>
                  );
                })}
              </VStack>
            </Box>

            {weeklyHistory.length > 0 && (
              <Box>
                <Text fontSize="xs" fontWeight="bold" color={t.text} letterSpacing="0.12em" textTransform="uppercase" mb={3} fontFamily={t.font}>
                  Weekly History
                </Text>
                <VStack gap={2} align="stretch">
                  {weeklyHistory.map((week, i) => (
                    <motion.div
                      key={week.week_start}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05, duration: 0.2 }}
                    >
                      <HStack
                        bg={week.rank === 1 ? "#f5a62311" : t.surface}
                        border={`1px solid ${week.rank === 1 ? "#f5a62344" : t.border}`}
                        borderRadius="xl" px={4} py={2.5} gap={3}
                      >
                        <Text fontSize="lg" flexShrink={0} w="32px" textAlign="center">{rankLabel(parseInt(week.rank))}</Text>
                        <Avatar.Root size="sm" flexShrink={0}>
                          <Avatar.Image src={user?.avatar} />
                          <Avatar.Fallback>{user?.name?.[0]}</Avatar.Fallback>
                        </Avatar.Root>
                        <VStack gap={0} align="flex-start" flex={1}>
                          <Text fontSize="xs" fontWeight="700" color={t.text} fontFamily={t.font}>
                            Week {i + 1}
                          </Text>
                          <Text fontSize="10px" color={t.muted} fontFamily={t.font}>
                            {parseInt(week.rank)} of {week.total_players} players
                          </Text>
                        </VStack>
                        <Text fontSize="sm" fontWeight="700" color={t.accent} fontFamily={t.font} flexShrink={0}>
                          {week.total_score} pts
                        </Text>
                      </HStack>
                    </motion.div>
                  ))}
                </VStack>
              </Box>
            )}
          </VStack>
        )}
      </Box>
    </Box>
  );
}
