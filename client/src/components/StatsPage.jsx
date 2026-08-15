import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Box, Text, VStack, HStack, Spinner } from "@chakra-ui/react";
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

export default function StatsPage({ token, maxGuesses = 6, mode = "daily" }) {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    axios.get(`${BASE_URL}/api/stats?mode=${mode}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => setStats(r.data))
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
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
          </VStack>
        )}
      </Box>
    </Box>
  );
}
