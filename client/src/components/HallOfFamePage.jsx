import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Box, VStack, Text, HStack, Avatar, Spinner, Heading } from "@chakra-ui/react";
import { motion } from "framer-motion";
import { Trophy } from "@phosphor-icons/react";
import axios from "axios";
import { t } from "../theme";
import { useAuth } from "../useAuth";
import { DEV_ACCOUNTS } from "../constants";

const BASE_URL = import.meta.env.VITE_API_URL ?? "";

function shortName(name) {
  const parts = (name || "").trim().split(" ");
  return parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1][0]}.` : parts[0];
}

function formatWeekRange(weekStart) {
  // weekStart is YYYY-MM-DD (Monday)
  const [y, m, d] = weekStart.split("-").map(Number);
  const mon = new Date(Date.UTC(y, m - 1, d));
  const fri = new Date(Date.UTC(y, m - 1, d + 4));
  const fmt = (dt) =>
    dt.toLocaleDateString("en-US", { timeZone: "UTC", month: "short", day: "numeric" });
  return `${fmt(mon)} – ${fmt(fri)}, ${y}`;
}

export default function HallOfFamePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user && DEV_ACCOUNTS.includes(user.email);
  const [weeks, setWeeks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAdmin) return;
    axios
      .get(`${BASE_URL}/api/leaderboard/hall-of-fame`)
      .then((r) => setWeeks(r.data))
      .catch(() => setWeeks([]))
      .finally(() => setLoading(false));
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <Box minH="100vh" bg={t.bg} display="flex" alignItems="center" justifyContent="center" fontFamily={t.font}>
        <VStack gap={3}>
          <Text fontSize="3xl">🔒</Text>
          <Text color={t.muted} fontFamily={t.font}>Admins only</Text>
          <Box as="button" color={t.accent} fontFamily={t.font} fontSize="sm" fontWeight="600" onClick={() => navigate("/")}>
            ← Back to home
          </Box>
        </VStack>
      </Box>
    );
  }

  return (
    <Box minH="100vh" bg={t.bg} display="flex" flexDir="column" alignItems="center" fontFamily={t.font}>
      {/* Header */}
      <Box w="100%" maxW="520px" bg={t.surface} borderBottom={`1px solid ${t.border}`} py={3} px={4}>
        <HStack justifyContent="space-between" alignItems="center">
          <Box
            as="button"
            onClick={() => navigate("/")}
            color={t.muted}
            fontSize="sm"
            cursor="pointer"
            fontFamily={t.font}
            _hover={{ color: t.text }}
          >
            ← Home
          </Box>
          <HStack gap={2}>
            <Trophy size={18} weight="duotone" color="#f5a623" />
            <Heading size="sm" color={t.text} fontFamily={t.font}>
              Hall of Fame
            </Heading>
          </HStack>
          <Box w="48px" />
        </HStack>
      </Box>

      <VStack w="100%" maxW="520px" px={4} py={5} gap={3} align="stretch">
        {loading ? (
          <Box display="flex" justifyContent="center" py={12}>
            <Spinner color={t.accent} />
          </Box>
        ) : weeks.length === 0 ? (
          <Text color={t.muted} textAlign="center" py={12} fontFamily={t.font}>
            No completed weeks yet 🏆
          </Text>
        ) : (
          weeks.map((week, i) => (
            <motion.div
              key={week.week_start}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.25 }}
            >
              <Box
                bg={t.surface}
                border={`1px solid ${t.border}`}
                borderRadius="xl"
                overflow="hidden"
              >
                {/* Week header */}
                <HStack px={4} py={2.5} borderBottom={`1px solid ${t.border}`} justifyContent="space-between">
                  <Text fontSize="xs" fontWeight="700" color={t.muted} fontFamily={t.font} letterSpacing="0.08em" textTransform="uppercase">
                    Week {i + 1}
                  </Text>
                  <Text fontSize="xs" color={t.muted} fontFamily={t.font}>
                    {formatWeekRange(week.week_start)}
                  </Text>
                </HStack>

                {/* Winner row */}
                <HStack px={4} py={3} gap={3}>
                  <Text fontSize="xl" flexShrink={0}>🥇</Text>
                  <Avatar.Root size="md" flexShrink={0}>
                    <Avatar.Image src={week.avatar_url} />
                    <Avatar.Fallback>{week.name?.[0]}</Avatar.Fallback>
                  </Avatar.Root>
                  <VStack gap={0} align="flex-start" flex={1} minW={0}>
                    <Text fontSize="md" fontWeight="700" color={t.text} fontFamily={t.font} noOfLines={1}>
                      {shortName(week.name)}
                    </Text>
                    <HStack gap={2} mt={0.5}>
                      <Text fontSize="xs" color={t.muted} fontFamily={t.font}>
                        {week.wins} win{week.wins !== 1 ? "s" : ""} · {week.played} played
                      </Text>
                    </HStack>
                  </VStack>
                  <VStack gap={0} align="flex-end" flexShrink={0}>
                    <Text fontSize="lg" fontWeight="700" color={t.accent} fontFamily={t.font}>
                      {week.total_score}
                    </Text>
                    <Text fontSize="xs" color={t.muted} fontFamily={t.font}>pts</Text>
                  </VStack>
                </HStack>
              </Box>
            </motion.div>
          ))
        )}
      </VStack>
    </Box>
  );
}
