import { useState, useEffect } from "react";
import { Box, VStack, Text, Heading, HStack, Avatar, Spinner } from "@chakra-ui/react";
import { Trophy } from "@phosphor-icons/react";
import axios from "axios";
import { t } from "../theme";

const BASE_URL = import.meta.env.VITE_API_URL ?? "";

export default function Leaderboard({ onClose }) {
  const [tab, setTab] = useState("daily");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const url = tab === "daily"   ? `${BASE_URL}/api/leaderboard/daily`
              : tab === "weekly"  ? `${BASE_URL}/api/leaderboard/weekly`
              :                     `${BASE_URL}/api/leaderboard/alltime`;
    axios.get(url)
      .then(r => setData(r.data))
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, [tab]);

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <Box
      position="fixed" inset={0} bg="rgba(0,50,120,0.4)" zIndex={100}
      display="flex" alignItems="center" justifyContent="center"
      onClick={onClose}
    >
      <Box
        bg={t.surface} border={`1px solid ${t.border}`} borderRadius="xl"
        w="100%" maxW="420px" mx={4} p={6} maxH="80vh" overflowY="auto"
        onClick={e => e.stopPropagation()}
      >
        <HStack justifyContent="space-between" mb={4}>
          <Heading size="md" color={t.text} fontFamily={t.font} display="flex" alignItems="center" gap={2}><Trophy size={20} weight="duotone" /> Leaderboard</Heading>
          <Box as="button" color={t.muted} onClick={onClose} fontSize="xl" cursor="pointer">✕</Box>
        </HStack>

        {/* Tabs */}
        <HStack mb={4} gap={0} border={`1px solid ${t.border}`} borderRadius="lg" overflow="hidden">
          {["daily", "weekly", "alltime"].map(tab_ => (
            <Box
              key={tab_}
              flex={1} textAlign="center" py={2} cursor="pointer"
              bg={tab === tab_ ? t.accent : "transparent"}
              color={tab === tab_ ? t.white : t.muted}
              onClick={() => setTab(tab_)}
              fontSize="sm" fontWeight="bold" fontFamily={t.font}
              transition="all 0.15s"
            >
              {tab_ === "daily" ? "Today" : tab_ === "weekly" ? "This Week" : "All Time"}
            </Box>
          ))}
        </HStack>

        {loading ? (
          <Box display="flex" justifyContent="center" py={8}><Spinner color={t.accent} /></Box>
        ) : data.length === 0 ? (
          <Text color={t.muted} textAlign="center" py={8} fontFamily={t.font}>No games yet today 👀</Text>
        ) : (
          <VStack gap={2} align="stretch">
            {data.map((row, i) => (
              <HStack key={i} bg={t.bg} borderRadius="lg" px={3} py={2} gap={3} border={`1px solid ${t.border}`}>
                <Text fontSize="lg" w="32px" textAlign="center" color={medals[i] ? "inherit" : t.muted}>
                  {medals[i] || i + 1}
                </Text>
                <Avatar.Root size="sm">
                  <Avatar.Image src={row.avatar_url} />
                  <Avatar.Fallback>{row.name?.[0]}</Avatar.Fallback>
                </Avatar.Root>
                <Text color={t.text} fontWeight="medium" flex={1} fontSize="sm" fontFamily={t.font}>{row.name}</Text>
                {tab === "daily" ? (
                  <VStack gap={0} align="flex-end">
                    <Text color={t.accent} fontWeight="bold" fontSize="sm" fontFamily={t.font}>
                      {row.status === "won" ? `${row.guess_count} guess${row.guess_count !== 1 ? "es" : ""}` : "❌"}
                    </Text>
                    {row.duration_seconds && (
                      <Text color={t.muted} fontSize="xs">{formatDuration(row.duration_seconds)}</Text>
                    )}
                  </VStack>
                ) : tab === "weekly" ? (
                  <VStack gap={0} align="flex-end">
                    <Text color={t.accent} fontWeight="bold" fontSize="sm" fontFamily={t.font}>{row.total_score} pts</Text>
                    <Text color={t.muted} fontSize="xs">{row.played} game{row.played !== 1 ? "s" : ""}</Text>
                  </VStack>
                ) : (
                  <VStack gap={0} align="flex-end">
                    <Text color={t.accent} fontWeight="bold" fontSize="sm" fontFamily={t.font}>{row.wins}W</Text>
                    <Text color={t.muted} fontSize="xs">avg {row.avg_guesses}</Text>
                  </VStack>
                )}
              </HStack>
            ))}
          </VStack>
        )}
      </Box>
    </Box>
  );
}

function formatDuration(seconds) {
  if (seconds < 60) return `${seconds}s`;
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}
