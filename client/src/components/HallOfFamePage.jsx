import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Box, VStack, Text, HStack, Avatar, Spinner, Heading } from "@chakra-ui/react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy } from "@phosphor-icons/react";
import axios from "axios";
import { t } from "../theme";
import { useAuth } from "../useAuth";

const BASE_URL = import.meta.env.VITE_API_URL ?? "";

const TIER = {
  1: { emoji: "🥇", label: "Gold",   color: "#f5a623", border: "rgba(245,166,35,0.5)",  bg: "rgba(245,166,35,0.08)"  },
  2: { emoji: "🥈", label: "Silver", color: "#b0b0b0", border: "rgba(176,176,176,0.4)", bg: "rgba(176,176,176,0.07)" },
  3: { emoji: "🥉", label: "Bronze", color: "#c47c3e", border: "rgba(196,124,62,0.4)",  bg: "rgba(196,124,62,0.07)"  },
};

function shortName(name) {
  const parts = (name || "").trim().split(" ");
  return parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1][0]}.` : parts[0];
}

export default function HallOfFamePage() {
  const navigate = useNavigate();
  useAuth();
  const [weeks, setWeeks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null); // week_start of selected card

  useEffect(() => {
    axios
      .get(`${BASE_URL}/api/leaderboard/hall-of-fame`)
      .then((r) => setWeeks(r.data))
      .catch(() => setWeeks([]))
      .finally(() => setLoading(false));
  }, []);

  // Most recent first
  const sorted = [...weeks].reverse();

  function toggleSelect(week_start) {
    setSelected(s => s === week_start ? null : week_start);
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
          <>
          {/* Dismiss overlay on outside click */}
          {selected && (
            <Box
              position="fixed"
              inset={0}
              zIndex={10}
              onClick={() => setSelected(null)}
            />
          )}

          {/* Gold grid — 3 columns */}
          <Box
            display="grid"
            gridTemplateColumns="repeat(3, 1fr)"
            gap={2.5}
            position="relative"
          >
            {sorted.map((week, i) => {
              const gold = week.entries.find(e => e.rank === 1);
              const isSelected = selected === week.week_start;
              const weekNum = weeks.length - i;
              const col = i % 3; // 0=left, 1=center, 2=right

              return (
                <motion.div
                  key={week.week_start}
                  initial={{ opacity: 0, scale: 0.88 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.04, duration: 0.2 }}
                  style={{ position: "relative" }}
                >
                  <Box
                    as="button"
                    w="100%"
                    onClick={() => toggleSelect(week.week_start)}
                    bg={isSelected ? "rgba(245,166,35,0.1)" : t.surface}
                    border={`1.5px solid ${isSelected ? TIER[1].border : t.border}`}
                    borderRadius="xl"
                    display="flex"
                    flexDir="column"
                    alignItems="center"
                    py={3}
                    px={1.5}
                    gap={1}
                    textAlign="center"
                    cursor="pointer"
                    transition="all 0.15s"
                    position="relative"
                    zIndex={isSelected ? 20 : 1}
                    _hover={{ borderColor: TIER[1].border, bg: "rgba(245,166,35,0.05)" }}
                  >
                    <Text fontSize="9px" color={t.muted} fontFamily={t.font} fontWeight="700" letterSpacing="0.07em" textTransform="uppercase">
                      Wk {weekNum}
                    </Text>
                    <Box position="relative" mb={1}>
                      <Avatar.Root size="sm">
                        <Avatar.Image src={gold?.avatar_url} />
                        <Avatar.Fallback fontSize="sm">{gold?.name?.[0]}</Avatar.Fallback>
                      </Avatar.Root>
                      <Box position="absolute" bottom="-4px" right="-6px" fontSize="11px" lineHeight={1}>
                        🥇
                      </Box>
                    </Box>
                    <Text fontSize="10px" fontWeight="700" color={t.text} fontFamily={t.font} noOfLines={1} w="100%">
                      {shortName(gold?.name)}
                    </Text>
                    <Text fontSize="10px" fontWeight="700" color={TIER[1].color} fontFamily={t.font}>
                      {gold?.total_score} pts
                    </Text>
                  </Box>

                  {/* Podium overlay — floats below the card */}
                  <AnimatePresence>
                    {isSelected && week.entries && (
                      <motion.div
                        key="podium"
                        initial={{ opacity: 0, scale: 0.92, y: -4 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.92, y: -4 }}
                        transition={{ duration: 0.15 }}
                        style={{
                          position: "absolute",
                          top: "calc(100% + 6px)",
                          ...(col === 0 ? { left: 0 } : col === 2 ? { right: 0 } : { left: "50%", transform: "translateX(-50%)" }),
                          zIndex: 30,
                          width: "180px",
                        }}
                        onClick={e => e.stopPropagation()}
                      >
                        <Box
                          bg={t.surface}
                          border={`1.5px solid ${TIER[1].border}`}
                          borderRadius="xl"
                          overflow="hidden"
                          boxShadow="0 8px 24px rgba(0,0,0,0.25)"
                        >
                          {week.entries.map((entry) => {
                            const tier = TIER[entry.rank];
                            return (
                              <Box
                                key={entry.rank}
                                px={2.5}
                                py={1.5}
                                display="flex"
                                alignItems="center"
                                gap={2}
                                borderBottom={entry.rank < week.entries.length ? `1px solid ${t.border}` : "none"}
                                bg={entry.rank === 1 ? tier.bg : "transparent"}
                              >
                                <Text fontSize="sm" lineHeight={1} flexShrink={0}>
                                  {tier.emoji}
                                </Text>
                                <Avatar.Root size="xs" flexShrink={0}>
                                  <Avatar.Image src={entry.avatar_url} />
                                  <Avatar.Fallback fontSize="xs">{entry.name?.[0]}</Avatar.Fallback>
                                </Avatar.Root>
                                <Box flex={1} minW={0}>
                                  <Text fontSize="10px" fontWeight="700" color={t.text} fontFamily={t.font} noOfLines={1}>
                                    {shortName(entry.name)}
                                  </Text>
                                  <Text fontSize="9px" color={t.accent} fontFamily={t.font} fontWeight="600">
                                    {entry.total_score} pts
                                  </Text>
                                </Box>
                              </Box>
                            );
                          })}
                        </Box>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </Box>
          </>
        )}
      </Box>
    </Box>
  );
}
