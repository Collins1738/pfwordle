import { useState, useEffect } from "react";
import { Box, VStack, Text, Heading, HStack, Avatar, Spinner } from "@chakra-ui/react";
import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL ?? "";

export default function Leaderboard({ onClose }) {
  const [tab, setTab] = useState("daily");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const url = tab === "daily" ? `${BASE_URL}/api/leaderboard/daily` : `${BASE_URL}/api/leaderboard/alltime`;
    axios.get(url)
      .then(r => setData(r.data))
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, [tab]);

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <Box
      position="fixed" inset={0} bg="rgba(0,0,0,0.85)" zIndex={100}
      display="flex" alignItems="center" justifyContent="center"
      onClick={onClose}
    >
      <Box
        bg="#1a1a1b" border="1px solid #3a3a3c" borderRadius="xl"
        w="100%" maxW="420px" mx={4} p={6} maxH="80vh" overflowY="auto"
        onClick={e => e.stopPropagation()}
      >
        <HStack justifyContent="space-between" mb={4}>
          <Heading size="md" color="white">🏆 Leaderboard</Heading>
          <Box as="button" color="#818384" onClick={onClose} fontSize="xl" cursor="pointer">✕</Box>
        </HStack>

        {/* Tabs */}
        <HStack mb={4} gap={0} border="1px solid #3a3a3c" borderRadius="lg" overflow="hidden">
          {["daily", "alltime"].map(t => (
            <Box
              key={t}
              flex={1} textAlign="center" py={2} cursor="pointer"
              bg={tab === t ? "#538d4e" : "transparent"}
              color={tab === t ? "white" : "#818384"}
              onClick={() => setTab(t)}
              fontSize="sm" fontWeight="bold"
              transition="all 0.15s"
            >
              {t === "daily" ? "Today" : "All Time"}
            </Box>
          ))}
        </HStack>

        {loading ? (
          <Box display="flex" justifyContent="center" py={8}><Spinner color="#538d4e" /></Box>
        ) : data.length === 0 ? (
          <Text color="#818384" textAlign="center" py={8}>No games yet today 👀</Text>
        ) : (
          <VStack gap={2} align="stretch">
            {data.map((row, i) => (
              <HStack key={i} bg="#242425" borderRadius="lg" px={3} py={2} gap={3}>
                <Text fontSize="lg" w="28px" textAlign="center">
                  {medals[i] || <Text color="#818384">{i + 1}</Text>}
                </Text>
                <Avatar.Root size="sm">
                  <Avatar.Image src={row.avatar_url} />
                  <Avatar.Fallback>{row.name?.[0]}</Avatar.Fallback>
                </Avatar.Root>
                <Text color="white" fontWeight="medium" flex={1} fontSize="sm">{row.name}</Text>
                {tab === "daily" ? (
                  <VStack gap={0} align="flex-end">
                    <Text color="#538d4e" fontWeight="bold" fontSize="sm">
                      {row.status === "won" ? `${row.guess_count} guess${row.guess_count !== 1 ? "es" : ""}` : "❌"}
                    </Text>
                    {row.duration_seconds && (
                      <Text color="#818384" fontSize="xs">{formatDuration(row.duration_seconds)}</Text>
                    )}
                  </VStack>
                ) : (
                  <VStack gap={0} align="flex-end">
                    <Text color="#538d4e" fontWeight="bold" fontSize="sm">{row.wins}W</Text>
                    <Text color="#818384" fontSize="xs">avg {row.avg_guesses}</Text>
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
