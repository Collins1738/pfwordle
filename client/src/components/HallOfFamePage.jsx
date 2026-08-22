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

export default function HallOfFamePage() {
  const navigate = useNavigate();
  const { user, getToken } = useAuth();
  const isAdmin = user && DEV_ACCOUNTS.includes(user.email);
  const [weeks, setWeeks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAdmin) return;
    const token = getToken();
    axios
      .get(`${BASE_URL}/api/leaderboard/hall-of-fame`, {
        headers: { Authorization: `Bearer ${token}` },
      })
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

      <Box w="100%" maxW="520px" px={4} py={5}>
        {loading ? (
          <Box display="flex" justifyContent="center" py={12}>
            <Spinner color={t.accent} />
          </Box>
        ) : weeks.length === 0 ? (
          <Text color={t.muted} textAlign="center" py={12} fontFamily={t.font}>
            No completed weeks yet 🏆
          </Text>
        ) : (
          <Box
            display="grid"
            gridTemplateColumns="repeat(3, 1fr)"
            gap={3}
          >
            {weeks.map((week, i) => (
              <motion.div
                key={week.week_start}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.04, duration: 0.2 }}
              >
                <Box
                  bg={t.surface}
                  border={`1px solid ${t.border}`}
                  borderRadius="xl"
                  display="flex"
                  flexDir="column"
                  alignItems="center"
                  py={3}
                  px={2}
                  gap={1}
                  textAlign="center"
                >
                  <Text fontSize="10px" color={t.muted} fontFamily={t.font} fontWeight="700" letterSpacing="0.06em" textTransform="uppercase">
                    Wk {i + 1}
                  </Text>
                  <Box position="relative" mb={1}>
                    <Avatar.Root size="md">
                      <Avatar.Image src={week.avatar_url} />
                      <Avatar.Fallback fontSize="md">{week.name?.[0]}</Avatar.Fallback>
                    </Avatar.Root>
                    <Box position="absolute" bottom="-4px" right="-6px" fontSize="13px" lineHeight={1}>
                      🥇
                    </Box>
                  </Box>
                  <Text fontSize="xs" fontWeight="700" color={t.text} fontFamily={t.font} noOfLines={1} w="100%">
                    {shortName(week.name)}
                  </Text>
                  <Text fontSize="xs" fontWeight="700" color={t.accent} fontFamily={t.font}>
                    {week.total_score} pts
                  </Text>
                </Box>
              </motion.div>
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
}
