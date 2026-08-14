import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Box, Text, VStack, HStack, Spinner } from "@chakra-ui/react";
import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL ?? "";

function StatBox({ value, label }) {
  return (
    <VStack gap={0} flex={1} align="center">
      <Text fontSize="2xl" fontWeight="black" color="white" lineHeight={1}>{value}</Text>
      <Text fontSize="10px" color="#818384" textAlign="center" mt={1} lineHeight="1.2">{label}</Text>
    </VStack>
  );
}

export default function StatsModal({ onClose, token, maxGuesses = 6 }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    axios.get(`${BASE_URL}/api/stats`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => setStats(r.data))
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, [token]);

  const maxCount = stats?.distribution?.reduce((m, r) => Math.max(m, parseInt(r.count)), 1) || 1;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center" }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 30 }}
          transition={{ type: "spring", stiffness: 300, damping: 28 }}
          onClick={e => e.stopPropagation()}
          style={{ width: "100%", maxWidth: "420px", margin: "0 16px" }}
        >
          <Box bg="#1a1a1b" border="1px solid #3a3a3c" borderRadius="xl" p={6}>
            <HStack justifyContent="space-between" mb={5}>
              <Text fontSize="sm" fontWeight="bold" color="white" letterSpacing="0.12em" textTransform="uppercase">
                Statistics
              </Text>
              <Box as="button" color="#818384" onClick={onClose} fontSize="lg" cursor="pointer" lineHeight={1}>✕</Box>
            </HStack>

            {loading ? (
              <Box display="flex" justifyContent="center" py={6}><Spinner color="#538d4e" /></Box>
            ) : !stats || !token ? (
              <Text color="#818384" textAlign="center" py={6} fontSize="sm">
                Sign in to track your stats 👀
              </Text>
            ) : (
              <VStack gap={6} align="stretch">
                {/* Top stats row */}
                <HStack gap={2} justify="center">
                  <StatBox value={stats.played} label="Played" />
                  <StatBox value={`${stats.winPct}`} label="Win %" />
                  <StatBox value={stats.currentStreak} label={`Current\nStreak`} />
                  <StatBox value={stats.maxStreak} label={`Max\nStreak`} />
                </HStack>

                {/* Guess distribution */}
                <Box>
                  <Text fontSize="xs" fontWeight="bold" color="white" letterSpacing="0.12em" textTransform="uppercase" mb={3}>
                    Guess Distribution
                  </Text>
                  <VStack gap={1.5} align="stretch">
                    {Array.from({ length: maxGuesses }, (_, i) => {
                      const row = stats.distribution?.find(r => parseInt(r.guess_count) === i + 1);
                      const count = row ? parseInt(row.count) : 0;
                      const pct = Math.max(8, Math.round((count / maxCount) * 100));
                      return (
                        <HStack key={i} gap={2} align="center">
                          <Text color="#818384" fontSize="sm" w="12px" textAlign="right" flexShrink={0}>{i + 1}</Text>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ delay: 0.1 + i * 0.05, duration: 0.4, ease: "easeOut" }}
                            style={{ background: count > 0 ? "#538d4e" : "#3a3a3c", borderRadius: 4, minWidth: 24, display: "flex", alignItems: "center", justifyContent: "flex-end", padding: "2px 6px" }}
                          >
                            <Text fontSize="xs" color="white" fontWeight="bold">{count}</Text>
                          </motion.div>
                        </HStack>
                      );
                    })}
                  </VStack>
                </Box>
              </VStack>
            )}
          </Box>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
